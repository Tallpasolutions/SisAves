/**
 * Contextos de pesagem e seus rótulos.
 *
 * Módulo puro, sem cliente de Supabase — o quarto criado pelo mesmo motivo
 * (`situacao.ts`, `marcos.ts`, `estados-do-ovo.ts`). O formulário é componente
 * de cliente, e importar a constante do módulo de leitura arrasta
 * `next/headers` para o pacote do navegador. A regra geral: rótulo e constante
 * de domínio NUNCA moram no módulo que lê o banco.
 *
 * Lista fechada em vez de texto livre: "desmame", "desmamado" e "pós-desmame"
 * digitados ao longo de um ano viram três séries do mesmo evento, e a curva de
 * crescimento deixa de ser comparável entre ninhadas.
 *
 * `anilhamento` não aparece no formulário — quem o grava é `anilhar_filhotes`,
 * no momento em que o anel entra.
 */
export const CONTEXTOS_PESAGEM = [
  { valor: "rotina", rotulo: "Rotina" },
  { valor: "desmame", rotulo: "Desmame" },
  { valor: "pre_exposicao", rotulo: "Pré-exposição" },
  { valor: "pos_exposicao", rotulo: "Pós-exposição" },
  { valor: "tratamento", rotulo: "Tratamento" },
] as const;

export const ROTULO_CONTEXTO: Record<string, string> = {
  anilhamento: "Anilhamento",
  ...Object.fromEntries(CONTEXTOS_PESAGEM.map((c) => [c.valor, c.rotulo])),
};
