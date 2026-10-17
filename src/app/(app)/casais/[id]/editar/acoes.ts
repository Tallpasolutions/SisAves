"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";
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
