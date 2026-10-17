import { criarClienteServidor } from "@/lib/supabase/servidor";
import { deslocarMes, rotuloCurto, type TipoLancamento } from "./financeiro-rotulos";

export interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: TipoLancamento;
  /** Nome de glifo Lucide gravado no banco. */
  icone: string | null;
  /** Preenchida só nas categorias de sistema — é o que as torna intocáveis. */
  chave: string | null;
  /** Quantos lançamentos a usam. Só vem na tela do catálogo. */
  usos?: number;
}

export interface Lancamento {
  id: string;
  tipo: TipoLancamento;
  valor: number;
  data: string;
  descricao: string | null;
  categoria: CategoriaFinanceira | null;
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
}

export interface MesFinanceiro {
  /** O primeiro dia do mês, em ISO: "2026-10-01". */
  mes: string;
  /** "out" */
  rotulo: string;
  receita: number;
  despesa: number;
  saldo: number;
  lancamentos: number;
}

const CAMPOS_CATEGORIA = "id, nome, tipo, icone, chave";

const CAMPOS_LANCAMENTO = `
  id, tipo, valor, data, descricao,
  categoria:financeiro_categorias(${CAMPOS_CATEGORIA}),
  ave:passaros(id, nome, anilha_sigla, anilha_criador, anilha_ano, anilha_numero)
`;

interface LinhaLancamento {
  id: string;
  tipo: TipoLancamento;
  valor: string | number;
  data: string;
  descricao: string | null;
  categoria: LinhaCategoria | LinhaCategoria[] | null;
  ave: LinhaAve | LinhaAve[] | null;
}

interface LinhaCategoria {
  id: string;
  nome: string;
  tipo: TipoLancamento;
  icone: string | null;
  chave: string | null;
}

interface LinhaAve {
  id: string;
  nome: string | null;
  anilha_sigla: string | null;
  anilha_criador: string | null;
  anilha_ano: number | null;
  anilha_numero: number | null;
}

/** PostgREST devolve objeto ou array conforme a cardinalidade que ele deduz. */
function um<T>(valor: T | T[] | null): T | null {
  if (!valor) return null;
  return Array.isArray(valor) ? (valor[0] ?? null) : valor;
}

function montarLancamento(l: LinhaLancamento): Lancamento {
  const categoria = um(l.categoria);
  const ave = um(l.ave);

  return {
    id: l.id,
    tipo: l.tipo,
    // `numeric` chega como string no PostgREST, e `Number` aqui é seguro:
    // numeric(12,2) cabe inteiro no double sem perder centavo.
    valor: Number(l.valor),
    data: l.data,
    descricao: l.descricao,
    categoria: categoria
      ? {
          id: categoria.id,
          nome: categoria.nome,
          tipo: categoria.tipo,
          icone: categoria.icone,
          chave: categoria.chave,
        }
      : null,
    ave: ave
      ? {
          id: ave.id,
          nome: ave.nome,
          anilha: {
            sigla: ave.anilha_sigla,
            criador: ave.anilha_criador,
            ano: ave.anilha_ano,
            numero: ave.anilha_numero,
          },
        }
      : null,
  };
}

/** Os lançamentos de um mês, do mais recente para o mais antigo. */
export async function listarLancamentos(mes: string): Promise<Lancamento[]> {
  const supabase = await criarClienteServidor();
  const proximo = deslocarMes(mes, 1);

  const { data, error } = await supabase
    .from("financeiro_lancamentos")
    .select(CAMPOS_LANCAMENTO)
    .is("deleted_at", null)
    .gte("data", mes)
    .lt("data", proximo)
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listarLancamentos:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as LinhaLancamento[]).map(montarLancamento);
}

export async function obterLancamento(id: string): Promise<Lancamento | null> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase
    .from("financeiro_lancamentos")
    .select(CAMPOS_LANCAMENTO)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("obterLancamento:", error.message);
    return null;
  }
  if (!data) return null;

  return montarLancamento(data as unknown as LinhaLancamento);
}

/**
 * Os seis meses que terminam em `mes`, inclusive os vazios.
 *
 * `vw_financeiro_mensal` não devolve linha para mês sem lançamento, e é esta
 * função que preenche a lacuna: a barra de um mês sem registro existe e é
 * zero, porque a série de seis meses é a informação — um gráfico com quatro
 * barras mentiria sobre o intervalo.
 */
export async function obterSaldoMensal(
  mes: string,
  quantos = 6,
): Promise<MesFinanceiro[]> {
  const supabase = await criarClienteServidor();

  const primeiro = deslocarMes(mes, -(quantos - 1));
  const depois = deslocarMes(mes, 1);

  const { data, error } = await supabase
    .from("vw_financeiro_mensal")
    .select("mes, receita, despesa, saldo, lancamentos")
    .gte("mes", primeiro)
    .lt("mes", depois);

  if (error) {
    console.error("obterSaldoMensal:", error.message);
  }

  const porMes = new Map<string, MesFinanceiro>();
  for (const linha of (data ?? []) as Array<{
    mes: string;
    receita: string | number;
    despesa: string | number;
    saldo: string | number;
    lancamentos: number;
  }>) {
    const iso = linha.mes.slice(0, 10);
    porMes.set(iso, {
      mes: iso,
      rotulo: rotuloCurto(iso),
      receita: Number(linha.receita),
      despesa: Number(linha.despesa),
      saldo: Number(linha.saldo),
      lancamentos: linha.lancamentos,
    });
  }

  const serie: MesFinanceiro[] = [];
  for (let i = quantos - 1; i >= 0; i -= 1) {
    const iso = deslocarMes(mes, -i);
    serie.push(
      porMes.get(iso) ?? {
        mes: iso,
        rotulo: rotuloCurto(iso),
        receita: 0,
        despesa: 0,
        saldo: 0,
        lancamentos: 0,
      },
    );
  }

  return serie;
}

/**
 * As categorias disponíveis: as de sistema (sem dono) e as do criatório.
 *
 * `usos` custa uma consulta a mais e só a tela do catálogo precisa dele — é o
 * número que diz se excluir uma categoria mexe em algo.
 */
export async function listarCategorias(
  comUsos = false,
): Promise<CategoriaFinanceira[]> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase
    .from("financeiro_categorias")
    .select(CAMPOS_CATEGORIA)
    .is("deleted_at", null)
    .order("tipo")
    .order("nome");

  if (error) {
    console.error("listarCategorias:", error.message);
    return [];
  }

  const categorias = ((data ?? []) as LinhaCategoria[]).map((c) => ({
    id: c.id,
    nome: c.nome,
    tipo: c.tipo,
    icone: c.icone,
    chave: c.chave,
  }));

  if (!comUsos) return categorias;

  const { data: linhas } = await supabase
    .from("financeiro_lancamentos")
    .select("categoria_id")
    .is("deleted_at", null)
    .not("categoria_id", "is", null);

  const contagem = new Map<string, number>();
  for (const l of (linhas ?? []) as Array<{ categoria_id: string }>) {
    contagem.set(l.categoria_id, (contagem.get(l.categoria_id) ?? 0) + 1);
  }

  return categorias.map((c) => ({ ...c, usos: contagem.get(c.id) ?? 0 }));
}

export interface OpcaoAveLancamento {
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
 * As aves que um lançamento pode citar.
 *
 * Inclui as que já saíram do plantel, de propósito: a receita da venda cita
 * justamente a ave vendida, e a despesa do veterinário pode ser de uma ave que
 * morreu. Oferecer só o plantel ativo faria a lista esconder metade dos casos
 * em que o vínculo importa.
 */
export async function opcoesDeAve(): Promise<OpcaoAveLancamento[]> {
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

  return ((data ?? []) as Array<LinhaAve & { situacao: string }>).map((a) => ({
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
