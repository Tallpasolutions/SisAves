import styles from "./SexChip.module.css";

export type Sexo = "macho" | "femea" | "indefinido";

const GLIFO: Record<Sexo, string> = {
  macho: "M",
  femea: "F",
  indefinido: "—",
};

const ROTULO: Record<Sexo, string> = {
  macho: "Macho",
  femea: "Fêmea",
  indefinido: "Sexo indefinido",
};

export interface SexChipProps {
  sexo: Sexo;
  /** Só o glifo, em 40px sobre superfície de marca (avatar do card de ave). */
  avatar?: boolean;
  /** Só o glifo, no tamanho do chip — para linhas densas de lista e tabela. */
  compacta?: boolean;
  className?: string;
}

/**
 * Indicador de sexo da ave.
 *
 * `indefinido` não é um caso de erro: filhote antes da sexagem é situação
 * normal e frequente no criatório.
 */
export function SexChip({ sexo, avatar = false, compacta = false, className }: SexChipProps) {
  const soGlifo = avatar || compacta;
  const classes = [
    styles.chip,
    styles[sexo],
    avatar ? styles.avatar : null,
    compacta ? styles.compacta : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} role="img" aria-label={ROTULO[sexo]}>
      <span className={styles.glifo} aria-hidden="true">
        {GLIFO[sexo]}
      </span>
      {soGlifo ? null : (
        <span className={styles.rotulo} aria-hidden="true">
          {ROTULO[sexo]}
        </span>
      )}
    </span>
  );
}
