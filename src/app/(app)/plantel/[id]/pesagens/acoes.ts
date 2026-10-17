"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { CONTEXTOS_PESAGEM } from "@/lib/dados/contextos-de-pesagem";
import { hojeNoCriatorio } from "@/lib/data";

export interface EstadoPesagem {
  erro?: string;
  campos?: Record<string, string>;
}

const CONTEXTOS = CONTEXTOS_PESAGEM.map((c) => c.valor) as [string, ...string[]];

const EsquemaPesagem = z.object({
  data: z
    // A mensagem no tipo base: campo vazio falha antes do regex e devolveria
    // o texto cru do Zod, em inglês.
    .string({ error: "Informe o dia da pesagem." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato dd/mm/aaaa.")
    .refine((d) => d <= hojeNoCriatorio(), "A pesagem não pode ser no futuro."),
  peso_gramas: z.coerce
    .number({ error: "Informe o peso em gramas." })
    .positive("O peso precisa ser maior que zero.")
    .max(9999, "Confira o peso em gramas."),
  contexto: z.enum(CONTEXTOS, { error: "Escolha o contexto da pesagem." }),
  observacoes: z.string().trim().max(300).optional(),
});

/**
 * Registra uma pesagem avulsa.
 *
 * Até aqui a única pesagem que existia era a do anilhamento, gravada por
 * `anilhar_filhotes`. A curva de crescimento começava e terminava no mesmo
 * ponto.
 *
 * A chave vem do cliente: é ela que torna o reenvio da fila offline
 * idempotente, em vez de gravar a mesma pesagem duas vezes e torcer a média.
 */
export async function registrarPesagem(
  _anterior: EstadoPesagem,
  dados: FormData,
): Promise<EstadoPesagem> {
  const aveId = String(dados.get("passaro_id") ?? "");
  if (!aveId) return { erro: "Ave não identificada." };

  const pesagemId = String(dados.get("pesagem_id") ?? "") || null;
  const reenvio = dados.get("reenvio") === "1";

  const opcional = (v: FormDataEntryValue | null) => {
    const t = String(v ?? "").trim();
    return t === "" ? undefined : t;
  };

  /** Peso em pt-BR usa vírgula: é assim que a balança mostra e a ficha exibe. */
  const bruto = opcional(dados.get("peso_gramas"));
  const peso = bruto?.replace(/\./g, "").replace(",", ".");

  const resultado = EsquemaPesagem.safeParse({
    data: dados.get("data"),
    peso_gramas: peso,
    contexto: opcional(dados.get("contexto")),
    observacoes: opcional(dados.get("observacoes")),
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

  const { data: ave } = await supabase
    .from("passaros")
    .select("id, criatorio_id, nome, dt_nascimento")
    .eq("id", aveId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!ave) return { erro: "Ave não encontrada ou fora do seu criatório." };

  // Pesagem anterior ao nascimento não é erro de digitação raro: é o criador
  // tendo escolhido a ave errada na lista.
  if (ave.dt_nascimento && resultado.data.data < ave.dt_nascimento) {
    return {
      campos: {
        data: `${ave.nome ?? "Esta ave"} nasceu em ${formatarBR(ave.dt_nascimento)}.`,
      },
    };
  }

  const { error } = await supabase.from("pesagens").insert({
    ...(pesagemId ? { id: pesagemId } : {}),
    criatorio_id: ave.criatorio_id,
    passaro_id: aveId,
    data: resultado.data.data,
    peso_gramas: resultado.data.peso_gramas,
    contexto: resultado.data.contexto,
    observacoes: resultado.data.observacoes ?? null,
  });

  if (error) {
    // Chave primária: esta escrita já chegou antes. Não é erro — o registro
    // está lá, e repetir seria duplicar a pesagem.
    if (error.code === "23505" && error.message.includes("pesagens_pkey")) {
      revalidatePath("/", "layout");
      if (reenvio) return {};
      redirect(`/plantel/${aveId}/pesagens`);
    }
    console.error("registrarPesagem:", error.message);
    return { erro: "Não foi possível registrar a pesagem. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect(`/plantel/${aveId}/pesagens?registrada=1`);
}


function formatarBR(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}
