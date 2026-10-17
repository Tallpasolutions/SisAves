"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterCriatorioAtual } from "@/lib/criatorio";

export interface EstadoEspecie {
  erro?: string;
  campos?: Record<string, string>;
}

/**
 * Os prazos espelham as constraints de `especies` em `0003_taxonomia.sql`.
 * A ovoscopia precisa cair ANTES da eclosão — é o que a constraint
 * `especies_prazos_coerentes` garante, e o que a mensagem aqui explica.
 */
const EsquemaPrazos = z
  .object({
    nome: z
      .string({ error: "A espécie precisa de um nome." })
      .trim()
      .min(1, "A espécie precisa de um nome.")
      .max(80, "O nome tem no máximo 80 caracteres."),
    dias_ovoscopia: z.coerce
      .number({ error: "Informe em quantos dias fazer a ovoscopia." })
      .int("Informe um número inteiro de dias.")
      .min(1, "A ovoscopia começa no dia 1.")
      .max(60, "Confira os dias de ovoscopia."),
    dias_choco: z.coerce
      .number({ error: "Informe os dias de choco." })
      .int("Informe um número inteiro de dias.")
      .min(1, "O choco começa no dia 1.")
      .max(120, "Confira os dias de choco."),
    dias_anilha: z.coerce
      .number({ error: "Informe os dias até o anilhamento." })
      .int("Informe um número inteiro de dias.")
      .min(1, "O anilhamento começa no dia 1.")
      .max(120, "Confira os dias de anilhamento."),
    janela_anilha_dias: z.coerce
      .number({ error: "Informe a janela de anilhamento." })
      .int("Informe um número inteiro de dias.")
      .min(1, "A janela tem pelo menos 1 dia.")
      .max(30, "Confira a janela de anilhamento."),
    dias_separa: z.coerce
      .number({ error: "Informe os dias até a separação." })
      .int("Informe um número inteiro de dias.")
      .min(1, "A separação começa no dia 1.")
      .max(365, "Confira os dias de separação."),
    anilha_mm: z.coerce
      .number()
      .min(1, "Confira o diâmetro da anilha.")
      .max(30, "Confira o diâmetro da anilha.")
      .optional(),
  })
  .refine((d) => d.dias_ovoscopia < d.dias_choco, {
    path: ["dias_ovoscopia"],
    message: "A ovoscopia tem de cair antes da eclosão.",
  });

/**
 * Corrige os prazos de uma espécie adotada.
 *
 * É a escrita de maior alcance do produto: os prazos movem a máquina de
 * estados do ovo, então mudar um deles reclassifica TODA postura da espécie na
 * hora seguinte. Nada é recalculado e gravado — a situação é derivada —, mas a
 * tela precisa dizer isso antes.
 */
export async function salvarPrazos(
  _anterior: EstadoEspecie,
  dados: FormData,
): Promise<EstadoEspecie> {
  const especieId = String(dados.get("especie_id") ?? "");
  if (!especieId) return { erro: "Espécie não identificada." };

  const reenvio = dados.get("reenvio") === "1";

  const opcional = (v: FormDataEntryValue | null) => {
    const t = String(v ?? "").trim();
    return t === "" ? undefined : t;
  };

  const resultado = EsquemaPrazos.safeParse({
    nome: dados.get("nome"),
    dias_ovoscopia: dados.get("dias_ovoscopia"),
    dias_choco: dados.get("dias_choco"),
    dias_anilha: dados.get("dias_anilha"),
    janela_anilha_dias: dados.get("janela_anilha_dias"),
    dias_separa: dados.get("dias_separa"),
    anilha_mm: opcional(dados.get("anilha_mm"))?.replace(",", "."),
  });

  if (!resultado.success) {
    const campos: Record<string, string> = {};
    for (const problema of resultado.error.issues) {
      const campo = String(problema.path[0] ?? "");
      if (campo && !campos[campo]) campos[campo] = problema.message;
    }
    return { campos };
  }

  const supabase = await criarClienteServidor();

  const { error } = await supabase
    .from("especies")
    .update({
      nome: resultado.data.nome,
      dias_ovoscopia: resultado.data.dias_ovoscopia,
      dias_choco: resultado.data.dias_choco,
      dias_anilha: resultado.data.dias_anilha,
      janela_anilha_dias: resultado.data.janela_anilha_dias,
      dias_separa: resultado.data.dias_separa,
      anilha_mm: resultado.data.anilha_mm ?? null,
    })
    .eq("id", especieId)
    .is("deleted_at", null);

  if (error) {
    if (error.code === "23505") {
      return { campos: { nome: `Já existe uma espécie chamada "${resultado.data.nome}".` } };
    }
    if (error.code === "23514") {
      return {
        campos: { dias_ovoscopia: "A ovoscopia tem de cair antes da eclosão." },
      };
    }
    console.error("salvarPrazos:", error.message);
    return { erro: "Não foi possível salvar a espécie. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect("/especies?salva=1");
}

/**
 * Tira a espécie da escolha sem apagar o que ela já explica.
 *
 * As aves e as posturas continuam apontando para ela e seguem com os prazos
 * certos; ela só some das listas de cadastro. É o caminho para a espécie que
 * o criador parou de criar.
 */
export async function alternarEspecie(
  _anterior: EstadoEspecie,
  dados: FormData,
): Promise<EstadoEspecie> {
  const especieId = String(dados.get("especie_id") ?? "");
  const ativar = dados.get("ativar") === "1";
  if (!especieId) return { erro: "Espécie não identificada." };

  const reenvio = dados.get("reenvio") === "1";
  const supabase = await criarClienteServidor();

  const { error } = await supabase
    .from("especies")
    .update({ ativa: ativar })
    .eq("id", especieId)
    .is("deleted_at", null);

  if (error) {
    console.error("alternarEspecie:", error.message);
    return { erro: "Não foi possível mudar a espécie. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect(`/especies?${ativar ? "reativada" : "desativada"}=1`);
}

/**
 * Exclusão lógica, e só de espécie que nenhuma ave usa.
 *
 * `passaros.especie_id` é `on delete set null`: apagar uma espécie em uso
 * deixaria as aves sem espécie e, por tabela, sem os prazos que movem o ciclo
 * do ovo delas. A tela nem oferece o botão nesse caso; aqui é a garantia.
 */
export async function excluirEspecie(
  _anterior: EstadoEspecie,
  dados: FormData,
): Promise<EstadoEspecie> {
  const especieId = String(dados.get("especie_id") ?? "");
  if (!especieId) return { erro: "Espécie não identificada." };

  const reenvio = dados.get("reenvio") === "1";
  const supabase = await criarClienteServidor();

  const { count } = await supabase
    .from("passaros")
    .select("id", { count: "exact", head: true })
    .eq("especie_id", especieId)
    .is("deleted_at", null);

  if ((count ?? 0) > 0) {
    return {
      erro: `Esta espécie está em ${count} ${count === 1 ? "ave" : "aves"} do plantel. Desative em vez de excluir.`,
    };
  }

  const { error } = await supabase
    .from("especies")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", especieId)
    .is("deleted_at", null);

  if (error) {
    console.error("excluirEspecie:", error.message);
    return { erro: "Não foi possível excluir a espécie. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect("/especies?excluida=1");
}

/** Adota espécies do catálogo depois do onboarding. */
export async function adotarDoCatalogo(
  _anterior: EstadoEspecie,
  dados: FormData,
): Promise<EstadoEspecie> {
  const criatorio = await obterCriatorioAtual();
  if (!criatorio) return { erro: "Criatório não encontrado." };

  const ids = dados.getAll("especie").map(String).filter(Boolean);
  if (ids.length === 0) {
    return { erro: "Marque ao menos uma espécie para adotar." };
  }

  const supabase = await criarClienteServidor();

  const { data: catalogo } = await supabase
    .from("especies_catalogo")
    .select("id, nome_comum, grupo_id, dias_choco, dias_anilha, dias_separa, anilha_mm")
    .in("id", ids);

  if (!catalogo?.length) return { erro: "Não foi possível ler o catálogo." };

  const semIncubacao: string[] = [];
  const linhas = [];

  for (const c of catalogo) {
    // O catálogo ainda não tem `dias_choco` de 32 das 60 espécies; quando
    // falta, o criador informa na própria tela.
    const informado = dados.get(`choco_${c.id}`);
    const diasChoco = c.dias_choco ?? (informado ? Number(informado) : null);

    if (!diasChoco || Number.isNaN(diasChoco)) {
      semIncubacao.push(c.nome_comum);
      continue;
    }

    linhas.push({
      criatorio_id: criatorio.id,
      catalogo_id: c.id,
      grupo_id: c.grupo_id,
      nome: c.nome_comum,
      dias_choco: diasChoco,
      dias_anilha: c.dias_anilha ?? 3,
      dias_separa: c.dias_separa ?? 40,
      anilha_mm: c.anilha_mm,
    });
  }

  if (semIncubacao.length > 0) {
    const lista = semIncubacao.slice(0, 3).join(", ");
    const resto = semIncubacao.length > 3 ? ` e mais ${semIncubacao.length - 3}` : "";
    return { erro: `Informe os dias de choco de ${lista}${resto}.` };
  }

  const { error } = await supabase
    .from("especies")
    .upsert(linhas, { onConflict: "criatorio_id,nome", ignoreDuplicates: true });

  if (error) {
    console.error("adotarDoCatalogo:", error.message);
    return { erro: "Não foi possível adotar as espécies. Tente de novo." };
  }

  revalidatePath("/", "layout");
  redirect(`/especies?adotadas=${linhas.length}`);
}
