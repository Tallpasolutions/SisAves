/**
 * Rótulos da situação da ave.
 *
 * Módulo puro, sem cliente de Supabase: componentes de cliente precisam destes
 * rótulos, e importá-los de `plantel.ts` arrastaria `next/headers` para o
 * bundle do navegador — erro que já aconteceu aqui antes.
 */
export const ROTULO_SITUACAO: Record<
  string,
  { texto: string; tom: "ok" | "neutro" | "critico" }
> = {
  ativo: { texto: "Plantel ativo", tom: "ok" },
  vendido: { texto: "Vendido", tom: "neutro" },
  doado: { texto: "Doado", tom: "neutro" },
  emprestado: { texto: "Emprestado", tom: "neutro" },
  morto: { texto: "Óbito", tom: "critico" },
  perdido: { texto: "Perdido", tom: "critico" },
};

export function descreverSituacao(situacao: string) {
  return ROTULO_SITUACAO[situacao] ?? { texto: situacao, tom: "neutro" as const };
}

/** "Curió · Lutino" — sem separador sobrando quando falta um dos dois. */
export function descreverEspecie(
  especie: string | null,
  mutacao: string | null,
): string {
  return [especie, mutacao].filter(Boolean).join(" · ") || "Espécie não informada";
}

/**
 * As saídas do plantel.
 *
 * São os cinco valores de `situacao_ave` que não são 'ativo'. Cada um pede
 * campos diferentes: venda tem comprador e valor, óbito tem causa e não tem
 * para quem, fuga não tem nenhum dos dois.
 */
export type MotivoSaida = "vendido" | "doado" | "emprestado" | "morto" | "perdido";

export interface Saida {
  valor: MotivoSaida;
  /** O rótulo da escolha: substantivo, como manda o contrato de voz. */
  rotulo: string;
  /**
   * A frase da confirmação, escrita inteira.
   *
   * Compor "<rotulo> registrada" parecia economia e saía errado em dois dos
   * cinco: "Empréstimo registrada", "Óbito registrada".
   */
  confirmacao: string;
  /** Rótulo do campo "para quem". Nulo quando a saída não tem destinatário. */
  destino: string | null;
  /** Rótulo do campo livre — a causa, no óbito; a observação, no resto. */
  motivo: string;
  /** Rótulo do campo de data. */
  data: string;
  /** Só a venda lança receita. */
  aceitaValor: boolean;
  /** Ave que pode voltar ao plantel sem virar aquisição nova. */
  reversivel: boolean;
}

export const SAIDAS: Saida[] = [
  {
    valor: "vendido",
    confirmacao: "Venda registrada",
    rotulo: "Venda",
    destino: "Comprador",
    motivo: "Observação",
    data: "Vendida em",
    aceitaValor: true,
    reversivel: false,
  },
  {
    valor: "doado",
    confirmacao: "Doação registrada",
    rotulo: "Doação",
    destino: "Para quem",
    motivo: "Observação",
    data: "Doada em",
    aceitaValor: false,
    reversivel: false,
  },
  {
    valor: "emprestado",
    confirmacao: "Empréstimo registrado",
    rotulo: "Empréstimo",
    destino: "Com quem fica",
    motivo: "Observação",
    data: "Emprestada em",
    aceitaValor: false,
    reversivel: true,
  },
  {
    valor: "morto",
    confirmacao: "Óbito registrado",
    rotulo: "Óbito",
    destino: null,
    motivo: "Causa",
    data: "Faleceu em",
    aceitaValor: false,
    reversivel: false,
  },
  {
    valor: "perdido",
    confirmacao: "Fuga registrada",
    rotulo: "Fuga",
    destino: null,
    motivo: "Observação",
    data: "Fugiu em",
    aceitaValor: false,
    reversivel: true,
  },
];

export function descreverSaida(valor: string): Saida | null {
  return SAIDAS.find((s) => s.valor === valor) ?? null;
}
