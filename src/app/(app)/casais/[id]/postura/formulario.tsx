"use client";

import { CircleAlert, Minus, Plus, WifiOff } from "lucide-react";
import { useActionState, useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { registrarPostura, type EstadoPostura } from "./acoes";
import styles from "./postura.module.css";

export interface Prazos {
  nome: string;
  dias_choco: number;
  dias_ovoscopia: number;
  dias_anilha: number;
  janela_anilha_dias: number;
  dias_separa: number;
}

const MAX_OVOS = 12;

export function FormularioPostura({
  casalId,
  proximaNinhada,
  prazos,
}: {
  casalId: string;
  proximaNinhada: number;
  prazos: Prazos | null;
}) {
  const [estado, acao, enviando] = useActionState<EstadoPostura, FormData>(
    registrarPostura,
    {},
  );
  const [quantidade, setQuantidade] = useState(1);
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  // Controlado porque o React 19 reseta o formulário quando a ação termina,
  // inclusive em erro: solto, o campo se esvaziaria junto com a mensagem.
  const [observacoes, setObservacoes] = useState("");

  return (
    <form action={acao} className={styles.formulario}>
      <input type="hidden" name="casal_id" value={casalId} />

      {estado.erro ? (
        <p className={styles.alerta} role="alert">
          <span className={styles.alertaIcone}>
            <CircleAlert size={16} aria-hidden="true" />
          </span>
          {estado.erro}
        </p>
      ) : null}

      <Field label="Data da postura" required error={estado.campos?.data_postura}>
        {({ id, descritoPor, invalido }) => (
          <Input
            id={id}
            name="data_postura"
            type="date"
            size="lg"
            numeric
            value={data}
            onChange={(e) => setData(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            aria-describedby={descritoPor}
            invalid={invalido}
            required
          />
        )}
      </Field>

      <ContadorOvos
        valor={quantidade}
        onMudar={setQuantidade}
        erro={estado.campos?.quantidade}
      />

      {prazos ? (
        <Previsoes data={data} prazos={prazos} />
      ) : (
        <p className={styles.semEspecie}>
          As previsões aparecem quando as aves do casal tiverem espécie definida.
        </p>
      )}

      <Field label="Observações" hint="Opcional. Ex.: ninho trocado, fêmea arrancando pena.">
        {({ id, descritoPor }) => (
          <Input
            id={id}
            name="observacoes"
            size="lg"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            aria-describedby={descritoPor}
          />
        )}
      </Field>

      <div className={styles.acaoFixa}>
        <div className={styles.acaoFixaInterno}>
          <Button type="submit" size="lg" bloco disabled={enviando}>
            {enviando
              ? "Registrando…"
              : `Registrar ninhada ${String(proximaNinhada).padStart(2, "0")}`}
          </Button>
          {/* A fila offline entra na Fase 6; até lá o aviso não promete o que
              o sistema ainda não faz. */}
          <span className={styles.aviso}>
            <WifiOff size={14} aria-hidden="true" />
            Precisa de conexão para salvar
          </span>
        </div>
      </div>
    </form>
  );
}

function ContadorOvos({
  valor,
  onMudar,
  erro,
}: {
  valor: number;
  onMudar: (v: number) => void;
  erro?: string;
}) {
  return (
    <div className={styles.contador}>
      <label className={styles.contadorRotulo} htmlFor="quantidade">
        Quantos ovos
      </label>

      <div className={styles.contadorControle}>
        <button
          type="button"
          className={styles.contadorBotao}
          onClick={() => onMudar(Math.max(1, valor - 1))}
          disabled={valor <= 1}
          aria-label="Um ovo a menos"
        >
          <Minus size={20} aria-hidden="true" />
        </button>

        <input
          id="quantidade"
          name="quantidade"
          className={styles.contadorValor}
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_OVOS}
          value={valor}
          onChange={(e) => onMudar(Number(e.target.value))}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? "quantidade-erro" : undefined}
        />

        <button
          type="button"
          className={styles.contadorBotao}
          onClick={() => onMudar(Math.min(MAX_OVOS, valor + 1))}
          disabled={valor >= MAX_OVOS}
          aria-label="Um ovo a mais"
        >
          <Plus size={20} aria-hidden="true" />
        </button>
      </div>

      {erro ? (
        <span className={styles.contadorErro} id="quantidade-erro" role="alert">
          <CircleAlert size={14} aria-hidden="true" />
          {erro}
        </span>
      ) : null}
    </div>
  );
}

/**
 * O que esta data agenda. Mostrar antes de salvar evita o erro mais comum do
 * galpão: registrar a postura no dia errado e descobrir pelo prazo furado.
 */
function Previsoes({ data, prazos }: { data: string; prazos: Prazos }) {
  const base = new Date(`${data}T00:00:00`);
  if (Number.isNaN(base.getTime())) return null;

  const mais = (dias: number) => {
    const d = new Date(base);
    d.setDate(d.getDate() + dias);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  return (
    <div className={styles.previsoes}>
      <span className={styles.previsoesTitulo}>O que esta data agenda</span>
      <span className={styles.previsao}>
        Ovoscopia <span className={styles.previsaoData}>{mais(prazos.dias_ovoscopia)}</span>
      </span>
      <span className={styles.previsao}>
        Eclosão prevista <span className={styles.previsaoData}>{mais(prazos.dias_choco)}</span>
      </span>
      <span className={styles.previsao}>
        Anilhar até{" "}
        <span className={styles.previsaoData}>
          {mais(prazos.dias_choco + prazos.dias_anilha + prazos.janela_anilha_dias)}
        </span>
      </span>
    </div>
  );
}
