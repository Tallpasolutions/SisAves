import { formatarAnilha } from "@/lib/formato";
import styles from "./Anilha.module.css";

export interface DadosAnilha {
  sigla?: string | null;
  criador?: string | null;
  ano?: number | null;
  numero?: number | null;
}

export interface AnilhaProps {
  /** Código já formatado. Tem precedência sobre `dados`. */
  code?: string | null;
  /** Partes da anilha, formatadas pelo componente. */
  dados?: DadosAnilha;
  size?: "sm" | "md" | "lg";
  tone?: "default" | "brand" | "quiet";
  /** Nome do clube ao lado, ex.: "Clube SOV". */
  club?: string | null;
  className?: string;
}

/**
 * A anilha oficial é o identificador primário de uma ave — por isso é
 * componente, e não texto solto: garante tabular-nums, peso e tracking
 * iguais em toda tela, do card ao certificado.
 *
 * Ave ainda não anilhada é estado real e frequente (filhote no ninho), então
 * o componente diz "Sem anilha" em vez de sumir.
 */
export function Anilha({
  code,
  dados,
  size = "md",
  tone = "default",
  club,
  className,
}: AnilhaProps) {
  const texto = code ?? (dados ? formatarAnilha(dados) : null);

  if (!texto) {
    return (
      <span className={[styles.anilha, styles[size], styles.vazia, className].filter(Boolean).join(" ")}>
        Sem anilha
      </span>
    );
  }

  return (
    <span className={[styles.anilha, styles[size], styles[tone], className].filter(Boolean).join(" ")}>
      {texto}
      {club ? <span className={styles.clube}>{club}</span> : null}
    </span>
  );
}
