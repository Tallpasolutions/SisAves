import type { ReactNode } from "react";
import { Anilha, type DadosAnilha } from "./Anilha";
import { SexChip, type Sexo } from "./SexChip";
import styles from "./BirdCard.module.css";

export interface DadoRodape {
  rotulo: string;
  valor: string;
  /** Em petróleo — usado na endogamia, que é decisão técnica do criador. */
  destaque?: boolean;
}

export interface BirdCardProps {
  nome: string;
  /** "Curió · mutação clássica · reprodutor" — já encadeado com SEPARADOR. */
  subtitulo?: string;
  sexo: Sexo;
  anilha?: DadosAnilha;
  anilhaCodigo?: string | null;
  status?: ReactNode;
  dados?: DadoRodape[];
  onClick?: () => void;
  className?: string;
}

/**
 * Card de ave.
 *
 * Vira `<button>` quando recebe `onClick`, para ser alcançável por teclado —
 * card clicável que é `<div>` não é operável sem mouse.
 */
export function BirdCard({
  nome,
  subtitulo,
  sexo,
  anilha,
  anilhaCodigo,
  status,
  dados,
  onClick,
  className,
}: BirdCardProps) {
  const Tag = onClick ? "button" : "div";
  const classes = [styles.card, onClick ? styles.interativo : null, className]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      className={classes}
      onClick={onClick}
      {...(onClick ? { type: "button" as const } : {})}
    >
      <div className={styles.identidade}>
        <SexChip sexo={sexo} avatar />
        <div className={styles.textos}>
          <span className={styles.nome}>{nome}</span>
          {subtitulo ? <span className={styles.subtitulo}>{subtitulo}</span> : null}
        </div>
        {status}
      </div>

      <Anilha dados={anilha} code={anilhaCodigo} />

      {dados?.length ? (
        <div className={styles.rodape}>
          {dados.map((d) => (
            <div key={d.rotulo} className={styles.dado}>
              <span className={styles.dadoRotulo}>{d.rotulo}</span>
              <span
                className={[styles.dadoValor, d.destaque ? styles.destaque : null]
                  .filter(Boolean)
                  .join(" ")}
              >
                {d.valor}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </Tag>
  );
}
