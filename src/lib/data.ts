/**
 * O "hoje" do criatório.
 *
 * `new Date().toISOString()` devolve UTC, e o produto é brasileiro: das 21h à
 * meia-noite de Brasília o UTC já está no dia seguinte. Era o bastante para a
 * tela oferecer amanhã como data padrão, e para a validação de "não pode ser
 * no futuro" aceitar — justamente na janela em que o criador trabalha, porque
 * eclosão acontece de madrugada.
 *
 * No navegador vale o relógio do aparelho, que é o do galpão. No servidor, que
 * roda em UTC, vale o fuso de São Paulo — fixo e explícito, porque é onde o
 * criatório está.
 */
export const FUSO_CRIATORIO = "America/Sao_Paulo";

/**
 * `aaaa-mm-dd` dos campos de ano, mês e dia LOCAIS de uma data.
 *
 * `toISOString()` converte para UTC antes de formatar: `new Date(2026, 9, 1)`
 * é 1º de outubro à meia-noite em Brasília, que em UTC é 30 de setembro às
 * 21h — e a string sai com o mês errado. Isso valia para todo limite de mês
 * calculado no produto.
 */
export function paraISO(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

/** Data local do aparelho em `aaaa-mm-dd`. Para componentes de cliente. */
export function hojeNoAparelho(): string {
  return paraISO(new Date());
}

/**
 * Data de hoje no fuso do criatório, em `aaaa-mm-dd`.
 *
 * `en-CA` é o truque: é o único locale comum cujo formato curto já é
 * ISO (aaaa-mm-dd), o que evita montar a string a partir das partes.
 */
export function hojeNoCriatorio(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_CRIATORIO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
