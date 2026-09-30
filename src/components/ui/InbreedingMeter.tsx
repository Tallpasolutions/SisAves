import { formatarPercentual } from "@/lib/formato";
import styles from "./InbreedingMeter.module.css";

export type FaixaEndogamia = "seguro" | "atencao" | "risco";

/**
 * Limiares do domínio: 6,25% é o cruzamento de primos-primeiros e 12,5% o de
 * meios-irmãos. Mesma regra da função `faixa_endogamia` no banco — se um lado
 * mudar, o outro precisa mudar junto.
 */
export function faixaEndogamia(valor: number): FaixaEndogamia {
  if (valor < 6.25) return "seguro";
  if (valor <= 12.5) return "atencao";
  return "risco";
}

const ROTULO: Record<FaixaEndogamia, string> = {
  seguro: "Seguro",
  atencao: "Atenção",
  risco: "Risco",
};

export interface InbreedingMeterProps {
  /** Percentual, ex.: 9.38 */
  value: number;
  showScale?: boolean;
  /** Uma frase dizendo o parentesco que gera o coeficiente. */
  explicacao?: string;
  className?: string;
}

/**
 * Coeficiente de endogamia do casal.
 *
 * A cópia é factual: "Risco — 14,06%. Endogamia acima de 12,5%." Nunca
 * "Cuidado com esse casal!". O criador decide; o sistema informa.
 */
export function InbreedingMeter({
  value,
  showScale = false,
  explicacao,
  className,
}: InbreedingMeterProps) {
  const faixa = faixaEndogamia(value);
  // 25% (irmãos completos) é o topo prático da escala; acima disso satura.
  const largura = Math.min(100, Math.max(0, (value / 25) * 100));

  return (
    <div className={[styles.medidor, styles[faixa], className].filter(Boolean).join(" ")}>
      <div className={styles.topo}>
        <span className={styles.valor}>{formatarPercentual(value)}</span>
        <span className={styles.rotulo}>{ROTULO[faixa]}</span>
      </div>

      <div
        className={styles.trilho}
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={25}
        aria-label={`Coeficiente de endogamia ${formatarPercentual(value)} — ${ROTULO[faixa]}`}
      >
        <div className={styles.barra} style={{ width: `${largura}%` }} />
      </div>

      {showScale ? (
        <div className={styles.escala} aria-hidden="true">
          <span>0%</span>
          <span>6,25%</span>
          <span>12,5%</span>
          <span>25%</span>
        </div>
      ) : null}

      {explicacao ? <p className={styles.explicacao}>{explicacao}</p> : null}
    </div>
  );
}
