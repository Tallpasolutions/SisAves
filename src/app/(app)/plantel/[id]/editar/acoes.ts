"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { EstadoCadastroAve } from "@/app/(app)/plantel/nova/acoes";
import { hojeNoCriatorio } from "@/lib/data";
import { barradoPelaAssinatura, ERRO_ASSINATURA } from "@/lib/erros";

const opcional = (v: FormDataEntryValue | null) => {
  const texto = String(v ?? "").trim();
  return texto === "" ? undefined : texto;
};

/** Mesmo esquema do cadastro: as constraints de `passaros` não mudam ao editar. */
const EsquemaEdicao = z
  .object({
    nome: z.string().trim().max(120, "O nome não pode passar de 120 caracteres.").optional(),
    especie_id: z
      .string({ error: "Escolha a espécie da ave." })
      .uuid("Escolha a espécie da ave."),
    mutacao_id: z.string().uuid().optional(),
    sexo: z.enum(["macho", "femea", "indefinido"], {
      error: "Informe o sexo, ou deixe como indefinido.",
    }),
    origem: z
      .enum(["nascimento_proprio", "compra", "doacao_recebida", "transferencia"])
      .optional(),
    dt_nascimento: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato dd/mm/aaaa.")
      .refine((d) => d <= hojeNoCriatorio(), "O nascimento não pode ser no futuro.")
      .optional(),
    anilha_sigla: z.string().trim().max(12, "A sigla do clube tem no máximo 12 caracteres.").optional(),
    anilha_criador: z.string().trim().max(20, "A matrícula do criador tem no máximo 20 caracteres.").optional(),
    anilha_ano: z.coerce
      .number()
      .int("O ano da anilha é um número inteiro.")
      .min(1950, "O ano da anilha começa em 1950.")
      .max(2200, "Confira o ano da anilha.")
      .optional(),
    anilha_numero: z.coerce
      .number()
      .int("O número da anilha é um número inteiro.")
      .positive("O número da anilha começa em 1.")
      .optional(),
    codigo_alternativo: z.string().trim().max(40).optional(),
    pai_id: z.string().uuid().optional(),
    mae_id: z.string().uuid().optional(),
    observacoes: z.string().trim().max(500, "As observações não passam de 500 caracteres.").optional(),
  })
  .refine((d) => !(d.anilha_numero !== undefined && d.anilha_ano === undefined), {
    path: ["anilha_ano"],
    message: "Informe também o ano da anilha.",
  })
  .refine((d) => !(d.anilha_ano !== undefined && d.anilha_numero === undefined), {
    path: ["anilha_numero"],
    message: "Informe também o número da anilha.",
  });

/**
 * Corrige os dados de uma ave já cadastrada.
 *
 * Escreve numa tabela só, então não precisa de função no banco. O que ela faz
 * além do cadastro é olhar o que já existe em volta da ave: filhotes, casais e
 * a postura que a originou. Nenhum desses vínculos existia no momento do
 * cadastro, e todos quebram em silêncio se a correção passar por cima deles.
 *
 * É idempotente por natureza — gravar os mesmos valores duas vezes dá o mesmo
 * resultado —, então o reenvio da fila offline não precisa de chave.
 */
export async function editarAve(
  _anterior: EstadoCadastroAve,
  dados: FormData,
): Promise<EstadoCadastroAve> {
  const aveId = String(dados.get("ave_id") ?? "");
  if (!aveId) return { erro: "Ave não identificada." };

  const reenvio = dados.get("reenvio") === "1";

  const resultado = EsquemaEdicao.safeParse({
    nome: opcional(dados.get("nome")),
    especie_id: String(dados.get("especie_id") ?? ""),
    mutacao_id: opcional(dados.get("mutacao_id")),
    sexo: String(dados.get("sexo") ?? "indefinido"),
    origem: opcional(dados.get("origem")),
    dt_nascimento: opcional(dados.get("dt_nascimento")),
    anilha_sigla: opcional(dados.get("anilha_sigla")),
    anilha_criador: opcional(dados.get("anilha_criador")),
    anilha_ano: opcional(dados.get("anilha_ano")),
    anilha_numero: opcional(dados.get("anilha_numero")),
    codigo_alternativo: opcional(dados.get("codigo_alternativo")),
    pai_id: opcional(dados.get("pai_id")),
    mae_id: opcional(dados.get("mae_id")),
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

  const ave = resultado.data;
  const supabase = await criarClienteServidor();

  const { data: atual } = await supabase
    .from("passaros")
    .select("id, nome, sexo, dt_nascimento, origem, postura_id, dt_obito, saida_em")
    .eq("id", aveId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!atual) return { erro: "Ave não encontrada ou fora do seu criatório." };

  // Nascimento e origem de ave vinda de postura são travados na tela, e campo
  // desabilitado não é enviado. Mantém-se o que já está gravado.
  const nascimento = atual.postura_id ? atual.dt_nascimento : (ave.dt_nascimento ?? null);
  const origem = atual.postura_id ? atual.origem : (ave.origem ?? "nascimento_proprio");

  if (ave.pai_id === aveId || ave.mae_id === aveId) {
    return {
      campos: {
        [ave.pai_id === aveId ? "pai_id" : "mae_id"]:
          "Uma ave não pode ser progenitora dela mesma.",
      },
    };
  }

  const campos: Record<string, string> = {};

  // --- O nascimento tem vizinhos que já dependem dele ------------------------
  if (nascimento) {
    if (atual.dt_obito && atual.dt_obito < nascimento) {
      campos.dt_nascimento = `O óbito está registrado em ${formatarBR(atual.dt_obito)}, antes desta data.`;
    }
    if (atual.saida_em && atual.saida_em < nascimento) {
      campos.dt_nascimento = `A saída está registrada em ${formatarBR(atual.saida_em)}, antes desta data.`;
    }

    // Um casal não pode ter começado antes de a ave existir — é a mesma regra
    // que a formação do casal já cobra, e mudar o nascimento depois a rompe.
    const { data: casais } = await supabase
      .from("casais")
      .select("numero, vigencia_inicio")
      .or(`macho_id.eq.${aveId},femea_id.eq.${aveId}`)
      .is("deleted_at", null)
      .lt("vigencia_inicio", nascimento)
      .order("vigencia_inicio")
      .limit(1);

    const casal = casais?.[0];
    if (casal) {
      campos.dt_nascimento = `O casal ${String(casal.numero).padStart(2, "0")} começou em ${formatarBR(
        casal.vigencia_inicio,
      )}, antes desta data.`;
    }
  }

  // --- Os progenitores, com mensagem que nomeia a ave -----------------------
  const ids = [ave.pai_id, ave.mae_id].filter((v): v is string => Boolean(v));
  if (ids.length) {
    const { data: progenitores } = await supabase
      .from("passaros")
      .select("id, nome, sexo, dt_nascimento")
      .in("id", ids)
      .is("deleted_at", null);

    const porId = new Map(
      ((progenitores ?? []) as Array<{
        id: string;
        nome: string | null;
        sexo: string;
        dt_nascimento: string | null;
      }>).map((p) => [p.id, p]),
    );

    for (const [campo, id, sexoErrado, rotulo] of [
      ["pai_id", ave.pai_id, "femea", "pai"],
      ["mae_id", ave.mae_id, "macho", "mãe"],
    ] as const) {
      if (!id) continue;
      const p = porId.get(id);
      if (!p) {
        campos[campo] = `A ave escolhida como ${rotulo} não está mais no plantel.`;
        continue;
      }
      if (p.sexo === sexoErrado) {
        campos[campo] = `${p.nome ?? "A ave escolhida"} está registrada como ${
          sexoErrado === "femea" ? "fêmea" : "macho"
        } e não pode ser ${rotulo}.`;
        continue;
      }
      if (nascimento && p.dt_nascimento && p.dt_nascimento >= nascimento) {
        campos[campo] = `${p.nome ?? "A ave escolhida"} nasceu em ${formatarBR(
          p.dt_nascimento,
        )}, depois do nascimento informado.`;
      }
    }
  }

  if (Object.keys(campos).length) return { campos };

  const { error } = await supabase
    .from("passaros")
    .update({
      nome: ave.nome ?? null,
      especie_id: ave.especie_id,
      mutacao_id: ave.mutacao_id ?? null,
      sexo: ave.sexo,
      origem,
      dt_nascimento: nascimento,
      anilha_sigla: ave.anilha_sigla ?? null,
      anilha_criador: ave.anilha_criador ?? null,
      anilha_ano: ave.anilha_ano ?? null,
      anilha_numero: ave.anilha_numero ?? null,
      codigo_alternativo: ave.codigo_alternativo ?? null,
      pai_id: ave.pai_id ?? null,
      mae_id: ave.mae_id ?? null,
      observacoes: ave.observacoes ?? null,
    })
    .eq("id", aveId);

  if (error) {
    if (error.code === "23505") {
      if (error.message.includes("passaros_anilha_unica")) {
        const anilha = [
          [ave.anilha_sigla, ave.anilha_criador].filter(Boolean).join(" "),
          String(ave.anilha_ano),
          String(ave.anilha_numero).padStart(4, "0"),
        ]
          .filter(Boolean)
          .join(" · ");
        return { campos: { anilha_numero: `A anilha ${anilha} já é de outra ave do plantel.` } };
      }
      if (error.message.includes("codigo_alternativo")) {
        return {
          campos: {
            codigo_alternativo: `O código ${ave.codigo_alternativo} já é de outra ave do plantel.`,
          },
        };
      }
    }
    // Os triggers de genealogia e de coerência de sexo falam a língua do
    // domínio ("Esta ave é pai de 3 ave(s) no plantel."); repassar é melhor
    // que traduzir de novo.
    if (error.code === "P0001") return { erro: error.message };

    // Vencido não é "tente de novo": tentar de novo nunca vai funcionar.
    if (barradoPelaAssinatura(error)) return { erro: ERRO_ASSINATURA };
    console.error("editarAve:", error.message);
    return { erro: "Não foi possível salvar as alterações. Tente de novo." };
  }

  revalidatePath("/", "layout");
  if (reenvio) return {};
  redirect(`/plantel/${aveId}?editada=1`);
}


function formatarBR(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}
