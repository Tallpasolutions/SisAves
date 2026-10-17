"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { CORES_ETIQUETA, COR_PADRAO } from "@/lib/dados/etiquetas";
import { hojeNoCriatorio } from "@/lib/data";

export interface EstadoEdicaoCasal {
  erro?: string;
  campos?: Record<string, string>;
}

const opcional = (v: FormDataEntryValue | null) => {
  const texto = String(v ?? "").trim();
  return texto === "" ? undefined : texto;
};

const EsquemaCasal = z
  .object({
    gaiola: z.string().trim().max(40, "A gaiola tem no máximo 40 caracteres.").optional(),
    observacoes: z.string().trim().max(500, "As observações não passam de 500 caracteres.").optional(),
    vigencia_inicio: z
      .string({ error: "Informe quando o casal foi formado." })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato dd/mm/aaaa.")
      .refine((d) => d <= hojeNoCriatorio(), "O casal não pode ter sido formado no futuro."),
    vigencia_fim: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato dd/mm/aaaa.")
      .refine((d) => d <= hojeNoCriatorio(), "O encerramento não pode ser no futuro.")
      .optional(),
  })
  .refine((d) => !d.vigencia_fim || d.vigencia_fim >= d.vigencia_inicio, {
    path: ["vigencia_fim"],
    message: "O encerramento vem depois da formação do casal.",
  });

/**
 * Corrige o casal e, quando a data de fim é informada, encerra-o.
 *
 * O PAR não se edita. Trocar o macho ou a fêmea deixaria as ninhadas já
 * registradas penduradas num par que nunca as gerou — e os filhotes anilhados
 * guardam a filiação copiada na hora do anilhamento, então a árvore diria uma
 * coisa e o casal outra. Par diferente é casal novo.
 *
 * Escreve numa tabela só; as validações que o banco não faz olham as ninhadas
 * e as aves, e citam o dado exato.
 */
export async function editarCasal(
  _anterior: EstadoEdicaoCasal,
  dados: FormData,
): Promise<EstadoEdicaoCasal> {
  const casalId = String(dados.get("casal_id") ?? "");
  if (!casalId) return { erro: "Casal não identificado." };

  const reenvio = dados.get("reenvio") === "1";

  const resultado = EsquemaCasal.safeParse({
    gaiola: opcional(dados.get("gaiola")),
    observacoes: opcional(dados.get("observacoes")),
    vigencia_inicio: dados.get("vigencia_inicio"),
    vigencia_fim: opcional(dados.get("vigencia_fim")),
  });

  if (!resultado.success) {
    const campos: Record<string, string> = {};
    for (const problema of resultado.error.issues) {
      const campo = String(problema.path[0] ?? "");
      if (campo && !campos[campo]) campos[campo] = problema.message;
    }
    return { campos };
  }

  const { gaiola, observacoes, vigencia_inicio, vigencia_fim } = resultado.data;
  const supabase = await criarClienteServidor();

  const { data: casal } = await supabase
    .from("casais")
    .select(
      "id, numero, vigencia_fim, macho:passaros!casais_macho_id_fkey(id, nome, situacao, dt_nascimento), femea:passaros!casais_femea_id_fkey(id, nome, situacao, dt_nascimento)",
    )
    .eq("id", casalId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!casal) return { erro: "Casal não encontrado ou fora do seu criatório." };

  const campos: Record<string, string> = {};
  const parceiros = [casal.macho, casal.femea]
    .map((p) => (Array.isArray(p) ? p[0] : p))
    .filter(Boolean) as Array<{
    id: string;
    nome: string | null;
    situacao: string;
    dt_nascimento: string | null;
  }>;

  // A vigência não começa antes de a ave existir — mesma regra que a formação
  // do casal já cobra, e que mudar a data depois romperia.
  for (const p of parceiros) {
    if (p.dt_nascimento && vigencia_inicio < p.dt_nascimento) {
      campos.vigencia_inicio = `${p.nome ?? "Uma das aves"} nasceu em ${formatarBR(p.dt_nascimento)}.`;
    }
  }

  // As posturas já registradas são o limite dos dois lados: elas aconteceram, e
  // uma vigência que as deixe de fora transformaria o histórico em mentira.
  const { data: extremos } = await supabase
    .from("posturas")
    .select("data_postura")
    .eq("casal_id", casalId)
    .is("deleted_at", null)
    .order("data_postura");

  const datas = ((extremos ?? []) as Array<{ data_postura: string }>).map((p) => p.data_postura);
  if (datas.length) {
    const primeira = datas[0];
    const ultima = datas[datas.length - 1];
    if (vigencia_inicio > primeira) {
      campos.vigencia_inicio = `Este casal já tem postura de ${formatarBR(primeira)}.`;
    }
    if (vigencia_fim && vigencia_fim < ultima) {
      campos.vigencia_fim = `Este casal tem postura de ${formatarBR(ultima)}, depois desta data.`;
    }
  }

  // Reabrir só vale enquanto as duas aves estão no plantel. Um casal com uma
  // ave vendida voltaria a aceitar postura de quem não está no galpão.
  if (!vigencia_fim && casal.vigencia_fim) {
    const fora = parceiros.find((p) => p.situacao !== "ativo");
    if (fora) {
      campos.vigencia_fim = `${fora.nome ?? "Uma das aves"} não está mais no plantel ativo, então o casal não reabre.`;
    }
  }

  if (Object.keys(campos).length) return { campos };

  // --- Etiquetas -------------------------------------------------------------
  // Vêm no mesmo envio porque é o mesmo gesto: o criador abre a edição do casal
  // para arrumar tudo que ele sabe sobre aquele par.
  const erroEtiqueta = await sincronizarEtiquetas(supabase, casalId, dados);
  if (erroEtiqueta) return { campos: erroEtiqueta };

  const { error } = await supabase
    .from("casais")
    .update({
      gaiola: gaiola ?? null,
      observacoes: observacoes ?? null,
      vigencia_inicio,
      vigencia_fim: vigencia_fim ?? null,
    })
    .eq("id", casalId);

  if (error) {
    if (error.code === "23505") {
      return { erro: "Outro casal já usa esse número." };
    }
    console.error("editarCasal:", error.message);
    return { erro: "Não foi possível salvar as alterações. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};

  const encerrou = Boolean(vigencia_fim) && !casal.vigencia_fim;
  redirect(`/casais/${casalId}?${encerrou ? "encerrado=1" : "editado=1"}`);
}


function formatarBR(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

/**
 * Aplica e remove etiquetas, e cria a nova quando o criador digitou um nome.
 *
 * Apaga todos os vínculos e regrava os marcados, em vez de calcular a
 * diferença: são no máximo algumas linhas por casal, a tabela é uma chave
 * composta sem dado próprio, e a diferença traria um estado intermediário em
 * que o casal fica com etiqueta a menos se a segunda escrita falhar.
 */
async function sincronizarEtiquetas(
  supabase: Awaited<ReturnType<typeof criarClienteServidor>>,
  casalId: string,
  dados: FormData,
): Promise<Record<string, string> | null> {
  const escolhidas = dados.getAll("etiqueta_id").map(String).filter(Boolean);
  const novoNome = String(dados.get("nova_etiqueta") ?? "").trim();
  const novaCor = String(dados.get("nova_cor") ?? "") || COR_PADRAO;

  if (novoNome !== "") {
    if (novoNome.length > 40) {
      return { nova_etiqueta: "O nome da etiqueta tem no máximo 40 caracteres." };
    }
    if (!CORES_ETIQUETA.some((c) => c.valor === novaCor)) {
      return { nova_etiqueta: "Escolha uma das cores da paleta." };
    }

    const { data: criatorio } = await supabase
      .from("casais")
      .select("criatorio_id")
      .eq("id", casalId)
      .maybeSingle();

    if (!criatorio) return { nova_etiqueta: "Casal não encontrado." };

    const { data: criada, error } = await supabase
      .from("casal_tags")
      .insert({ criatorio_id: criatorio.criatorio_id, nome: novoNome, cor: novaCor })
      .select("id")
      .single();

    if (error) {
      // unique (criatorio_id, nome): a etiqueta já existe, e o criador quis
      // aplicá-la. Procurar e usar é o que ele esperava, não um erro.
      if (error.code === "23505") {
        const { data: existente } = await supabase
          .from("casal_tags")
          .select("id")
          .eq("nome", novoNome)
          .maybeSingle();
        if (existente) escolhidas.push(existente.id);
        else return { nova_etiqueta: `A etiqueta "${novoNome}" já existe.` };
      } else {
        console.error("sincronizarEtiquetas/criar:", error.message);
        return { nova_etiqueta: "Não foi possível criar a etiqueta." };
      }
    } else if (criada) {
      escolhidas.push(criada.id);
    }
  }

  await supabase.from("casal_tag_vinculo").delete().eq("casal_id", casalId);

  const unicas = [...new Set(escolhidas)];
  if (unicas.length) {
    const { error } = await supabase
      .from("casal_tag_vinculo")
      .insert(unicas.map((tagId) => ({ casal_id: casalId, tag_id: tagId })));
    if (error) {
      console.error("sincronizarEtiquetas/vincular:", error.message);
      return { nova_etiqueta: "Não foi possível aplicar as etiquetas." };
    }
  }

  return null;
}
