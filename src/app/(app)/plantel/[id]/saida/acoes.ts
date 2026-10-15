"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { SAIDAS, type MotivoSaida } from "@/lib/dados/situacao";

export interface EstadoSaida {
  erro?: string;
  campos?: Record<string, string>;
}

const MOTIVOS = SAIDAS.map((s) => s.valor) as [MotivoSaida, ...MotivoSaida[]];

const EsquemaSaida = z.object({
  situacao: z.enum(MOTIVOS, { error: "Escolha o motivo da saída." }),
  data: z
    // A mensagem no tipo base: campo vazio falha antes do regex e devolveria
    // o texto cru do Zod, em inglês.
    .string({ error: "Informe o dia da saída." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato dd/mm/aaaa.")
    .refine((d) => d <= hoje(), "A saída não pode ser no futuro."),
  destino: z.string().trim().max(160).optional(),
  motivo: z.string().trim().max(400).optional(),
  valor: z.coerce
    .number({ error: "Confira o valor da venda." })
    .positive("O valor da venda precisa ser maior que zero.")
    .max(9_999_999, "Confira o valor da venda.")
    .optional(),
});

/**
 * Tira a ave do plantel ativo.
 *
 * A escrita inteira vai para `registrar_saida`: ela toca a ave, o casal
 * vigente e — na venda com valor — o lançamento da receita. Uma venda que
 * gravasse a receita e deixasse a ave ativa é pior que uma venda não
 * registrada, porque parece registrada.
 */
export async function registrarSaida(
  _anterior: EstadoSaida,
  dados: FormData,
): Promise<EstadoSaida> {
  const passaroId = String(dados.get("passaro_id") ?? "");
  if (!passaroId) return { erro: "Ave não identificada." };

  // Reenvio da fila offline: grava e devolve, sem navegar.
  const reenvio = dados.get("reenvio") === "1";

  const opcional = (v: FormDataEntryValue | null) => {
    const t = String(v ?? "").trim();
    return t === "" ? undefined : t;
  };

  /** Dinheiro em pt-BR: "1.240,00" é o que o criador digita e o que a ficha mostra. */
  const bruto = opcional(dados.get("valor"));
  const valor = bruto?.replace(/\./g, "").replace(",", ".");

  const resultado = EsquemaSaida.safeParse({
    situacao: opcional(dados.get("situacao")),
    data: dados.get("data"),
    destino: opcional(dados.get("destino")),
    motivo: opcional(dados.get("motivo")),
    valor,
  });

  if (!resultado.success) {
    const campos: Record<string, string> = {};
    for (const problema of resultado.error.issues) {
      const campo = String(problema.path[0] ?? "");
      if (campo && !campos[campo]) campos[campo] = problema.message;
    }
    return { campos };
  }

  const escolha = SAIDAS.find((s) => s.valor === resultado.data.situacao)!;

  // O valor só existe na venda. Mandá-lo numa doação faria a função recusar o
  // lote inteiro com uma mensagem que não ajuda a corrigir o campo.
  if (resultado.data.valor !== undefined && !escolha.aceitaValor) {
    return { campos: { valor: `${escolha.rotulo} não registra valor.` } };
  }

  const supabase = await criarClienteServidor();

  const { error } = await supabase.rpc("registrar_saida", {
    p_passaro_id: passaroId,
    p_situacao: resultado.data.situacao,
    p_data: resultado.data.data,
    p_destino: escolha.destino ? (resultado.data.destino ?? null) : null,
    p_motivo: resultado.data.motivo ?? null,
    p_valor: escolha.aceitaValor ? (resultado.data.valor ?? null) : null,
  });

  if (error) {
    // As mensagens da função já falam a língua do domínio ("Esta ave já saiu
    // do plantel: vendida."); repassar é melhor que traduzir de novo.
    if (error.code === "P0001") return { erro: error.message };

    console.error("registrarSaida:", error.message);
    return { erro: "Não foi possível registrar a saída. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect(`/plantel/${passaroId}?saiu=${resultado.data.situacao}`);
}

/** A ave emprestada que o criador buscou de volta, ou a que fugiu e voltou. */
export async function reativarAve(
  _anterior: EstadoSaida,
  dados: FormData,
): Promise<EstadoSaida> {
  const passaroId = String(dados.get("passaro_id") ?? "");
  if (!passaroId) return { erro: "Ave não identificada." };

  const reenvio = dados.get("reenvio") === "1";
  const supabase = await criarClienteServidor();

  const { error } = await supabase.rpc("reativar_ave", { p_passaro_id: passaroId });

  if (error) {
    if (error.code === "P0001") return { erro: error.message };
    console.error("reativarAve:", error.message);
    return { erro: "Não foi possível devolver a ave ao plantel. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect(`/plantel/${passaroId}?voltou=1`);
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}
