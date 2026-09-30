import type { ReactNode } from "react";
import styles from "./Badge.module.css";

export type TomBadge = "ok" | "atencao" | "critico" | "neutro" | "info" | "acao";

export interface BadgeProps {
  tone?: TomBadge;
  icon?: ReactNode;
  size?: "sm" | "md";
  /** Ponto antes do rótulo, para status do plantel. */
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Chip de estado.
 *
 * `acao` é o tom âmbar cheio, separado de `atencao` de propósito: `atencao` é
 * o âmbar suave que informa ("Ovoscopia prevista"), enquanto `acao` convoca
 * agora ("Anilhar hoje"). No máximo um `acao` por tela.
 */
export function Badge({
  tone = "neutro",
  icon,
  size = "md",
  dot = false,
  children,
  className,
}: BadgeProps) {
  const classes = [styles.badge, styles[tone], size === "sm" ? styles.sm : null, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      {dot ? <span className={styles.ponto} aria-hidden="true" /> : null}
      {icon ? (
        <span className={styles.icone} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}
