import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterCriatorioAtual } from "@/lib/criatorio";

export interface FilhoteParaAnilhar {
  posturaId: string;
  numeroOvo: number | null;
  dataEclosao: string;
  limiteAnilhamento: string | null;
  diasRestantes: number | null;
  vencido: boolean;
}

export interface NinhadaParaAnilhar {
  ninhadaId: string;
  ninhadaNumero: number | null;
  casalId: string;
  casalNumero: number;
  especie: string | null;
  filhotes: FilhoteParaAnilhar[];
  anilha: {
    sigla: string | null;
    criador: string | null;
    ano: number;
    /** Próximo sequencial livre do ano, oferecido como botão. */
    sugestao: number | null;
  };
}

/**
 * Os filhotes de uma ninhada que ainda esperam anilha.
 *
 * Só entram os que estão em `anilhar`: já eclodiram e a janela abriu. Um ovo
 * chocando na mesma ninhada não aparece — ele não tem o que anilhar hoje.
 */
export async function obterNinhadaParaAnilhar(
  ninhadaId: string,
): Promise<NinhadaParaAnilhar | null> {
  const supabase = await criarClienteServidor();
  const criatorio = await obterCriatorioAtual();
  const ano = new Date().getFullYear();

  const [{ data: posturas, error }, { data: ultimaAnilha }] = await Promise.all([
    supabase
      .from("vw_posturas")
      .select(
        "id, casal_id, casal_numero, ninhada_id, ninhada_numero, numero_ovo, data_eclosao, situacao, especie_nome, limite_anilhamento, dias_restantes_anilha, anilhamento_vencido",
      )
      .eq("ninhada_id", ninhadaId)
      .order("numero_ovo", { ascending: true, nullsFirst: false }),
    supabase
      .from("passaros")
      .select("anilha_numero")
      .is("deleted_at", null)
      .eq("anilha_ano", ano)
      .not("anilha_numero", "is", null)
      .order("anilha_numero", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (error) {
    console.error("obterNinhadaParaAnilhar:", error.message);
    return null;
  }

  const linhas = (posturas ?? []) as Array<{
    id: string;
    casal_id: string;
    casal_numero: number;
    ninhada_numero: number | null;
    numero_ovo: number | null;
    data_eclosao: string | null;
    situacao: string;
    especie_nome: string | null;
    limite_anilhamento: string | null;
    dias_restantes_anilha: number | null;
    anilhamento_vencido: boolean;
  }>;

  if (linhas.length === 0) return null;

  const filhotes = linhas
    .filter((l) => l.situacao === "anilhar" && l.data_eclosao)
    .map((l) => ({
      posturaId: l.id,
      numeroOvo: l.numero_ovo,
      dataEclosao: l.data_eclosao as string,
      limiteAnilhamento: l.limite_anilhamento,
      diasRestantes: l.dias_restantes_anilha,
      vencido: l.anilhamento_vencido,
    }));

  return {
    ninhadaId,
    ninhadaNumero: linhas[0].ninhada_numero,
    casalId: linhas[0].casal_id,
    casalNumero: linhas[0].casal_numero,
    especie: linhas[0].especie_nome,
    filhotes,
    anilha: {
      sigla: criatorio?.clube?.sigla ?? null,
      criador: criatorio?.nro_criador ?? null,
      ano,
      sugestao: ultimaAnilha?.anilha_numero ? Number(ultimaAnilha.anilha_numero) + 1 : null,
    },
  };
}
