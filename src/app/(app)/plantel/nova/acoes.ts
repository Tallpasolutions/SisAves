"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterCriatorioAtual } from "@/lib/criatorio";

export interface EstadoCadastroAve {
  erro?: string;
  /** Erros por campo, para o Field citar o dado exato. */
  campos?: Record<string, string>;
}

const opcional = (v: FormDataEntryValue | null) => {
  const texto = String(v ?? "").trim();
  return texto === "" ? undefined : texto;
};

/**
 * O esquema espelha as constraints de `passaros` em `0004_plantel.sql`.
 * Validar aqui não substitui a constraint — ela é a garantia final —, mas
 * permite devolver mensagem que cita o dado em vez do erro cru do Postgres.
 */
const EsquemaAve = z
  .object({
    nome: z.string().trim().max(120, "O nome não pode passar de 120 caracteres.").optional(),
    especie_id: z
      .string({ error: "Escolha a espécie da ave." })
      .uuid("Escolha a espécie da ave."),
    mutacao_id: z.string().uuid().optional(),
    sexo: z.enum(["macho", "femea", "indefinido"], {
      error: "Informe o sexo, ou deixe como indefinido.",
    }),
    origem: z.enum(["nascimento_proprio", "compra", "doacao_recebida", "transferencia"], {
      error: "Informe a origem da ave.",
    }),
    dt_nascimento: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data no formato dd/mm/aaaa.")
      .refine((d) => d <= hoje(), "O nascimento não pode ser no futuro.")
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
  // `passaros_anilha_completa`: ou a anilha tem ano e número, ou não tem nenhum
  // dos dois. Meia anilha identificaria a ave pela metade.
  .refine((d) => !(d.anilha_numero !== undefined && d.anilha_ano === undefined), {
    path: ["anilha_ano"],
    message: "Informe também o ano da anilha.",
  })
  .refine((d) => !(d.anilha_ano !== undefined && d.anilha_numero === undefined), {
    path: ["anilha_numero"],
    message: "Informe também o número da anilha.",
  });

export async function cadastrarAve(
  _anterior: EstadoCadastroAve,
  dados: FormData,
): Promise<EstadoCadastroAve> {
  const resultado = EsquemaAve.safeParse({
    nome: opcional(dados.get("nome")),
    especie_id: String(dados.get("especie_id") ?? ""),
    mutacao_id: opcional(dados.get("mutacao_id")),
    sexo: String(dados.get("sexo") ?? "indefinido"),
    origem: String(dados.get("origem") ?? "nascimento_proprio"),
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
  const criatorio = await obterCriatorioAtual();
  if (!criatorio) redirect("/comecar");

  const supabase = await criarClienteServidor();

  // Pai e mãe são lidos antes de escrever por dois motivos: conferir o sexo e
  // a idade com mensagem que nomeia a ave, e não deixar o erro cru do trigger
  // chegar à tela.
  const idsProgenitores = [ave.pai_id, ave.mae_id].filter((v): v is string => Boolean(v));
  if (idsProgenitores.length) {
    const { data: progenitores } = await supabase
      .from("passaros")
      .select("id, nome, sexo, dt_nascimento")
      .in("id", idsProgenitores)
      .is("deleted_at", null);

    const porId = new Map(
      ((progenitores ?? []) as Array<{
        id: string;
        nome: string | null;
        sexo: string;
        dt_nascimento: string | null;
      }>).map((p) => [p.id, p]),
    );

    const campos: Record<string, string> = {};

    for (const [papel, id, sexoErrado, rotulo] of [
      ["pai_id", ave.pai_id, "femea", "pai"],
      ["mae_id", ave.mae_id, "macho", "mãe"],
    ] as const) {
      if (!id) continue;
      const p = porId.get(id);
      if (!p) {
        campos[papel] = `A ave escolhida como ${rotulo} não está mais no plantel.`;
        continue;
      }
      if (p.sexo === sexoErrado) {
        campos[papel] = `${p.nome ?? "A ave escolhida"} está registrada como ${
          sexoErrado === "femea" ? "fêmea" : "macho"
        } e não pode ser ${rotulo}.`;
        continue;
      }
      // Um filhote não nasce antes do próprio progenitor. O banco não barra
      // isso, e o erro passa despercebido até a árvore genealógica ficar
      // impossível de ler.
      if (ave.dt_nascimento && p.dt_nascimento && p.dt_nascimento >= ave.dt_nascimento) {
        campos[papel] = `${p.nome ?? "A ave escolhida"} nasceu em ${formatarBR(
          p.dt_nascimento,
        )}, depois do nascimento informado.`;
      }
    }

    if (Object.keys(campos).length) return { campos };
  }

  const { data: criada, error } = await supabase
    .from("passaros")
    .insert({
      criatorio_id: criatorio.id,
      nome: ave.nome ?? null,
      especie_id: ave.especie_id,
      mutacao_id: ave.mutacao_id ?? null,
      sexo: ave.sexo,
      origem: ave.origem,
      dt_nascimento: ave.dt_nascimento ?? null,
      anilha_sigla: ave.anilha_sigla ?? null,
      anilha_criador: ave.anilha_criador ?? null,
      anilha_ano: ave.anilha_ano ?? null,
      anilha_numero: ave.anilha_numero ?? null,
      codigo_alternativo: ave.codigo_alternativo ?? null,
      pai_id: ave.pai_id ?? null,
      mae_id: ave.mae_id ?? null,
      observacoes: ave.observacoes ?? null,
    })
    .select("id")
    .single();

  if (error || !criada) {
    // 23505 = unicidade. São dois índices possíveis, e a mensagem precisa dizer
    // QUAL identificação colidiu — é o erro mais caro do domínio.
    if (error?.code === "23505") {
      if (error.message.includes("passaros_anilha_unica")) {
        const anilha = [
          [ave.anilha_sigla, ave.anilha_criador].filter(Boolean).join(" "),
          String(ave.anilha_ano),
          String(ave.anilha_numero).padStart(4, "0"),
        ]
          .filter(Boolean)
          .join(" · ");
        return { campos: { anilha_numero: `A anilha ${anilha} já existe no plantel.` } };
      }
      if (error.message.includes("codigo_alternativo")) {
        return {
          campos: {
            codigo_alternativo: `O código ${ave.codigo_alternativo} já existe no plantel.`,
          },
        };
      }
    }
    // O trigger de genealogia fala a língua do domínio; repassar é melhor que
    // traduzir de novo.
    if (error?.code === "P0001") return { erro: error.message };

    console.error("cadastrarAve:", error?.message);
    return { erro: "Não foi possível cadastrar a ave. Tente de novo." };
  }

  revalidatePath("/", "layout");
  redirect(`/plantel/${criada.id}?cadastrada=1`);
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatarBR(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}
