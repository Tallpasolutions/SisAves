"use client";

import { Award, CircleAlert } from "lucide-react";
import { useActionState, useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { emitirCertificado, revogarCertificado, type EstadoCertificado } from "./acoes";
import styles from "./certificado.module.css";

export function BotaoEmitir({
  aveId,
  temAnilha,
  jaEmitidos,
}: {
  aveId: string;
  temAnilha: boolean;
  jaEmitidos: number;
}) {
  const [estado, acao, enviando] = useActionState<EstadoCertificado, FormData>(
    emitirCertificado,
    {},
  );

  return (
    <form action={acao} className={styles.acao}>
      <input type="hidden" name="passaro_id" value={aveId} />

      {estado.erro ? (
        <p className={styles.alerta} role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          {estado.erro}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        disabled={enviando || !temAnilha}
        iconeEsquerda={<Award size={18} aria-hidden="true" />}
      >
        {enviando
          ? "Emitindo…"
          : jaEmitidos > 0
            ? "Emitir nova via"
            : "Emitir certificado"}
      </Button>
    </form>
  );
}

/**
 * Revogar, em dois toques e com motivo.
 *
 * O motivo não é burocracia: ele aparece na página pública para quem escaneia
 * o QR de uma via revogada. "Ave vendida e recertificada" e "emitido por
 * engano" são coisas muito diferentes para quem está com a ave na mão.
 */
export function BotaoRevogar({
  certificadoId,
  aveId,
  numero,
}: {
  certificadoId: string;
  aveId: string;
  numero: number;
}) {
  const [estado, acao, enviando] = useActionState<EstadoCertificado, FormData>(
    revogarCertificado,
    {},
  );
  const [confirmando, setConfirmando] = useState(false);
  const [motivo, setMotivo] = useState("");

  if (!confirmando) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirmando(true)}>
        Revogar
      </Button>
    );
  }

  return (
    <form action={acao} className={styles.revogacao}>
      <input type="hidden" name="certificado_id" value={certificadoId} />
      <input type="hidden" name="passaro_id" value={aveId} />

      <p className={styles.pergunta}>
        Revogar o certificado nº {String(numero).padStart(5, "0")}? Ele continua
        existindo, e quem escanear o QR vê que não vale mais.
      </p>

      <Field label="Motivo" hint="Aparece na página pública de validação.">
        {({ id, descritoPor }) => (
          <Input
            id={id}
            name="motivo"
            size="lg"
            autoComplete="off"
            placeholder="Ex.: emitido por engano"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            aria-describedby={descritoPor}
          />
        )}
      </Field>

      <div className={styles.revogacaoAcoes}>
        <Button type="submit" variant="danger" size="md" disabled={enviando}>
          {enviando ? "Revogando…" : "Revogar"}
        </Button>
        <Button variant="ghost" size="md" onClick={() => setConfirmando(false)}>
          Cancelar
        </Button>
      </div>

      {estado.erro ? (
        <span className={styles.erroLinha} role="alert">
          {estado.erro}
        </span>
      ) : null}
    </form>
  );
}
