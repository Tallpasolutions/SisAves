"use client";

import { Check } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui";
import { marcarLida, type EstadoNotificacao } from "./acoes";
import styles from "./notificacoes.module.css";

export function BotaoLida({ id }: { id: string }) {
  const [estado, acao, enviando] = useActionState<EstadoNotificacao, FormData>(
    marcarLida,
    {},
  );

  return (
    <form action={acao} className={styles.acaoLinha}>
      <input type="hidden" name="notificacao_id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={enviando}
        iconeEsquerda={<Check size={16} aria-hidden="true" />}
      >
        {enviando ? "Marcando…" : "Marcar como lido"}
      </Button>
      {estado.erro ? (
        <span className={styles.erro} role="alert">
          {estado.erro}
        </span>
      ) : null}
    </form>
  );
}
