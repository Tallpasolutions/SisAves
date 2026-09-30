import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./Toast.module.css";

export type TomToast = "ok" | "atencao" | "critico" | "info" | "neutro";

const ICONE: Record<TomToast, ReactNode> = {
  ok: <CircleCheck size={18} />,
  atencao: <TriangleAlert size={18} />,
  critico: <CircleAlert size={18} />,
  info: <Info size={18} />,
  neutro: <Info size={18} />,
};

export interface ToastProps {
  tone?: TomToast;
  /** Fato: "Postura registrada · Ninhada 04 · 5 ovos" */
  title: string;
  /** Consequência com data: "Ovoscopia prevista para 17/03/2026." */
  description?: string;
  className?: string;
}

/**
 * Confirmação de ação.
 *
 * O padrão de cópia é FATO + CONSEQUÊNCIA COM DATA, nunca "Tudo pronto!".
 * `role="status"` anuncia sem interromper o que o leitor de tela está lendo.
 */
export function Toast({ tone = "ok", title, description, className }: ToastProps) {
  return (
    <div
      className={[styles.toast, styles[tone], className].filter(Boolean).join(" ")}
      role="status"
    >
      <span className={styles.icone} aria-hidden="true">
        {ICONE[tone]}
      </span>
      <div className={styles.textos}>
        <span className={styles.titulo}>{title}</span>
        {description ? <span className={styles.descricao}>{description}</span> : null}
      </div>
    </div>
  );
}
