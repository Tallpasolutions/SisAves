"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterCriatorioAtual } from "@/lib/criatorio";
import { calcularEndogamia, explicarEndogamia } from "@/lib/dados/casais";

export interface EstadoFormarCasal {
  erro?: string;
  campos?: Record<string, string>;
}

export interface LeituraEndogamia {
  valor: number | null;
  explicacao: string | null;
}

/**
 * Consulta o coeficiente antes de confirmar.
 *
 * O cálculo vive no banco (`coeficiente_endogamia`, recursivo sobre a árvore),
 * então o cliente não tem como fazê-lo sozinho. Esta ação existe para que o
 * número apareça enquanto o criador ainda está escolhendo o par — depois de
 * confirmar já não adianta: é a decisão técnica central dele.
 */
export async function consultarEndogamia(
  machoId: string,
  femeaId: string,
): Promise<LeituraEndogamia> {
  if (!machoId || !femeaId) return { valor: null, explicacao: null };

  const [valor, explicacao] = await Promise.all([
    calcularEndogamia(machoId, femeaId),
    explicarEndogamia(machoId, femeaId),
  ]);

  return { valor, explicacao };
}

const EsquemaCasal = z.object({
  macho_id: z.string().uuid("Escolha o macho do casal."),
  femea_id: z.string().uuid("Escolha a fêmea do casal."),
  gaiola: z.string().trim().max(30, "A identificação da gaiola tem no máximo 30 caracteres.").optional(),
  vigencia_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato dd/mm/aaaa.")
    .refine((d) => d <= hoje(), "A formação do casal não pode ser no futuro."),
  observacoes: z.string().trim().max(500, "As observações não passam de 500 caracteres.").optional(),
});

export async function formarCasal(
  _anterior: EstadoFormarCasal,
  dados: FormData,
): Promise<EstadoFormarCasal> {
  const texto = (campo: string) => {
    const v = String(dados.get(campo) ?? "").trim();
    return v === "" ? undefined : v;
  };

  const resultado = EsquemaCasal.safeParse({
    macho_id: String(dados.get("macho_id") ?? ""),
    femea_id: String(dados.get("femea_id") ?? ""),
    gaiola: texto("gaiola"),
    vigencia_inicio: String(dados.get("vigencia_inicio") ?? ""),
    observacoes: texto("observacoes"),
  });

  if (!resultado.success) {
    const campos: Record<string, string> = {};
    for (const problema of resultado.error.issues) {
      const campo = String(problema.path[0] ?? "");
      if (campo && !campos[campo]) campos[campo] = problema.message;
    }
    return { campos };
  }

  const casal = resultado.data;
  const criatorio = await obterCriatorioAtual();
  if (!criatorio) redirect("/comecar");

  const supabase = await criarClienteServidor();

  // Confere sexo e existência das duas aves antes de escrever, para a mensagem
  // nomear a ave em vez de devolver a violação crua da constraint.
  const { data: aves } = await supabase
    .from("passaros")
    .select("id, nome, sexo, situacao, dt_nascimento")
    .in("id", [casal.macho_id, casal.femea_id])
    .is("deleted_at", null);

  const porId = new Map(
    ((aves ?? []) as Array<{
      id: string;
      nome: string | null;
      sexo: string;
      situacao: string;
      dt_nascimento: string | null;
    }>).map((a) => [a.id, a]),
  );

  const campos: Record<string, string> = {};
  for (const [campo, id, sexoEsperado, papel] of [
    ["macho_id", casal.macho_id, "macho", "macho"],
    ["femea_id", casal.femea_id, "femea", "fêmea"],
  ] as const) {
    const a = porId.get(id);
    if (!a) {
      campos[campo] = `A ave escolhida como ${papel} não está mais no plantel.`;
      continue;
    }
    if (a.sexo !== sexoEsperado) {
      campos[campo] = `${a.nome ?? "A ave escolhida"} não está registrada como ${papel}.`;
      continue;
    }
    if (a.situacao !== "ativo") {
      campos[campo] = `${a.nome ?? "A ave escolhida"} não está no plantel ativo.`;
      continue;
    }
    // A vigência não pode começar antes de a ave existir.
    if (a.dt_nascimento && casal.vigencia_inicio < a.dt_nascimento) {
      campos.vigencia_inicio = `${a.nome ?? "A ave escolhida"} nasceu em ${formatarBR(
        a.dt_nascimento,
      )}.`;
    }
  }
  if (Object.keys(campos).length) return { campos };

  // Mesmo par já vigente é duplicata, não casal novo. A constraint não pega
  // isso — é regra de domínio.
  const { data: existente } = await supabase
    .from("casais")
    .select("numero")
    .eq("macho_id", casal.macho_id)
    .eq("femea_id", casal.femea_id)
    .is("vigencia_fim", null)
    .is("deleted_at", null)
    .maybeSingle();

  if (existente) {
    return {
      erro: `Este par já forma o casal ${String(existente.numero).padStart(2, "0")}, ainda vigente.`,
    };
  }

  // O coeficiente é gravado, e não só exibido: a árvore muda quando o criador
  // corrige uma filiação, e o registro precisa dizer o que ele sabia ao decidir.
  const endogamia = await calcularEndogamia(casal.macho_id, casal.femea_id);

  const { data: ultimo } = await supabase
    .from("casais")
    .select("numero")
    .is("deleted_at", null)
    .order("numero", { ascending: false })
    .limit(1)
    .maybeSingle();

  const numero = (ultimo?.numero ?? 0) + 1;

  const { data: criado, error } = await supabase
    .from("casais")
    .insert({
      criatorio_id: criatorio.id,
      numero,
      macho_id: casal.macho_id,
      femea_id: casal.femea_id,
      gaiola: casal.gaiola ?? null,
      vigencia_inicio: casal.vigencia_inicio,
      endogamia_pct: endogamia,
      observacoes: casal.observacoes ?? null,
    })
    .select("id")
    .single();

  if (error || !criado) {
    // 23505 = dois casais com o mesmo número, o que só acontece se outra aba
    // gravou no intervalo entre ler o último número e escrever.
    if (error?.code === "23505") {
      return { erro: "Outro casal foi formado agora mesmo. Tente de novo." };
    }
    console.error("formarCasal:", error?.message);
    return { erro: "Não foi possível formar o casal. Tente de novo." };
  }

  revalidatePath("/", "layout");
  redirect(`/casais/${criado.id}?formado=${numero}`);
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatarBR(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}
