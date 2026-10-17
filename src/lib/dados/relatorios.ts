import { criarClienteServidor } from "@/lib/supabase/servidor";
import { paraISO } from "@/lib/data";

export interface LinhaTemporada {
  ano: number;
  posturas: number;
  ovos: number;
  ferteis: number;
  nascidos: number;
  anilhados: number;
  perdidos: number;
  infertis: number;
}

export interface DesempenhoCasal {
  casalId: string;
  numero: number;
  especie: string | null;
  ovos: number;
  nascidos: number;
  anilhados: number;
  /** Ovos cujo desfecho já se sabe. É o denominador da taxa. */
  decididos: number;
  /** Nascidos ÷ decididos. Null quando nada foi decidido ainda. */
  eclosao: number | null;
}

export interface Relatorios {
  temporadas: LinhaTemporada[];
  casais: DesempenhoCasal[];
  /** Ovos cujo desfecho ainda não se sabe — ficam fora de toda taxa. */
  emCurso: number;
}

interface LinhaPostura {
  casal_id: string;
  casal_numero: number;
  especie_nome: string | null;
  data_postura: string;
  fertil: boolean | null;
  data_eclosao: string | null;
  data_anilhamento: string | null;
  desfecho: string | null;
}

/**
 * Os números que o criador usa para decidir o plantel do ano seguinte.
 *
 * A regra que atravessa tudo: **taxa só conta ovo já decidido**. Ovo chocando
 * não é fracasso, é ovo chocando — contá-lo como tal faz a eclosão despencar
 * a cada postura nova, e o número que deveria medir a qualidade do plantel
 * passa a medir o calendário. Mesmo erro já corrigido no painel.
 */
export async function obterRelatorios(): Promise<Relatorios> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase
    .from("vw_posturas")
    .select(
      "casal_id, casal_numero, especie_nome, data_postura, fertil, data_eclosao, data_anilhamento, desfecho",
    );

  if (error) {
    console.error("obterRelatorios:", error.message);
    return { temporadas: [], casais: [], emCurso: 0 };
  }

  const linhas = (data ?? []) as LinhaPostura[];

  const porAno = new Map<number, LinhaTemporada>();
  const porCasal = new Map<string, DesempenhoCasal>();
  let emCurso = 0;

  for (const l of linhas) {
    const ano = Number(l.data_postura.slice(0, 4));
    const decidido =
      l.data_eclosao !== null || l.desfecho !== null || l.fertil === false;

    if (!decidido) emCurso += 1;

    const temporada = porAno.get(ano) ?? {
      ano,
      posturas: 0,
      ovos: 0,
      ferteis: 0,
      nascidos: 0,
      anilhados: 0,
      perdidos: 0,
      infertis: 0,
    };
    temporada.ovos += 1;
    if (l.fertil === true) temporada.ferteis += 1;
    if (l.data_eclosao) temporada.nascidos += 1;
    if (l.data_anilhamento) temporada.anilhados += 1;
    if (l.desfecho === "perdido") temporada.perdidos += 1;
    if (l.desfecho === "infertil" || l.fertil === false) temporada.infertis += 1;
    porAno.set(ano, temporada);

    const casal = porCasal.get(l.casal_id) ?? {
      casalId: l.casal_id,
      numero: l.casal_numero,
      especie: l.especie_nome,
      ovos: 0,
      nascidos: 0,
      anilhados: 0,
      decididos: 0,
      eclosao: null,
    };
    casal.ovos += 1;
    if (l.data_eclosao) casal.nascidos += 1;
    if (l.data_anilhamento) casal.anilhados += 1;
    porCasal.set(l.casal_id, casal);
  }

  // Posturas distintas por ano: a ninhada é o evento, o ovo é a unidade.
  const ninhadasPorAno = new Map<number, Set<string>>();
  for (const l of linhas) {
    const ano = Number(l.data_postura.slice(0, 4));
    const chave = `${l.casal_id}:${l.data_postura}`;
    const conjunto = ninhadasPorAno.get(ano) ?? new Set<string>();
    conjunto.add(chave);
    ninhadasPorAno.set(ano, conjunto);
  }
  for (const [ano, conjunto] of ninhadasPorAno) {
    const temporada = porAno.get(ano);
    if (temporada) temporada.posturas = conjunto.size;
  }

  // A taxa por casal, sobre o que já foi decidido naquele casal. O
  // denominador vai junto: "100%" ao lado de "1 de 5 ovos" não se lê como
  // sucesso, lê-se como engano — e a tela precisa mostrar sobre o que a conta
  // foi feita.
  for (const [casalId, casal] of porCasal) {
    casal.decididos = linhas.filter(
      (l) =>
        l.casal_id === casalId &&
        (l.data_eclosao !== null || l.desfecho !== null || l.fertil === false),
    ).length;
    casal.eclosao = casal.decididos === 0 ? null : casal.nascidos / casal.decididos;
  }

  return {
    temporadas: [...porAno.values()].sort((a, b) => b.ano - a.ano),
    casais: [...porCasal.values()].sort(
      (a, b) => (b.eclosao ?? -1) - (a.eclosao ?? -1) || b.ovos - a.ovos,
    ),
    emCurso,
  };
}

/** "2026" quando é o ano corrente, para a tela dizer "temporada atual". */
export function anoAtual(): number {
  return Number(paraISO(new Date()).slice(0, 4));
}
