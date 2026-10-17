import { criarClienteServidor } from "@/lib/supabase/servidor";

export interface OpcaoAve {
  id: string;
  nome: string | null;
  anilha: {
    sigla: string | null;
    criador: string | null;
    ano: number | null;
    numero: number | null;
  };
  /** Ave que já saiu do plantel. A lista diz isso em vez de esconder. */
  fora: boolean;
}

/**
 * As aves que um registro pode citar — lançamento financeiro e tratamento.
 *
 * Inclui as que já saíram do plantel, de propósito: a receita da venda cita
 * justamente a ave vendida, e o tratamento que se corrige meses depois pode
 * ser de uma ave que morreu. Oferecer só o plantel ativo faria a lista
 * esconder metade dos casos em que o vínculo importa — e, numa tela de edição,
 * sumir com o valor já gravado.
 */
export async function opcoesDeAve(): Promise<OpcaoAve[]> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase
    .from("passaros")
    .select("id, nome, situacao, anilha_sigla, anilha_criador, anilha_ano, anilha_numero")
    .is("deleted_at", null)
    .order("anilha_numero", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("opcoesDeAve:", error.message);
    return [];
  }

  return ((data ?? []) as Array<{
    id: string;
    nome: string | null;
    situacao: string;
    anilha_sigla: string | null;
    anilha_criador: string | null;
    anilha_ano: number | null;
    anilha_numero: number | null;
  }>).map((a) => ({
    id: a.id,
    nome: a.nome,
    anilha: {
      sigla: a.anilha_sigla,
      criador: a.anilha_criador,
      ano: a.anilha_ano,
      numero: a.anilha_numero,
    },
    fora: a.situacao !== "ativo",
  }));
}
