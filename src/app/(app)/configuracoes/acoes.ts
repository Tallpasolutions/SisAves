"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterCriatorioAtual } from "@/lib/criatorio";

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
    })
    .eq("id", criatorio.id);

  if (error) {
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
    console.error("salvarPerfil:", error.message);
    return { erro: "Não foi possível salvar o perfil. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect("/perfil?salvo=1");
}
