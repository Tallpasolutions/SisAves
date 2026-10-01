import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Sexo } from "@/components/ui";

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

const ROTULO_SITUACAO: Record<string, { texto: string; tom: "ok" | "neutro" | "critico" }> = {
  ativo: { texto: "Plantel ativo", tom: "ok" },
  vendido: { texto: "Vendido", tom: "neutro" },
  doado: { texto: "Doado", tom: "neutro" },
  emprestado: { texto: "Emprestado", tom: "neutro" },
  morto: { texto: "Óbito", tom: "critico" },
  perdido: { texto: "Perdido", tom: "critico" },
};

export function descreverSituacao(situacao: string) {
  return ROTULO_SITUACAO[situacao] ?? { texto: situacao, tom: "neutro" as const };
}

/** "Curió · Lutino" — sem separador sobrando quando falta um dos dois. */
export function descreverEspecie(
  especie: string | null,
  mutacao: string | null,
): string {
  return [especie, mutacao].filter(Boolean).join(" · ") || "Espécie não informada";
}
