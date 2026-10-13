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
