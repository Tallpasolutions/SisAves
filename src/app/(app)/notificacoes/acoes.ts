"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export interface EstadoNotificacao {
  erro?: string;
}

/** Marca um aviso como lido. Ele some da contagem, não da lista. */
export async function marcarLida(
  _anterior: EstadoNotificacao,
  dados: FormData,
): Promise<EstadoNotificacao> {
  const id = String(dados.get("notificacao_id") ?? "");
  if (!id) return { erro: "Aviso não identificado." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("notificacoes")
    .update({ lida_em: new Date().toISOString() })
    .eq("id", id)
    .is("lida_em", null);

  if (error) {
    console.error("marcarLida:", error.message);
    return { erro: "Não foi possível marcar como lido." };
  }

  revalidatePath("/", "layout");
  return {};
}

/** Zera a contagem de uma vez. */
export async function marcarTodasLidas(): Promise<void> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("notificacoes")
    .update({ lida_em: new Date().toISOString() })
    .is("lida_em", null);

  if (error) console.error("marcarTodasLidas:", error.message);

  revalidatePath("/", "layout");
  redirect("/notificacoes");
}
