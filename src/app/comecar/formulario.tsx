"use client";

import { CircleAlert } from "lucide-react";
import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { salvarDadosPessoais, type EstadoDadosPessoais } from "./acoes";
import styles from "./comecar.module.css";

/**
 * O primeiro passo do onboarding: quem é o criador.
 *
 * Os três campos são obrigatórios, e cada um tem um motivo que está escrito na
 * tela. Pedir CPF sem dizer para quê faz parte das pessoas desistirem no meio
 * do cadastro — e com razão: um sistema de aves querendo documento, sem
 * explicação, parece outra coisa.
 */
export function FormularioDadosPessoais({
  nome,
  telefone,
}: {
  nome?: string | null;
  telefone?: string | null;
}) {
  const [estado, acao, enviando] = useActionState<
    EstadoDadosPessoais,
    FormData
  >(salvarDadosPessoais, {});

  return (
    <div className={styles.cartao}>
      {estado.erro ? (
        <p className={styles.alerta} role="alert">
          <span className={styles.alertaIcone}>
            <CircleAlert size={16} aria-hidden="true" />
          </span>
          {estado.erro}
        </p>
      ) : null}

      <form action={acao} className={styles.formulario}>
        <Field
          label="Nome completo"
          required
          hint="Como aparece no seu documento."
          error={estado.campos?.nome}
        >
          {({ id, descritoPor, invalido }) => (
            <Input
              id={id}
              name="nome"
              size="lg"
              autoComplete="name"
              defaultValue={nome ?? ""}
              placeholder="Alex José Fausto"
              aria-describedby={descritoPor}
              invalid={invalido}
              required
            />
          )}
        </Field>

        <Field
          label="CPF"
          required
          hint="Usado na nota fiscal da assinatura. Não aparece em certificado nem em documento do plantel."
          error={estado.campos?.cpf}
        >
          {({ id, descritoPor, invalido }) => (
            <Input
              id={id}
              name="cpf"
              size="lg"
              inputMode="numeric"
              autoComplete="off"
              placeholder="000.000.000-00"
              aria-describedby={descritoPor}
              invalid={invalido}
              required
            />
          )}
        </Field>

        <Field
          label="Celular"
          required
          hint="Com DDD. É por onde falamos com você se algo travar."
          error={estado.campos?.telefone}
        >
          {({ id, descritoPor, invalido }) => (
            <Input
              id={id}
              name="telefone"
              size="lg"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              defaultValue={telefone ?? ""}
              placeholder="(48) 99179-3316"
              aria-describedby={descritoPor}
              invalid={invalido}
              required
            />
          )}
        </Field>

        <Button type="submit" size="lg" bloco disabled={enviando}>
          {enviando ? "Salvando…" : "Continuar"}
        </Button>
      </form>
    </div>
  );
}
