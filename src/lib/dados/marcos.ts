/**
 * Os marcos do ciclo do ovo, como o criador os declara.
 *
 * Módulo puro de propósito: o formulário da ninhada é componente de cliente, e
 * importar daqui um módulo que toca `next/headers` arrastaria o cliente do
 * Supabase para o pacote do navegador.
 */

/** O que o criador encontrou no ninho. Espelha `registrar_marcos` (0017). */
export type Marco = "fertil" | "infertil" | "eclodiu" | "separado" | "perdido";

export const MARCOS: Marco[] = [
  "fertil",
  "eclodiu",
  "separado",
  "infertil",
  "perdido",
];

/** O rótulo do botão. Substantivo ou particípio, como manda o contrato. */
export const ROTULO_MARCO: Record<Marco, string> = {
  fertil: "Fértil",
  infertil: "Ovo claro",
  eclodiu: "Nasceu",
  separado: "Separado",
  perdido: "Perdido",
};

/** Marca que tira o ovo do ciclo — pede motivo e muda o tom da linha. */
export function ehPerda(marco: Marco): boolean {
  return marco === "infertil" || marco === "perdido";
}

/**
 * Os marcos que se desfazem, quando foram registrados por engano.
 *
 * Corrigir a DATA de um marco é desfazer e registrar de novo — dois toques, e
 * evita uma segunda função no banco repetindo todas as guardas de
 * `desfazer_marco`.
 */
export type MarcoDesfazivel = "ovoscopia" | "eclosao" | "separacao" | "desfecho";

export const MARCOS_DESFAZIVEIS: Array<{
  valor: MarcoDesfazivel;
  /** O botão: verbo e o que ele apaga. */
  rotulo: string;
  /** A confirmação, depois de feito. */
  desfeito: string;
  /** O rótulo do campo de data, quando é só a data que está errada. */
  rotuloData: string;
  /** A confirmação da troca de data. */
  redatado: string;
}> = [
  {
    valor: "ovoscopia",
    rotulo: "Desfazer a ovoscopia",
    desfeito: "Ovoscopia desfeita",
    rotuloData: "Ovoscopia feita em",
    redatado: "Data da ovoscopia corrigida",
  },
  {
    valor: "eclosao",
    rotulo: "Desfazer a eclosão",
    desfeito: "Eclosão desfeita",
    rotuloData: "Eclodiu em",
    redatado: "Data da eclosão corrigida",
  },
  {
    valor: "separacao",
    rotulo: "Desfazer a separação",
    desfeito: "Separação desfeita",
    rotuloData: "Separado em",
    redatado: "Data da separação corrigida",
  },
  {
    valor: "desfecho",
    rotulo: "Desfazer o desfecho",
    desfeito: "Desfecho desfeito",
    rotuloData: "Observado em",
    redatado: "Data do desfecho corrigida",
  },
];
