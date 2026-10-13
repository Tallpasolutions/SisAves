/**
 * Os nove estados da postura e seus rótulos.
 *
 * Módulo puro, sem cliente de Supabase. A tela da ninhada mostra o estado de
 * cada ovo dentro do formulário — componente de cliente —, e importar daqui de
 * `ovos.ts` arrastaria `next/headers` para o pacote do navegador. Já aconteceu
 * uma vez com os rótulos da situação da ave.
 */

/** Na ordem do ciclo. */
export const ESTADOS_OVO = [
  "chocando",
  "verificar",
  "nascendo",
  "nascido",
  "anilhar",
  "separar",
  "separado",
  "infertil",
  "perdido",
] as const;

export type EstadoOvo = (typeof ESTADOS_OVO)[number];

/** Só estes aparecem como filtro: os terminais ficam fora da operação do dia. */
export const ESTADOS_ATIVOS: EstadoOvo[] = [
  "verificar",
  "chocando",
  "nascendo",
  "anilhar",
  "separar",
];

export const ROTULO_ESTADO: Record<EstadoOvo, string> = {
  chocando: "Chocando",
  verificar: "Ovoscopia",
  nascendo: "Nascendo",
  nascido: "Nascido",
  anilhar: "Anilhar",
  separar: "Separar",
  separado: "Separado",
  infertil: "Infértil",
  perdido: "Perda",
};

export const TOM_ESTADO: Record<
  EstadoOvo,
  "info" | "neutro" | "ok" | "acao" | "critico"
> = {
  chocando: "info",
  verificar: "neutro",
  nascendo: "ok",
  nascido: "ok",
  anilhar: "acao",
  separar: "neutro",
  separado: "neutro",
  infertil: "critico",
  perdido: "critico",
};
