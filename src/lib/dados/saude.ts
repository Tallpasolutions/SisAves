import { criarClienteServidor } from "@/lib/supabase/servidor";

export interface ItemCatalogo {
  id: string;
  nome: string;
  descricao: string | null;
  /** `true` quando vem do catálogo compartilhado: lê-se, não se edita. */
  doCatalogo: boolean;
}

export interface Medicamento extends ItemCatalogo {
  principioAtivo: string | null;
  dosagem: string | null;
  /** Dias de espera depois do fim do tratamento. Null = sem carência. */
  carenciaDias: number | null;
  observacoes: string | null;
  /** Ids das doenças que ele trata. */
  doencas: string[];
  /** Quantos tratamentos já o usaram. */
  usos?: number;
}

export interface Doenca extends ItemCatalogo {
  /** Ids dos sintomas observados nela. */
  sintomas: string[];
  usos?: number;
}

export interface Tratamento {
  id: string;
  inicio: string;
  fim: string | null;
  dosagem: string | null;
  observacoes: string | null;
  emCurso: boolean;
  carenciaDias: number | null;
  /** Só existe depois do fim: a carência conta do fim da aplicação. */
  carenciaAte: string | null;
  carenciaAtiva: boolean;
  medicamento: { id: string; nome: string; principio: string | null } | null;
  doenca: { id: string; nome: string } | null;
  ave: {
    id: string;
    nome: string | null;
    anilha: {
      sigla: string | null;
      criador: string | null;
      ano: number | null;
      numero: number | null;
    };
  } | null;
  casal: { id: string; numero: number } | null;
}

interface LinhaTratamento {
  id: string;
  passaro_id: string | null;
  casal_id: string | null;
  medicamento_id: string | null;
  doenca_id: string | null;
  inicio: string;
  fim: string | null;
  dosagem: string | null;
  observacoes: string | null;
  medicamento_nome: string | null;
  medicamento_principio: string | null;
  carencia_dias: number | null;
  doenca_nome: string | null;
  passaro_nome: string | null;
  anilha_sigla: string | null;
  anilha_criador: string | null;
  anilha_ano: number | null;
  anilha_numero: number | null;
  casal_numero: number | null;
  em_curso: boolean;
  carencia_ate: string | null;
  carencia_ativa: boolean;
}

const CAMPOS_TRATAMENTO = `
  id, passaro_id, casal_id, medicamento_id, doenca_id, inicio, fim, dosagem,
  observacoes, medicamento_nome, medicamento_principio, carencia_dias,
  doenca_nome, passaro_nome, anilha_sigla, anilha_criador, anilha_ano,
  anilha_numero, casal_numero, em_curso, carencia_ate, carencia_ativa
`;

function montarTratamento(t: LinhaTratamento): Tratamento {
  return {
    id: t.id,
    inicio: t.inicio,
    fim: t.fim,
    dosagem: t.dosagem,
    observacoes: t.observacoes,
    emCurso: t.em_curso,
    carenciaDias: t.carencia_dias,
    carenciaAte: t.carencia_ate,
    carenciaAtiva: t.carencia_ativa,
    medicamento: t.medicamento_id
      ? {
          id: t.medicamento_id,
          nome: t.medicamento_nome ?? "Medicamento",
          principio: t.medicamento_principio,
        }
      : null,
    doenca: t.doenca_id
      ? { id: t.doenca_id, nome: t.doenca_nome ?? "Doença" }
      : null,
    ave: t.passaro_id
      ? {
          id: t.passaro_id,
          nome: t.passaro_nome,
          anilha: {
            sigla: t.anilha_sigla,
            criador: t.anilha_criador,
            ano: t.anilha_ano,
            numero: t.anilha_numero,
          },
        }
      : null,
    casal:
      t.casal_id && t.casal_numero !== null
        ? { id: t.casal_id, numero: t.casal_numero }
        : null,
  };
}

/**
 * Os tratamentos do criatório, do mais recente para o mais antigo.
 *
 * `aveId` filtra o histórico sanitário de uma ave — é como a ficha dela chega
 * aqui sem precisar de rota própria.
 */
export async function listarTratamentos(aveId?: string): Promise<Tratamento[]> {
  const supabase = await criarClienteServidor();

  let consulta = supabase
    .from("vw_tratamentos")
    .select(CAMPOS_TRATAMENTO)
    .order("inicio", { ascending: false })
    .order("created_at", { ascending: false });

  if (aveId) consulta = consulta.eq("passaro_id", aveId);

  const { data, error } = await consulta;

  if (error) {
    console.error("listarTratamentos:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as LinhaTratamento[]).map(montarTratamento);
}

export async function obterTratamento(id: string): Promise<Tratamento | null> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase
    .from("vw_tratamentos")
    .select(CAMPOS_TRATAMENTO)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("obterTratamento:", error.message);
    return null;
  }
  if (!data) return null;

  return montarTratamento(data as unknown as LinhaTratamento);
}

export async function listarSintomas(): Promise<ItemCatalogo[]> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase
    .from("sintomas")
    .select("id, nome, descricao, criatorio_id")
    .is("deleted_at", null)
    .order("nome");

  if (error) {
    console.error("listarSintomas:", error.message);
    return [];
  }

  return ((data ?? []) as Array<{
    id: string;
    nome: string;
    descricao: string | null;
    criatorio_id: string | null;
  }>).map((s) => ({
    id: s.id,
    nome: s.nome,
    descricao: s.descricao,
    doCatalogo: s.criatorio_id === null,
  }));
}

export async function listarDoencas(comUsos = false): Promise<Doenca[]> {
  const supabase = await criarClienteServidor();

  const [{ data, error }, { data: vinculos }] = await Promise.all([
    supabase
      .from("doencas")
      .select("id, nome, descricao, criatorio_id")
      .is("deleted_at", null)
      .order("nome"),
    supabase.from("doenca_sintomas").select("doenca_id, sintoma_id"),
  ]);

  if (error) {
    console.error("listarDoencas:", error.message);
    return [];
  }

  const porDoenca = new Map<string, string[]>();
  for (const v of (vinculos ?? []) as Array<{
    doenca_id: string;
    sintoma_id: string;
  }>) {
    porDoenca.set(v.doenca_id, [...(porDoenca.get(v.doenca_id) ?? []), v.sintoma_id]);
  }

  const doencas = ((data ?? []) as Array<{
    id: string;
    nome: string;
    descricao: string | null;
    criatorio_id: string | null;
  }>).map((d) => ({
    id: d.id,
    nome: d.nome,
    descricao: d.descricao,
    doCatalogo: d.criatorio_id === null,
    sintomas: porDoenca.get(d.id) ?? [],
  }));

  if (!comUsos) return doencas;

  return comContagem(doencas, await contarPorColuna("doenca_id"));
}

export async function listarMedicamentos(comUsos = false): Promise<Medicamento[]> {
  const supabase = await criarClienteServidor();

  const [{ data, error }, { data: vinculos }] = await Promise.all([
    supabase
      .from("medicamentos")
      .select(
        "id, nome, principio_ativo, dosagem, carencia_dias, observacoes, criatorio_id",
      )
      .is("deleted_at", null)
      .order("nome"),
    supabase.from("medicamento_doencas").select("medicamento_id, doenca_id"),
  ]);

  if (error) {
    console.error("listarMedicamentos:", error.message);
    return [];
  }

  const porMedicamento = new Map<string, string[]>();
  for (const v of (vinculos ?? []) as Array<{
    medicamento_id: string;
    doenca_id: string;
  }>) {
    porMedicamento.set(v.medicamento_id, [
      ...(porMedicamento.get(v.medicamento_id) ?? []),
      v.doenca_id,
    ]);
  }

  const medicamentos = ((data ?? []) as Array<{
    id: string;
    nome: string;
    principio_ativo: string | null;
    dosagem: string | null;
    carencia_dias: number | null;
    observacoes: string | null;
    criatorio_id: string | null;
  }>).map((m) => ({
    id: m.id,
    nome: m.nome,
    // O medicamento não tem campo de descrição: o que ele tem é princípio
    // ativo, dose e observação, que são três coisas diferentes.
    descricao: null,
    principioAtivo: m.principio_ativo,
    dosagem: m.dosagem,
    carenciaDias: m.carencia_dias,
    observacoes: m.observacoes,
    doCatalogo: m.criatorio_id === null,
    doencas: porMedicamento.get(m.id) ?? [],
  }));

  if (!comUsos) return medicamentos;

  return comContagem(medicamentos, await contarPorColuna("medicamento_id"));
}

/** Quantos tratamentos citam cada medicamento (ou cada doença). */
async function contarPorColuna(
  coluna: "medicamento_id" | "doenca_id",
): Promise<Map<string, number>> {
  const supabase = await criarClienteServidor();

  const { data } = await supabase
    .from("tratamentos")
    .select(coluna)
    .is("deleted_at", null)
    .not(coluna, "is", null);

  const contagem = new Map<string, number>();
  for (const linha of (data ?? []) as Array<Record<string, string>>) {
    const id = linha[coluna];
    if (id) contagem.set(id, (contagem.get(id) ?? 0) + 1);
  }
  return contagem;
}

function comContagem<T extends { id: string }>(
  itens: T[],
  contagem: Map<string, number>,
): Array<T & { usos: number }> {
  return itens.map((i) => ({ ...i, usos: contagem.get(i.id) ?? 0 }));
}

export interface OpcaoCasal {
  id: string;
  numero: number;
  ativo: boolean;
}

/**
 * Os casais que um tratamento pode citar.
 *
 * Trata-se o casal inteiro quando a aplicação é na água ou na ração do
 * viveiro — é assim que vermífugo e antibiótico costumam ir. O casal
 * encerrado continua na lista pelo mesmo motivo da ave vendida: o tratamento
 * antigo precisa continuar editável.
 */
export async function opcoesDeCasal(): Promise<OpcaoCasal[]> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase
    .from("casais")
    .select("id, numero, vigencia_fim")
    .is("deleted_at", null)
    .order("numero");

  if (error) {
    console.error("opcoesDeCasal:", error.message);
    return [];
  }

  return ((data ?? []) as Array<{
    id: string;
    numero: number;
    vigencia_fim: string | null;
  }>).map((c) => ({
    id: c.id,
    numero: c.numero,
    // "Ativo" é "ainda não encerrado" — a mesma definição do resto do produto.
    ativo: c.vigencia_fim === null,
  }));
}
