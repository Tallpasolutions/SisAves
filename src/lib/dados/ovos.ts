import { criarClienteServidor } from "@/lib/supabase/servidor";

/** Os nove estados possíveis de uma postura, na ordem do ciclo. */
export const ESTADOS_OVO = [
  "chocando",
  "verificar",
  "nascendo",
  "nascido",
  "anilhar",
  "separar",
  "separado",
  "infertil",
  "perdido",
] as const;

export type EstadoOvo = (typeof ESTADOS_OVO)[number];

/** Só estes aparecem como filtro: os terminais ficam fora da operação do dia. */
export const ESTADOS_ATIVOS: EstadoOvo[] = [
  "verificar",
  "chocando",
  "nascendo",
  "anilhar",
  "separar",
];

export interface Ninhada {
  chave: string;
  casalId: string;
  /** Null quando a postura foi registrada sem ninhada (dado antigo). */
  ninhadaId: string | null;
  casalNumero: number;
  ninhadaNumero: number | null;
  especie: string | null;
  dataPostura: string;
  /** Estado predominante — o mais urgente da ninhada. */
  estado: EstadoOvo;
  /** Quantos ovos em cada estado dentro desta ninhada. */
  porEstado: Partial<Record<EstadoOvo, number>>;
  total: number;
  previsaoEclosao: string | null;
  /** Data real da eclosão, quando já aconteceu. */
  dataEclosao: string | null;
  limiteAnilhamento: string | null;
  diasRestantesAnilha: number | null;
  anilhamentoVencido: boolean;
  /** Dias desde a postura — "Chocando · dia 6". */
  diaDoChoco: number;
}

interface LinhaPostura {
  id: string;
  casal_id: string;
  ninhada_id: string | null;
  casal_numero: number;
  ninhada_numero: number | null;
  especie_nome: string | null;
  data_postura: string;
  data_eclosao: string | null;
  situacao: EstadoOvo;
  previsao_eclosao: string | null;
  limite_anilhamento: string | null;
  dias_restantes_anilha: number | null;
  anilhamento_vencido: boolean;
}

/**
 * Urgência: quanto menor, mais em cima na tela. "anilhar" vem primeiro porque
 * a janela fecha em dois dias; "perdido" e "infertil" são fatos registrados,
 * não tarefas, e fecham a lista.
 */
const URGENCIA: Record<EstadoOvo, number> = {
  anilhar: 1,
  verificar: 2,
  nascendo: 3,
  separar: 4,
  nascido: 5,
  chocando: 6,
  separado: 7,
  infertil: 8,
  perdido: 9,
};

export async function listarNinhadas(filtro?: EstadoOvo): Promise<Ninhada[]> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase
    .from("vw_posturas")
    .select(
      "id, casal_id, ninhada_id, casal_numero, ninhada_numero, especie_nome, data_postura, data_eclosao, situacao, previsao_eclosao, limite_anilhamento, dias_restantes_anilha, anilhamento_vencido",
    )
    .order("data_postura", { ascending: false });

  if (error) {
    console.error("listarNinhadas:", error.message);
    return [];
  }

  const porNinhada = new Map<string, Ninhada>();

  for (const l of (data ?? []) as LinhaPostura[]) {
    const chave = `${l.casal_id}:${l.ninhada_numero ?? "–"}`;
    let n = porNinhada.get(chave);

    if (!n) {
      n = {
        chave,
        casalId: l.casal_id,
        ninhadaId: l.ninhada_id,
        casalNumero: l.casal_numero,
        ninhadaNumero: l.ninhada_numero,
        especie: l.especie_nome,
        dataPostura: l.data_postura,
        estado: l.situacao,
        porEstado: {},
        total: 0,
        previsaoEclosao: l.previsao_eclosao,
        dataEclosao: l.data_eclosao,
        limiteAnilhamento: l.limite_anilhamento,
        diasRestantesAnilha: l.dias_restantes_anilha,
        anilhamentoVencido: l.anilhamento_vencido,
        diaDoChoco: diasDesde(l.data_postura),
      };
      porNinhada.set(chave, n);
    }

    n.total += 1;
    // Basta um ovo ter eclodido para a ninhada ter data real de eclosão.
    if (l.data_eclosao && !n.dataEclosao) n.dataEclosao = l.data_eclosao;
    n.porEstado[l.situacao] = (n.porEstado[l.situacao] ?? 0) + 1;

    // O estado da ninhada é o mais urgente entre os ovos dela: se três estão
    // chocando e um precisa de anilha, a ninhada precisa de anilha.
    if (URGENCIA[l.situacao] < URGENCIA[n.estado]) n.estado = l.situacao;

    if (
      l.dias_restantes_anilha !== null &&
      (n.diasRestantesAnilha === null || l.dias_restantes_anilha < n.diasRestantesAnilha)
    ) {
      n.diasRestantesAnilha = l.dias_restantes_anilha;
    }
    n.anilhamentoVencido ||= l.anilhamento_vencido;
  }

  const lista = [...porNinhada.values()];
  const filtrada = filtro ? lista.filter((n) => (n.porEstado[filtro] ?? 0) > 0) : lista;

  return filtrada.sort(
    (a, b) =>
      URGENCIA[a.estado] - URGENCIA[b.estado] ||
      b.dataPostura.localeCompare(a.dataPostura),
  );
}

/** Contagem de NINHADAS por estado, para as pílulas do topo. */
export function contarPorEstado(ninhadas: Ninhada[]): Record<string, number> {
  const contagem: Record<string, number> = { todas: ninhadas.length };
  for (const estado of ESTADOS_ATIVOS) {
    contagem[estado] = ninhadas.filter((n) => (n.porEstado[estado] ?? 0) > 0).length;
  }
  return contagem;
}

function diasDesde(data: string): number {
  const d = new Date(`${data}T00:00:00`);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((hoje.getTime() - d.getTime()) / 86_400_000));
}

export const ROTULO_ESTADO: Record<EstadoOvo, string> = {
  chocando: "Chocando",
  verificar: "Ovoscopia",
  nascendo: "Nascendo",
  nascido: "Nascido",
  anilhar: "Anilhar",
  separar: "Separar",
  separado: "Separado",
  infertil: "Infértil",
  perdido: "Perda",
};

export const TOM_ESTADO: Record<EstadoOvo, "info" | "neutro" | "ok" | "acao" | "critico"> = {
  chocando: "info",
  verificar: "neutro",
  nascendo: "ok",
  nascido: "ok",
  anilhar: "acao",
  separar: "neutro",
  separado: "neutro",
  infertil: "critico",
  perdido: "critico",
};
