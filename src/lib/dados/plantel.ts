import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Sexo } from "@/components/ui";
// Rótulos ficam num módulo puro: componentes de cliente precisam deles, e este
// arquivo carrega o cliente de servidor.
export { descreverEspecie, descreverSituacao, ROTULO_SITUACAO } from "./situacao";

export type FiltroPlantel = "todas" | "machos" | "femeas" | "sem-anilha";

export interface AveListada {
  id: string;
  nome: string | null;
  sexo: Sexo;
  situacao: string;
  dtNascimento: string | null;
  fotoUrl: string | null;
  especie: string | null;
  mutacao: string | null;
  anilha: {
    sigla: string | null;
    criador: string | null;
    ano: number | null;
    numero: number | null;
  };
}

/** Colunas da ave usadas na listagem e na ficha. */
const CAMPOS_AVE = `
  id, nome, sexo, situacao, dt_nascimento, foto_url, observacoes, portador, origem, dt_obito,
  anilha_sigla, anilha_criador, anilha_ano, anilha_numero, codigo_alternativo, pai_id, mae_id,
  especie:especies(id, nome), mutacao:mutacoes(id, nome)
`;

/** Só o necessário para mostrar pai e mãe na ficha. */
const CAMPOS_RESUMO =
  "id, nome, sexo, anilha_sigla, anilha_criador, anilha_ano, anilha_numero";

interface LinhaAve {
  id: string;
  nome: string | null;
  sexo: Sexo;
  situacao: string;
  dt_nascimento: string | null;
  foto_url: string | null;
  anilha_sigla: string | null;
  anilha_criador: string | null;
  anilha_ano: number | null;
  anilha_numero: number | null;
  especie: { id: string; nome: string } | { id: string; nome: string }[] | null;
  mutacao: { id: string; nome: string } | { id: string; nome: string }[] | null;
}

/** O PostgREST infere array nas relações; aqui elas são sempre um só registro. */
function primeiro<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export async function listarPlantel({
  busca = "",
  filtro = "todas",
}: {
  busca?: string;
  filtro?: FiltroPlantel;
} = {}): Promise<AveListada[]> {
  const supabase = await criarClienteServidor();

  let consulta = supabase
    .from("passaros")
    .select(CAMPOS_AVE)
    .is("deleted_at", null)
    .order("anilha_ano", { ascending: false, nullsFirst: false })
    .order("anilha_numero", { ascending: false, nullsFirst: false });

  if (filtro === "machos") consulta = consulta.eq("sexo", "macho");
  if (filtro === "femeas") consulta = consulta.eq("sexo", "femea");
  if (filtro === "sem-anilha") consulta = consulta.is("anilha_numero", null);

  const termo = busca.trim();
  if (termo) {
    // O criador procura pelo número da anilha ou pelo nome da ave — são as
    // duas coisas que ele sabe de cor com o animal na mão.
    const somenteDigitos = termo.replace(/\D/g, "");
    const condicoes = [`nome.ilike.%${termo}%`];
    if (somenteDigitos) condicoes.push(`anilha_numero.eq.${Number(somenteDigitos)}`);
    consulta = consulta.or(condicoes.join(","));
  }

  const { data, error } = await consulta;
  if (error) {
    console.error("listarPlantel:", error.message);
    return [];
  }
  if (!data) return [];

  return (data as unknown as LinhaAve[]).map((a) => ({
    id: a.id,
    nome: a.nome,
    sexo: a.sexo,
    situacao: a.situacao,
    dtNascimento: a.dt_nascimento,
    fotoUrl: a.foto_url,
    especie: primeiro(a.especie)?.nome ?? null,
    mutacao: primeiro(a.mutacao)?.nome ?? null,
    anilha: {
      sigla: a.anilha_sigla,
      criador: a.anilha_criador,
      ano: a.anilha_ano,
      numero: a.anilha_numero,
    },
  }));
}

export interface AveDetalhe extends AveListada {
  observacoes: string | null;
  portador: string | null;
  origem: string;
  dtObito: string | null;
  codigoAlternativo: string | null;
  pai: ResumoAve | null;
  mae: ResumoAve | null;
  pesoAtual: number | null;
  ninhadas: number;
}

export interface ResumoAve {
  id: string;
  nome: string | null;
  sexo: Sexo;
  anilha: AveListada["anilha"];
}

export async function obterAve(id: string): Promise<AveDetalhe | null> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase
    .from("passaros")
    .select(CAMPOS_AVE)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("obterAve:", error.message);
    return null;
  }
  if (!data) return null;

  const a = data as unknown as LinhaAve & Record<string, unknown>;
  const paiId = (a.pai_id as string | null) ?? null;
  const maeId = (a.mae_id as string | null) ?? null;

  // Pai e mãe vêm em consulta própria, não por embed.
  // O PostgREST não resolve relação auto-referente com dica de constraint
  // (PGRST200) e, com dica de coluna, inverte a direção — devolve os FILHOS.
  // Buscar por id é explícito e não depende do cache de relacionamentos.
  const idsProgenitores = [paiId, maeId].filter((v): v is string => Boolean(v));

  const [{ data: progenitores }, { data: pesagem }, { count: ninhadas }] = await Promise.all([
    idsProgenitores.length
      ? supabase.from("passaros").select(CAMPOS_RESUMO).in("id", idsProgenitores)
      : Promise.resolve({ data: [] as unknown[] }),
    supabase
      .from("pesagens")
      .select("peso_gramas")
      .eq("passaro_id", id)
      .is("deleted_at", null)
      .order("data", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("casais")
      .select("id", { count: "exact", head: true })
      .or(`macho_id.eq.${id},femea_id.eq.${id}`)
      .is("deleted_at", null),
  ]);

  const porId = new Map(
    ((progenitores ?? []) as Array<{ id: string }>).map((p) => [p.id, p]),
  );

  return {
    id: a.id,
    nome: a.nome,
    sexo: a.sexo,
    situacao: a.situacao,
    dtNascimento: a.dt_nascimento,
    fotoUrl: a.foto_url,
    especie: primeiro(a.especie)?.nome ?? null,
    mutacao: primeiro(a.mutacao)?.nome ?? null,
    anilha: {
      sigla: a.anilha_sigla,
      criador: a.anilha_criador,
      ano: a.anilha_ano,
      numero: a.anilha_numero,
    },
    observacoes: (a.observacoes as string | null) ?? null,
    portador: (a.portador as string | null) ?? null,
    origem: (a.origem as string) ?? "nascimento_proprio",
    dtObito: (a.dt_obito as string | null) ?? null,
    codigoAlternativo: (a.codigo_alternativo as string | null) ?? null,
    pai: converterResumo(paiId ? porId.get(paiId) : null),
    mae: converterResumo(maeId ? porId.get(maeId) : null),
    pesoAtual: pesagem?.peso_gramas ? Number(pesagem.peso_gramas) : null,
    ninhadas: ninhadas ?? 0,
  };
}

function converterResumo(bruto: unknown): ResumoAve | null {
  if (!bruto) return null;
  const p = bruto as {
    id: string;
    nome: string | null;
    sexo: Sexo;
    anilha_sigla: string | null;
    anilha_criador: string | null;
    anilha_ano: number | null;
    anilha_numero: number | null;
  };
  return {
    id: p.id,
    nome: p.nome,
    sexo: p.sexo,
    anilha: {
      sigla: p.anilha_sigla,
      criador: p.anilha_criador,
      ano: p.anilha_ano,
      numero: p.anilha_numero,
    },
  };
}


/* ===========================================================================
 * C2 — Plantel em tabela (prancha 4b)
 *
 * O desktop pede o que o celular não comporta: dez colunas, filtros por
 * faceta com contagem, ordenação e paginação. Tudo passa pela URL, como a
 * busca da B5 — compartilhar um filtro é compartilhar um link, e a tela
 * funciona antes de a hidratação chegar.
 * ======================================================================== */

export interface FiltrosTabela {
  busca?: string;
  /** Ids de espécie. Vazio = todas. */
  especies?: string[];
  sexo?: Sexo | "todos";
  /** Valores de `situacao_ave`. Vazio = todas. */
  situacoes?: string[];
  anoAnilha?: number;
  /** A pílula "Sem anilha" da B5: ave que ainda não foi anilhada. */
  semAnilha?: boolean;
  ordem?: "anilha" | "nome" | "nascimento";
  direcao?: "asc" | "desc";
  pagina?: number;
}

export interface Faceta {
  valor: string;
  rotulo: string;
  contagem: number;
}

export interface AveNaTabela extends AveListada {
  mutacaoNome: string | null;
  casalNumero: number | null;
  casalId: string | null;
}

export interface PlantelEmTabela {
  aves: AveNaTabela[];
  total: number;
  pagina: number;
  paginas: number;
  facetas: {
    especies: Faceta[];
    situacoes: Faceta[];
    anos: number[];
  };
}

export const POR_PAGINA = 50;

const ROTULO_FACETA_SITUACAO: Record<string, string> = {
  ativo: "Plantel ativo",
  vendido: "Vendido",
  doado: "Doado",
  emprestado: "Emprestado",
  morto: "Óbito",
  perdido: "Perdido",
};

export async function listarPlantelEmTabela(
  filtros: FiltrosTabela = {},
): Promise<PlantelEmTabela> {
  const supabase = await criarClienteServidor();
  const pagina = Math.max(1, filtros.pagina ?? 1);

  /*
   * As facetas contam sobre o plantel INTEIRO, não sobre o resultado filtrado.
   * Uma contagem que muda quando você clica nela não serve para navegar: o
   * criador precisa saber quantos curiós existem para decidir filtrar por
   * curió. Mesma regra das pílulas da tela de Ovos.
   */
  const { data: todas } = await supabase
    .from("passaros")
    .select("id, situacao, anilha_ano, especie:especies(id, nome)")
    .is("deleted_at", null);

  const universo = (todas ?? []) as unknown as Array<{
    id: string;
    situacao: string;
    anilha_ano: number | null;
    especie: { id: string; nome: string } | { id: string; nome: string }[] | null;
  }>;

  const porEspecie = new Map<string, { rotulo: string; contagem: number }>();
  const porSituacao = new Map<string, number>();
  const anos = new Set<number>();

  for (const a of universo) {
    const especie = primeiro(a.especie);
    if (especie) {
      const atual = porEspecie.get(especie.id);
      porEspecie.set(especie.id, {
        rotulo: especie.nome,
        contagem: (atual?.contagem ?? 0) + 1,
      });
    }
    porSituacao.set(a.situacao, (porSituacao.get(a.situacao) ?? 0) + 1);
    if (a.anilha_ano) anos.add(a.anilha_ano);
  }

  let consulta = supabase
    .from("passaros")
    .select(// A constraint chama-se `passaros_postura_fk`, não o `_id_fkey` que o
    // PostgREST usaria por convenção — errar o nome dá PGRST200.
    `${CAMPOS_AVE}, casal_origem:posturas!passaros_postura_fk(casal:casais(id, numero))`, {
      count: "exact",
    })
    .is("deleted_at", null);

  if (filtros.especies?.length) consulta = consulta.in("especie_id", filtros.especies);
  if (filtros.situacoes?.length) consulta = consulta.in("situacao", filtros.situacoes);
  if (filtros.sexo && filtros.sexo !== "todos") consulta = consulta.eq("sexo", filtros.sexo);
  if (filtros.anoAnilha) consulta = consulta.eq("anilha_ano", filtros.anoAnilha);
  if (filtros.semAnilha) consulta = consulta.is("anilha_numero", null);

  const termo = filtros.busca?.trim();
  if (termo) {
    const somenteDigitos = termo.replace(/\D/g, "");
    const condicoes = [`nome.ilike.%${termo}%`];
    if (somenteDigitos) condicoes.push(`anilha_numero.eq.${Number(somenteDigitos)}`);
    consulta = consulta.or(condicoes.join(","));
  }

  const ascendente = filtros.direcao !== "desc";
  if (filtros.ordem === "nome") {
    consulta = consulta.order("nome", { ascending: ascendente, nullsFirst: false });
  } else if (filtros.ordem === "nascimento") {
    consulta = consulta.order("dt_nascimento", { ascending: ascendente, nullsFirst: false });
  } else {
    // Padrão: pela anilha, que é como o criador procura a ave.
    consulta = consulta
      .order("anilha_ano", { ascending: ascendente, nullsFirst: false })
      .order("anilha_numero", { ascending: ascendente, nullsFirst: false });
  }

  const de = (pagina - 1) * POR_PAGINA;
  const { data, count, error } = await consulta.range(de, de + POR_PAGINA - 1);

  if (error) {
    console.error("listarPlantelEmTabela:", error.message);
  }

  const aves = ((data ?? []) as unknown as Array<LinhaAve & Record<string, unknown>>).map(
    (a) => {
      const postura = primeiro(
        a.casal_origem as { casal: { id: string; numero: number } | null } | null,
      );
      const casal = postura ? primeiro(postura.casal) : null;

      return {
        id: a.id,
        nome: a.nome,
        sexo: a.sexo,
        situacao: a.situacao,
        dtNascimento: a.dt_nascimento,
        fotoUrl: a.foto_url,
        especie: primeiro(a.especie)?.nome ?? null,
        mutacao: primeiro(a.mutacao)?.nome ?? null,
        mutacaoNome: primeiro(a.mutacao)?.nome ?? null,
        casalId: casal?.id ?? null,
        casalNumero: casal?.numero ?? null,
        anilha: {
          sigla: a.anilha_sigla,
          criador: a.anilha_criador,
          ano: a.anilha_ano,
          numero: a.anilha_numero,
        },
      };
    },
  );

  const total = count ?? aves.length;

  return {
    aves,
    total,
    pagina,
    paginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
    facetas: {
      especies: [...porEspecie.entries()]
        .map(([valor, { rotulo, contagem }]) => ({ valor, rotulo, contagem }))
        .sort((a, b) => b.contagem - a.contagem || a.rotulo.localeCompare(b.rotulo)),
      situacoes: [...porSituacao.entries()]
        .map(([valor, contagem]) => ({
          valor,
          rotulo: ROTULO_FACETA_SITUACAO[valor] ?? valor,
          contagem,
        }))
        .sort((a, b) => b.contagem - a.contagem),
      anos: [...anos].sort((a, b) => b - a),
    },
  };
}
