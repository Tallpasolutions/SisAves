import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Sexo } from "@/components/ui";
import type { EstadoOvo } from "@/lib/dados/ovos";

export interface ParceiroCasal {
  id: string;
  nome: string | null;
  sexo: Sexo;
  especie: string | null;
  mutacao: string | null;
  anilha: {
    sigla: string | null;
    criador: string | null;
    ano: number | null;
    numero: number | null;
  };
}

export interface CasalListado {
  id: string;
  numero: number;
  gaiola: string | null;
  ativo: boolean;
  vigenciaInicio: string;
  vigenciaFim: string | null;
  endogamiaPct: number | null;
  macho: ParceiroCasal | null;
  femea: ParceiroCasal | null;
  /** Ninhada mais recente e o estado mais urgente dela. */
  ninhadaAtual: number | null;
  ovosAtivos: number;
  estadoMaisUrgente: EstadoOvo | null;
}

const CAMPOS_PARCEIRO =
  "id, nome, sexo, anilha_sigla, anilha_criador, anilha_ano, anilha_numero, especie:especies(nome), mutacao:mutacoes(nome)";

interface LinhaParceiro {
  id: string;
  nome: string | null;
  sexo: Sexo;
  anilha_sigla: string | null;
  anilha_criador: string | null;
  anilha_ano: number | null;
  anilha_numero: number | null;
  especie: { nome: string } | { nome: string }[] | null;
  mutacao: { nome: string } | { nome: string }[] | null;
}

function primeiro<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

function converterParceiro(bruto: unknown): ParceiroCasal | null {
  if (!bruto) return null;
  const p = primeiro(bruto as LinhaParceiro | LinhaParceiro[]);
  if (!p) return null;
  return {
    id: p.id,
    nome: p.nome,
    sexo: p.sexo,
    especie: primeiro(p.especie)?.nome ?? null,
    mutacao: primeiro(p.mutacao)?.nome ?? null,
    anilha: {
      sigla: p.anilha_sigla,
      criador: p.anilha_criador,
      ano: p.anilha_ano,
      numero: p.anilha_numero,
    },
  };
}

/** Mesma ordem de urgência da tela de Ovos. */
const URGENCIA: Record<string, number> = {
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

export async function listarCasais(): Promise<CasalListado[]> {
  const supabase = await criarClienteServidor();

  const [{ data: casais, error }, { data: posturas }] = await Promise.all([
    supabase
      .from("casais")
      .select(
        `id, numero, gaiola, vigencia_inicio, vigencia_fim, endogamia_pct,
         macho:passaros!casais_macho_id_fkey(${CAMPOS_PARCEIRO}),
         femea:passaros!casais_femea_id_fkey(${CAMPOS_PARCEIRO})`,
      )
      .is("deleted_at", null)
      .order("numero"),
    // Agregados da ninhada atual vêm da view, numa consulta só — evita uma
    // ida ao banco por casal.
    supabase
      .from("vw_posturas")
      .select("casal_id, ninhada_numero, situacao"),
  ]);

  if (error) {
    console.error("listarCasais:", error.message);
    return [];
  }

  const resumoPorCasal = new Map<
    string,
    { ninhada: number | null; ovos: number; estado: EstadoOvo | null }
  >();

  for (const p of (posturas ?? []) as Array<{
    casal_id: string;
    ninhada_numero: number | null;
    situacao: EstadoOvo;
  }>) {
    // Terminais não contam como ovo ativo: o ciclo deles acabou.
    const ativo = !["separado", "infertil", "perdido"].includes(p.situacao);
    const atual = resumoPorCasal.get(p.casal_id) ?? {
      ninhada: null,
      ovos: 0,
      estado: null,
    };

    if (ativo) {
      atual.ovos += 1;
      if (p.ninhada_numero !== null && (atual.ninhada === null || p.ninhada_numero > atual.ninhada)) {
        atual.ninhada = p.ninhada_numero;
      }
      if (atual.estado === null || URGENCIA[p.situacao] < URGENCIA[atual.estado]) {
        atual.estado = p.situacao;
      }
    }
    resumoPorCasal.set(p.casal_id, atual);
  }

  return (casais ?? []).map((c) => {
    const resumo = resumoPorCasal.get(c.id);
    return {
      id: c.id,
      numero: c.numero,
      gaiola: c.gaiola,
      ativo: c.vigencia_fim === null || c.vigencia_fim >= hoje(),
      vigenciaInicio: c.vigencia_inicio,
      vigenciaFim: c.vigencia_fim,
      endogamiaPct: c.endogamia_pct !== null ? Number(c.endogamia_pct) : null,
      macho: converterParceiro(c.macho),
      femea: converterParceiro(c.femea),
      ninhadaAtual: resumo?.ninhada ?? null,
      ovosAtivos: resumo?.ovos ?? 0,
      estadoMaisUrgente: resumo?.estado ?? null,
    };
  });
}

export interface NinhadaResumo {
  id: string;
  numero: number;
  iniciadaEm: string;
  total: number;
  nascidos: number;
  perdidos: number;
  estado: EstadoOvo | null;
}

export interface CasalDetalhe extends CasalListado {
  observacoes: string | null;
  /** Recalculado agora, não o guardado na formação do casal. */
  endogamiaAtual: number | null;
  explicacaoEndogamia: string | null;
  ninhadas: NinhadaResumo[];
}

export async function obterCasal(id: string): Promise<CasalDetalhe | null> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase
    .from("casais")
    .select(
      `id, numero, gaiola, vigencia_inicio, vigencia_fim, endogamia_pct, observacoes,
       macho:passaros!casais_macho_id_fkey(${CAMPOS_PARCEIRO}),
       femea:passaros!casais_femea_id_fkey(${CAMPOS_PARCEIRO})`,
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("obterCasal:", error.message);
    return null;
  }
  if (!data) return null;

  const macho = converterParceiro(data.macho);
  const femea = converterParceiro(data.femea);

  const [endogamia, explicacao, ninhadas] = await Promise.all([
    calcularEndogamia(macho?.id, femea?.id),
    explicarEndogamia(macho?.id, femea?.id),
    listarNinhadasDoCasal(id),
  ]);

  const ovosAtivos = ninhadas.reduce(
    (soma, n) => soma + (n.estado && !["separado", "infertil", "perdido"].includes(n.estado) ? n.total : 0),
    0,
  );

  // O estado do casal é o MAIS URGENTE entre todas as ninhadas, não o da mais
  // recente. Usar a mais recente escondia o que importa: registrar uma postura
  // nova fazia sumir o aviso de que filhotes de uma ninhada anterior ainda
  // precisam de anilha. Mesma regra da listagem.
  const estadoMaisUrgente = ninhadas.reduce<EstadoOvo | null>((maisUrgente, n) => {
    if (!n.estado) return maisUrgente;
    if (maisUrgente === null) return n.estado;
    return URGENCIA[n.estado] < URGENCIA[maisUrgente] ? n.estado : maisUrgente;
  }, null);

  return {
    id: data.id,
    numero: data.numero,
    gaiola: data.gaiola,
    ativo: data.vigencia_fim === null || data.vigencia_fim >= hoje(),
    vigenciaInicio: data.vigencia_inicio,
    vigenciaFim: data.vigencia_fim,
    endogamiaPct: data.endogamia_pct !== null ? Number(data.endogamia_pct) : null,
    endogamiaAtual: endogamia,
    explicacaoEndogamia: explicacao,
    observacoes: data.observacoes,
    macho,
    femea,
    ninhadas,
    ninhadaAtual: ninhadas[0]?.numero ?? null,
    ovosAtivos,
    estadoMaisUrgente,
  };
}

async function calcularEndogamia(
  machoId?: string,
  femeaId?: string,
): Promise<number | null> {
  if (!machoId || !femeaId) return null;
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("coeficiente_endogamia", {
    p_macho_id: machoId,
    p_femea_id: femeaId,
  });
  if (error) {
    console.error("coeficiente_endogamia:", error.message);
    return null;
  }
  return data !== null ? Number(data) : null;
}

/**
 * Traduz os ancestrais comuns numa frase ("Avós paternos em comum").
 *
 * O número sozinho não ajuda o criador a decidir: ele precisa saber DE ONDE
 * vem o parentesco para julgar se aceita o cruzamento.
 */
async function explicarEndogamia(
  machoId?: string,
  femeaId?: string,
): Promise<string | null> {
  if (!machoId || !femeaId) return null;

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("ancestrais_comuns", {
    p_a: machoId,
    p_b: femeaId,
  });

  if (error || !data?.length) return null;

  const comuns = data as Array<{
    nome: string | null;
    geracoes_a: number;
    geracoes_b: number;
  }>;

  const maisProximo = comuns[0];
  const grau = Math.max(maisProximo.geracoes_a, maisProximo.geracoes_b);
  const quantos = comuns.length;

  const parentesco =
    grau === 1 ? "progenitor" : grau === 2 ? "avô ou avó" : grau === 3 ? "bisavô ou bisavó" : "ancestral";

  if (quantos === 1) {
    const nome = maisProximo.nome ? ` (${maisProximo.nome})` : "";
    return `Um ${parentesco} em comum${nome}.`;
  }
  return `${quantos} ancestrais em comum, o mais próximo no grau de ${parentesco}.`;
}

async function listarNinhadasDoCasal(casalId: string): Promise<NinhadaResumo[]> {
  const supabase = await criarClienteServidor();

  const [{ data: ninhadas }, { data: posturas }] = await Promise.all([
    supabase
      .from("ninhadas")
      .select("id, numero, iniciada_em")
      .eq("casal_id", casalId)
      .is("deleted_at", null)
      .order("numero", { ascending: false }),
    supabase
      .from("vw_posturas")
      .select("ninhada_id, situacao, data_eclosao")
      .eq("casal_id", casalId),
  ]);

  const porNinhada = new Map<
    string,
    { total: number; nascidos: number; perdidos: number; estado: EstadoOvo | null }
  >();

  for (const p of (posturas ?? []) as Array<{
    ninhada_id: string | null;
    situacao: EstadoOvo;
    data_eclosao: string | null;
  }>) {
    if (!p.ninhada_id) continue;
    const atual = porNinhada.get(p.ninhada_id) ?? {
      total: 0,
      nascidos: 0,
      perdidos: 0,
      estado: null,
    };
    atual.total += 1;
    if (p.data_eclosao) atual.nascidos += 1;
    if (p.situacao === "perdido" || p.situacao === "infertil") atual.perdidos += 1;
    if (atual.estado === null || URGENCIA[p.situacao] < URGENCIA[atual.estado]) {
      atual.estado = p.situacao;
    }
    porNinhada.set(p.ninhada_id, atual);
  }

  return (ninhadas ?? []).map((n) => {
    const r = porNinhada.get(n.id);
    return {
      id: n.id,
      numero: n.numero,
      iniciadaEm: n.iniciada_em,
      total: r?.total ?? 0,
      nascidos: r?.nascidos ?? 0,
      perdidos: r?.perdidos ?? 0,
      estado: r?.estado ?? null,
    };
  });
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}
