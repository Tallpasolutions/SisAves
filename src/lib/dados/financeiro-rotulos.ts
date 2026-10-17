/**
 * Rótulos e aritmética de mês do financeiro — módulo puro.
 *
 * Mora longe de `dados/financeiro.ts` porque o formulário de lançamento é
 * componente de cliente: importar daquele arquivo arrastaria `next/headers`
 * para o pacote do navegador. É a mesma separação de `estados-do-ovo.ts` e
 * `contextos-de-pesagem.ts`.
 */

export const MESES_CURTOS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
] as const;

const MESES_LONGOS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
] as const;

/**
 * O mês é identificado pelo primeiro dia, em ISO: "2026-10-01".
 *
 * Nunca por `Date`: `new Date(ano, mes, 1).toISOString()` devolve o mês
 * anterior no Brasil, porque meia-noite local é 21h do dia anterior em UTC.
 * A string é montada dos campos, sem passar por UTC nenhuma vez.
 */
export function mesISO(ano: number, mes: number): string {
  // Mês fora de 0–11 rola o ano: é o que faz "mês anterior a janeiro" ser
  // dezembro do ano passado sem nenhuma conta na tela.
  const ajustado = new Date(ano, mes, 1);
  const a = ajustado.getFullYear();
  const m = String(ajustado.getMonth() + 1).padStart(2, "0");
  return `${a}-${m}-01`;
}

export function partesDoMes(iso: string): { ano: number; mes: number } {
  const ano = Number(iso.slice(0, 4));
  const mes = Number(iso.slice(5, 7)) - 1;
  return { ano, mes };
}

export function deslocarMes(iso: string, passos: number): string {
  const { ano, mes } = partesDoMes(iso);
  return mesISO(ano, mes + passos);
}

/** "Outubro de 2026" — o cabeçalho da tela. */
export function rotuloDoMes(iso: string): string {
  const { ano, mes } = partesDoMes(iso);
  return `${MESES_LONGOS[mes]} de ${ano}`;
}

/**
 * "Setembro", ou "Janeiro de 2027" quando o ano muda.
 *
 * É o rótulo dos vizinhos na navegação de mês: "Setembro de 2026" ao lado de
 * "Novembro de 2026" quebra em duas linhas num telefone de 375px, e o ano
 * repetido três vezes na mesma barra não informa nada. Quando o ano é outro,
 * ele volta — é justamente aí que ele importa.
 */
export function rotuloVizinho(iso: string, referencia: string): string {
  const { ano, mes } = partesDoMes(iso);
  return ano === partesDoMes(referencia).ano
    ? MESES_LONGOS[mes]
    : `${MESES_LONGOS[mes]} de ${ano}`;
}

/** "out" — o rótulo embaixo da barra. */
export function rotuloCurto(iso: string): string {
  return MESES_CURTOS[partesDoMes(iso).mes];
}

/** `true` quando o ISO não é um primeiro-dia-de-mês válido. */
export function mesInvalido(iso: string): boolean {
  if (!/^\d{4}-\d{2}-01$/.test(iso)) return true;
  const mes = Number(iso.slice(5, 7));
  return mes < 1 || mes > 12;
}

/**
 * O ícone da categoria vem do banco como nome de glifo Lucide ("Bird",
 * "Wallet"). A lista é fechada: ícone é vocabulário, e o léxico está no
 * `CLAUDE.md`. Nome desconhecido cai em `Wallet`, nunca em caixa vazia.
 */
export const ICONES_CATEGORIA = ["Bird", "Wallet", "Syringe", "Award", "Egg"] as const;

export type IconeCategoria = (typeof ICONES_CATEGORIA)[number];

export function iconeDaCategoria(nome: string | null): IconeCategoria {
  return ICONES_CATEGORIA.includes(nome as IconeCategoria)
    ? (nome as IconeCategoria)
    : "Wallet";
}

export const TIPOS_LANCAMENTO = [
  { valor: "receita", rotulo: "Receita" },
  { valor: "despesa", rotulo: "Despesa" },
] as const;

export type TipoLancamento = "receita" | "despesa";
