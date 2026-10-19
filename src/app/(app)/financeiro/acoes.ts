"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterCriatorioAtual } from "@/lib/criatorio";
import { hojeNoCriatorio } from "@/lib/data";
import { ICONES_CATEGORIA } from "@/lib/dados/financeiro-rotulos";
import { barradoPelaAssinatura, ERRO_ASSINATURA } from "@/lib/erros";

export interface EstadoLancamento {
  erro?: string;
  campos?: Record<string, string>;
}

const TIPOS = ["receita", "despesa"] as const;

const EsquemaLancamento = z.object({
  tipo: z.enum(TIPOS, { error: "Escolha se é receita ou despesa." }),
  valor: z.coerce
    .number({ error: "Informe o valor em reais." })
    .positive("O valor precisa ser maior que zero.")
    // numeric(12,2) no banco. O limite existe para pegar o dedo escorregado no
    // teclado numérico, não para julgar o preço de uma ave.
    .max(9_999_999.99, "Confira o valor: o máximo é R$ 9.999.999,99."),
  data: z
    .string({ error: "Informe o dia do lançamento." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato dd/mm/aaaa.")
    .refine((d) => d <= hojeNoCriatorio(), "O lançamento não pode ser no futuro."),
  categoria_id: z.string().uuid("Escolha uma categoria da lista.").optional(),
  descricao: z.string().trim().max(300, "A descrição tem no máximo 300 letras.").optional(),
  passaro_id: z.string().uuid("Escolha uma ave da lista.").optional(),
});

function opcional(v: FormDataEntryValue | null): string | undefined {
  const t = String(v ?? "").trim();
  return t === "" ? undefined : t;
}

/**
 * Valor em reais vem do teclado pt-BR: "1.240,50".
 *
 * O ponto é separador de milhar e a vírgula é decimal — `Number("1.240,50")` é
 * `NaN`, e `z.coerce.number()` leria o `NaN` como erro de tipo, devolvendo a
 * mensagem crua do Zod em inglês.
 */
function normalizarValor(bruto: string | undefined): string | undefined {
  return bruto?.replace(/\./g, "").replace(",", ".");
}

function coletarCampos(
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>,
): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const problema of issues) {
    const campo = String(problema.path[0] ?? "");
    if (campo && !campos[campo]) campos[campo] = problema.message;
  }
  return campos;
}

function lerFormulario(dados: FormData) {
  return EsquemaLancamento.safeParse({
    tipo: opcional(dados.get("tipo")),
    valor: normalizarValor(opcional(dados.get("valor"))),
    data: dados.get("data"),
    categoria_id: opcional(dados.get("categoria_id")),
    descricao: opcional(dados.get("descricao")),
    passaro_id: opcional(dados.get("passaro_id")),
  });
}

/**
 * A categoria tem tipo próprio, e ele tem de bater com o do lançamento.
 *
 * "Ração" é categoria de despesa: uma receita dentro dela somaria no lado
 * errado do saldo e o criador só descobriria ao fechar o mês. O banco não
 * impede — a constraint cruzada entre duas tabelas exigiria trigger — então a
 * guarda é aqui, nomeando a categoria.
 */
async function conferirCategoria(
  supabase: Awaited<ReturnType<typeof criarClienteServidor>>,
  categoriaId: string | undefined,
  tipo: string,
): Promise<string | null> {
  if (!categoriaId) return null;

  const { data } = await supabase
    .from("financeiro_categorias")
    .select("nome, tipo")
    .eq("id", categoriaId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) return "Esta categoria não existe mais. Escolha outra.";
  if (data.tipo !== tipo) {
    return `${data.nome} é categoria de ${data.tipo}. Escolha uma de ${tipo === "receita" ? "receita" : "despesa"}.`;
  }
  return null;
}

/**
 * Lança uma receita ou despesa.
 *
 * A chave vem do cliente: é ela que torna o reenvio da fila offline
 * idempotente em vez de lançar a mesma despesa duas vezes e torcer o saldo.
 */
export async function registrarLancamento(
  _anterior: EstadoLancamento,
  dados: FormData,
): Promise<EstadoLancamento> {
  const lancamentoId = String(dados.get("lancamento_id") ?? "") || null;
  const reenvio = dados.get("reenvio") === "1";

  const resultado = lerFormulario(dados);
  if (!resultado.success) return { campos: coletarCampos(resultado.error.issues) };

  const criatorio = await obterCriatorioAtual();
  if (!criatorio) return { erro: "Criatório não identificado." };

  const supabase = await criarClienteServidor();

  const erroCategoria = await conferirCategoria(
    supabase,
    resultado.data.categoria_id,
    resultado.data.tipo,
  );
  if (erroCategoria) return { campos: { categoria_id: erroCategoria } };

  const { error } = await supabase.from("financeiro_lancamentos").insert({
    ...(lancamentoId ? { id: lancamentoId } : {}),
    criatorio_id: criatorio.id,
    tipo: resultado.data.tipo,
    categoria_id: resultado.data.categoria_id ?? null,
    valor: resultado.data.valor,
    data: resultado.data.data,
    descricao: resultado.data.descricao ?? null,
    passaro_id: resultado.data.passaro_id ?? null,
  });

  if (error) {
    // Chave primária repetida: esta escrita já chegou antes. O registro está
    // lá, e repetir duplicaria o lançamento.
    if (error.code === "23505" && error.message.includes("financeiro_lancamentos_pkey")) {
      revalidatePath("/", "layout");
      if (reenvio) return {};
      redirect(`/financeiro?mes=${mesDe(resultado.data.data)}`);
    }
    // Vencido não é "tente de novo": tentar de novo nunca vai funcionar.
    if (barradoPelaAssinatura(error)) return { erro: ERRO_ASSINATURA };
    console.error("registrarLancamento:", error.message);
    return { erro: "Não foi possível registrar o lançamento. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect(`/financeiro?mes=${mesDe(resultado.data.data)}&registrado=1`);
}

/** O mês do lançamento, não o mês que estava na tela: a data pode ter mudado. */
function mesDe(data: string): string {
  return `${data.slice(0, 7)}-01`;
}

export async function editarLancamento(
  _anterior: EstadoLancamento,
  dados: FormData,
): Promise<EstadoLancamento> {
  const lancamentoId = String(dados.get("lancamento_id") ?? "");
  if (!lancamentoId) return { erro: "Lançamento não identificado." };

  const reenvio = dados.get("reenvio") === "1";

  const resultado = lerFormulario(dados);
  if (!resultado.success) return { campos: coletarCampos(resultado.error.issues) };

  const supabase = await criarClienteServidor();

  const erroCategoria = await conferirCategoria(
    supabase,
    resultado.data.categoria_id,
    resultado.data.tipo,
  );
  if (erroCategoria) return { campos: { categoria_id: erroCategoria } };

  const { error } = await supabase
    .from("financeiro_lancamentos")
    .update({
      tipo: resultado.data.tipo,
      categoria_id: resultado.data.categoria_id ?? null,
      valor: resultado.data.valor,
      data: resultado.data.data,
      descricao: resultado.data.descricao ?? null,
      passaro_id: resultado.data.passaro_id ?? null,
    })
    .eq("id", lancamentoId)
    .is("deleted_at", null);

  if (error) {
    // Vencido não é "tente de novo": tentar de novo nunca vai funcionar.
    if (barradoPelaAssinatura(error)) return { erro: ERRO_ASSINATURA };
    console.error("editarLancamento:", error.message);
    return { erro: "Não foi possível salvar o lançamento. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect(`/financeiro?mes=${mesDe(resultado.data.data)}&corrigido=1`);
}

/**
 * Apaga um lançamento.
 *
 * Exclusão lógica: a coluna existe, e o lançamento pode já ter entrado num
 * fechamento de mês. A receita da venda de ave também se apaga por aqui — o
 * que não se desfaz é a saída da ave, que é outro fato e tem tela própria.
 */
export async function excluirLancamento(
  _anterior: EstadoLancamento,
  dados: FormData,
): Promise<EstadoLancamento> {
  const lancamentoId = String(dados.get("lancamento_id") ?? "");
  if (!lancamentoId) return { erro: "Lançamento não identificado." };

  const reenvio = dados.get("reenvio") === "1";
  const mes = String(dados.get("mes") ?? "");

  const supabase = await criarClienteServidor();

  const { error } = await supabase
    .from("financeiro_lancamentos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", lancamentoId)
    .is("deleted_at", null);

  if (error) {
    // Vencido não é "tente de novo": tentar de novo nunca vai funcionar.
    if (barradoPelaAssinatura(error)) return { erro: ERRO_ASSINATURA };
    console.error("excluirLancamento:", error.message);
    return { erro: "Não foi possível excluir o lançamento. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect(`/financeiro${mes ? `?mes=${mes}&` : "?"}excluido=1`);
}

// -----------------------------------------------------------------------------
// Categorias
// -----------------------------------------------------------------------------

export interface EstadoCategoria {
  erro?: string;
  campos?: Record<string, string>;
}

const EsquemaCategoria = z.object({
  nome: z
    .string({ error: "Dê um nome à categoria." })
    .trim()
    .min(2, "O nome precisa de pelo menos duas letras.")
    .max(40, "O nome tem no máximo 40 letras."),
  tipo: z.enum(TIPOS, { error: "Escolha se a categoria é de receita ou despesa." }),
  icone: z.enum(ICONES_CATEGORIA, { error: "Escolha um ícone da lista." }),
});

/**
 * Cria ou renomeia uma categoria do criatório.
 *
 * As de sistema (`chave` preenchida) não passam por aqui: elas são a ponte com
 * os dados do legado e com `registrar_saida`, que procura `venda_passaro` pela
 * chave. Renomear uma delas no criatório de um usuário mudaria o catálogo de
 * todos — a RLS, por isso, só deixa escrever linha com `criatorio_id` próprio.
 */
export async function salvarCategoria(
  _anterior: EstadoCategoria,
  dados: FormData,
): Promise<EstadoCategoria> {
  const categoriaId = String(dados.get("categoria_id") ?? "") || null;
  const reenvio = dados.get("reenvio") === "1";

  const resultado = EsquemaCategoria.safeParse({
    nome: opcional(dados.get("nome")),
    tipo: opcional(dados.get("tipo")),
    icone: opcional(dados.get("icone")),
  });

  if (!resultado.success) return { campos: coletarCampos(resultado.error.issues) };

  const criatorio = await obterCriatorioAtual();
  if (!criatorio) return { erro: "Criatório não identificado." };

  const supabase = await criarClienteServidor();

  // Nome igual ao de uma categoria de sistema não é bloqueado pelo índice
  // único (o escopo delas é outro), e duas "Venda de ave" na mesma lista de
  // escolha é a confusão garantida.
  const { data: doSistema } = await supabase
    .from("financeiro_categorias")
    .select("nome")
    .is("criatorio_id", null)
    .is("deleted_at", null);

  const colide = (doSistema ?? []).some(
    (c: { nome: string }) =>
      c.nome.toLowerCase() === resultado.data.nome.toLowerCase(),
  );
  if (colide) {
    return {
      campos: {
        nome: `${resultado.data.nome} já é uma categoria do sistema. Escolha outro nome.`,
      },
    };
  }

  const valores = {
    nome: resultado.data.nome,
    tipo: resultado.data.tipo,
    icone: resultado.data.icone,
  };

  const { error } = categoriaId
    ? await supabase
        .from("financeiro_categorias")
        .update(valores)
        .eq("id", categoriaId)
        .not("criatorio_id", "is", null)
        .is("deleted_at", null)
    : await supabase
        .from("financeiro_categorias")
        .insert({ ...valores, criatorio_id: criatorio.id });

  if (error) {
    if (error.code === "23505") {
      return {
        campos: {
          nome: `Já existe uma categoria chamada ${resultado.data.nome} no criatório.`,
        },
      };
    }
    // Vencido não é "tente de novo": tentar de novo nunca vai funcionar.
    if (barradoPelaAssinatura(error)) return { erro: ERRO_ASSINATURA };
    console.error("salvarCategoria:", error.message);
    return { erro: "Não foi possível salvar a categoria. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  // Criar e renomear são confirmações diferentes, escritas inteiras: compor
  // "Categoria salva" para os dois casos já deu "Empréstimo registrada".
  redirect(`/financeiro/categorias?${categoriaId ? "salva" : "criada"}=1`);
}

/**
 * Apaga uma categoria do criatório.
 *
 * Exclusão lógica, e os lançamentos que a usam **continuam com ela**: o
 * `on delete set null` da 0007 vale para apagão de verdade, que não acontece
 * aqui. Zerar a categoria de um lançamento antigo reescreveria o histórico de
 * um mês já fechado — e a tela diz quantos lançamentos a usam antes de
 * perguntar.
 */
export async function excluirCategoria(
  _anterior: EstadoCategoria,
  dados: FormData,
): Promise<EstadoCategoria> {
  const categoriaId = String(dados.get("categoria_id") ?? "");
  if (!categoriaId) return { erro: "Categoria não identificada." };

  const reenvio = dados.get("reenvio") === "1";
  const supabase = await criarClienteServidor();

  const { error } = await supabase
    .from("financeiro_categorias")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", categoriaId)
    // Categoria de sistema não se apaga: `registrar_saida` a procura pela
    // chave, e sem ela a receita da venda ficaria sem categoria.
    .not("criatorio_id", "is", null)
    .is("deleted_at", null);

  if (error) {
    // Vencido não é "tente de novo": tentar de novo nunca vai funcionar.
    if (barradoPelaAssinatura(error)) return { erro: ERRO_ASSINATURA };
    console.error("excluirCategoria:", error.message);
    return { erro: "Não foi possível excluir a categoria. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect("/financeiro/categorias?excluida=1");
}
