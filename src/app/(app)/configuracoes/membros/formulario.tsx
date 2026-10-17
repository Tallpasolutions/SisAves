"use client";

import { CircleAlert } from "lucide-react";
import { useActionState, useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import type { Convite, Membro } from "@/lib/dados/configuracoes";
import { useErrosQueEnvelhecem } from "@/lib/formulario";
import {
  cancelarConvite,
  convidarMembro,
  removerMembro,
  type EstadoMembro,
} from "./acoes";
import styles from "../configuracoes.module.css";

/**
 * Convidar por e-mail.
 *
 * Sem fila offline: o convite depende de o servidor conhecer o e-mail, e
 * guardá-lo no aparelho só adiaria a descoberta de que ele está errado. É
 * também a única escrita do produto que não acontece no galpão.
 */
export function FormularioConvite() {
  const [estado, acao, enviando] = useActionState<EstadoMembro, FormData>(
    convidarMembro,
    {},
  );
  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState("operador");

  return (
    <form action={acao} onSubmit={enviar} className={styles.formulario}>
      {estado.erro ? (
        <p className={styles.alerta} role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          {estado.erro}
        </p>
      ) : null}

      <Field
        label="E-mail"
        required
        hint="A pessoa entra com este e-mail e o acesso aparece sozinho."
        error={erro("email")}
      >
        {({ id, descritoPor, invalido }) => (
          <Input
            id={id}
            name="email"
            type="email"
            size="lg"
            autoComplete="off"
            placeholder="pessoa@exemplo.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              marcar("email");
            }}
            aria-describedby={descritoPor}
            invalid={invalido}
            required
          />
        )}
      </Field>

      <Field label="O que ela pode fazer" error={erro("papel")}>
        {({ id, descritoPor, invalido }) => (
          <Select
            id={id}
            name="papel"
            size="lg"
            value={papel}
            onChange={(e) => {
              setPapel(e.target.value);
              marcar("papel");
            }}
            aria-describedby={descritoPor}
            invalid={invalido}
          >
            <option value="operador">Operador · registra e corrige</option>
            <option value="leitor">Leitor · só consulta</option>
          </Select>
        )}
      </Field>

      <div className={styles.acao}>
        <Button type="submit" size="lg" disabled={enviando}>
          {enviando ? "Convidando…" : "Convidar"}
        </Button>
      </div>
    </form>
  );
}

export function BotaoCancelarConvite({ convite }: { convite: Convite }) {
  const [estado, acao, enviando] = useActionState<EstadoMembro, FormData>(
    cancelarConvite,
    {},
  );

  return (
    <form action={acao} className={styles.confirmacao}>
      <input type="hidden" name="convite_id" value={convite.id} />
      <Button type="submit" variant="ghost" size="sm" disabled={enviando}>
        {enviando ? "Cancelando…" : "Cancelar convite"}
      </Button>
      {estado.erro ? (
        <span className={styles.erroLinha} role="alert">
          {estado.erro}
        </span>
      ) : null}
    </form>
  );
}

/** Tirar alguém do criatório, em dois toques. */
export function BotaoRemover({ membro }: { membro: Membro }) {
  const [estado, acao, enviando] = useActionState<EstadoMembro, FormData>(
    removerMembro,
    {},
  );
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirmando(true)}>
        Remover
      </Button>
    );
  }

  return (
    <form action={acao} className={styles.confirmacao}>
      <input type="hidden" name="usuario_id" value={membro.usuarioId} />

      <span className={styles.pergunta}>
        Tirar {membro.nome} do criatório?
      </span>
      <Button type="submit" variant="danger" size="sm" disabled={enviando}>
        {enviando ? "Removendo…" : "Remover"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirmando(false)}>
        Cancelar
      </Button>

      {estado.erro ? (
        <span className={styles.erroLinha} role="alert">
          {estado.erro}
        </span>
      ) : null}
    </form>
  );
}
