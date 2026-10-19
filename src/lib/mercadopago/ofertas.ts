/**
 * O catálogo de ofertas — do SERVIDOR, e só dele.
 *
 * O navegador manda apenas a chave da oferta. Preço, prazo e meio de pagamento
 * são resolvidos aqui: aceitar `unit_price` do formulário é vender o SisAves
 * por um centavo a quem souber abrir o inspetor.
 *
 * Modelo comercial espelhado do sistema atual: R$ 290 por ano, R$ 270 no PIX.
 */

/**
 * Os `id` de tipo de pagamento que o Mercado Pago aceita em
 * `payment_methods.excluded_payment_types`.
 *
 * O SDK tipa o campo como `{ id?: string }` — ou seja, a FORMA está verificada
 * (`clients/preference/commonTypes.d.ts`), mas os valores possíveis não vêm
 * tipados. `bank_transfer` é o tipo do PIX no Brasil.
 *
 * **Para conferir contra a conta de verdade**, com as credenciais no lugar:
 *
 *     node scripts/mercadopago-meios.mjs
 *
 * Ele lista `id` e `payment_type_id` de cada meio habilitado na sua conta. Se
 * algum nome aqui divergir do que a conta devolve, o nome da conta manda.
 */
/**
 * Para a oferta de PIX.
 *
 * Note o que NÃO dá para excluir: `account_money`. A API recusa a preferência
 * se ele aparecer aqui, então quem tiver saldo no Mercado Pago consegue pagar
 * a oferta de R$ 270 com saldo. São R$ 20 de desconto para quem usa carteira —
 * limite da plataforma, não escolha nossa.
 */
const TIPOS_SEM_PIX = [
  { id: "credit_card" },
  { id: "debit_card" },
  { id: "prepaid_card" },
  { id: "ticket" },
  { id: "atm" },
] as const;

/**
 * Para a oferta de cartão. **`account_money` não entra**: a API responde
 * `400 account_money cannot be excluded` e recusa a preferência inteira —
 * descoberto ao primeiro checkout de teste, em 19/10/2026. O saldo do Mercado
 * Pago é sempre aceito, em qualquer preferência, e não há como desligar.
 */
const TIPOS_SO_CARTAO = [
  { id: "bank_transfer" },
  { id: "ticket" },
  { id: "atm" },
] as const;

export interface Oferta {
  readonly chave: string;
  readonly titulo: string;
  readonly rotulo: string;
  readonly valor: number;
  readonly meses: number;
  /**
   * Os tipos que o comprador NÃO vê no checkout.
   *
   * É o que sustenta o desconto: no Checkout Pro o meio é escolhido na página
   * do Mercado Pago, DEPOIS de o preço estar fixado na preferência. Sem
   * restringir, a preferência de R$ 270 aceitaria cartão — e o desconto do PIX
   * viraria desconto para todo mundo.
   */
  readonly excluir: readonly { readonly id: string }[];
}

/**
 * Se o PIX está habilitado na conta do Mercado Pago.
 *
 * **Falha fechada, e por um motivo concreto:** em 19/10/2026 a conta da Tallpa
 * não tinha PIX — `/v1/payment_methods` devolvia cartão, pré-pago, saldo,
 * débito e boleto, e nenhum `bank_transfer`. Com a oferta de R$ 270 no ar
 * assim, a preferência excluiria TODOS os meios disponíveis e o criador
 * chegaria a um checkout sem forma de pagar, depois de escolher o preço com
 * desconto. Pior que não oferecer.
 *
 * Habilitar é na CONTA do Mercado Pago (cadastrar a chave PIX), não no painel
 * de desenvolvedor. Depois, confira com:
 *
 *     node scripts/mercadopago-meios.mjs
 *
 * e ligue `MP_PIX_ATIVO=on` quando `bank_transfer` aparecer.
 */
export const PIX_ATIVO = process.env.MP_PIX_ATIVO === "on";

const CATALOGO: Record<string, Oferta> = {
  "anual-pix": {
    chave: "anual-pix",
    titulo: "SisAves · assinatura anual",
    rotulo: "PIX",
    valor: 270.0,
    meses: 12,
    excluir: TIPOS_SEM_PIX,
  },
  "anual-cartao": {
    chave: "anual-cartao",
    titulo: "SisAves · assinatura anual",
    rotulo: "cartão",
    valor: 290.0,
    meses: 12,
    excluir: TIPOS_SO_CARTAO,
  },
};

/** As ofertas que a conta consegue de fato cobrar. */
export const OFERTAS: Record<string, Oferta> = PIX_ATIVO
  ? CATALOGO
  : { "anual-cartao": CATALOGO["anual-cartao"] };

export function oferta(chave: unknown): Oferta | null {
  return typeof chave === "string" ? (OFERTAS[chave] ?? null) : null;
}
