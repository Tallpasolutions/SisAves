"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { pedirRecuperacao, type EstadoFormulario } from "../acoes";
import styles from "../layout.module.css";

export function FormularioRecuperar() {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(
    pedirRecuperacao,
    {},
  );

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
        <Field label="E-mail da conta" required>
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

        <Button type="submit" size="lg" bloco disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar link"}
        </Button>
      </form>
    </>
  );
}
