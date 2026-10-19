/**
 * O erro que a RLS devolve quando a assinatura venceu.
 *
 * O bloqueio suave mora no banco, não na aplicação — é a fronteira certa, mas
 * ela fala em `42501: new row violates row-level security policy`. Sem traduzir,
 * o criador recebia "Não foi possível cadastrar a ave. Tente de novo.", e
 * "tente de novo" é mentira: tentar de novo nunca vai funcionar. O contrato de
 * voz manda citar o dado e dizer o que fazer.
 */

/** Forma mínima do erro do PostgREST/Supabase. */
interface ErroDeBanco {
  code?: string | null;
  message?: string | null;
}

/**
 * Se o que barrou a escrita foi a assinatura vencida.
 *
 * `42501` é `insufficient_privilege`, que é como a política de RLS recusa.
 * A checagem da mensagem é cinto e suspensório: o PostgREST nem sempre
 * repassa o `code` em todos os caminhos.
 */
export function barradoPelaAssinatura(erro: ErroDeBanco | null | undefined): boolean {
  if (!erro) return false;
  if (erro.code === "42501") return true;
  return /row-level security|violates row-level/i.test(erro.message ?? "");
}

/**
 * O que o criador lê.
 *
 * Diz o que parou, o que NÃO parou — que é a parte que tira o medo — e para
 * onde ir. Sem dramatizar: vencer assinatura é evento administrativo, não
 * perda.
 */
export const ERRO_ASSINATURA =
  "A assinatura do criatório venceu, então o registro de dados novos está " +
  "pausado. O plantel, a genealogia e os certificados continuam aqui para " +
  "consultar e imprimir. Abra Assinatura para reativar.";
