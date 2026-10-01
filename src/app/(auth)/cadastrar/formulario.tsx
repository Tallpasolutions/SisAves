"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { cadastrar, type EstadoFormulario } from "../acoes";
import styles from "../layout.module.css";

export function FormularioCadastrar() {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(
    cadastrar,
    {},
  );

  // Cadastro aceito e aguardando confirmação: o formulário sai de cena para
  // a pessoa não reenviar achando que falhou.
  if (estado.aviso) {
    return (
      <p className={`${styles.alerta} ${styles.alertaAviso}`} role="status">
        <span className={styles.alertaIcone}>
          <CircleCheck size={16} aria-hidden="true" />
        </span>
        {estado.aviso}
      </p>
    );
  }

  return (
    <>
      {estado.erro ? (
        <p className={`${styles.alerta} ${styles.alertaErro}`} role="alert">
          <span className={styles.alertaIcone}>
            <CircleAlert size={16} aria-hidden="true" />
          </span>
          {estado.erro}
        </p>
      ) : null}

      <form action={acao} className={styles.formulario}>
        <Field label="Seu nome" required>
          {({ id, invalido }) => (
            <Input
              id={id}
              name="nome"
              size="lg"
              autoComplete="name"
              placeholder="Como você assina os documentos"
              invalid={invalido}
              required
            />
          )}
        </Field>

        <Field label="E-mail" required>
          {({ id, invalido }) => (
            <Input
              id={id}
              name="email"
              type="email"
              size="lg"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              invalid={invalido}
              required
            />
          )}
        </Field>

        <Field label="Senha" required hint="Pelo menos 8 caracteres.">
          {({ id, descritoPor, invalido }) => (
            <Input
              id={id}
              name="senha"
              type="password"
              size="lg"
              autoComplete="new-password"
              aria-describedby={descritoPor}
              invalid={invalido}
              minLength={8}
              required
            />
          )}
        </Field>

        <Button type="submit" size="lg" bloco disabled={enviando}>
          {enviando ? "Criando…" : "Criar conta"}
        </Button>
      </form>
    </>
  );
}
