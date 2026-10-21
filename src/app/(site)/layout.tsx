import type { ReactNode } from "react";

/**
 * A casca do site público.
 *
 * Sem sidebar, sem tab bar, sem indicador de sincronização: quem chega aqui
 * não tem conta ainda. O layout do app faz uma ida ao banco para montar
 * contagens e perfil — tudo inútil para um visitante, e um atraso a mais na
 * primeira tela que ele vê.
 */
export default function LayoutSite({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
