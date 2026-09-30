/**
 * Formatação pt-BR do SisAves.
 *
 * Regras do contrato (docs/design/03-conteudo-e-copy.md):
 * datas dd/mm/aaaa · decimais com vírgula · moeda R$ 1.240,00 ·
 * coeficiente de endogamia SEMPRE com duas decimais ·
 * peso e valor financeiro NUNCA arredondados na exibição.
 */

const LOCALE = "pt-BR";

/** Ponto médio com espaços, para encadear fatos de mesmo nível. Nunca | - /. */
export const SEPARADOR = " · ";

/** "Postura registrada · Ninhada 04 · 5 ovos" */
export function encadear(...partes: Array<string | null | undefined>): string {
  return partes.filter(Boolean).join(SEPARADOR);
}

/** 09/03/2026 */
export function formatarData(valor: Date | string | null | undefined): string {
  if (!valor) return "—";
  const d = typeof valor === "string" ? parseDataISO(valor) : valor;
  if (!d || Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(LOCALE, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

/** 09/03 — para chips e listas onde o ano é redundante. */
export function formatarDataCurta(valor: Date | string | null | undefined): string {
  if (!valor) return "—";
  const d = typeof valor === "string" ? parseDataISO(valor) : valor;
  if (!d || Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(LOCALE, { day: "2-digit", month: "2-digit" }).format(d);
}

/**
 * Interpreta "2026-03-09" como data local, não UTC.
 * `new Date("2026-03-09")` cai à meia-noite UTC e, no fuso do Brasil, volta um
 * dia — o ovo apareceria posto em 08/03. Datas do banco são `date`, sem hora.
 */
function parseDataISO(valor: string): Date | null {
  const m = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** R$ 1.240,00 — sem arredondar. */
export function formatarMoeda(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  const n = typeof valor === "string" ? Number(valor) : valor;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/**
 * 3,13% — o coeficiente de endogamia sai sempre com duas decimais, mesmo
 * quando é zero, porque a interface compara valores lado a lado.
 */
export function formatarPercentual(
  valor: number | string | null | undefined,
  decimais = 2,
): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  const n = typeof valor === "string" ? Number(valor) : valor;
  if (Number.isNaN(n)) return "—";
  return (
    new Intl.NumberFormat(LOCALE, {
      minimumFractionDigits: decimais,
      maximumFractionDigits: decimais,
    }).format(n) + "%"
  );
}

/** 18,4 g — uma decimal, sem arredondar para cima. */
export function formatarPeso(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  const n = typeof valor === "string" ? Number(valor) : valor;
  if (Number.isNaN(n)) return "—";
  return (
    new Intl.NumberFormat(LOCALE, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(n) + " g"
  );
}

/** 1.284 */
export function formatarNumero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—";
  return new Intl.NumberFormat(LOCALE).format(valor);
}

/**
 * Idade em linguagem de criatório: dias até completar um mês, depois meses,
 * depois anos. O criador pensa em dias no ninho e em anos na matriz.
 */
export function formatarIdade(nascimento: Date | string | null | undefined): string {
  if (!nascimento) return "—";
  const d = typeof nascimento === "string" ? parseDataISO(nascimento) : nascimento;
  if (!d || Number.isNaN(d.getTime())) return "—";

  const hoje = new Date();
  const dias = Math.floor((hoje.getTime() - d.getTime()) / 86_400_000);

  if (dias < 0) return "—";
  if (dias < 31) return `${dias} ${dias === 1 ? "dia" : "dias"}`;

  const meses =
    (hoje.getFullYear() - d.getFullYear()) * 12 + (hoje.getMonth() - d.getMonth());
  if (meses < 24) return `${meses} ${meses === 1 ? "mês" : "meses"}`;

  const anos = Math.floor(meses / 12);
  return `${anos} anos`;
}

/** Anilha: "SOV 1234 · 2026 · 0087". Nunca reformatar nem abreviar. */
export function formatarAnilha(anilha: {
  sigla?: string | null;
  criador?: string | null;
  ano?: number | null;
  numero?: number | null;
}): string | null {
  const { sigla, criador, ano, numero } = anilha;
  if (!ano || !numero) return null;
  const cabeca = [sigla, criador].filter(Boolean).join(" ");
  const sequencial = String(numero).padStart(4, "0");
  return encadear(cabeca || null, String(ano), sequencial);
}
