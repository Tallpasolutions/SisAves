import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./Button.module.css";

export type VarianteBotao = "primary" | "secondary" | "ghost" | "danger" | "accent";
export type TamanhoBotao = "sm" | "md" | "lg";

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: VarianteBotao;
  size?: TamanhoBotao;
  /** Ocupa a largura toda — ação fixa na base de formulário. */
  bloco?: boolean;
  iconeEsquerda?: ReactNode;
  iconeDireita?: ReactNode;
  /**
   * Quando presente, o botão vira link. Navegação é <a>, não <button> dentro
   * de <a> — que além de HTML inválido quebra teclado e leitor de tela.
   */
  href?: string;
}

/**
 * Botão do SisAves.
 *
 * O rótulo é sempre um VERBO ("Registrar postura", não "Enviar") e o ícone
 * nunca o substitui na ação principal de uma tela — regra do CLAUDE.md.
 *
 * A variante `accent` (âmbar) é reservada ao que exige ação humana agora:
 * no máximo uma por tela, e só com prazo vencendo.
 */
export function Button({
  variant = "primary",
  size = "md",
  bloco = false,
  iconeEsquerda,
  iconeDireita,
  className,
  children,
  type = "button",
  href,
  ...resto
}: ButtonProps) {
  const classes = [
    styles.botao,
    styles[variant],
    styles[size],
    bloco ? styles.bloco : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const conteudo = (
    <>
      {iconeEsquerda ? (
        <span className={styles.icone} aria-hidden="true">
          {iconeEsquerda}
        </span>
      ) : null}
      {children}
      {iconeDireita ? (
        <span className={styles.icone} aria-hidden="true">
          {iconeDireita}
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {conteudo}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...resto}>
      {conteudo}
    </button>
  );
}
