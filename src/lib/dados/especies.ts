import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterCriatorioAtual } from "@/lib/criatorio";

export interface EspecieDoCriatorio {
  id: string;
  nome: string;
  diasOvoscopia: number;
  diasChoco: number;
  diasAnilha: number;
  janelaAnilhaDias: number;
  diasSepara: number;
  anilhaMm: number | null;
  ativa: boolean;
  /** Quantas aves do plantel são desta espécie — decide se ela pode sumir. */
  aves: number;
}

/**
 * As espécies adotadas pelo criatório.
 *
 * A contagem de aves vem junto porque é ela que decide o que a tela oferece:
 * espécie com ave no plantel se desativa, nunca se exclui — apagar deixaria as
 * aves sem espécie e, com isso, sem os prazos que movem o ciclo.
 */
export async function listarEspecies(): Promise<EspecieDoCriatorio[]> {
  const supabase = await criarClienteServidor();

  const [{ data: especies, error }, { data: aves }] = await Promise.all([
    supabase
      .from("especies")
      .select(
        "id, nome, dias_ovoscopia, dias_choco, dias_anilha, janela_anilha_dias, dias_separa, anilha_mm, ativa",
      )
      .is("deleted_at", null)
      .order("nome"),
    supabase.from("passaros").select("especie_id").is("deleted_at", null),
  ]);

  if (error) {
    console.error("listarEspecies:", error.message);
    return [];
  }

  const porEspecie = new Map<string, number>();
  for (const a of (aves ?? []) as Array<{ especie_id: string | null }>) {
    if (!a.especie_id) continue;
    porEspecie.set(a.especie_id, (porEspecie.get(a.especie_id) ?? 0) + 1);
  }

  return ((especies ?? []) as Array<{
    id: string;
    nome: string;
    dias_ovoscopia: number;
    dias_choco: number;
    dias_anilha: number;
    janela_anilha_dias: number;
    dias_separa: number;
    anilha_mm: string | number | null;
    ativa: boolean;
  }>).map((e) => ({
    id: e.id,
    nome: e.nome,
    diasOvoscopia: e.dias_ovoscopia,
    diasChoco: e.dias_choco,
    diasAnilha: e.dias_anilha,
    janelaAnilhaDias: e.janela_anilha_dias,
    diasSepara: e.dias_separa,
    anilhaMm: e.anilha_mm === null ? null : Number(e.anilha_mm),
    ativa: e.ativa,
    aves: porEspecie.get(e.id) ?? 0,
  }));
}

export async function obterEspecie(id: string): Promise<EspecieDoCriatorio | null> {
  const todas = await listarEspecies();
  return todas.find((e) => e.id === id) ?? null;
}

export interface EspecieDoCatalogo {
  id: string;
  nomeComum: string;
  nomeCientifico: string | null;
  diasChoco: number | null;
  grupo: string;
  grupoOrdem: number;
  /** Já adotada: aparece marcada e fora da escolha. */
  adotada: boolean;
}

/**
 * O catálogo, com o que já foi adotado marcado.
 *
 * O criatório já adotado é excluído da escolha em vez de só ficar duplicado:
 * `unique (criatorio_id, nome)` recusaria, e o erro de banco não explica nada
 * a quem só queria conferir se a espécie já estava lá.
 */
export async function listarCatalogo(): Promise<EspecieDoCatalogo[]> {
  const supabase = await criarClienteServidor();

  const [{ data: catalogo, error }, { data: minhas }] = await Promise.all([
    supabase
      .from("especies_catalogo")
      .select("id, nome_comum, nome_cientifico, dias_choco, grupo:grupos(nome, ordem)")
      .order("nome_comum"),
    supabase.from("especies").select("nome, catalogo_id").is("deleted_at", null),
  ]);

  if (error) {
    console.error("listarCatalogo:", error.message);
    return [];
  }

  const adotadas = new Set<string>();
  const nomesAdotados = new Set<string>();
  for (const e of (minhas ?? []) as Array<{ nome: string; catalogo_id: string | null }>) {
    if (e.catalogo_id) adotadas.add(e.catalogo_id);
    nomesAdotados.add(e.nome.toLowerCase());
  }

  return ((catalogo ?? []) as Array<{
    id: string;
    nome_comum: string;
    nome_cientifico: string | null;
    dias_choco: number | null;
    grupo: { nome: string; ordem: number } | { nome: string; ordem: number }[] | null;
  }>).map((c) => {
    const grupo = Array.isArray(c.grupo) ? c.grupo[0] : c.grupo;
    return {
      id: c.id,
      nomeComum: c.nome_comum,
      nomeCientifico: c.nome_cientifico,
      diasChoco: c.dias_choco,
      grupo: grupo?.nome ?? "Outras",
      grupoOrdem: grupo?.ordem ?? 999,
      adotada: adotadas.has(c.id) || nomesAdotados.has(c.nome_comum.toLowerCase()),
    };
  });
}

/** Usado pelo cabeçalho das telas de configuração. */
export async function nomeDoCriatorio(): Promise<string> {
  const criatorio = await obterCriatorioAtual();
  return criatorio?.nome ?? "Criatório";
}
