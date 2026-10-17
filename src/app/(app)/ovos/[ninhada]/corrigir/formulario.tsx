"use client";

import { CircleAlert, Undo2, WifiOff } from "lucide-react";
import { useActionState } from "react";
import { Badge, Button } from "@/components/ui";
import { useEnvioOffline } from "@/components/offline/useEnvioOffline";
import { ROTULO_ESTADO, TOM_ESTADO } from "@/lib/dados/estados-do-ovo";
import { MARCOS_DESFAZIVEIS, type MarcoDesfazivel } from "@/lib/dados/marcos";
import type { OvoDaNinhada } from "@/lib/dados/ninhada";
import { formatarDataCurta } from "@/lib/formato";
import { desfazerMarco, type EstadoCorrecao } from "./acoes";
import styles from "./corrigir.module.css";

export function LinhaCorrecao({
  ovo,
  ninhadaId,
}: {
  ovo: OvoDaNinhada;
  ninhadaId: string;
}) {
  const nome = ovo.numeroOvo === null ? "Ovo sem número" : `Ovo ${ovo.numeroOvo}`;

  return (
    <div className={styles.ovo}>
      <div className={styles.ovoTopo}>
        <span className={styles.ovoNome}>{nome}</span>
        <Badge tone={TOM_ESTADO[ovo.estado]} size="sm">
          {ROTULO_ESTADO[ovo.estado]}
        </Badge>
      </div>

      <span className={styles.ovoContexto}>{registrado(ovo)}</span>

      <div className={styles.botoes}>
        {ovo.desfaziveis.map((marco) => (
          <BotaoDesfazer
            key={marco}
            posturaId={ovo.posturaId}
            ninhadaId={ninhadaId}
            marco={marco}
            nome={nome}
          />
        ))}
      </div>
    </div>
  );
}

function BotaoDesfazer({
  posturaId,
  ninhadaId,
  marco,
  nome,
}: {
  posturaId: string;
  ninhadaId: string;
  marco: MarcoDesfazivel;
  nome: string;
}) {
  const [estado, acao, enviando] = useActionState<EstadoCorrecao, FormData>(
    desfazerMarco,
    {},
  );

  const definicao = MARCOS_DESFAZIVEIS.find((m) => m.valor === marco)!;

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "desfazer-marco",
    resumo: () => `${definicao.desfeito} · ${nome}`,
  });

  if (salvoNoAparelho) {
    return (
      <span className={styles.nota}>
        <WifiOff size={14} aria-hidden="true" />
        Salvo no aparelho. Sobe quando o sinal voltar.
      </span>
    );
  }

  return (
    <form action={acao} onSubmit={aoEnviar} className={styles.acao}>
      <input type="hidden" name="postura_id" value={posturaId} />
      <input type="hidden" name="ninhada_id" value={ninhadaId} />
      <input type="hidden" name="marco" value={marco} />

      <Button
        type="submit"
        variant="secondary"
        size="md"
        disabled={enviando}
        iconeEsquerda={<Undo2 size={16} aria-hidden="true" />}
      >
        {enviando ? "Desfazendo…" : definicao.rotulo}
      </Button>

      {estado.erro ? (
        <span className={styles.erro} role="alert">
          <CircleAlert size={14} aria-hidden="true" />
          {estado.erro}
        </span>
      ) : null}

      {!online ? (
        <span className={styles.nota}>
          <WifiOff size={14} aria-hidden="true" />
          Offline — será salvo no aparelho
        </span>
      ) : null}
    </form>
  );
}

/** Os fatos gravados neste ovo, que é o que a tela permite apagar. */
function registrado(o: OvoDaNinhada): string {
  const partes: string[] = [];
  if (o.ovoscopiaEm) {
    partes.push(
      `ovoscopia ${formatarDataCurta(o.ovoscopiaEm)}${o.fertil === false ? " · claro" : " · fértil"}`,
    );
  }
  if (o.dataEclosao) partes.push(`nasceu ${formatarDataCurta(o.dataEclosao)}`);
  if (o.dataAnilhamento) partes.push(`anilhado ${formatarDataCurta(o.dataAnilhamento)}`);
  if (o.dataSeparacao) partes.push(`separado ${formatarDataCurta(o.dataSeparacao)}`);
  if (o.desfechoEm) {
    partes.push(
      o.desfechoMotivo
        ? `desfecho ${formatarDataCurta(o.desfechoEm)} · ${o.desfechoMotivo}`
        : `desfecho ${formatarDataCurta(o.desfechoEm)}`,
    );
  }
  return partes.join(" · ") || "Nada registrado além da postura.";
}
