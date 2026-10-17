"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterCriatorioAtual } from "@/lib/criatorio";
import { hojeNoCriatorio } from "@/lib/data";

export interface EstadoSaude {
  erro?: string;
  campos?: Record<string, string>;
}

function opcional(v: FormDataEntryValue | null): string | undefined {
  const t = String(v ?? "").trim();
  return t === "" ? undefined : t;
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

function formatarBR(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

// -----------------------------------------------------------------------------
// Tratamentos
// -----------------------------------------------------------------------------

const EsquemaTratamento = z
  .object({
    passaro_id: z.string().uuid("Escolha uma ave da lista.").optional(),
    casal_id: z.string().uuid("Escolha um casal da lista.").optional(),
    medicamento_id: z.string().uuid("Escolha um medicamento da lista.").optional(),
    doenca_id: z.string().uuid("Escolha uma doença da lista.").optional(),
    inicio: z
      .string({ error: "Informe o dia em que o tratamento começou." })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato dd/mm/aaaa.")
      .refine((d) => d <= hojeNoCriatorio(), "O início não pode ser no futuro."),
    // O fim PODE ser no futuro: "termina sexta" é o que o criador sabe quando
    // começa a aplicação, e é dele que a carência vai contar.
    fim: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato dd/mm/aaaa.")
      .optional(),
    dosagem: z.string().trim().max(120, "A dose tem no máximo 120 letras.").optional(),
    observacoes: z
      .string()
      .trim()
      .max(300, "A observação tem no máximo 300 letras.")
      .optional(),
  })
  .refine((v) => v.passaro_id || v.casal_id, {
    error: "Escolha a ave ou o casal que recebeu o tratamento.",
    path: ["passaro_id"],
  })
  .refine((v) => !v.fim || !v.inicio || v.fim >= v.inicio, {
    error: "O fim não pode ser antes do início.",
    path: ["fim"],
  });

function lerTratamento(dados: FormData) {
  // O alvo é um ou outro, nunca os dois: a tela escolhe entre ave e casal, e
  // mandar o campo do lado não escolhido deixaria um vínculo fantasma.
  const alvo = String(dados.get("alvo") ?? "ave");

  return EsquemaTratamento.safeParse({
    passaro_id: alvo === "ave" ? opcional(dados.get("passaro_id")) : undefined,
    casal_id: alvo === "casal" ? opcional(dados.get("casal_id")) : undefined,
    medicamento_id: opcional(dados.get("medicamento_id")),
    doenca_id: opcional(dados.get("doenca_id")),
    inicio: dados.get("inicio"),
    fim: opcional(dados.get("fim")),
    dosagem: opcional(dados.get("dosagem")),
    observacoes: opcional(dados.get("observacoes")),
  });
}

/**
 * Registra um tratamento.
 *
 * Ausente no legado, que só catalogava medicamentos sem registrar aplicação —
 * e sem aplicação não há histórico sanitário nem controle de carência.
 *
 * A chave vem do cliente: é ela que torna o reenvio da fila offline
 * idempotente, em vez de gravar a mesma aplicação duas vezes.
 */
export async function registrarTratamento(
  _anterior: EstadoSaude,
  dados: FormData,
): Promise<EstadoSaude> {
  const tratamentoId = String(dados.get("tratamento_id") ?? "") || null;
  const reenvio = dados.get("reenvio") === "1";

  const resultado = lerTratamento(dados);
  if (!resultado.success) return { campos: coletarCampos(resultado.error.issues) };

  const criatorio = await obterCriatorioAtual();
  if (!criatorio) return { erro: "Criatório não identificado." };

  const supabase = await criarClienteServidor();

  const erroData = await conferirNascimento(
    supabase,
    resultado.data.passaro_id,
    resultado.data.inicio,
  );
  if (erroData) return { campos: { inicio: erroData } };

  const { error } = await supabase.from("tratamentos").insert({
    ...(tratamentoId ? { id: tratamentoId } : {}),
    criatorio_id: criatorio.id,
    passaro_id: resultado.data.passaro_id ?? null,
    casal_id: resultado.data.casal_id ?? null,
    medicamento_id: resultado.data.medicamento_id ?? null,
    doenca_id: resultado.data.doenca_id ?? null,
    inicio: resultado.data.inicio,
    fim: resultado.data.fim ?? null,
    dosagem: resultado.data.dosagem ?? null,
    observacoes: resultado.data.observacoes ?? null,
  });

  if (error) {
    // Chave primária repetida: esta escrita já chegou antes.
    if (error.code === "23505" && error.message.includes("tratamentos_pkey")) {
      revalidatePath("/", "layout");
      if (reenvio) return {};
      redirect("/saude");
    }
    console.error("registrarTratamento:", error.message);
    return { erro: "Não foi possível registrar o tratamento. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect("/saude?registrado=1");
}

/**
 * Tratamento anterior ao nascimento não é erro de digitação raro: é o criador
 * tendo escolhido a ave errada na lista. A mensagem nomeia a data da ave.
 */
async function conferirNascimento(
  supabase: Awaited<ReturnType<typeof criarClienteServidor>>,
  aveId: string | undefined,
  inicio: string,
): Promise<string | null> {
  if (!aveId) return null;

  const { data: ave } = await supabase
    .from("passaros")
    .select("nome, dt_nascimento")
    .eq("id", aveId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!ave) return "Ave não encontrada ou fora do seu criatório.";
  if (ave.dt_nascimento && inicio < ave.dt_nascimento) {
    return `${ave.nome ?? "Esta ave"} nasceu em ${formatarBR(ave.dt_nascimento)}.`;
  }
  return null;
}

export async function editarTratamento(
  _anterior: EstadoSaude,
  dados: FormData,
): Promise<EstadoSaude> {
  const tratamentoId = String(dados.get("tratamento_id") ?? "");
  if (!tratamentoId) return { erro: "Tratamento não identificado." };

  const reenvio = dados.get("reenvio") === "1";

  const resultado = lerTratamento(dados);
  if (!resultado.success) return { campos: coletarCampos(resultado.error.issues) };

  const supabase = await criarClienteServidor();

  const erroData = await conferirNascimento(
    supabase,
    resultado.data.passaro_id,
    resultado.data.inicio,
  );
  if (erroData) return { campos: { inicio: erroData } };

  const { error } = await supabase
    .from("tratamentos")
    .update({
      passaro_id: resultado.data.passaro_id ?? null,
      casal_id: resultado.data.casal_id ?? null,
      medicamento_id: resultado.data.medicamento_id ?? null,
      doenca_id: resultado.data.doenca_id ?? null,
      inicio: resultado.data.inicio,
      fim: resultado.data.fim ?? null,
      dosagem: resultado.data.dosagem ?? null,
      observacoes: resultado.data.observacoes ?? null,
    })
    .eq("id", tratamentoId)
    .is("deleted_at", null);

  if (error) {
    console.error("editarTratamento:", error.message);
    return { erro: "Não foi possível salvar o tratamento. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect("/saude?corrigido=1");
}

/**
 * Apaga um tratamento.
 *
 * Exclusão lógica, como a pesagem: é registro sanitário, e um ponto apagado
 * pode já ter sido citado numa venda ou numa exposição.
 */
export async function excluirTratamento(
  _anterior: EstadoSaude,
  dados: FormData,
): Promise<EstadoSaude> {
  const tratamentoId = String(dados.get("tratamento_id") ?? "");
  if (!tratamentoId) return { erro: "Tratamento não identificado." };

  const reenvio = dados.get("reenvio") === "1";
  const supabase = await criarClienteServidor();

  const { error } = await supabase
    .from("tratamentos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", tratamentoId)
    .is("deleted_at", null);

  if (error) {
    console.error("excluirTratamento:", error.message);
    return { erro: "Não foi possível excluir o tratamento. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect("/saude?excluido=1");
}

// -----------------------------------------------------------------------------
// Catálogos
// -----------------------------------------------------------------------------

const NOME = z
  .string({ error: "Dê um nome." })
  .trim()
  .min(2, "O nome precisa de pelo menos duas letras.")
  .max(60, "O nome tem no máximo 60 letras.");

const DESCRICAO = z
  .string()
  .trim()
  .max(300, "A descrição tem no máximo 300 letras.")
  .optional();

const EsquemaMedicamento = z.object({
  nome: NOME,
  principio_ativo: z.string().trim().max(120).optional(),
  dosagem: z.string().trim().max(120).optional(),
  carencia_dias: z.coerce
    .number()
    .int("A carência é em dias inteiros.")
    .min(0, "A carência não pode ser negativa.")
    .max(365, "Confira a carência: o máximo é 365 dias.")
    .optional(),
  observacoes: DESCRICAO,
});

/**
 * Cria ou corrige um medicamento do criatório.
 *
 * **Nenhum medicamento vem semeado** (ver 0033): nome comercial, dose e
 * carência saem da bula e da prescrição, e uma lista pronta no produto seria
 * lida como recomendação. O catálogo é o que está na prateleira do criador.
 *
 * As doenças que ele trata são gravadas pela função do banco, que escreve o
 * conjunto inteiro numa transação.
 */
export async function salvarMedicamento(
  _anterior: EstadoSaude,
  dados: FormData,
): Promise<EstadoSaude> {
  const medicamentoId = String(dados.get("medicamento_id") ?? "") || null;
  const reenvio = dados.get("reenvio") === "1";

  const resultado = EsquemaMedicamento.safeParse({
    nome: opcional(dados.get("nome")),
    principio_ativo: opcional(dados.get("principio_ativo")),
    dosagem: opcional(dados.get("dosagem")),
    carencia_dias: opcional(dados.get("carencia_dias")),
    observacoes: opcional(dados.get("observacoes")),
  });

  if (!resultado.success) return { campos: coletarCampos(resultado.error.issues) };

  const criatorio = await obterCriatorioAtual();
  if (!criatorio) return { erro: "Criatório não identificado." };

  const supabase = await criarClienteServidor();

  const valores = {
    nome: resultado.data.nome,
    principio_ativo: resultado.data.principio_ativo ?? null,
    dosagem: resultado.data.dosagem ?? null,
    carencia_dias: resultado.data.carencia_dias ?? null,
    observacoes: resultado.data.observacoes ?? null,
  };

  const { data, error } = medicamentoId
    ? await supabase
        .from("medicamentos")
        .update(valores)
        .eq("id", medicamentoId)
        // Item do catálogo compartilhado não se edita: ele é de todos.
        .not("criatorio_id", "is", null)
        .is("deleted_at", null)
        .select("id")
        .maybeSingle()
    : await supabase
        .from("medicamentos")
        .insert({ ...valores, criatorio_id: criatorio.id })
        .select("id")
        .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return {
        campos: {
          nome: `Já existe um medicamento chamado ${resultado.data.nome} no criatório.`,
        },
      };
    }
    console.error("salvarMedicamento:", error.message);
    return { erro: "Não foi possível salvar o medicamento. Tente de novo." };
  }

  const alvo = data?.id ?? medicamentoId;
  if (alvo) {
    const doencas = dados.getAll("doencas").map(String).filter(Boolean);
    const { error: erroVinculo } = await supabase.rpc(
      "definir_doencas_do_medicamento",
      { p_medicamento: alvo, p_doencas: doencas },
    );
    if (erroVinculo) {
      console.error("definir_doencas_do_medicamento:", erroVinculo.message);
      return {
        erro: "O medicamento foi salvo, mas as doenças não. Tente de novo.",
      };
    }
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect(`/saude/medicamentos?${medicamentoId ? "salvo" : "criado"}=1`);
}

export async function excluirMedicamento(
  _anterior: EstadoSaude,
  dados: FormData,
): Promise<EstadoSaude> {
  return excluirDoCatalogo(dados, "medicamentos", "medicamento_id", "/saude/medicamentos");
}

const EsquemaDoenca = z.object({ nome: NOME, descricao: DESCRICAO });

/**
 * Cria ou corrige uma doença do criatório.
 *
 * As do catálogo compartilhado (0033) aparecem na lista de escolha e não se
 * editam — nem recebem sintomas. O sintoma é o que ESTE criador observou no
 * galpão dele; prendê-lo a uma linha de todos seria afirmar pelos outros.
 */
export async function salvarDoenca(
  _anterior: EstadoSaude,
  dados: FormData,
): Promise<EstadoSaude> {
  const doencaId = String(dados.get("doenca_id") ?? "") || null;
  const reenvio = dados.get("reenvio") === "1";

  const resultado = EsquemaDoenca.safeParse({
    nome: opcional(dados.get("nome")),
    descricao: opcional(dados.get("descricao")),
  });

  if (!resultado.success) return { campos: coletarCampos(resultado.error.issues) };

  const criatorio = await obterCriatorioAtual();
  if (!criatorio) return { erro: "Criatório não identificado." };

  const supabase = await criarClienteServidor();

  const valores = {
    nome: resultado.data.nome,
    descricao: resultado.data.descricao ?? null,
  };

  const { data, error } = doencaId
    ? await supabase
        .from("doencas")
        .update(valores)
        .eq("id", doencaId)
        .not("criatorio_id", "is", null)
        .is("deleted_at", null)
        .select("id")
        .maybeSingle()
    : await supabase
        .from("doencas")
        .insert({ ...valores, criatorio_id: criatorio.id })
        .select("id")
        .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return {
        campos: {
          nome: `Já existe uma doença chamada ${resultado.data.nome} no criatório.`,
        },
      };
    }
    console.error("salvarDoenca:", error.message);
    return { erro: "Não foi possível salvar a doença. Tente de novo." };
  }

  const alvo = data?.id ?? doencaId;
  if (alvo) {
    const sintomas = dados.getAll("sintomas").map(String).filter(Boolean);
    const { error: erroVinculo } = await supabase.rpc("definir_sintomas_da_doenca", {
      p_doenca: alvo,
      p_sintomas: sintomas,
    });
    if (erroVinculo) {
      console.error("definir_sintomas_da_doenca:", erroVinculo.message);
      return { erro: "A doença foi salva, mas os sintomas não. Tente de novo." };
    }
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect(`/saude/doencas?${doencaId ? "salva" : "criada"}=1`);
}

export async function excluirDoenca(
  _anterior: EstadoSaude,
  dados: FormData,
): Promise<EstadoSaude> {
  return excluirDoCatalogo(dados, "doencas", "doenca_id", "/saude/doencas");
}

const EsquemaSintoma = z.object({ nome: NOME, descricao: DESCRICAO });

export async function salvarSintoma(
  _anterior: EstadoSaude,
  dados: FormData,
): Promise<EstadoSaude> {
  const sintomaId = String(dados.get("sintoma_id") ?? "") || null;
  const reenvio = dados.get("reenvio") === "1";

  const resultado = EsquemaSintoma.safeParse({
    nome: opcional(dados.get("nome")),
    descricao: opcional(dados.get("descricao")),
  });

  if (!resultado.success) return { campos: coletarCampos(resultado.error.issues) };

  const criatorio = await obterCriatorioAtual();
  if (!criatorio) return { erro: "Criatório não identificado." };

  const supabase = await criarClienteServidor();

  const valores = {
    nome: resultado.data.nome,
    descricao: resultado.data.descricao ?? null,
  };

  const { error } = sintomaId
    ? await supabase
        .from("sintomas")
        .update(valores)
        .eq("id", sintomaId)
        .not("criatorio_id", "is", null)
        .is("deleted_at", null)
    : await supabase.from("sintomas").insert({ ...valores, criatorio_id: criatorio.id });

  if (error) {
    if (error.code === "23505") {
      return {
        campos: {
          nome: `Já existe um sintoma chamado ${resultado.data.nome} no criatório.`,
        },
      };
    }
    console.error("salvarSintoma:", error.message);
    return { erro: "Não foi possível salvar o sintoma. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect(`/saude/sintomas?${sintomaId ? "salvo" : "criado"}=1`);
}

export async function excluirSintoma(
  _anterior: EstadoSaude,
  dados: FormData,
): Promise<EstadoSaude> {
  return excluirDoCatalogo(dados, "sintomas", "sintoma_id", "/saude/sintomas");
}

/**
 * Exclusão lógica de item de catálogo — a mesma regra para os três.
 *
 * Os tratamentos que o citam continuam com ele: `on delete set null` vale para
 * apagão de verdade, que não acontece aqui. Zerar o medicamento de um
 * tratamento antigo apagaria justamente o que o registro sanitário prova.
 */
async function excluirDoCatalogo(
  dados: FormData,
  tabela: "medicamentos" | "doencas" | "sintomas",
  campo: "medicamento_id" | "doenca_id" | "sintoma_id",
  destino: string,
): Promise<EstadoSaude> {
  const id = String(dados.get(campo) ?? "");
  if (!id) return { erro: "Item não identificado." };

  const reenvio = dados.get("reenvio") === "1";
  const supabase = await criarClienteServidor();

  const { error } = await supabase
    .from(tabela)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    // Item do catálogo compartilhado não se apaga: ele é de todos.
    .not("criatorio_id", "is", null)
    .is("deleted_at", null);

  if (error) {
    console.error(`excluir ${tabela}:`, error.message);
    return { erro: "Não foi possível excluir. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect(`${destino}?excluido=1`);
}
