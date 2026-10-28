"use client";

import { CircleAlert, TriangleAlert, WifiOff } from "lucide-react";
import { useActionState, useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { SalvoNoAparelho } from "@/components/offline/SalvoNoAparelho";
import { useEnvioOffline } from "@/components/offline/useEnvioOffline";
import type { AveDetalhe } from "@/lib/dados/plantel";
import { SAIDAS, type MotivoSaida } from "@/lib/dados/situacao";
import { formatarData } from "@/lib/formato";
import { useErrosQueEnvelhecem, useMarcacaoFirme } from "@/lib/formulario";
import { registrarSaida, type EstadoSaida } from "./acoes";
import styles from "./saida.module.css";
import { hojeNoAparelho } from "@/lib/data";

export function FormularioSaida({ ave }: { ave: AveDetalhe }) {
  const [estado, acao, enviando] = useActionState<EstadoSaida, FormData>(
    registrarSaida,
    {},
  );
  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const [motivo, setMotivo] = useState<MotivoSaida | "">("");
  const [data, setData] = useState(() => hojeNoAparelho());
  const [destino, setDestino] = useState("");
  const [valor, setValor] = useState("");
  const [observacao, setObservacao] = useState("");

  const escolha = SAIDAS.find((s) => s.valor === motivo) ?? null;

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "saida",
    resumo: () =>
      `Saída · ${ave.nome ?? "ave sem nome"} · ${escolha?.rotulo ?? "motivo não escolhido"}`,
  });

  if (salvoNoAparelho) {
    return (
      <SalvoNoAparelho
        titulo={`Saída salva no aparelho · ${escolha?.rotulo ?? ""}`}
        consequencia={
          ave.casalVigente
            ? `A ave sai do plantel ativo e o casal ${String(ave.casalVigente.numero).padStart(2, "0")} é encerrado assim que o registro subir.`
            : "A ave sai do plantel ativo assim que o registro subir."
        }
        voltarPara={`/plantel/${ave.id}`}
        rotuloVoltar="Voltar para a ficha"
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
      <input type="hidden" name="passaro_id" value={ave.id} />

      {estado.erro ? (
        <p className={styles.alerta} role="alert">
          <span className={styles.alertaIcone}>
            <CircleAlert size={16} aria-hidden="true" />
          </span>
          {estado.erro}
        </p>
      ) : null}

      <fieldset className={styles.grupo}>
        <legend className={styles.grupoTitulo}>Motivo da saída</legend>
        {erro("situacao") ? (
          <p className={styles.erroGrupo} role="alert">
            <CircleAlert size={14} aria-hidden="true" />
            {erro("situacao")}
          </p>
        ) : null}

        <div className={styles.chips}>
          {SAIDAS.map((s) => (
            <ChipSaida
              key={s.valor}
              valor={s.valor}
              rotulo={s.rotulo}
              marcado={motivo === s.valor}
              onEscolher={(v) => {
                setMotivo(v);
                marcar("situacao");
              }}
            />
          ))}
        </div>
      </fieldset>

      {/* O aviso vem ANTES de confirmar, e não só na confirmação: encerrar o
          casal é consequência que o criador precisa ver chegando. */}
      {escolha && ave.casalVigente ? (
        <p className={styles.consequencia}>
          <TriangleAlert size={16} aria-hidden="true" />
          <span>
            O casal {String(ave.casalVigente.numero).padStart(2, "0")} será
            encerrado em {formatarData(data)}. As ninhadas já registradas ficam
            no histórico dele.
          </span>
        </p>
      ) : null}

      {escolha ? (
        <div className={styles.campos}>
          <Field label={escolha.data} required error={erro("data")}>
            {({ id, descritoPor, invalido }) => (
              <Input
                id={id}
                name="data"
                type="date"
                size="lg"
                numeric
                max={hojeNoAparelho()}
                value={data}
                onChange={(e) => {
                  setData(e.target.value);
                  marcar("data");
                }}
                aria-describedby={descritoPor}
                invalid={invalido}
                required
              />
            )}
          </Field>

          {escolha.destino ? (
            <Field label={escolha.destino} hint="Opcional." error={erro("destino")}>
              {({ id, descritoPor, invalido }) => (
                <Input
                  id={id}
                  name="destino"
                  size="lg"
                  autoComplete="off"
                  value={destino}
                  onChange={(e) => {
                    setDestino(e.target.value);
                    marcar("destino");
                  }}
                  aria-describedby={descritoPor}
                  invalid={invalido}
                />
              )}
            </Field>
          ) : null}

          {escolha.aceitaValor ? (
            <Field
              label="Valor"
              hint="Opcional. Informado, entra como receita no financeiro."
              error={erro("valor")}
            >
              {({ id, descritoPor, invalido }) => (
                <Input
                  id={id}
                  name="valor"
                  size="lg"
                  numeric
                  inputMode="decimal"
                  prefix="R$"
                  value={valor}
                  onChange={(e) => {
                    setValor(e.target.value);
                    marcar("valor");
                  }}
                  aria-describedby={descritoPor}
                  invalid={invalido}
                />
              )}
            </Field>
          ) : null}

          <Field label={escolha.motivo} hint="Opcional." error={erro("motivo")}>
            {({ id, descritoPor, invalido }) => (
              <Input
                id={id}
                name="motivo"
                size="lg"
                autoComplete="off"
                value={observacao}
                onChange={(e) => {
                  setObservacao(e.target.value);
                  marcar("motivo");
                }}
                aria-describedby={descritoPor}
                invalid={invalido}
              />
            )}
          </Field>
        </div>
      ) : null}

      <div className={styles.acaoFixa}>
        <div className={styles.acaoFixaInterno}>
          <Button type="submit" size="lg" bloco disabled={enviando || !escolha}>
            {enviando
              ? "Registrando…"
              : escolha
                ? `Registrar ${escolha.rotulo.toLowerCase()}`
                : "Registrar saída"}
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

function ChipSaida({
  valor,
  rotulo,
  marcado,
  onEscolher,
}: {
  valor: MotivoSaida;
  rotulo: string;
  marcado: boolean;
  onEscolher: (valor: MotivoSaida) => void;
}) {
  // O reset do React 19 desmarca o radio no DOM sem o React reaplicar.
  const ref = useMarcacaoFirme(marcado);

  return (
    <label className={`${styles.chip} ${marcado ? styles.chipMarcado : ""}`}>
      <input
        ref={ref}
        type="radio"
        name="situacao"
        value={valor}
        checked={marcado}
        onChange={() => onEscolher(valor)}
        className={styles.radio}
      />
      <span className={styles.chipRotulo}>{rotulo}</span>
    </label>
  );
}
