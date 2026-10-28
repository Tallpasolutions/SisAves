"use client";

import { CircleAlert, Undo2, WifiOff } from "lucide-react";
import { useActionState, useState } from "react";
import { Badge, Button, Field, Input, Select } from "@/components/ui";
import { SalvoNoAparelho } from "@/components/offline/SalvoNoAparelho";
import { useEnvioOffline } from "@/components/offline/useEnvioOffline";
import { ROTULO_ESTADO, TOM_ESTADO } from "@/lib/dados/estados-do-ovo";
import type { CasalBaba, NinhadaCompleta, OvoDaNinhada } from "@/lib/dados/ninhada";
import { encadear, formatarDataCurta } from "@/lib/formato";
import { useErrosQueEnvelhecem, useMarcacaoFirme } from "@/lib/formulario";
import {
  devolverPostura,
  transferirPosturas,
  type EstadoTransferencia,
} from "./acoes";
import styles from "./transferir.module.css";

export function FormularioTransferencia({
  ninhada,
  babas,
}: {
  ninhada: NinhadaCompleta;
  babas: CasalBaba[];
}) {
  const [estado, acao, enviando] = useActionState<EstadoTransferencia, FormData>(
    transferirPosturas,
    {},
  );
  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [marcados, setMarcados] = useState<Record<string, boolean>>({});

  // Ovo fora do ciclo ou já separado não se transfere: a função recusaria, e
  // oferecer a caixa é convidar ao erro.
  const moviveis = ninhada.ovos.filter(
    (o) => o.marcos.length > 0 && o.dataSeparacao === null,
  );
  const quantos = moviveis.filter((o) => marcados[o.posturaId]).length;
  const numero = String(ninhada.ninhadaNumero ?? 0).padStart(2, "0");

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "transferencia",
    resumo: () =>
      `Transferência · Ninhada ${numero} · ${quantos} ${quantos === 1 ? "ovo" : "ovos"}`,
  });

  if (salvoNoAparelho) {
    return (
      <SalvoNoAparelho
        titulo={`Transferência salva no aparelho · ${quantos} ${quantos === 1 ? "ovo" : "ovos"}`}
        consequencia="Os ovos passam a aparecer no casal que vai chocar assim que o registro subir."
        voltarPara={`/ovos/${ninhada.ninhadaId}`}
        rotuloVoltar="Voltar para a ninhada"
      />
    );
  }

  if (moviveis.length === 0) {
    return (
      <p className={styles.nota}>
        Nenhum ovo desta ninhada pode mudar de ninho agora: os que restam já
        saíram do ciclo ou já foram separados.
      </p>
    );
  }

  return (
    <form
      action={acao}
      onSubmit={(evento) => {
        enviar();
        aoEnviar(evento);
      }}
      className={styles.formulario}
    >
      <input type="hidden" name="ninhada_id" value={ninhada.ninhadaId} />

      {estado.erro ? (
        <p className={styles.alerta} role="alert">
          <span className={styles.alertaIcone}>
            <CircleAlert size={16} aria-hidden="true" />
          </span>
          {estado.erro}
        </p>
      ) : null}

      <Field
        label="Quem vai chocar"
        required
        hint="Só casal vigente. O ovo continua sendo do casal que o pôs."
        error={erro("destino_id")}
      >
        {({ id, descritoPor, invalido }) => (
          <Select
            id={id}
            name="destino_id"
            size="lg"
            value={destino}
            onChange={(e) => {
              setDestino(e.target.value);
              marcar("destino_id");
            }}
            disabled={babas.length === 0}
            aria-describedby={descritoPor}
            invalid={invalido}
            required
          >
            <option value="">Escolha o casal</option>
            {babas.map((c) => (
              <option key={c.id} value={c.id}>
                {encadear(
                  `Casal ${String(c.numero).padStart(2, "0")}`,
                  c.especie,
                  c.gaiola ? `gaiola ${c.gaiola}` : null,
                )}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <section className={styles.grupo}>
        <h2 className={styles.grupoTitulo}>
          Quais ovos · {quantos} de {moviveis.length}
        </h2>

        <ul className={styles.ovos}>
          {moviveis.map((ovo) => (
            <li key={ovo.posturaId}>
              <LinhaOvo
                ovo={ovo}
                marcado={marcados[ovo.posturaId] ?? false}
                onMarcar={(v) =>
                  setMarcados((atual) => ({ ...atual, [ovo.posturaId]: v }))
                }
              />
            </li>
          ))}
        </ul>
      </section>

      <Field label="Motivo" hint="Opcional. Ex.: fêmea abandonou o ninho." error={erro("motivo")}>
        {({ id, descritoPor, invalido }) => (
          <Input
            id={id}
            name="motivo"
            size="lg"
            autoComplete="off"
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value);
              marcar("motivo");
            }}
            aria-describedby={descritoPor}
            invalid={invalido}
          />
        )}
      </Field>

      <div className={styles.acaoFixa}>
        <div className={styles.acaoFixaInterno}>
          <Button type="submit" size="lg" bloco disabled={enviando || quantos === 0}>
            {enviando
              ? "Transferindo…"
              : quantos === 0
                ? "Transferir ovos"
                : `Transferir ${quantos} ${quantos === 1 ? "ovo" : "ovos"}`}
          </Button>
          {!online ? (
            <span className={styles.aviso}>
              <WifiOff size={14} aria-hidden="true" />
              Offline. Será salvo no aparelho
            </span>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function LinhaOvo({
  ovo,
  marcado,
  onMarcar,
}: {
  ovo: OvoDaNinhada;
  marcado: boolean;
  onMarcar: (v: boolean) => void;
}) {
  // O reset do React 19 desmarca a caixa sem o React reaplicar.
  const ref = useMarcacaoFirme(marcado);
  const nome = ovo.numeroOvo === null ? "Ovo sem número" : `Ovo ${ovo.numeroOvo}`;

  return (
    <label className={`${styles.ovo} ${marcado ? styles.ovoMarcado : ""}`}>
      <input type="hidden" name="postura_id" value={ovo.posturaId} />
      <input
        ref={ref}
        type="checkbox"
        name={`mover_${ovo.posturaId}`}
        checked={marcado}
        onChange={(e) => onMarcar(e.target.checked)}
        className={styles.marca}
      />
      <span className={styles.ovoTextos}>
        <span className={styles.ovoNome}>{nome}</span>
        <span className={styles.ovoContexto}>
          {ovo.chocadorNumero !== null
            ? `hoje com o Casal ${String(ovo.chocadorNumero).padStart(2, "0")}`
            : ovo.dataEclosao
              ? `nasceu ${formatarDataCurta(ovo.dataEclosao)}`
              : `postura ${formatarDataCurta(ovo.dataPostura)}`}
        </span>
      </span>
      <Badge tone={TOM_ESTADO[ovo.estado]} size="sm">
        {ROTULO_ESTADO[ovo.estado]}
      </Badge>
    </label>
  );
}

/** Traz o ovo de volta ao ninho de origem. Fora do formulário principal. */
export function BotaoDevolver({
  posturaId,
  ninhadaId,
  rotulo,
}: {
  posturaId: string;
  ninhadaId: string;
  rotulo: string;
}) {
  const [estado, acao, enviando] = useActionState<EstadoTransferencia, FormData>(
    devolverPostura,
    {},
  );

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "devolucao",
    resumo: () => `Devolução · ${rotulo}`,
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
    <form action={acao} onSubmit={aoEnviar} className={styles.devolver}>
      <input type="hidden" name="postura_id" value={posturaId} />
      <input type="hidden" name="ninhada_id" value={ninhadaId} />

      <Button
        type="submit"
        variant="secondary"
        size="md"
        disabled={enviando}
        iconeEsquerda={<Undo2 size={16} aria-hidden="true" />}
      >
        {enviando ? "Devolvendo…" : "Trazer de volta"}
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
