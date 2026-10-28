"use client";

import { CircleAlert, Undo2, WifiOff } from "lucide-react";
import { useActionState, useState } from "react";
import { Badge, Button, Field, Input } from "@/components/ui";
import { useEnvioOffline } from "@/components/offline/useEnvioOffline";
import { ROTULO_ESTADO, TOM_ESTADO } from "@/lib/dados/estados-do-ovo";
import { MARCOS_DESFAZIVEIS, type MarcoDesfazivel } from "@/lib/dados/marcos";
import type { OvoDaNinhada } from "@/lib/dados/ninhada";
import { formatarDataCurta } from "@/lib/formato";
import { hojeNoAparelho } from "@/lib/data";
import { useErrosQueEnvelhecem } from "@/lib/formulario";
import {
  corrigirDataMarco,
  desfazerMarco,
  type EstadoCorrecao,
} from "./acoes";
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
        {ovo.desfaziveis.map(({ marco, data }) => (
          <Correcao
            key={marco}
            posturaId={ovo.posturaId}
            ninhadaId={ninhadaId}
            marco={marco}
            data={data}
            nome={nome}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * As duas correções de um marco, lado a lado: trocar a data e apagar.
 *
 * Dois formulários irmãos, nunca aninhados — <form> dentro de <form> é HTML
 * inválido e o navegador descarta o de dentro em silêncio.
 */
function Correcao({
  posturaId,
  ninhadaId,
  marco,
  data,
  nome,
}: {
  posturaId: string;
  ninhadaId: string;
  marco: MarcoDesfazivel;
  data: string | null;
  nome: string;
}) {
  return (
    <div className={styles.correcao}>
      {data ? (
        <FormularioData
          posturaId={posturaId}
          ninhadaId={ninhadaId}
          marco={marco}
          data={data}
          nome={nome}
        />
      ) : null}
      <BotaoDesfazer
        posturaId={posturaId}
        ninhadaId={ninhadaId}
        marco={marco}
        nome={nome}
      />
    </div>
  );
}

/** Troca a data sem tirar o marco: um passo, numa transação. */
function FormularioData({
  posturaId,
  ninhadaId,
  marco,
  data,
  nome,
}: {
  posturaId: string;
  ninhadaId: string;
  marco: MarcoDesfazivel;
  data: string;
  nome: string;
}) {
  const [estado, acao, enviando] = useActionState<EstadoCorrecao, FormData>(
    corrigirDataMarco,
    {},
  );
  const [valor, setValor] = useState(data);
  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const definicao = MARCOS_DESFAZIVEIS.find((m) => m.valor === marco)!;

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "redatar-marco",
    resumo: () => `${definicao.rotuloData} · ${nome}`,
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
    <form
      action={acao}
      onSubmit={(evento) => {
        enviar();
        aoEnviar(evento);
      }}
      className={styles.acao}
    >
      <input type="hidden" name="postura_id" value={posturaId} />
      <input type="hidden" name="ninhada_id" value={ninhadaId} />
      <input type="hidden" name="marco" value={marco} />

      <Field label={definicao.rotuloData} error={erro("data")}>
        {({ id, descritoPor, invalido }) => (
          <Input
            id={id}
            name="data"
            type="date"
            size="lg"
            numeric
            max={hojeNoAparelho()}
            value={valor}
            onChange={(e) => {
              setValor(e.target.value);
              marcar("data");
            }}
            aria-describedby={descritoPor}
            invalid={invalido}
            required
          />
        )}
      </Field>

      <Button
        type="submit"
        variant="secondary"
        size="md"
        disabled={enviando || valor === data}
      >
        {enviando ? "Mudando…" : "Mudar a data"}
      </Button>

      {!online ? (
        <span className={styles.nota}>
          <WifiOff size={14} aria-hidden="true" />
          Offline. Será salvo no aparelho
        </span>
      ) : null}
    </form>
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
          Offline. Será salvo no aparelho
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
