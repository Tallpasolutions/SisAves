"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export interface EstadoTransferencia {
  erro?: string;
  campos?: Record<string, string>;
}

/**
 * Passa ovos para outro casal chocar.
 *
 * A escrita vai inteira para `transferir_posturas`: ela muda quem choca e
 * grava a passagem no histórico, numa transação. Ovo que muda de ninho sem
 * deixar rastro é o defeito do sistema antigo.
 *
 * Não manda chave própria — a função ignora em silêncio o ovo que já está com
 * aquele casal, e é isso que torna o reenvio da fila inofensivo.
 */
export async function transferirPosturas(
  _anterior: EstadoTransferencia,
  dados: FormData,
): Promise<EstadoTransferencia> {
  const ninhadaId = String(dados.get("ninhada_id") ?? "");
  const destino = String(dados.get("destino_id") ?? "");
  const reenvio = dados.get("reenvio") === "1";

  if (!ninhadaId) return { erro: "Ninhada não identificada." };
  if (!destino) return { campos: { destino_id: "Escolha o casal que vai chocar." } };

  const ids = dados
    .getAll("postura_id")
    .map(String)
    .filter((id) => dados.get(`mover_${id}`) === "on");

  if (ids.length === 0) {
    return { erro: "Marque ao menos um ovo para transferir." };
  }

  const motivo = String(dados.get("motivo") ?? "").trim();
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase.rpc("transferir_posturas", {
    p_destino_id: destino,
    p_posturas: ids,
    p_motivo: motivo === "" ? null : motivo.slice(0, 200),
  });

  if (error) {
    // As mensagens da função já falam a língua do domínio ("O casal 03 está
    // encerrado e não recebe ovo para chocar."); repassar é melhor.
    if (error.code === "P0001") return { erro: error.message };
    console.error("transferirPosturas:", error.message);
    return { erro: "Não foi possível transferir. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};

  const movidos = typeof data === "number" ? data : ids.length;
  redirect(`/ovos/${ninhadaId}?transferidos=${movidos}`);
}

/** O ovo volta ao ninho de quem o pôs. A passagem fica no histórico. */
export async function devolverPostura(
  _anterior: EstadoTransferencia,
  dados: FormData,
): Promise<EstadoTransferencia> {
  const posturaId = String(dados.get("postura_id") ?? "");
  const ninhadaId = String(dados.get("ninhada_id") ?? "");
  const reenvio = dados.get("reenvio") === "1";

  if (!posturaId) return { erro: "Ovo não identificado." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("devolver_postura", {
    p_postura_id: posturaId,
  });

  if (error) {
    if (error.code === "P0001") return { erro: error.message };
    console.error("devolverPostura:", error.message);
    return { erro: "Não foi possível devolver o ovo. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio || !ninhadaId) return {};
  redirect(`/ovos/${ninhadaId}/transferir?devolvido=1`);
}
