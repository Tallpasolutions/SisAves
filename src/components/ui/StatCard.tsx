import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./StatCard.module.css";

export interface StatCardProps {
  label: string;
  /** Já formatado em pt-BR. O componente não arredonda nem abrevia. */
  value: string;
  icon?: ReactNode;
  /** A linha de baixo: "102 ativas · 26 arquivadas". */
  hint?: string;
  /** Destaque de marca. No máximo um por tela — é um bloco de petróleo cheio. */
  tone?: "neutro" | "brand";
  trend?: "up" | "down";
  /** "+2 vs. agosto" — a comparação, sempre com o período nomeado. */
  trendLabel?: string;
  className?: string;
}

/**
 * Indicador do painel desktop — prancha `4a`.
 *
 * A tendência nunca é só a seta: o rótulo diz contra o quê ("+2 vs. agosto").
 * Uma seta verde sozinha obrigaria o criador a adivinhar o período, e cor não
 * pode ser o único sinal.
 */
export function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "neutro",
  trend,
  trendLabel,
  className,
}: StatCardProps) {
  const Seta = trend === "down" ? TrendingDown : TrendingUp;

  return (
    <div className={[styles.cartao, styles[tone], className].filter(Boolean).join(" ")}>
      <div className={styles.topo}>
        <span className={styles.rotulo}>{label}</span>
        {icon ? (
          <span className={styles.icone} aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>

      <span className={styles.valor}>{value}</span>

      {trend && trendLabel ? (
        <span className={styles.tendencia}>
          <Seta size={14} aria-hidden="true" />
          {trendLabel}
        </span>
      ) : hint ? (
        <span className={styles.ajuda}>{hint}</span>
      ) : null}
    </div>
  );
}
