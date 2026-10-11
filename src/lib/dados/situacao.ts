/**
 * Rótulos da situação da ave.
 *
 * Módulo puro, sem cliente de Supabase: componentes de cliente precisam destes
 * rótulos, e importá-los de `plantel.ts` arrastaria `next/headers` para o
 * bundle do navegador — erro que já aconteceu aqui antes.
 */
export const ROTULO_SITUACAO: Record<
  string,
  { texto: string; tom: "ok" | "neutro" | "critico" }
> = {
  ativo: { texto: "Plantel ativo", tom: "ok" },
  vendido: { texto: "Vendido", tom: "neutro" },
  doado: { texto: "Doado", tom: "neutro" },
  emprestado: { texto: "Emprestado", tom: "neutro" },
  morto: { texto: "Óbito", tom: "critico" },
  perdido: { texto: "Perdido", tom: "critico" },
};

export function descreverSituacao(situacao: string) {
  return ROTULO_SITUACAO[situacao] ?? { texto: situacao, tom: "neutro" as const };
}

/** "Curió · Lutino" — sem separador sobrando quando falta um dos dois. */
export function descreverEspecie(
  especie: string | null,
  mutacao: string | null,
): string {
  return [especie, mutacao].filter(Boolean).join(" · ") || "Espécie não informada";
}
