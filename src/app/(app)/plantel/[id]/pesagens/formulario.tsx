"use client";

import { CircleAlert, WifiOff } from "lucide-react";
import { useActionState, useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { SalvoNoAparelho } from "@/components/offline/SalvoNoAparelho";
import { useEnvioOffline } from "@/components/offline/useEnvioOffline";
import { CONTEXTOS_PESAGEM } from "@/lib/dados/contextos-de-pesagem";
import { useErrosQueEnvelhecem } from "@/lib/formulario";
import { registrarPesagem, type EstadoPesagem } from "./acoes";
import styles from "./pesagens.module.css";
import { hojeNoAparelho } from "@/lib/data";

export function FormularioPesagem({
  aveId,
  nome,
}: {
  aveId: string;
  nome: string | null;
}) {
  const [estado, acao, enviando] = useActionState<EstadoPesagem, FormData>(
    registrarPesagem,
    {},
  );
  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const [data, setData] = useState(() => hojeNoAparelho());
  const [peso, setPeso] = useState("");
  const [contexto, setContexto] = useState("rotina");
  const [observacoes, setObservacoes] = useState("");

  const { id, aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "pesagem",
    resumo: () => `Pesagem · ${nome ?? "ave sem nome"} · ${peso || "?"} g`,
  });

  if (salvoNoAparelho) {
    return (
      <SalvoNoAparelho
        titulo={`Pesagem salva no aparelho · ${peso} g`}
        consequencia="Ela entra no histórico assim que o registro subir."
        voltarPara={`/plantel/${aveId}`}
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
      <input type="hidden" name="passaro_id" value={aveId} />
      {/* Chave gerada aqui: idempotência do reenvio da fila. */}
      <input type="hidden" name="pesagem_id" value={id} />

      {estado.erro ? (
        <p className={styles.alerta} role="alert">
          <span className={styles.alertaIcone}>
            <CircleAlert size={16} aria-hidden="true" />
          </span>
          {estado.erro}
        </p>
      ) : null}

      <div className={styles.linhaDupla}>
        <Field label="Peso" required error={erro("peso_gramas")}>
          {({ id: campoId, descritoPor, invalido }) => (
            <Input
              id={campoId}
              name="peso_gramas"
              size="lg"
              numeric
              inputMode="decimal"
              suffix="g"
              autoFocus
              value={peso}
              onChange={(e) => {
                setPeso(e.target.value);
                marcar("peso_gramas");
              }}
              aria-describedby={descritoPor}
              invalid={invalido}
              required
            />
          )}
        </Field>

        <Field label="Pesada em" required error={erro("data")}>
          {({ id: campoId, descritoPor, invalido }) => (
            <Input
              id={campoId}
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
      </div>

      <Field
        label="Contexto"
        hint="Compare pesagens do mesmo contexto entre si."
        error={erro("contexto")}
      >
        {({ id: campoId, descritoPor, invalido }) => (
          <Select
            id={campoId}
            name="contexto"
            size="lg"
            value={contexto}
            onChange={(e) => {
              setContexto(e.target.value);
              marcar("contexto");
            }}
            aria-describedby={descritoPor}
            invalid={invalido}
          >
            {CONTEXTOS_PESAGEM.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.rotulo}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label="Observação" hint="Opcional." error={erro("observacoes")}>
        {({ id: campoId, descritoPor, invalido }) => (
          <Input
            id={campoId}
            name="observacoes"
            size="lg"
            autoComplete="off"
            value={observacoes}
            onChange={(e) => {
              setObservacoes(e.target.value);
              marcar("observacoes");
            }}
            aria-describedby={descritoPor}
            invalid={invalido}
          />
        )}
      </Field>

      <div className={styles.acao}>
        <Button type="submit" size="lg" bloco disabled={enviando}>
          {enviando ? "Registrando…" : "Registrar pesagem"}
        </Button>
        {!online ? (
          <span className={styles.aviso}>
            <WifiOff size={14} aria-hidden="true" />
            Offline — será salvo no aparelho
          </span>
        ) : null}
      </div>
    </form>
  );
}
