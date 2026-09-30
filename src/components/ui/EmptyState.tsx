import type { ReactNode } from "react";
import styles from "./EmptyState.module.css";

export interface EmptyStateProps {
  /** Ícone Lucide do domínio — Egg para ninhada, Bird para plantel. */
  icon?: ReactNode;
  /** Nomeia o que falta: "Nenhuma ninhada ativa". */
  title: string;
  /** Diz o próximo passo concreto, em no máximo duas frases. */
  description?: string;
  acao?: ReactNode;
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  acao,
  compact = false,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={[styles.vazio, compact ? styles.compacto : null, className]
        .filter(Boolean)
        .join(" ")}
    >
      {icon ? (
        <span className={styles.icone} aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className={styles.titulo}>{title}</span>
      {description ? <p className={styles.descricao}>{description}</p> : null}
      {acao ? <div className={styles.acao}>{acao}</div> : null}
    </div>
  );
}
