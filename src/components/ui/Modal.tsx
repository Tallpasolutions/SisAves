"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import styles from "./Modal.module.css";

export interface ModalProps {
  aberto: boolean;
  /** Repete o verbo do título na ação confirmadora. */
  titulo: string;
  /** Diz a CONSEQUÊNCIA real, não "Tem certeza?". */
  children: ReactNode;
  /** Ações à direita: terciário "Cancelar" + a ação, ambos size="sm". */
  acoes?: ReactNode;
  onFechar: () => void;
  className?: string;
}

/**
 * Diálogo modal sobre `<dialog>` nativo.
 *
 * O corpo declara a consequência real ("A ave sai do plantel ativo e permanece
 * na genealogia."), nunca "Tem certeza? Esta ação não pode ser desfeita." —
 * regra de cópia do CLAUDE.md.
 */
export function Modal({ aberto, titulo, children, acoes, onFechar, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (aberto && !el.open) el.showModal();
    if (!aberto && el.open) el.close();
  }, [aberto]);

  return (
    <dialog
      ref={ref}
      className={[styles.dialogo, className].filter(Boolean).join(" ")}
      // Esc dispara 'cancel'/'close': o estado do React precisa acompanhar,
      // senão o diálogo fica fechado com `aberto` ainda true e não reabre.
      onClose={onFechar}
    >
      <header className={styles.cabecalho}>
        <h2 className={styles.titulo}>{titulo}</h2>
      </header>
      <div className={styles.corpo}>{children}</div>
      {acoes ? <footer className={styles.rodape}>{acoes}</footer> : null}
    </dialog>
  );
}
