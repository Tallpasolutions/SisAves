import type { ReactNode } from "react";
import styles from "./TableRow.module.css";

export type Gravidade = "normal" | "atencao" | "critico";

export interface TableRowProps {
  nome: string;
  data?: string;
  quantidade?: number | string;
  situacao?: ReactNode;
  gravidade?: Gravidade;
  selecionada?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Linha de tabela com faixa de gravidade.
 *
 * A gravidade aparece em três sinais simultâneos — faixa de 3px, fundo e o
 * chip de situação —, nunca só na cor: o design proíbe estado comunicado
 * apenas por cor ou opacidade.
 */
export function TableRow({
  nome,
  data,
  quantidade,
  situacao,
  gravidade = "normal",
  selecionada = false,
  onClick,
  className,
}: TableRowProps) {
  const Tag = onClick ? "button" : "div";
  const classes = [
    styles.grade,
    styles.linha,
    gravidade === "atencao" ? styles.gravidadeAtencao : null,
    gravidade === "critico" ? styles.gravidadeCritico : null,
    selecionada ? styles.selecionada : null,
    onClick ? styles.interativa : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      className={classes}
      onClick={onClick}
      {...(onClick ? { type: "button" as const } : {})}
      {...(selecionada ? { "aria-current": "true" as const } : {})}
    >
      <span className={styles.faixa} aria-hidden="true" />
      <span className={styles.nome}>{nome}</span>
      <span className={styles.data}>{data}</span>
      <span className={styles.numero}>{quantidade}</span>
      <span className={styles.situacao}>{situacao}</span>
    </Tag>
  );
}

export interface TableProps {
  colunas: [string, string, string, string];
  children: ReactNode;
  className?: string;
}

/** Envelope com o cabeçalho de 36px. A primeira coluna é a faixa, sem rótulo. */
export function Table({ colunas, children, className }: TableProps) {
  return (
    <div className={[styles.tabela, className].filter(Boolean).join(" ")}>
      <div className={[styles.grade, styles.cabecalho].join(" ")}>
        <span aria-hidden="true" />
        <span>{colunas[0]}</span>
        <span>{colunas[1]}</span>
        <span className={styles.numero}>{colunas[2]}</span>
        <span className={styles.situacao}>{colunas[3]}</span>
      </div>
      {children}
    </div>
  );
}
