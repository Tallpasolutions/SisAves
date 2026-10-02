import Link from "next/link";
import { formatarAnilha } from "@/lib/formato";
import type { DadosAnilha } from "./Anilha";
import type { Sexo } from "./SexChip";
import styles from "./PedigreeNode.module.css";

const GLIFO: Record<Sexo, string> = {
  macho: "M",
  femea: "F",
  indefinido: "—",
};

const ROTULO_SEXO: Record<Sexo, string> = {
  macho: "Macho",
  femea: "Fêmea",
  indefinido: "Sexo indefinido",
};

export interface PedigreeNodeProps {
  nome?: string | null;
  anilha?: DadosAnilha;
  sexo?: Sexo;
  mutacao?: string | null;
  /** 44px, sem mutação — gerações 2 e 3. */
  compacta?: boolean;
  /** Ancestral não registrado. Estado de primeira classe, não lacuna. */
  desconhecido?: boolean;
  /** Qual posição está vazia: "Avó materna". Só aparece no nó desconhecido —
   *  nos demais a posição já se lê pelo lugar na árvore. */
  posicao?: string;
  /** O mesmo ancestral aparece em mais de um ramo: contorno âmbar. */
  repetido?: boolean;
  /** Abre a ficha da ave. Ausente no nó desconhecido. */
  href?: string;
  className?: string;
}

/**
 * Nó da árvore genealógica — contrato na prancha `3c` do handoff.
 *
 * É **um dos dois únicos lugares** onde uma barra colorida à esquerda é
 * permitida (o outro é a linha de tabela): 3px, e aqui ela marca o sexo.
 *
 * A cor da faixa nunca é o único sinal — a letra M/F/— e o `aria-label`
 * acompanham sempre, como no `SexChip`.
 */
export function PedigreeNode({
  nome,
  anilha,
  sexo = "indefinido",
  mutacao,
  compacta = false,
  desconhecido = false,
  posicao,
  repetido = false,
  href,
  className,
}: PedigreeNodeProps) {
  const classes = [
    styles.no,
    compacta ? styles.compacta : null,
    desconhecido ? styles.desconhecido : null,
    repetido ? styles.repetido : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (desconhecido) {
    return (
      <div className={classes}>
        <span className={styles.faixa} aria-hidden="true" />
        <span className={styles.textos}>
          <span className={styles.nome}>Desconhecido</span>
          <span className={styles.codigo}>{posicao ?? "Sem registro"}</span>
        </span>
      </div>
    );
  }

  const conteudo = (
    <>
      <span className={`${styles.faixa} ${styles[sexo]}`} aria-hidden="true" />
      <span className={styles.textos}>
        <span className={styles.nome}>{nome ?? "Sem nome"}</span>
        <span className={styles.codigo}>
          {(anilha && formatarAnilha(anilha)) ?? "Sem anilha"}
        </span>
        {!compacta && mutacao ? (
          <span className={styles.mutacao}>{mutacao}</span>
        ) : null}
      </span>
      <span className={styles.sexo} role="img" aria-label={ROTULO_SEXO[sexo]}>
        <span aria-hidden="true">{GLIFO[sexo]}</span>
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {conteudo}
      </Link>
    );
  }
  return <div className={classes}>{conteudo}</div>;
}
