"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { MARCOS_DESFAZIVEIS, type MarcoDesfazivel } from "@/lib/dados/marcos";

export interface EstadoCorrecao {
  erro?: string;
  /** O que acabou de ser desfeito, para a tela confirmar com o fato. */
  desfeito?: string;
}

/**
 * Apaga um marco registrado por engano.
 *
 * Volta para a PRÓPRIA tela de correção, não para a ninhada: o criador que
 * errou uma linha costuma ter outra para acertar, e a lista já reflete o que
 * foi desfeito — a linha some quando não sobra nada nela.
 *
 * A escrita inteira vai para `desfazer_marco`, que guarda as regras — inclusive
 * desfazer o óbito da ave quando foi esta perda que o gravou.
 */
export async function desfazerMarco(
  _anterior: EstadoCorrecao,
  dados: FormData,
): Promise<EstadoCorrecao> {
  const posturaId = String(dados.get("postura_id") ?? "");
  const marco = String(dados.get("marco") ?? "");
  const ninhadaId = String(dados.get("ninhada_id") ?? "");
  const reenvio = dados.get("reenvio") === "1";

  if (!posturaId) return { erro: "Ovo não identificado." };
  if (!MARCOS_DESFAZIVEIS.some((m) => m.valor === marco)) {
    return { erro: "Marca desconhecida. Recarregue a tela." };
  }

  const supabase = await criarClienteServidor();

  const { data, error } = await supabase.rpc("desfazer_marco", {
    p_postura_id: posturaId,
    p_marco: marco,
  });

  if (error) {
    // As mensagens da função já falam a língua do domínio; repassar é melhor
    // que traduzir de novo.
    if (error.code === "P0001") return { erro: error.message };
    console.error("desfazerMarco:", error.message);
    return { erro: "Não foi possível desfazer. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};

  // `false` quer dizer que o marco já não estava lá — outra aba desfez, ou o
  // reenvio da fila chegou pela segunda vez. Não é erro, e também não é fato
  // novo para anunciar.
  if (data === false || !ninhadaId) return {};

  redirect(`/ovos/${ninhadaId}/corrigir?desfeito=${marco}`);
}

export type { MarcoDesfazivel };
