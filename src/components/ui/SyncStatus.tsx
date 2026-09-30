import { CircleCheck, RefreshCw, WifiOff } from "lucide-react";
import styles from "./SyncStatus.module.css";

export type EstadoSync = "offline" | "pendente" | "online";

export interface SyncStatusProps {
  state: EstadoSync;
  /** Quantos registros esperam envio. */
  pending?: number;
  /** "hoje 07:42" */
  lastSync?: string;
  /** Gira o ícone enquanto o envio acontece. */
  enviando?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Estado da sincronização.
 *
 * A cópia nunca sugere perda: é "Offline — salvo no aparelho", jamais
 * "Sem conexão. Tente novamente mais tarde." O registro não se perde, e o
 * texto precisa dizer isso — o criador está no galpão, sem sinal, com uma ave
 * na mão, e precisa confiar que o que digitou ficou.
 */
export function SyncStatus({
  state,
  pending = 0,
  lastSync,
  enviando = false,
  compact = false,
  className,
}: SyncStatusProps) {
  const tamanho = compact ? 14 : 16;
  const classes = [styles.chip, styles[state], compact ? styles.compacto : null, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} role="status">
      <span className={styles.icone} aria-hidden="true">
        {state === "offline" ? <WifiOff size={tamanho} /> : null}
        {state === "pendente" ? (
          <RefreshCw size={tamanho} className={enviando ? styles.girando : undefined} />
        ) : null}
        {state === "online" ? <CircleCheck size={tamanho} /> : null}
      </span>

      {state === "offline" ? "Offline — salvo no aparelho" : null}

      {state === "pendente" ? (
        <>
          <span className={styles.contagem}>{pending}</span>
          {pending === 1 ? "registro pendente" : "registros pendentes"}
        </>
      ) : null}

      {state === "online" ? `Sincronizado${lastSync ? ` · ${lastSync}` : ""}` : null}
    </span>
  );
}
