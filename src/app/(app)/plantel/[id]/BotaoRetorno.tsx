"use client";

import { CircleAlert, WifiOff } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui";
import { useEnvioOffline } from "@/components/offline/useEnvioOffline";
import { reativarAve, type EstadoSaida } from "./saida/acoes";
import styles from "./ficha.module.css";

/**
 * A volta ao plantel: a ave emprestada que o criador buscou, a que fugiu e
 * apareceu. Um botão, porque não há o que preencher — o fato é só que ela está
 * de novo no galpão.
 */
export function BotaoRetorno({
  passaroId,
  nome,
}: {
  passaroId: string;
  nome: string | null;
}) {
  const [estado, acao, enviando] = useActionState<EstadoSaida, FormData>(
    reativarAve,
    {},
  );

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "retorno",
    resumo: () => `Voltou ao plantel · ${nome ?? "ave sem nome"}`,
  });

  if (salvoNoAparelho) {
    return (
      <p className={styles.saidaNota}>
        Salvo no aparelho. A ave volta ao plantel ativo assim que o registro
        subir.
      </p>
    );
  }

  return (
    <form action={acao} onSubmit={aoEnviar} className={styles.saidaAcao}>
      <input type="hidden" name="passaro_id" value={passaroId} />

      {estado.erro ? (
        <p className={styles.saidaErro} role="alert">
          <CircleAlert size={14} aria-hidden="true" />
          {estado.erro}
        </p>
      ) : null}

      <Button type="submit" variant="secondary" size="md" disabled={enviando}>
        {enviando ? "Registrando…" : "Voltou ao plantel"}
      </Button>

      {!online ? (
        <span className={styles.saidaNota}>
          <WifiOff size={14} aria-hidden="true" />
          Offline — será salvo no aparelho
        </span>
      ) : null}
    </form>
  );
}
