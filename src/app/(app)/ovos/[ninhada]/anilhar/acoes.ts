"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export interface EstadoAnilhamento {
  erro?: string;
  /** Erros por filhote, indexados pelo id da postura. */
  porFilhote?: Record<string, string>;
  campos?: Record<string, string>;
}

const EsquemaFilhote = z.object({
  postura_id: z.string().uuid(),
  anilha_numero: z.coerce
    .number({ error: "Informe o número da anilha deste filhote." })
    .int("O número da anilha é um número inteiro.")
    .positive("O número da anilha começa em 1."),
  nome: z.string().trim().max(120).optional(),
  peso_gramas: z.coerce
    .number()
    .positive("O peso precisa ser maior que zero.")
    .max(9999, "Confira o peso em gramas.")
    .optional(),
});

const EsquemaAnilhamento = z.object({
  data_anilhamento: z
    .string({ error: "Informe a data do anilhamento." })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato dd/mm/aaaa.")
    .refine((d) => d <= hoje(), "O anilhamento não pode ser no futuro."),
  anilha_sigla: z.string().trim().max(12).optional(),
  anilha_criador: z.string().trim().max(20).optional(),
  anilha_ano: z.coerce
    .number({ error: "Informe o ano da anilha." })
    .int("O ano da anilha é um número inteiro.")
    .min(1950, "O ano da anilha começa em 1950.")
    .max(2200, "Confira o ano da anilha."),
});

export async function anilharFilhotes(
  _anterior: EstadoAnilhamento,
  dados: FormData,
): Promise<EstadoAnilhamento> {
  const ninhadaId = String(dados.get("ninhada_id") ?? "");
  const ids = dados.getAll("postura_id").map(String).filter(Boolean);
  const reenvio = dados.get("reenvio") === "1";

  if (!ninhadaId || ids.length === 0) {
    return { erro: "Nenhum filhote informado para anilhar." };
  }

  const opcional = (v: FormDataEntryValue | null) => {
    const t = String(v ?? "").trim();
    return t === "" ? undefined : t;
  };

  /**
   * Peso em pt-BR usa vírgula: o criador digita "12,5" porque é assim que a
   * balança mostra e assim que a ficha exibe. `z.coerce.number()` leria NaN.
   */
  const decimal = (v: FormDataEntryValue | null) => {
    const t = opcional(v);
    return t === undefined ? undefined : t.replace(/\./g, "").replace(",", ".");
  };

  const cabecalho = EsquemaAnilhamento.safeParse({
    data_anilhamento: String(dados.get("data_anilhamento") ?? ""),
    anilha_sigla: opcional(dados.get("anilha_sigla")),
    anilha_criador: opcional(dados.get("anilha_criador")),
    anilha_ano: String(dados.get("anilha_ano") ?? ""),
  });

  if (!cabecalho.success) {
    const campos: Record<string, string> = {};
    for (const problema of cabecalho.error.issues) {
      const campo = String(problema.path[0] ?? "");
      if (campo && !campos[campo]) campos[campo] = problema.message;
    }
    return { campos };
  }

  // Só entram os filhotes que o criador marcou. Nem toda ninhada é anilhada de
  // uma vez: um filhote menor pode não estar com a perna no ponto.
  const escolhidos = ids.filter((id) => dados.get(`anilhar_${id}`) === "on");
  if (escolhidos.length === 0) {
    return { erro: "Marque ao menos um filhote para anilhar." };
  }

  const porFilhote: Record<string, string> = {};
  const filhotes: Array<z.infer<typeof EsquemaFilhote>> = [];

  for (const id of escolhidos) {
    const resultado = EsquemaFilhote.safeParse({
      postura_id: id,
      anilha_numero: opcional(dados.get(`numero_${id}`)),
      nome: opcional(dados.get(`nome_${id}`)),
      peso_gramas: decimal(dados.get(`peso_${id}`)),
    });

    if (!resultado.success) {
      porFilhote[id] =
        resultado.error.issues[0]?.message ?? "Confira os dados deste filhote.";
      continue;
    }
    filhotes.push(resultado.data);
  }

  if (Object.keys(porFilhote).length) return { porFilhote };

  // Duas anilhas iguais no mesmo envio: o banco pegaria pela constraint, mas a
  // mensagem sairia sem dizer qual dos dois filhotes repetiu.
  const vistos = new Map<number, string>();
  for (const f of filhotes) {
    const anterior = vistos.get(f.anilha_numero);
    if (anterior) {
      porFilhote[f.postura_id] =
        `O número ${String(f.anilha_numero).padStart(4, "0")} já foi usado em outro filhote desta ninhada.`;
    } else {
      vistos.set(f.anilha_numero, f.postura_id);
    }
  }
  if (Object.keys(porFilhote).length) return { porFilhote };

  const supabase = await criarClienteServidor();

  const { error } = await supabase.rpc("anilhar_filhotes", {
    p_data_anilhamento: cabecalho.data.data_anilhamento,
    p_filhotes: filhotes.map((f) => ({
      postura_id: f.postura_id,
      anilha_sigla: cabecalho.data.anilha_sigla ?? null,
      anilha_criador: cabecalho.data.anilha_criador ?? null,
      anilha_ano: cabecalho.data.anilha_ano,
      anilha_numero: f.anilha_numero,
      nome: f.nome ?? null,
      peso_gramas: f.peso_gramas ?? null,
    })),
  });

  if (error) {
    // A função roda tudo numa transação: se chegou erro, nada foi gravado.
    if (error.message.includes("passaros_anilha_unica")) {
      return {
        erro: `Uma das anilhas de ${cabecalho.data.anilha_ano} já existe no plantel. Confira os números.`,
      };
    }
    // As mensagens da função já falam a língua do domínio ("Este filhote já foi
    // anilhado em 28/09/2026."); repassar é melhor que traduzir de novo.
    if (error.code === "P0001") return { erro: error.message };

    console.error("anilharFilhotes:", error.message);
    return { erro: "Não foi possível anilhar. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect(`/ovos?anilhados=${filhotes.length}&ninhada=${ninhadaId}`);
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}
