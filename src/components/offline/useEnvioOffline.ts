"use client";

import { useState, type FormEvent } from "react";
import type { TipoEscrita } from "@/lib/offline/fila";
import { useSincronizacao } from "./Sincronizacao";

/**
 * Faz um formulário de escrita funcionar sem rede.
 *
 * Com sinal, nada muda: a Server Action roda como sempre, e ela continua sendo
 * o único lugar onde a validação e a escrita vivem. Sem sinal, o envio é
 * interceptado e o que o criador digitou vai para a fila do aparelho.
 *
 * `id` é gerado uma vez por formulário e vai junto como chave primária da
 * linha. É o que torna o reenvio idempotente: se a primeira tentativa chegou e
 * só a resposta se perdeu, a segunda bate na chave e é reconhecida como já
 * aplicada.
 */
export function useEnvioOffline({
  tipo,
  resumo,
}: {
  tipo: TipoEscrita;
  /** Avaliado no envio, para descrever o registro com os valores finais. */
  resumo: () => string;
}) {
  const { online, enfileirarEscrita } = useSincronizacao();
  const [id] = useState(() => crypto.randomUUID());
  const [salvoNoAparelho, setSalvoNoAparelho] = useState(false);

  const aoEnviar = (evento: FormEvent<HTMLFormElement>) => {
    if (online) return;

    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);

    const campos = [...dados.entries()]
      // `$ACTION_*` é a carga interna do React para a Server Action, e carrega
      // um identificador que muda a cada build. Guardar isso na fila faria o
      // reenvio depois de um deploy falhar — e não é preciso: o reenvio chama
      // a ação diretamente.
      .filter(([chave, valor]) => typeof valor === "string" && !chave.startsWith("$ACTION"))
      .map(([chave, valor]) => [chave, String(valor)] as [string, string]);

    void enfileirarEscrita({ id, tipo, campos, resumo: resumo() });
    setSalvoNoAparelho(true);
  };

  return { id, aoEnviar, salvoNoAparelho, online };
}
