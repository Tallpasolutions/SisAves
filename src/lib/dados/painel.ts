import { criarClienteServidor } from "@/lib/supabase/servidor";

export interface IndicadorPainel {
  rotulo: string;
  valor: number;
  /** A linha de baixo: "26 saíram · 128 cadastradas". */
  ajuda: string;
}

export interface MesDeNascimentos {
  /** "jan" */
  rotulo: string;
  mes: number;
  nascimentos: number;
  /** Mês que ainda não chegou: barra em cinza, sem número. */
  futuro: boolean;
  /** O mês corrente, destacado em petróleo cheio. */
  atual: boolean;
}

export type TipoMovimentacao =
  | "postura"
  | "ovoscopia"
  | "eclosao"
  | "separacao"
  | "anilhamento"
  | "perda"
  | "infertil"
  | "pesagem"
  | "certificado"
  | "venda"
  | "doacao"
  | "emprestimo"
  | "obito"
  | "fuga";

export interface Movimentacao {
  chave: string;
  data: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  casalId: string | null;
  casalNumero: number | null;
  passaroId: string | null;
  anilha: {
    sigla: string | null;
    criador: string | null;
    ano: number | null;
    numero: number | null;
  };
}

export interface ResumoTemporada {
  ano: number;
  filhotes: number;
  /** Percentual de ovos postos que eclodiram, no ano. */
  eclosaoMedia: number | null;
  endogamiaMedia: number | null;
}

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export async function obterIndicadoresPainel(): Promise<IndicadorPainel[]> {
  const supabase = await criarClienteServidor();
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = agora.getMonth();

  const inicioDoMes = new Date(ano, mes, 1).toISOString().slice(0, 10);
  const inicioDoMesAnterior = new Date(ano, mes - 1, 1).toISOString().slice(0, 10);

  const [
    { count: ativas },
    { count: fora },
    { count: casaisAtivos },
    { data: posturasAtivas },
    { count: nascimentosNoMes },
    { count: nascimentosNoMesAnterior },
  ] = await Promise.all([
    supabase
      .from("passaros")
      .select("id", { count: "exact", head: true })
      .eq("situacao", "ativo")
      .is("deleted_at", null),
    supabase
      .from("passaros")
      .select("id", { count: "exact", head: true })
      .neq("situacao", "ativo")
      .is("deleted_at", null),
    supabase
      .from("casais")
      .select("id", { count: "exact", head: true })
      // Ativo é "ainda não encerrado" — a mesma definição da lista e da ficha.
      .is("vigencia_fim", null)
      .is("deleted_at", null),
    // Em choco: o ovo e a ninhada dele, para dizer "23 ovos em 6 ninhadas".
    supabase.from("vw_posturas").select("ninhada_id, casal_id, situacao"),
    supabase
      .from("posturas")
      .select("id", { count: "exact", head: true })
      .gte("data_eclosao", inicioDoMes)
      .is("deleted_at", null),
    supabase
      .from("posturas")
      .select("id", { count: "exact", head: true })
      .gte("data_eclosao", inicioDoMesAnterior)
      .lt("data_eclosao", inicioDoMes)
      .is("deleted_at", null),
  ]);

  const linhas = (posturasAtivas ?? []) as Array<{
    ninhada_id: string | null;
    casal_id: string;
    situacao: string;
  }>;

  const emChoco = linhas.filter((l) => l.situacao === "chocando");
  const ninhadasEmChoco = new Set(emChoco.map((l) => l.ninhada_id)).size;

  // "com ninhada em curso" é o casal que tem ovo fora dos estados terminais.
  const terminais = ["separado", "infertil", "perdido"];
  const casaisComNinhada = new Set(
    linhas.filter((l) => !terminais.includes(l.situacao)).map((l) => l.casal_id),
  ).size;

  const noMes = nascimentosNoMes ?? 0;
  const noAnterior = nascimentosNoMesAnterior ?? 0;
  const diferenca = noMes - noAnterior;
  const mesAnterior = MESES[(mes + 11) % 12];

  return [
    {
      rotulo: "Aves no plantel",
      // Conta só quem está no galpão. Somar as que saíram dava um número certo
      // enquanto nenhuma ave saía; com a saída registrável, passaria a chamar
      // de "no plantel" a ave que foi vendida mês passado.
      valor: ativas ?? 0,
      ajuda:
        (fora ?? 0) === 0
          ? "nenhuma saiu do plantel"
          : `${fora} ${fora === 1 ? "saiu" : "saíram"} · ${(ativas ?? 0) + (fora ?? 0)} cadastradas`,
    },
    {
      rotulo: "Casais ativos",
      valor: casaisAtivos ?? 0,
      ajuda:
        casaisComNinhada === 0
          ? "nenhum com ninhada em curso"
          : `${casaisComNinhada} com ninhada em curso`,
    },
    {
      rotulo: "Ovos em choco",
      valor: emChoco.length,
      ajuda:
        ninhadasEmChoco === 0
          ? "nenhuma ninhada chocando"
          : `em ${ninhadasEmChoco} ${ninhadasEmChoco === 1 ? "ninhada" : "ninhadas"}`,
    },
    {
      rotulo: "Nascimentos no mês",
      valor: noMes,
      // A comparação nomeia o período: uma seta sozinha obrigaria a adivinhar.
      ajuda:
        diferenca === 0
          ? `igual a ${mesAnterior}`
          : `${diferenca > 0 ? "+" : "−"}${Math.abs(diferenca)} vs. ${mesAnterior}`,
    },
  ];
}

export async function obterNascimentosPorMes(): Promise<MesDeNascimentos[]> {
  const supabase = await criarClienteServidor();
  const agora = new Date();
  const ano = agora.getFullYear();

  const { data } = await supabase
    .from("posturas")
    .select("data_eclosao")
    .gte("data_eclosao", `${ano}-01-01`)
    .lte("data_eclosao", `${ano}-12-31`)
    .is("deleted_at", null);

  const porMes = new Array(12).fill(0);
  for (const linha of (data ?? []) as Array<{ data_eclosao: string }>) {
    // Fatiar a string em vez de `new Date(iso)`: a data vem em UTC e no Brasil
    // voltaria um dia, jogando o nascimento de 1º de março para fevereiro.
    const mes = Number(linha.data_eclosao.slice(5, 7)) - 1;
    if (mes >= 0 && mes < 12) porMes[mes] += 1;
  }

  return MESES.map((rotulo, mes) => ({
    rotulo,
    mes,
    nascimentos: porMes[mes],
    futuro: mes > agora.getMonth(),
    atual: mes === agora.getMonth(),
  }));
}

export async function obterResumoTemporada(): Promise<ResumoTemporada> {
  const supabase = await criarClienteServidor();
  const ano = new Date().getFullYear();

  const [{ data: posturasDoAno }, { data: casais }] = await Promise.all([
    supabase
      .from("posturas")
      .select("data_eclosao, desfecho")
      .gte("data_postura", `${ano}-01-01`)
      .lte("data_postura", `${ano}-12-31`)
      .is("deleted_at", null),
    supabase
      .from("casais")
      .select("endogamia_pct")
      .is("vigencia_fim", null)
      .is("deleted_at", null)
      .not("endogamia_pct", "is", null),
  ]);

  const postos = (posturasDoAno ?? []) as Array<{
    data_eclosao: string | null;
    desfecho: string | null;
  }>;

  const eclodidos = postos.filter((p) => p.data_eclosao).length;

  /*
   * A média de eclosão só conta ovo com DESFECHO: eclodiu, deu claro ou se
   * perdeu. Ovo ainda chocando não é fracasso — é ovo chocando. Contá-lo no
   * denominador fazia a taxa despencar sempre que uma ninhada nova entrava, e
   * o número que deveria medir a qualidade do plantel passava a medir o
   * calendário.
   */
  const decididos = postos.filter((p) => p.data_eclosao || p.desfecho).length;

  const percentuais = ((casais ?? []) as Array<{ endogamia_pct: number }>).map((c) =>
    Number(c.endogamia_pct),
  );

  return {
    ano,
    filhotes: eclodidos,
    // Sem ovo decidido no ano não há média: 0% diria que tudo falhou.
    eclosaoMedia: decididos > 0 ? (eclodidos / decididos) * 100 : null,
    endogamiaMedia:
      percentuais.length > 0
        ? percentuais.reduce((s, v) => s + v, 0) / percentuais.length
        : null,
  };
}

export async function listarMovimentacoes(limite = 8): Promise<Movimentacao[]> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase
    .from("vw_movimentacoes")
    .select(
      "data, tipo, quantidade, casal_id, casal_numero, ninhada_id, passaro_id, anilha_sigla, anilha_criador, anilha_ano, anilha_numero",
    )
    .order("data", { ascending: false })
    .limit(limite);

  if (error) {
    console.error("listarMovimentacoes:", error.message);
    return [];
  }

  return ((data ?? []) as Array<{
    data: string;
    tipo: TipoMovimentacao;
    quantidade: number;
    casal_id: string | null;
    casal_numero: number | null;
    ninhada_id: string | null;
    passaro_id: string | null;
    anilha_sigla: string | null;
    anilha_criador: string | null;
    anilha_ano: number | null;
    anilha_numero: number | null;
  }>).map((m, indice) => ({
    // A view não tem chave própria: o evento é derivado, não uma linha.
    chave: `${m.tipo}:${m.data}:${m.ninhada_id ?? m.passaro_id ?? indice}:${indice}`,
    data: m.data.slice(0, 10),
    tipo: m.tipo,
    quantidade: m.quantidade,
    casalId: m.casal_id,
    casalNumero: m.casal_numero,
    passaroId: m.passaro_id,
    anilha: {
      sigla: m.anilha_sigla,
      criador: m.anilha_criador,
      ano: m.anilha_ano,
      numero: m.anilha_numero,
    },
  }));
}

/** "Postura registrada · 5 ovos" — fato e quantidade, sem adjetivo. */
export function descreverMovimentacao(m: Movimentacao): string {
  const n = m.quantidade;
  switch (m.tipo) {
    case "postura":
      return `Postura registrada · ${n} ${n === 1 ? "ovo" : "ovos"}`;
    case "ovoscopia":
      return `Ovoscopia · ${n} ${n === 1 ? "ovo fértil" : "ovos férteis"}`;
    case "eclosao":
      return `Eclosão · ${n} ${n === 1 ? "filhote" : "filhotes"}`;
    case "anilhamento":
      return "Anilhamento";
    case "separacao":
      return `Separação · ${n} ${n === 1 ? "filhote" : "filhotes"}`;
    case "perda":
      return `Perda registrada · ${n} ${n === 1 ? "ovo" : "ovos"}`;
    case "infertil":
      return `Ovo claro · ${n} ${n === 1 ? "ovo" : "ovos"}`;
    case "pesagem":
      return `Pesagem · ${n} g`;
    case "certificado":
      return "CRO emitido";
    case "venda":
      return "Venda registrada";
    case "doacao":
      return "Doação registrada";
    case "emprestimo":
      return "Empréstimo registrado";
    case "obito":
      return "Óbito registrado";
    case "fuga":
      return "Fuga registrada";
  }
}

/** A faixa de 3px à esquerda da linha — um dos dois lugares permitidos. */
export const GRAVIDADE_MOVIMENTACAO: Record<
  TipoMovimentacao,
  "neutro" | "atencao" | "critico" | "ok"
> = {
  postura: "neutro",
  ovoscopia: "neutro",
  eclosao: "ok",
  separacao: "ok",
  anilhamento: "ok",
  perda: "critico",
  infertil: "critico",
  pesagem: "neutro",
  certificado: "ok",
  venda: "ok",
  doacao: "neutro",
  emprestimo: "neutro",
  obito: "critico",
  fuga: "critico",
};

export const ROTULO_MOVIMENTACAO: Record<TipoMovimentacao, string> = {
  postura: "Chocando",
  ovoscopia: "Fértil",
  eclosao: "Nascido",
  separacao: "Separado",
  anilhamento: "Anilhado",
  perda: "Perda",
  infertil: "Infértil",
  pesagem: "Pesado",
  certificado: "Emitido",
  venda: "Vendido",
  doacao: "Doado",
  emprestimo: "Emprestado",
  obito: "Óbito",
  fuga: "Fuga",
};
