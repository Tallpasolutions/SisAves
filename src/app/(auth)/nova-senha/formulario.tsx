"use client";

import { CircleAlert } from "lucide-react";
import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { definirNovaSenha, type EstadoFormulario } from "../acoes";
import styles from "../layout.module.css";

export function FormularioNovaSenha() {
  const [estado, acao, enviando] = useActionState<EstadoFormulario, FormData>(
    definirNovaSenha,
    {},
  );

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
        <Field label="Nova senha" required hint="Pelo menos 8 caracteres.">
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

        <Field label="Repita a senha" required>
          {({ id, invalido }) => (
            <Input
              id={id}
              name="confirmacao"
              type="password"
              size="lg"
              autoComplete="new-password"
              invalid={invalido}
              minLength={8}
              required
            />
          )}
        </Field>

        <Button type="submit" size="lg" bloco disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar senha"}
        </Button>
      </form>
    </>
  );
}
