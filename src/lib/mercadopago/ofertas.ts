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
const TIPOS_SEM_PIX = [
  { id: "credit_card" },
  { id: "debit_card" },
  { id: "prepaid_card" },
  { id: "ticket" },
  { id: "atm" },
] as const;

const TIPOS_SO_CARTAO = [
  { id: "bank_transfer" },
  { id: "ticket" },
  { id: "atm" },
  { id: "account_money" },
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

export const OFERTAS: Record<string, Oferta> = {
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

export function oferta(chave: unknown): Oferta | null {
  return typeof chave === "string" ? (OFERTAS[chave] ?? null) : null;
}
