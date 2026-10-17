"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { CORES_ETIQUETA } from "@/lib/dados/etiquetas";

export interface EstadoEtiqueta {
  erro?: string;
  campos?: Record<string, string>;
}

/**
 * Renomeia a etiqueta e troca a cor dela.
 *
 * O nome aparece em toda a lista de casais; corrigir um erro de digitação aqui
 * é a diferença entre uma etiqueta útil e uma que o criador para de usar.
 */
export async function renomearEtiqueta(
  _anterior: EstadoEtiqueta,
  dados: FormData,
): Promise<EstadoEtiqueta> {
  const etiquetaId = String(dados.get("etiqueta_id") ?? "");
  if (!etiquetaId) return { erro: "Etiqueta não identificada." };

  const reenvio = dados.get("reenvio") === "1";
  const nome = String(dados.get("nome") ?? "").trim();
  const cor = String(dados.get("cor") ?? "");

  if (nome === "") return { campos: { nome: "A etiqueta precisa de um nome." } };
  if (nome.length > 40) {
    return { campos: { nome: "O nome da etiqueta tem no máximo 40 caracteres." } };
  }
  if (!CORES_ETIQUETA.some((c) => c.valor === cor)) {
    return { campos: { nome: "Escolha uma das cores da paleta." } };
  }

  const supabase = await criarClienteServidor();

  const { error } = await supabase
    .from("casal_tags")
    .update({ nome, cor })
    .eq("id", etiquetaId);

  if (error) {
    if (error.code === "23505") {
      return { campos: { nome: `Já existe uma etiqueta chamada "${nome}".` } };
    }
    console.error("renomearEtiqueta:", error.message);
    return { erro: "Não foi possível salvar a etiqueta. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect("/casais/etiquetas?salva=1");
}

/**
 * Apaga a etiqueta do criatório.
 *
 * Exclusão de verdade: `casal_tags` não tem `deleted_at`, e o vínculo cai em
 * cascata. A etiqueta não guarda fato nenhum do criatório — é um rótulo que o
 * criador inventou e pode desinventar. A tela diz de quantos casais ela sai
 * antes de perguntar.
 */
export async function excluirEtiqueta(
  _anterior: EstadoEtiqueta,
  dados: FormData,
): Promise<EstadoEtiqueta> {
  const etiquetaId = String(dados.get("etiqueta_id") ?? "");
  if (!etiquetaId) return { erro: "Etiqueta não identificada." };

  const reenvio = dados.get("reenvio") === "1";
  const supabase = await criarClienteServidor();

  const { error } = await supabase.from("casal_tags").delete().eq("id", etiquetaId);

  if (error) {
    console.error("excluirEtiqueta:", error.message);
    return { erro: "Não foi possível excluir a etiqueta. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect("/casais/etiquetas?excluida=1");
}
