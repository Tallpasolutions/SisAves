import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterCriatorioAtual } from "@/lib/criatorio";
import type { Sexo } from "@/components/ui";

export interface OpcaoEspecie {
  id: string;
  nome: string;
}

export interface OpcaoMutacao {
  id: string;
  nome: string;
  /** Mutação de catálogo (do grupo) não tem espécie: vale para todas. */
  especieId: string | null;
}

export interface OpcaoProgenitor {
  id: string;
  nome: string | null;
  sexo: Sexo;
  especieId: string | null;
  especie: string | null;
  anilha: {
    sigla: string | null;
    criador: string | null;
    ano: number | null;
    numero: number | null;
  };
}

/**
 * Valores que o criatório já conhece sobre a própria anilha.
 *
 * `sugestao` é o próximo sequencial livre do ano corrente — **oferecido como
 * botão**, nunca preenchido em silêncio. A regra está no spec (`05-telas.md`,
 * B9) e existe por um motivo prático: a anilha é física, está na perna da ave,
 * e o sistema não tem como saber qual anel o criador pegou da cartela.
 */
export interface SugestaoAnilha {
  sigla: string | null;
  criador: string | null;
  ano: number;
  sugestao: number | null;
}

export interface OpcoesCadastroAve {
  especies: OpcaoEspecie[];
  mutacoes: OpcaoMutacao[];
  machos: OpcaoProgenitor[];
  femeas: OpcaoProgenitor[];
  anilha: SugestaoAnilha;
}

const CAMPOS_PROGENITOR =
  "id, nome, sexo, especie_id, anilha_sigla, anilha_criador, anilha_ano, anilha_numero, especie:especies(nome)";

export async function opcoesCadastroAve(): Promise<OpcoesCadastroAve> {
  const supabase = await criarClienteServidor();
  const criatorio = await obterCriatorioAtual();
  const ano = new Date().getFullYear();

  const [
    { data: especies },
    { data: mutacoes },
    { data: progenitores },
    { data: ultimaAnilha },
  ] = await Promise.all([
    supabase
      .from("especies")
      .select("id, nome")
      .eq("ativa", true)
      .is("deleted_at", null)
      .order("nome"),
    supabase
      .from("mutacoes")
      .select("id, nome, especie_id")
      .is("deleted_at", null)
      .order("nome"),
    // Só ave viva e no plantel pode entrar como pai ou mãe de um cadastro novo.
    // Ave vendida ou morta continua na genealogia das que já existem — mas
    // oferecê-la aqui seria convidar ao erro.
    supabase
      .from("passaros")
      .select(CAMPOS_PROGENITOR)
      .is("deleted_at", null)
      .eq("situacao", "ativo")
      .in("sexo", ["macho", "femea"])
      .order("anilha_numero", { ascending: true, nullsFirst: false }),
    supabase
      .from("passaros")
      .select("anilha_numero")
      .is("deleted_at", null)
      .eq("anilha_ano", ano)
      .not("anilha_numero", "is", null)
      .order("anilha_numero", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const lista = ((progenitores ?? []) as Array<{
    id: string;
    nome: string | null;
    sexo: Sexo;
    especie_id: string | null;
    especie: { nome: string } | { nome: string }[] | null;
    anilha_sigla: string | null;
    anilha_criador: string | null;
    anilha_ano: number | null;
    anilha_numero: number | null;
  }>).map((p) => ({
    id: p.id,
    nome: p.nome,
    sexo: p.sexo,
    especieId: p.especie_id,
    especie: (Array.isArray(p.especie) ? p.especie[0] : p.especie)?.nome ?? null,
    anilha: {
      sigla: p.anilha_sigla,
      criador: p.anilha_criador,
      ano: p.anilha_ano,
      numero: p.anilha_numero,
    },
  }));

  return {
    especies: (especies ?? []) as OpcaoEspecie[],
    mutacoes: ((mutacoes ?? []) as Array<{ id: string; nome: string; especie_id: string | null }>).map(
      (m) => ({ id: m.id, nome: m.nome, especieId: m.especie_id }),
    ),
    machos: lista.filter((p) => p.sexo === "macho"),
    femeas: lista.filter((p) => p.sexo === "femea"),
    anilha: {
      sigla: criatorio?.clube?.sigla ?? null,
      criador: criatorio?.nro_criador ?? null,
      ano,
      sugestao: ultimaAnilha?.anilha_numero ? Number(ultimaAnilha.anilha_numero) + 1 : null,
    },
  };
}

export interface OpcoesFormarCasal {
  machos: OpcaoProgenitor[];
  femeas: OpcaoProgenitor[];
  /** Numeração do casal é sequencial dentro do criatório. */
  proximoNumero: number;
}

export async function opcoesFormarCasal(): Promise<OpcoesFormarCasal> {
  const supabase = await criarClienteServidor();

  const [{ data: aves }, { data: ultimo }] = await Promise.all([
    supabase
      .from("passaros")
      .select(CAMPOS_PROGENITOR)
      .is("deleted_at", null)
      .eq("situacao", "ativo")
      .in("sexo", ["macho", "femea"])
      .order("anilha_numero", { ascending: true, nullsFirst: false }),
    supabase
      .from("casais")
      .select("numero")
      .is("deleted_at", null)
      .order("numero", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const lista = ((aves ?? []) as Array<{
    id: string;
    nome: string | null;
    sexo: Sexo;
    especie_id: string | null;
    especie: { nome: string } | { nome: string }[] | null;
    anilha_sigla: string | null;
    anilha_criador: string | null;
    anilha_ano: number | null;
    anilha_numero: number | null;
  }>).map((p) => ({
    id: p.id,
    nome: p.nome,
    sexo: p.sexo,
    especieId: p.especie_id,
    especie: (Array.isArray(p.especie) ? p.especie[0] : p.especie)?.nome ?? null,
    anilha: {
      sigla: p.anilha_sigla,
      criador: p.anilha_criador,
      ano: p.anilha_ano,
      numero: p.anilha_numero,
    },
  }));

  return {
    machos: lista.filter((p) => p.sexo === "macho"),
    femeas: lista.filter((p) => p.sexo === "femea"),
    proximoNumero: (ultimo?.numero ?? 0) + 1,
  };
}
