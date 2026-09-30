import type { ReactNode } from "react";
import styles from "./NotificationBadge.module.css";

export interface NotificationBadgeProps {
  /** Contagem em âmbar: há tarefa esperando ação. */
  count?: number;
  /** Ponto tijolo: há algo grave para ver, sem número. */
  dot?: boolean;
  /** O alvo de 44px — normalmente um botão de ícone. */
  children: ReactNode;
  /** Como o contador é lido em voz alta. */
  rotulo?: string;
  className?: string;
}

/**
 * Marcador ancorado no canto de um alvo.
 *
 * O badge tem `pointer-events: none` de propósito: quem recebe o toque é o
 * botão de 44px embaixo, nunca a pílula de 20px.
 */
export function NotificationBadge({
  count,
  dot = false,
  children,
  rotulo,
  className,
}: NotificationBadgeProps) {
  const mostrarContagem = typeof count === "number" && count > 0;
  const texto = mostrarContagem ? (count > 99 ? "99+" : String(count)) : null;

  return (
    <span className={[styles.ancora, className].filter(Boolean).join(" ")}>
      {children}
      {mostrarContagem ? (
        <span className={styles.badge} role="status" aria-label={rotulo ?? `${count} pendentes`}>
          {texto}
        </span>
      ) : dot ? (
        <span
          className={[styles.badge, styles.ponto].join(" ")}
          role="status"
          aria-label={rotulo ?? "Há novidades"}
        />
      ) : null}
    </span>
  );
}
