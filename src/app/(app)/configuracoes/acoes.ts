"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterCriatorioAtual } from "@/lib/criatorio";
import { barradoPelaAssinatura, ERRO_ASSINATURA } from "@/lib/erros";

export interface EstadoConfiguracoes {
  erro?: string;
  campos?: Record<string, string>;
}

const opcional = (v: FormDataEntryValue | null) => {
  const t = String(v ?? "").trim();
  return t === "" ? undefined : t;
};

const EsquemaCriatorio = z.object({
  nome: z
    .string({ error: "O criatório precisa de um nome." })
    .trim()
    .min(2, "O nome do criatório tem pelo menos 2 caracteres.")
    .max(80, "O nome tem no máximo 80 caracteres."),
  clube_id: z.string().uuid().optional(),
  nro_criador: z.string().trim().max(20, "A matrícula tem no máximo 20 caracteres.").optional(),
  registro_ibama: z.string().trim().max(40, "O registro tem no máximo 40 caracteres.").optional(),
  cidade: z.string().trim().max(60).optional(),
  uf: z
    .string()
    .trim()
    .length(2, "A UF tem duas letras.")
    .regex(/^[A-Za-zÀ-ÿ]{2}$/, "A UF tem duas letras.")
    .optional(),
  instagram: z.string().trim().max(40).optional(),
  whatsapp: z.string().trim().max(20).optional(),
});

/**
 * Os dados do criatório.
 *
 * O CRO imprime nome, clube, matrícula e registro IBAMA no cabeçalho: até
 * aqui eles só entravam no onboarding, e emitir certificado sobre um registro
 * que não dá para corrigir é frágil.
 *
 * O SLUG não se edita. Ele é o endereço público do certificado — mudar quebra
 * o QR de toda peça já impressa, que é exatamente o que o snapshot do CRO
 * existe para impedir.
 */
export async function salvarCriatorio(
  _anterior: EstadoConfiguracoes,
  dados: FormData,
): Promise<EstadoConfiguracoes> {
  const criatorio = await obterCriatorioAtual();
  if (!criatorio) return { erro: "Criatório não encontrado." };

  const reenvio = dados.get("reenvio") === "1";

  const resultado = EsquemaCriatorio.safeParse({
    nome: dados.get("nome"),
    clube_id: opcional(dados.get("clube_id")),
    nro_criador: opcional(dados.get("nro_criador")),
    registro_ibama: opcional(dados.get("registro_ibama")),
    cidade: opcional(dados.get("cidade")),
    uf: opcional(dados.get("uf")),
    instagram: opcional(dados.get("instagram")),
    whatsapp: opcional(dados.get("whatsapp")),
  });

  // Caixa desmarcada não chega no FormData: ausência é "não imprimir".
  const contatoNoDocumento = dados.get("contato_no_documento") === "1";

  if (!resultado.success) {
    const campos: Record<string, string> = {};
    for (const problema of resultado.error.issues) {
      const campo = String(problema.path[0] ?? "");
      if (campo && !campos[campo]) campos[campo] = problema.message;
    }
    return { campos };
  }

  const supabase = await criarClienteServidor();

  const { error } = await supabase
    .from("criatorios")
    .update({
      nome: resultado.data.nome,
      clube_id: resultado.data.clube_id ?? null,
      nro_criador: resultado.data.nro_criador ?? null,
      registro_ibama: resultado.data.registro_ibama ?? null,
      cidade: resultado.data.cidade ?? null,
      uf: resultado.data.uf?.toUpperCase() ?? null,
      instagram: resultado.data.instagram?.replace(/^@/, "") ?? null,
      whatsapp: resultado.data.whatsapp ?? null,
      contato_no_documento: contatoNoDocumento,
    })
    .eq("id", criatorio.id);

  if (error) {
    // Vencido não é "tente de novo": tentar de novo nunca vai funcionar.
    if (barradoPelaAssinatura(error)) return { erro: ERRO_ASSINATURA };
    console.error("salvarCriatorio:", error.message);
    return { erro: "Não foi possível salvar. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect("/configuracoes?salvo=1");
}

const EsquemaPerfil = z.object({
  nome: z
    .string({ error: "Informe o seu nome." })
    .trim()
    .min(2, "O nome tem pelo menos 2 caracteres.")
    .max(80, "O nome tem no máximo 80 caracteres."),
  telefone: z.string().trim().max(20, "O telefone tem no máximo 20 caracteres.").optional(),
});

/** Nome e telefone de quem está usando. O e-mail é credencial, não perfil. */
export async function salvarPerfil(
  _anterior: EstadoConfiguracoes,
  dados: FormData,
): Promise<EstadoConfiguracoes> {
  const reenvio = dados.get("reenvio") === "1";

  const resultado = EsquemaPerfil.safeParse({
    nome: dados.get("nome"),
    telefone: opcional(dados.get("telefone")),
  });

  if (!resultado.success) {
    const campos: Record<string, string> = {};
    for (const problema of resultado.error.issues) {
      const campo = String(problema.path[0] ?? "");
      if (campo && !campos[campo]) campos[campo] = problema.message;
    }
    return { campos };
  }

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada. Entre de novo." };

  const { error } = await supabase
    .from("perfis")
    .update({ nome: resultado.data.nome, telefone: resultado.data.telefone ?? null })
    .eq("id", user.id);

  if (error) {
    // Vencido não é "tente de novo": tentar de novo nunca vai funcionar.
    if (barradoPelaAssinatura(error)) return { erro: ERRO_ASSINATURA };
    console.error("salvarPerfil:", error.message);
    return { erro: "Não foi possível salvar o perfil. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect("/perfil?salvo=1");
}

// -----------------------------------------------------------------------------
// A logo do criatório
// -----------------------------------------------------------------------------

/** O que o bucket aceita. SVG fica de fora — ver a migration 0036. */
const TIPOS_LOGO = ["image/png", "image/jpeg", "image/webp"] as const;
const TAMANHO_MAXIMO = 2 * 1024 * 1024;

const EXTENSAO: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/**
 * Envia a logo que sai impressa nas peças.
 *
 * **Fora da fila offline, de propósito.** A fila guarda campos de formulário
 * como texto; um arquivo binário não cabe nela, e fingir que coube deixaria o
 * criador achando que a logo subiu. É a mesma exceção dos convites de membro.
 *
 * O caminho é `<criatorio_id>/logo.<ext>` — a primeira pasta é o que a
 * política do Storage confere para saber se o arquivo é seu.
 */
export async function salvarLogo(
  _anterior: EstadoConfiguracoes,
  dados: FormData,
): Promise<EstadoConfiguracoes> {
  const criatorio = await obterCriatorioAtual();
  if (!criatorio) return { erro: "Criatório não encontrado." };

  const arquivo = dados.get("logo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { campos: { logo: "Escolha um arquivo de imagem." } };
  }

  if (!TIPOS_LOGO.includes(arquivo.type as (typeof TIPOS_LOGO)[number])) {
    return {
      campos: {
        logo: "A logo precisa ser PNG, JPG ou WEBP. SVG não é aceito por segurança.",
      },
    };
  }

  if (arquivo.size > TAMANHO_MAXIMO) {
    const mb = (arquivo.size / 1024 / 1024).toFixed(1).replace(".", ",");
    return { campos: { logo: `A imagem tem ${mb} MB. O máximo é 2 MB.` } };
  }

  const supabase = await criarClienteServidor();
  const caminho = `${criatorio.id}/logo.${EXTENSAO[arquivo.type]}`;

  const { error: erroUpload } = await supabase.storage
    .from("criatorios")
    .upload(caminho, arquivo, { upsert: true, contentType: arquivo.type });

  if (erroUpload) {
    // Vencido não é "tente de novo": tentar de novo nunca vai funcionar.
    if (barradoPelaAssinatura(erroUpload)) return { erro: ERRO_ASSINATURA };
    console.error("salvarLogo:", erroUpload.message);
    return { erro: "Não foi possível enviar a logo. Tente de novo." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("criatorios").getPublicUrl(caminho);

  // O sufixo de versão força o navegador e a CDN a buscarem a imagem nova:
  // o caminho é o mesmo a cada envio, e sem ele a logo antiga continuaria
  // aparecendo no certificado por horas.
  const url = `${publicUrl}?v=${Date.now()}`;

  const { error } = await supabase
    .from("criatorios")
    .update({ logo_url: url })
    .eq("id", criatorio.id);

  if (error) {
    // Vencido não é "tente de novo": tentar de novo nunca vai funcionar.
    if (barradoPelaAssinatura(error)) return { erro: ERRO_ASSINATURA };
    console.error("salvarLogo (url):", error.message);
    return { erro: "A imagem subiu, mas não foi possível salvá-la. Tente de novo." };
  }

  revalidatePath("/", "layout");
  redirect("/configuracoes?logo=1");
}

/**
 * Tira a logo.
 *
 * O arquivo sai do bucket junto: logo removida que continua acessível por URL
 * é logo removida só na tela. Certificado JÁ EMITIDO continua com ela, porque
 * o snapshot congelou a URL — e é isso que faz a via impressa em 2026 seguir
 * igual a si mesma.
 */
// Sem parâmetros: não há nada a ler do formulário, e uma função de aridade
// menor é atribuível ao que `useActionState` espera.
export async function removerLogo(): Promise<EstadoConfiguracoes> {
  const criatorio = await obterCriatorioAtual();
  if (!criatorio) return { erro: "Criatório não encontrado." };

  const supabase = await criarClienteServidor();

  await supabase.storage
    .from("criatorios")
    .remove(
      Object.values(EXTENSAO).map((ext) => `${criatorio.id}/logo.${ext}`),
    );

  const { error } = await supabase
    .from("criatorios")
    .update({ logo_url: null })
    .eq("id", criatorio.id);

  if (error) {
    // Vencido não é "tente de novo": tentar de novo nunca vai funcionar.
    if (barradoPelaAssinatura(error)) return { erro: ERRO_ASSINATURA };
    console.error("removerLogo:", error.message);
    return { erro: "Não foi possível remover a logo. Tente de novo." };
  }

  revalidatePath("/", "layout");
  redirect("/configuracoes?logo=0");
}
