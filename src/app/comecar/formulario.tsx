"use client";

import { CircleAlert } from "lucide-react";
import { useActionState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { criarCriatorio, type EstadoOnboarding } from "./acoes";
import styles from "./comecar.module.css";

export interface ClubeOpcao {
  id: string;
  sigla: string | null;
  nome: string;
  uf: string | null;
}

export function FormularioCriatorio({ clubes }: { clubes: ClubeOpcao[] }) {
  const [estado, acao, enviando] = useActionState<EstadoOnboarding, FormData>(
    criarCriatorio,
    {},
  );

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
        <Field label="Nome do criatório" required>
          {({ id, invalido }) => (
            <Input
              id={id}
              name="nome"
              size="lg"
              placeholder="Criatório Santos"
              invalid={invalido}
              required
            />
          )}
        </Field>

        <Field
          label="Clube ou federação"
          hint="Define a sigla que aparece nas anilhas das suas aves."
        >
          {({ id, descritoPor }) => (
            <select id={id} name="clube_id" className={styles.selecao} aria-describedby={descritoPor}>
              <option value="">Não informar agora</option>
              {clubes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.sigla ? `${c.sigla} — ` : ""}
                  {c.nome}
                  {c.uf ? ` (${c.uf})` : ""}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field label="Número de criador" hint="A sua matrícula no clube.">
          {({ id, descritoPor }) => (
            <Input id={id} name="nro_criador" size="lg" numeric aria-describedby={descritoPor} placeholder="1234" />
          )}
        </Field>

        <Field
          label="Registro IBAMA"
          hint="Exigido no cabeçalho do certificado. Pode preencher depois."
        >
          {({ id, descritoPor }) => (
            <Input id={id} name="registro_ibama" size="lg" aria-describedby={descritoPor} />
          )}
        </Field>

        <div className={styles.duasColunas}>
          <Field label="Cidade">
            {({ id }) => <Input id={id} name="cidade" size="lg" placeholder="Florianópolis" />}
          </Field>
          <Field label="UF">
            {({ id }) => (
              <Input id={id} name="uf" size="lg" maxLength={2} placeholder="SC" />
            )}
          </Field>
        </div>

        <div className={styles.acoes}>
          <Button type="submit" size="lg" disabled={enviando}>
            {enviando ? "Salvando…" : "Continuar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
