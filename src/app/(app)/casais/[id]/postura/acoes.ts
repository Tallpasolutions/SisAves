"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export interface EstadoPostura {
  erro?: string;
  /** Erros por campo, para o Field citar o dado exato. */
  campos?: Record<string, string>;
}

/**
 * O esquema espelha as constraints do banco. Validar aqui não substitui a
 * constraint — ela é a garantia final —, mas permite devolver uma mensagem que
 * cita o dado em vez do erro cru do Postgres.
 */
const EsquemaPostura = z.object({
  data_postura: z
    // A mensagem no tipo base, e não só no regex: campo que chega vazio falha
    // ANTES do regex, e sem ela o criador recebia o texto cru do Zod, em
    // inglês ("Invalid input: expected string, received null").
    .string({ error: "Informe a data da postura." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato dd/mm/aaaa.")
    .refine((d) => d <= hoje(), "A postura não pode ser no futuro."),
  quantidade: z.coerce
    .number({ error: "Informe quantos ovos a ninhada tem." })
    .int("Informe um número inteiro de ovos.")
    .min(1, "A ninhada precisa de ao menos 1 ovo.")
    .max(12, "Mais de 12 ovos numa ninhada: confira o número."),
  observacoes: z.string().trim().max(500).optional(),
});

export async function registrarPostura(
  _anterior: EstadoPostura,
  dados: FormData,
): Promise<EstadoPostura> {
  const casalId = String(dados.get("casal_id") ?? "");
  if (!casalId) return { erro: "Casal não identificado." };

  /*
   * Chave gerada no cliente, usada como PK da ninhada.
   *
   * É o que torna o reenvio da fila offline idempotente: se a primeira
   * tentativa chegou ao servidor e só a resposta se perdeu — o caso clássico
   * de sinal ruim —, a segunda bate na chave primária e é reconhecida como já
   * aplicada, em vez de criar uma segunda ninhada idêntica.
   */
  const ninhadaId = String(dados.get("ninhada_id") ?? "") || null;

  // Reenvio da fila offline: grava e devolve, sem navegar. Ver paraFormData.
  const reenvio = dados.get("reenvio") === "1";

  const resultado = EsquemaPostura.safeParse({
    data_postura: dados.get("data_postura"),
    quantidade: dados.get("quantidade"),
    observacoes: dados.get("observacoes") || undefined,
  });

  if (!resultado.success) {
    const campos: Record<string, string> = {};
    for (const problema of resultado.error.issues) {
      const campo = String(problema.path[0] ?? "");
      if (campo && !campos[campo]) campos[campo] = problema.message;
    }
    return { campos };
  }

  const { data_postura, quantidade, observacoes } = resultado.data;
  const supabase = await criarClienteServidor();

  // A RLS já impede ler casal de outro criatório; esta leitura serve para
  // pegar criatorio_id e a vigência.
  const { data: casal } = await supabase
    .from("casais")
    .select("id, criatorio_id, numero, vigencia_inicio, vigencia_fim")
    .eq("id", casalId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!casal) return { erro: "Casal não encontrado." };

  if (data_postura < casal.vigencia_inicio) {
    return {
      campos: {
        data_postura: `O casal ${String(casal.numero).padStart(2, "0")} só existe desde ${formatarBR(casal.vigencia_inicio)}.`,
      },
    };
  }

  if (casal.vigencia_fim && data_postura > casal.vigencia_fim) {
    return {
      campos: {
        data_postura: `O casal foi encerrado em ${formatarBR(casal.vigencia_fim)}.`,
      },
    };
  }

  // Numeração da ninhada é sequencial por casal, calculada na hora da escrita.
  const { data: ultima } = await supabase
    .from("ninhadas")
    .select("numero")
    .eq("casal_id", casalId)
    .order("numero", { ascending: false })
    .limit(1)
    .maybeSingle();

  const numero = (ultima?.numero ?? 0) + 1;

  const { data: ninhada, error: erroNinhada } = await supabase
    .from("ninhadas")
    .insert({
      ...(ninhadaId ? { id: ninhadaId } : {}),
      criatorio_id: casal.criatorio_id,
      casal_id: casalId,
      numero,
      iniciada_em: data_postura,
      observacoes: observacoes ?? null,
    })
    .select("id")
    .single();

  if (erroNinhada || !ninhada) {
    if (erroNinhada?.code === "23505") {
      // Chave primária: esta mesma escrita já chegou antes. Não é erro — o
      // registro está lá, e repetir seria duplicar a ninhada.
      if (erroNinhada.message.includes("ninhadas_pkey")) {
        revalidatePath("/", "layout");
        if (reenvio) return {};
        redirect(`/casais/${casalId}`);
      }
      // Dois números iguais no mesmo casal: outra aba gravou entre ler e
      // escrever.
      return { erro: "Outra ninhada foi registrada agora mesmo. Tente de novo." };
    }
    console.error("registrarPostura/ninhada:", erroNinhada?.message);
    return { erro: "Não foi possível registrar a ninhada. Tente de novo." };
  }

  const ovos = Array.from({ length: quantidade }, (_, i) => ({
    criatorio_id: casal.criatorio_id,
    casal_id: casalId,
    ninhada_id: ninhada.id,
    numero_ovo: i + 1,
    data_postura,
  }));

  const { error: erroOvos } = await supabase.from("posturas").insert(ovos);

  if (erroOvos) {
    // A ninhada já entrou; sem os ovos ela fica órfã e confunde a tela.
    await supabase.from("ninhadas").delete().eq("id", ninhada.id);
    console.error("registrarPostura/ovos:", erroOvos.message);
    return { erro: "Não foi possível registrar os ovos. Tente de novo." };
  }

  revalidatePath("/", "layout");
  // A confirmação é fato + consequência com data, montada na tela de destino.
  redirect(`/casais/${casalId}?registrada=${numero}&ovos=${quantidade}`);
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatarBR(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}
