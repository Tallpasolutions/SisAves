/**
 * Etiquetas de casal.
 *
 * Módulo puro, sem cliente de Supabase — o formulário do casal é componente de
 * cliente. A regra, já repetida: rótulo e constante de domínio nunca moram no
 * módulo que lê o banco.
 *
 * A COR vem de uma lista fechada, e não de um seletor livre. A paleta do
 * produto é fechada por contrato, e um seletor de cor em tela de criação é o
 * caminho mais curto para um criatório com etiquetas em rosa e verde-limão.
 * As quatro são as da paleta oficial, mais o tijolo de gravidade.
 */
export const CORES_ETIQUETA = [
  { valor: "#0B5D5E", rotulo: "Petróleo", classe: "petroleo" },
  { valor: "#163A45", rotulo: "Azul profundo", classe: "azul" },
  { valor: "#F2B544", rotulo: "Âmbar", classe: "ambar" },
  { valor: "#A8352A", rotulo: "Tijolo", classe: "tijolo" },
] as const;

export const COR_PADRAO = CORES_ETIQUETA[0].valor;

export interface Etiqueta {
  id: string;
  nome: string;
  cor: string;
}

/**
 * O nome da classe CSS para a cor da etiqueta.
 *
 * O ponto colorido sai de uma classe, nunca de `style={{ background: cor }}`:
 * hex cru no componente é o que o contrato proíbe, e seria também o que
 * deixaria passar uma cor fora da paleta gravada no banco por outro caminho.
 */
export function classeDaCor(cor: string): string {
  return CORES_ETIQUETA.find((c) => c.valor.toLowerCase() === cor.toLowerCase())?.classe ?? "petroleo";
}
