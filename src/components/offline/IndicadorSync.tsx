"use client";

import { SyncStatus } from "@/components/ui";
import { useSincronizacao } from "./Sincronizacao";

/**
 * O `SyncStatus` ligado ao estado real da fila.
 *
 * Antes da Fase 6 ele vivia fixo em "online" no cabeçalho da Hoje — bonito e
 * mentiroso. Agora reflete o que de fato aconteceu com o que o criador digitou.
 */
export function IndicadorSync({ compact = false }: { compact?: boolean }) {
  const { online, pendentes, enviando, ultimoEnvio } = useSincronizacao();

  if (!online) return <SyncStatus state="offline" compact={compact} />;

  if (pendentes.length > 0) {
    return (
      <SyncStatus
        state="pendente"
        pending={pendentes.length}
        enviando={enviando}
        compact={compact}
      />
    );
  }

  return <SyncStatus state="online" lastSync={ultimoEnvio ?? undefined} compact={compact} />;
}
