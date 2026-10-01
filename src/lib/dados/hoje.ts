import { criarClienteServidor } from "@/lib/supabase/servidor";

/** Os quatro estados que exigem ação, na ordem em que a tela os apresenta. */
export type SituacaoTarefa = "anilhar" | "verificar" | "nascendo" | "separar";

export interface Tarefa {
  chave: string;
  situacao: SituacaoTarefa;
  casalId: string;
  casalNumero: number;
  ninhadaNumero: number | null;
  especie: string | null;
  /** Quantos ovos ou filhotes dessa ninhada estão nesse estado. */
  quantidade: number;
  /** Dias até a janela de anilhamento fechar. Negativo = já passou. */
  diasRestantesAnilha: number | null;
  anilhamentoVencido: boolean;
  previsaoEclosao: string | null;
}

export interface IndicadoresPlantel {
  aves: number;
  casaisAtivos: number;
  ovosEmChoco: number;
  nascimentosNoMes: number;
}

interface LinhaTarefa {
  postura_id: string;
  casal_id: string;
  casal_numero: number;
  ninhada_numero: number | null;
  especie_nome: string | null;
  situacao: SituacaoTarefa;
  prioridade: number;
  dias_restantes_anilha: number | null;
  anilhamento_vencido: boolean;
  previsao_eclosao: string | null;
}

/**
 * Tarefas do dia, agrupadas por ninhada.
 *
 * A view devolve uma linha por OVO; o criador pensa em ninhada ("3 filhotes
 * para anilhar — Casal 03"), não em ovo avulso. A soma acontece aqui, não no
 * banco, porque a view também alimenta a tela de Ovos, onde o ovo individual
 * é a unidade certa.
 */
export async function obterTarefasDeHoje(): Promise<Tarefa[]> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase
    .from("vw_tarefas_hoje")
    .select(
      "postura_id, casal_id, casal_numero, ninhada_numero, especie_nome, situacao, prioridade, dias_restantes_anilha, anilhamento_vencido, previsao_eclosao",
    )
    .order("prioridade");

  if (error || !data) return [];

  const porNinhada = new Map<string, Tarefa>();

  for (const linha of data as LinhaTarefa[]) {
    const chave = `${linha.casal_id}:${linha.ninhada_numero ?? "–"}:${linha.situacao}`;
    const atual = porNinhada.get(chave);

    if (atual) {
      atual.quantidade += 1;
      // Dentro da mesma ninhada vale o prazo mais apertado.
      if (
        linha.dias_restantes_anilha !== null &&
        (atual.diasRestantesAnilha === null ||
          linha.dias_restantes_anilha < atual.diasRestantesAnilha)
      ) {
        atual.diasRestantesAnilha = linha.dias_restantes_anilha;
      }
      atual.anilhamentoVencido ||= linha.anilhamento_vencido;
      continue;
    }

    porNinhada.set(chave, {
      chave,
      situacao: linha.situacao,
      casalId: linha.casal_id,
      casalNumero: linha.casal_numero,
      ninhadaNumero: linha.ninhada_numero,
      especie: linha.especie_nome,
      quantidade: 1,
      diasRestantesAnilha: linha.dias_restantes_anilha,
      anilhamentoVencido: linha.anilhamento_vencido,
      previsaoEclosao: linha.previsao_eclosao,
    });
  }

  const ordem: Record<SituacaoTarefa, number> = {
    anilhar: 1,
    verificar: 2,
    nascendo: 3,
    separar: 4,
  };

  return [...porNinhada.values()].sort(
    (a, b) => ordem[a.situacao] - ordem[b.situacao] || a.casalNumero - b.casalNumero,
  );
}

export async function obterIndicadores(): Promise<IndicadoresPlantel> {
  const supabase = await criarClienteServidor();
  const primeiroDoMes = new Date();
  primeiroDoMes.setDate(1);
  const desde = primeiroDoMes.toISOString().slice(0, 10);

  const [aves, casais, choco, nascimentos] = await Promise.all([
    supabase
      .from("passaros")
      .select("id", { count: "exact", head: true })
      .eq("situacao", "ativo")
      .is("deleted_at", null),
    supabase
      .from("casais")
      .select("id", { count: "exact", head: true })
      .is("vigencia_fim", null)
      .is("deleted_at", null),
    supabase
      .from("vw_posturas")
      .select("id", { count: "exact", head: true })
      .eq("situacao", "chocando"),
    supabase
      .from("posturas")
      .select("id", { count: "exact", head: true })
      .gte("data_eclosao", desde)
      .is("deleted_at", null),
  ]);

  return {
    aves: aves.count ?? 0,
    casaisAtivos: casais.count ?? 0,
    ovosEmChoco: choco.count ?? 0,
    nascimentosNoMes: nascimentos.count ?? 0,
  };
}

/** "3 filhotes para anilhar" — contagem antes do substantivo, como manda a cópia. */
export function descreverTarefa(t: Tarefa): string {
  const n = t.quantidade;
  switch (t.situacao) {
    case "anilhar":
      return `${n} ${n === 1 ? "filhote para anilhar" : "filhotes para anilhar"}`;
    case "verificar":
      return `${n} ${n === 1 ? "ovo para ovoscopia" : "ovos para ovoscopia"}`;
    case "nascendo":
      return `${n} ${n === 1 ? "ovo nascendo" : "ovos nascendo"}`;
    case "separar":
      return `${n} ${n === 1 ? "filhote para separar" : "filhotes para separar"}`;
  }
}

/** A linha de contexto: onde está e qual o prazo. */
export function detalharTarefa(t: Tarefa): string {
  const partes = [`Casal ${String(t.casalNumero).padStart(2, "0")}`];
  if (t.ninhadaNumero !== null) {
    partes.push(`Ninhada ${String(t.ninhadaNumero).padStart(2, "0")}`);
  }
  if (t.especie) partes.push(t.especie);

  if (t.situacao === "anilhar" && t.diasRestantesAnilha !== null) {
    partes.push(
      t.anilhamentoVencido
        ? "janela encerrada"
        : t.diasRestantesAnilha <= 0
          ? "último dia"
          : `${t.diasRestantesAnilha} ${t.diasRestantesAnilha === 1 ? "dia restante" : "dias restantes"}`,
    );
  }

  return partes.join(" · ");
}
