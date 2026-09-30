"use client";

import styles from "./Tabs.module.css";

export interface Aba {
  value: string;
  label: string;
  /** Ausente de propósito onde a contagem não informa nada. */
  count?: number;
}

export interface TabsProps {
  tabs: Aba[];
  value: string;
  onChange: (value: string) => void;
  /** Rótulo do grupo para leitores de tela. */
  "aria-label"?: string;
  className?: string;
}

export function Tabs({ tabs, value, onChange, className, ...resto }: TabsProps) {
  return (
    <div
      className={[styles.abas, className].filter(Boolean).join(" ")}
      role="tablist"
      aria-label={resto["aria-label"]}
    >
      {tabs.map((aba) => {
        const ativa = aba.value === value;
        return (
          <button
            key={aba.value}
            type="button"
            role="tab"
            aria-selected={ativa}
            className={[styles.aba, ativa ? styles.ativa : null].filter(Boolean).join(" ")}
            onClick={() => onChange(aba.value)}
          >
            {aba.label}
            {aba.count !== undefined ? (
              <span className={styles.contador}>({aba.count})</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
