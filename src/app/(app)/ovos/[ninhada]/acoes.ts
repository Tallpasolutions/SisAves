"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { MARCOS, type Marco } from "@/lib/dados/marcos";
import { hojeNoCriatorio } from "@/lib/data";

export interface EstadoConferencia {
  erro?: string;
  /** Erros por campo, para o Field citar o dado exato. */
  campos?: Record<string, string>;
}

const EsquemaConferencia = z.object({
  conferido_em: z
    // A mensagem no tipo base, e não só no regex: campo que chega vazio falha
    // antes do regex e devolveria o texto cru do Zod, em inglês.
    .string({ error: "Informe o dia da conferência." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato dd/mm/aaaa.")
    .refine((d) => d <= hojeNoCriatorio(), "A conferência não pode ser no futuro."),
});

/**
 * Grava de uma vez o que o criador encontrou no ninho.
 *
 * Uma conferência, uma data: ele abriu o ninho agora e viu tudo junto — dois
 * filhotes nascidos, um ovo claro, um quebrado. Datar cada marca em separado
 * seria perguntar quatro vezes a mesma coisa.
 *
 * A escrita inteira vai para `registrar_marcos`, numa transação. A função
 * ignora em silêncio o marco que já está gravado, e é isso que torna o reenvio
 * da fila offline — e o toque duplo no botão — inofensivo.
 */
export async function registrarConferencia(
  _anterior: EstadoConferencia,
  dados: FormData,
): Promise<EstadoConferencia> {
  const ninhadaId = String(dados.get("ninhada_id") ?? "");
  if (!ninhadaId) return { erro: "Ninhada não identificada." };

  // Reenvio da fila offline: grava e devolve, sem navegar.
  const reenvio = dados.get("reenvio") === "1";

  const resultado = EsquemaConferencia.safeParse({
    conferido_em: dados.get("conferido_em"),
  });

  if (!resultado.success) {
    const campos: Record<string, string> = {};
    for (const problema of resultado.error.issues) {
      const campo = String(problema.path[0] ?? "");
      if (campo && !campos[campo]) campos[campo] = problema.message;
    }
    return { campos };
  }

  const ids = dados.getAll("postura_id").map(String).filter(Boolean);
  const marcos: Array<{ postura_id: string; marco: Marco; motivo: string | null }> = [];

  for (const id of ids) {
    const escolha = String(dados.get(`marco_${id}`) ?? "");
    if (!escolha) continue; // "Segue igual": o ovo não mudou de estado.

    if (!MARCOS.includes(escolha as Marco)) {
      return { erro: "Marca desconhecida no formulário. Recarregue a tela." };
    }

    const motivo = String(dados.get(`motivo_${id}`) ?? "").trim();
    marcos.push({
      postura_id: id,
      marco: escolha as Marco,
      motivo: motivo === "" ? null : motivo.slice(0, 200),
    });
  }

  if (marcos.length === 0) {
    return { erro: "Marque o que você encontrou em ao menos um ovo." };
  }

  const supabase = await criarClienteServidor();

  const { data, error } = await supabase.rpc("registrar_marcos", {
    p_data: resultado.data.conferido_em,
    p_marcos: marcos,
  });

  if (error) {
    // As mensagens da função já falam a língua do domínio ("O ovo 2 já foi
    // registrado como perda."); repassar é melhor que traduzir de novo.
    if (error.code === "P0001") return { erro: error.message };

    console.error("registrarConferencia:", error.message);
    return { erro: "Não foi possível registrar a conferência. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};

  // Volta para a mesma ninhada: o criador precisa ver o estado novo de cada
  // ovo, e é dali que ele segue para o anilhamento.
  const aplicados = typeof data === "number" ? data : marcos.length;
  redirect(`/ovos/${ninhadaId}?conferidos=${aplicados}`);
}

