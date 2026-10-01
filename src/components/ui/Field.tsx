"use client";

import { ChevronDown, CircleAlert } from "lucide-react";
import { useId } from "react";
import { useSelecaoFirme } from "@/lib/formulario";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import styles from "./Field.module.css";

export interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  /** Quando presente, substitui a ajuda. Deve citar o dado exato. */
  error?: string;
  children: (props: { id: string; descritoPor?: string; invalido: boolean }) => ReactNode;
  className?: string;
}

/**
 * Envelope de um campo: rótulo, controle e a linha de ajuda ou erro.
 *
 * A mensagem de erro cita o dado ("O código COBP-25-04781 já existe no
 * plantel."), nunca "Ops, algo deu errado" — regra de cópia do CLAUDE.md.
 * Validar no blur e no envio, jamais a cada tecla.
 */
export function Field({ label, required, hint, error, children, className }: FieldProps) {
  const id = useId();
  const idAuxiliar = `${id}-aux`;
  const temAuxiliar = Boolean(error ?? hint);

  return (
    <div className={[styles.campo, className].filter(Boolean).join(" ")}>
      <label className={styles.rotulo} htmlFor={id}>
        {label}
        {required ? (
          <span className={styles.obrigatorio} aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {children({
        id,
        descritoPor: temAuxiliar ? idAuxiliar : undefined,
        invalido: Boolean(error),
      })}

      {error ? (
        <span className={styles.erro} id={idAuxiliar} role="alert">
          <span className={styles.erroIcone}>
            <CircleAlert size={14} aria-hidden="true" />
          </span>
          {error}
        </span>
      ) : hint ? (
        <span className={styles.ajuda} id={idAuxiliar}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export interface InputProps extends Omit<ComponentPropsWithoutRef<"input">, "size"> {
  /** Alinha dígitos em coluna: peso, anilha, valor financeiro. */
  numeric?: boolean;
  /** Unidade à direita, ex.: "g". */
  suffix?: string;
  iconLeft?: ReactNode;
  invalid?: boolean;
  size?: "md" | "lg";
}

/**
 * Controle de texto. `size="lg"` (48px) é o do app de campo — o criador toca
 * a tela com uma ave na mão, às vezes de luva.
 */
export function Input({
  numeric = false,
  suffix,
  iconLeft,
  invalid = false,
  size = "md",
  disabled,
  className,
  ...resto
}: InputProps) {
  const envelope = [
    styles.envelope,
    size === "lg" ? styles.lg : null,
    invalid ? styles.invalido : null,
    disabled ? styles.desabilitado : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={envelope}>
      {iconLeft ? (
        <span className={styles.adorno} aria-hidden="true">
          {iconLeft}
        </span>
      ) : null}
      <input
        className={[styles.entrada, numeric ? styles.numerico : null].filter(Boolean).join(" ")}
        inputMode={numeric ? "numeric" : undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        {...resto}
      />
      {suffix ? <span className={styles.sufixo}>{suffix}</span> : null}
    </div>
  );
}

export interface SelectProps extends Omit<ComponentPropsWithoutRef<"select">, "size"> {
  invalid?: boolean;
  size?: "md" | "lg";
}

/**
 * Lista de escolha. Usa o `<select>` nativo de propósito: no celular ele abre
 * a roda do sistema, que é o alvo mais confiável no galpão — e funciona antes
 * da hidratação, com a conexão ruim de lá.
 *
 * O handoff não desenhou este controle; ele herda o envelope do `Input` para
 * não introduzir uma segunda linguagem de campo.
 */
export function Select({
  invalid = false,
  size = "md",
  disabled,
  className,
  children,
  ...resto
}: SelectProps) {
  // O reset automático de formulário do React 19 esvazia o select no DOM sem
  // que o React reaplique o valor. Ver src/lib/formulario.ts.
  const ref = useSelecaoFirme(
    typeof resto.value === "string" ? resto.value : undefined,
  );
  const envelope = [
    styles.envelope,
    styles.envelopeSelecao,
    size === "lg" ? styles.lg : null,
    invalid ? styles.invalido : null,
    disabled ? styles.desabilitado : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={envelope}>
      <select
        ref={ref}
        className={styles.selecao}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        {...resto}
      >
        {children}
      </select>
      {/* Decorativo: o alvo é o próprio select, que cobre o envelope inteiro. */}
      <span className={styles.adornoFim} aria-hidden="true">
        <ChevronDown size={18} />
      </span>
    </div>
  );
}
