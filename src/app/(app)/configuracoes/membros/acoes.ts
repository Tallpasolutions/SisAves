"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterCriatorioAtual } from "@/lib/criatorio";
import { barradoPelaAssinatura, ERRO_ASSINATURA } from "@/lib/erros";

export interface EstadoMembro {
  erro?: string;
  campos?: Record<string, string>;
}

const EsquemaConvite = z.object({
  email: z
    .string({ error: "Informe o e-mail de quem você quer convidar." })
    .trim()
    .email("Confira o e-mail."),
  papel: z.enum(["operador", "leitor"], { error: "Escolha o que a pessoa pode fazer." }),
});

/**
 * Convida alguém para o criatório.
 *
 * O convite fica guardado até a pessoa entrar: o e-mail vive em `auth.users`,
 * que o cliente não lê, então não dá para transformar em membro na hora. Quem
 * faz a virada é `aceitar_convites()`, no login.
 */
export async function convidarMembro(
  _anterior: EstadoMembro,
  dados: FormData,
): Promise<EstadoMembro> {
  const criatorio = await obterCriatorioAtual();
  if (!criatorio) return { erro: "Criatório não encontrado." };

  const resultado = EsquemaConvite.safeParse({
    email: dados.get("email"),
    papel: dados.get("papel"),
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

  if (resultado.data.email.toLowerCase() === (user.email ?? "").toLowerCase()) {
    return { campos: { email: "Este é o seu próprio e-mail." } };
  }

  const { error } = await supabase.from("criatorio_convites").insert({
    criatorio_id: criatorio.id,
    email: resultado.data.email,
    papel: resultado.data.papel,
    convidado_por: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        campos: { email: `Já existe um convite aberto para ${resultado.data.email}.` },
      };
    }
    // Vencido não é "tente de novo": tentar de novo nunca vai funcionar.
    if (barradoPelaAssinatura(error)) return { erro: ERRO_ASSINATURA };
    console.error("convidarMembro:", error.message);
    return { erro: "Não foi possível convidar. Tente de novo." };
  }

  revalidatePath("/", "layout");
  redirect(`/configuracoes/membros?convidado=${encodeURIComponent(resultado.data.email)}`);
}

/** Cancela um convite que ainda não foi aceito. */
export async function cancelarConvite(
  _anterior: EstadoMembro,
  dados: FormData,
): Promise<EstadoMembro> {
  const conviteId = String(dados.get("convite_id") ?? "");
  if (!conviteId) return { erro: "Convite não identificado." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("criatorio_convites")
    .delete()
    .eq("id", conviteId)
    .is("aceito_em", null);

  if (error) {
    // Vencido não é "tente de novo": tentar de novo nunca vai funcionar.
    if (barradoPelaAssinatura(error)) return { erro: ERRO_ASSINATURA };
    console.error("cancelarConvite:", error.message);
    return { erro: "Não foi possível cancelar o convite. Tente de novo." };
  }

  revalidatePath("/", "layout");
  redirect("/configuracoes/membros?cancelado=1");
}

/**
 * Tira alguém do criatório.
 *
 * O dono não sai: `criatorios.owner_id` aponta para ele, e a tabela tem
 * `on delete restrict` ali de propósito — criatório sem dono é criatório sem
 * ninguém que responda por ele.
 */
export async function removerMembro(
  _anterior: EstadoMembro,
  dados: FormData,
): Promise<EstadoMembro> {
  const usuarioId = String(dados.get("usuario_id") ?? "");
  const criatorio = await obterCriatorioAtual();
  if (!usuarioId || !criatorio) return { erro: "Membro não identificado." };

  const supabase = await criarClienteServidor();

  const { data: dono } = await supabase
    .from("criatorios")
    .select("owner_id")
    .eq("id", criatorio.id)
    .maybeSingle();

  if (dono?.owner_id === usuarioId) {
    return { erro: "O dono do criatório não pode ser removido." };
  }

  const { error } = await supabase
    .from("criatorio_membros")
    .delete()
    .eq("criatorio_id", criatorio.id)
    .eq("usuario_id", usuarioId);

  if (error) {
    // Vencido não é "tente de novo": tentar de novo nunca vai funcionar.
    if (barradoPelaAssinatura(error)) return { erro: ERRO_ASSINATURA };
    console.error("removerMembro:", error.message);
    return { erro: "Não foi possível remover. Tente de novo." };
  }

  revalidatePath("/", "layout");
  redirect("/configuracoes/membros?removido=1");
}
