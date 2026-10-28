"use client";

import { CircleAlert, TriangleAlert, WifiOff } from "lucide-react";
import { useActionState, useState } from "react";
import { Badge, Button, Field, Input } from "@/components/ui";
import { SalvoNoAparelho } from "@/components/offline/SalvoNoAparelho";
import { useEnvioOffline } from "@/components/offline/useEnvioOffline";
import { ROTULO_ESTADO, TOM_ESTADO } from "@/lib/dados/estados-do-ovo";
import { ehPerda, ROTULO_MARCO, type Marco } from "@/lib/dados/marcos";
import type { NinhadaCompleta, OvoDaNinhada } from "@/lib/dados/ninhada";
import { formatarDataCurta } from "@/lib/formato";
import { useErrosQueEnvelhecem, useMarcacaoFirme } from "@/lib/formulario";
import { registrarConferencia, type EstadoConferencia } from "./acoes";
import styles from "./ninhada.module.css";
import { hojeNoAparelho } from "@/lib/data";

/** Vazio quer dizer "segue igual" — o ovo não mudou de estado. */
type Escolha = "" | Marco;

export function FormularioConferencia({ ninhada }: { ninhada: NinhadaCompleta }) {
  const [estado, acao, enviando] = useActionState<EstadoConferencia, FormData>(
    registrarConferencia,
    {},
  );
  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const [data, setData] = useState(() => hojeNoAparelho());
  const [escolhas, setEscolhas] = useState<Record<string, Escolha>>({});
  const [motivos, setMotivos] = useState<Record<string, string>>({});

  const abertos = ninhada.ovos.filter((o) => o.marcos.length > 0);
  const marcados = abertos.filter((o) => (escolhas[o.posturaId] ?? "") !== "");

  const numero = String(ninhada.ninhadaNumero ?? 0).padStart(2, "0");

  /*
   * A conferência não manda chave própria: a idempotência vem de
   * `registrar_marcos`, que ignora em silêncio o marco já gravado. Um reenvio
   * depois de a resposta se perder aplica zero e é sucesso.
   */
  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "marcos",
    resumo: () =>
      `Conferência · Ninhada ${numero} · ${marcados.length} ${
        marcados.length === 1 ? "ovo" : "ovos"
      }`,
  });

  if (salvoNoAparelho) {
    return (
      <SalvoNoAparelho
        titulo={`Conferência salva no aparelho · ${marcados.length} ${marcados.length === 1 ? "ovo" : "ovos"}`}
        consequencia="A ninhada passa para o estado novo assim que o registro subir."
        voltarPara="/ovos"
        rotuloVoltar="Voltar para os ovos"
      />
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

      {abertos.length > 0 ? (
        <Field label="Conferido em" required error={erro("conferido_em")}>
          {({ id, descritoPor, invalido }) => (
            <Input
              id={id}
              name="conferido_em"
              type="date"
              size="lg"
              numeric
              max={hojeNoAparelho()}
              value={data}
              onChange={(e) => {
                setData(e.target.value);
                marcar("conferido_em");
              }}
              aria-describedby={descritoPor}
              invalid={invalido}
              required
            />
          )}
        </Field>
      ) : null}

      <section className={styles.grupo}>
        {/* Ninhada encerrada vira registro, não formulário: pedir que o
            criador "toque na marca" do que não aceita marca nenhuma seria
            prometer uma ação que a tela não tem. */}
        <h2 className={styles.grupoTitulo}>
          {abertos.length > 0 ? "O que você encontrou no ninho" : "Os ovos desta ninhada"}
        </h2>
        {abertos.length > 0 ? (
          <p className={styles.grupoNota}>
            Toque na marca de cada ovo. O que não mudou fica em “Segue igual”.
          </p>
        ) : null}

        <ul className={styles.ovos}>
          {ninhada.ovos.map((ovo) => (
            <li key={ovo.posturaId}>
              <LinhaOvo
                ovo={ovo}
                escolha={escolhas[ovo.posturaId] ?? ""}
                motivo={motivos[ovo.posturaId] ?? ""}
                onEscolher={(valor) =>
                  setEscolhas((atual) => ({ ...atual, [ovo.posturaId]: valor }))
                }
                onMotivo={(valor) =>
                  setMotivos((atual) => ({ ...atual, [ovo.posturaId]: valor }))
                }
              />
            </li>
          ))}
        </ul>
      </section>

      {abertos.length > 0 ? (
        <div className={styles.acaoFixa}>
          <div className={styles.acaoFixaInterno}>
            <Button type="submit" size="lg" bloco disabled={enviando || marcados.length === 0}>
              {enviando
                ? "Registrando…"
                : marcados.length === 0
                  ? "Registrar conferência"
                  : `Registrar conferência · ${marcados.length} ${marcados.length === 1 ? "ovo" : "ovos"}`}
            </Button>
            {!online ? (
              <span className={styles.aviso}>
                <WifiOff size={14} aria-hidden="true" />
                Offline. Será salvo no aparelho
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </form>
  );
}

function LinhaOvo({
  ovo,
  escolha,
  motivo,
  onEscolher,
  onMotivo,
}: {
  ovo: OvoDaNinhada;
  escolha: Escolha;
  motivo: string;
  onEscolher: (valor: Escolha) => void;
  onMotivo: (valor: string) => void;
}) {
  const aberto = ovo.marcos.length > 0;
  const nome = ovo.numeroOvo === null ? "Ovo sem número" : `Ovo ${ovo.numeroOvo}`;

  return (
    <div className={`${styles.ovo} ${aberto ? "" : styles.ovoFechado}`}>
      {/* Mesmo o ovo fora do ciclo manda o id: a lista de `postura_id` é o que
          a ação percorre, e omiti-los faria a numeração do formulário depender
          do estado de cada ovo. */}
      <input type="hidden" name="postura_id" value={ovo.posturaId} />

      <div className={styles.ovoTopo}>
        <span className={styles.ovoNome}>{nome}</span>
        <Badge tone={TOM_ESTADO[ovo.estado]} size="sm">
          {ROTULO_ESTADO[ovo.estado]}
        </Badge>
      </div>

      <span className={styles.ovoContexto}>{contar(ovo)}</span>

      {ovo.anilhamentoVencido && aberto ? (
        <p className={styles.atraso}>
          <TriangleAlert size={14} aria-hidden="true" />
          Janela de anilhamento encerrada em{" "}
          {formatarDataCurta(ovo.limiteAnilhamento)}.
        </p>
      ) : null}

      {aberto ? (
        <fieldset className={styles.escolha}>
          <legend className={styles.oculto}>O que você encontrou no {nome}</legend>

          <div className={styles.chips}>
            <ChipMarco
              posturaId={ovo.posturaId}
              valor=""
              rotulo="Segue igual"
              marcado={escolha === ""}
              onEscolher={onEscolher}
            />
            {ovo.marcos.map((marco) => (
              <ChipMarco
                key={marco}
                posturaId={ovo.posturaId}
                valor={marco}
                rotulo={ROTULO_MARCO[marco]}
                marcado={escolha === marco}
                onEscolher={onEscolher}
              />
            ))}
          </div>

          {/* O motivo só aparece quando há o que explicar. Perda e óbito são
              eventos normais: registre sem dramatizar. */}
          {escolha !== "" && ehPerda(escolha) ? (
            <Field label="Motivo" hint="Opcional.">
              {({ id, descritoPor }) => (
                <Input
                  id={id}
                  name={`motivo_${ovo.posturaId}`}
                  size="lg"
                  autoComplete="off"
                  value={motivo}
                  onChange={(e) => onMotivo(e.target.value)}
                  aria-describedby={descritoPor}
                />
              )}
            </Field>
          ) : null}
        </fieldset>
      ) : null}
    </div>
  );
}

function ChipMarco({
  posturaId,
  valor,
  rotulo,
  marcado,
  onEscolher,
}: {
  posturaId: string;
  valor: Escolha;
  rotulo: string;
  marcado: boolean;
  onEscolher: (valor: Escolha) => void;
}) {
  // O reset do React 19 desmarca o radio no DOM sem o React reaplicar.
  const ref = useMarcacaoFirme(marcado);

  return (
    <label className={`${styles.chip} ${marcado ? styles.chipMarcado : ""}`}>
      <input
        ref={ref}
        type="radio"
        name={`marco_${posturaId}`}
        value={valor}
        checked={marcado}
        onChange={() => onEscolher(valor)}
        className={styles.radio}
      />
      <span className={styles.chipRotulo}>{rotulo}</span>
    </label>
  );
}

/**
 * A linha de fatos do ovo: o que já foi observado, com data.
 *
 * Previsão só aparece onde o fato ainda pode acontecer. Depois que o ovo
 * eclode, "eclosão prevista" passaria a mentir; depois que ele se perde, toda
 * previsão passa a falar de um futuro que não existe mais.
 */
function contar(o: OvoDaNinhada): string {
  const partes: string[] = [`postura ${formatarDataCurta(o.dataPostura)}`];

  // Onde o ovo ESTÁ vem primeiro entre os fatos: é a informação que decide em
  // qual gaiola o criador vai procurar.
  if (o.chocadorNumero !== null) {
    partes.push(`chocando com o Casal ${String(o.chocadorNumero).padStart(2, "0")}`);
  }
  const fora = o.desfechoEm !== null || o.marcos.length === 0;

  if (o.ovoscopiaEm) {
    partes.push(
      `ovoscopia ${formatarDataCurta(o.ovoscopiaEm)}${o.fertil === false ? " · claro" : " · fértil"}`,
    );
  } else if (!fora && o.dataEclosao === null && o.previsaoOvoscopia) {
    partes.push(`ovoscopia prevista ${formatarDataCurta(o.previsaoOvoscopia)}`);
  }

  if (o.dataEclosao) {
    partes.push(`nasceu ${formatarDataCurta(o.dataEclosao)}`);
  } else if (!fora && o.previsaoEclosao) {
    partes.push(`eclosão prevista ${formatarDataCurta(o.previsaoEclosao)}`);
  }

  if (o.dataAnilhamento) partes.push(`anilhado ${formatarDataCurta(o.dataAnilhamento)}`);
  if (o.dataSeparacao) partes.push(`separado ${formatarDataCurta(o.dataSeparacao)}`);

  if (o.desfechoEm) {
    partes.push(
      o.desfechoMotivo
        ? `desfecho ${formatarDataCurta(o.desfechoEm)} · ${o.desfechoMotivo}`
        : `desfecho ${formatarDataCurta(o.desfechoEm)}`,
    );
  }

  return partes.join(" · ");
}
