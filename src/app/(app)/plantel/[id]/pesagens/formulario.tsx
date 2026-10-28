"use client";

import { CircleAlert, WifiOff } from "lucide-react";
import { useActionState, useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { SalvoNoAparelho } from "@/components/offline/SalvoNoAparelho";
import { useEnvioOffline } from "@/components/offline/useEnvioOffline";
import Link from "next/link";
import {
  CONTEXTOS_PESAGEM,
  ROTULO_CONTEXTO,
} from "@/lib/dados/contextos-de-pesagem";
import type { Pesagem } from "@/lib/dados/pesagens";
import { useErrosQueEnvelhecem } from "@/lib/formulario";
import {
  editarPesagem,
  excluirPesagem,
  registrarPesagem,
  type EstadoPesagem,
} from "./acoes";
import styles from "./pesagens.module.css";
import { hojeNoAparelho } from "@/lib/data";

/**
 * Lançamento e correção no mesmo formulário.
 *
 * São os mesmos quatro campos e as mesmas regras; duas cópias garantiriam que
 * a próxima validação entrasse só numa.
 */
export function FormularioPesagem({
  aveId,
  nome,
  emEdicao,
}: {
  aveId: string;
  nome: string | null;
  /** A pesagem que está sendo corrigida. Ausente, o formulário lança uma nova. */
  emEdicao?: Pesagem;
}) {
  const edicao = Boolean(emEdicao);

  const [estado, acao, enviando] = useActionState<EstadoPesagem, FormData>(
    edicao ? editarPesagem : registrarPesagem,
    {},
  );
  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const [data, setData] = useState(() => emEdicao?.data ?? hojeNoAparelho());
  const [peso, setPeso] = useState(() =>
    emEdicao ? String(emEdicao.pesoGramas).replace(".", ",") : "",
  );
  const [contexto, setContexto] = useState(() => emEdicao?.contexto ?? "rotina");
  const [observacoes, setObservacoes] = useState(() => emEdicao?.observacoes ?? "");

  const contextoDeFora =
    emEdicao?.contexto && !CONTEXTOS_PESAGEM.some((c) => c.valor === emEdicao.contexto)
      ? emEdicao.contexto
      : null;

  const { id, aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    // A correção é idempotente por natureza: gravar os mesmos valores duas
    // vezes dá o mesmo resultado, então ela não precisa de chave própria.
    tipo: edicao ? "edicao-pesagem" : "pesagem",
    resumo: () =>
      `${edicao ? "Correção de pesagem" : "Pesagem"} · ${nome ?? "ave sem nome"} · ${peso || "?"} g`,
  });

  if (salvoNoAparelho) {
    return (
      <SalvoNoAparelho
        titulo={
          edicao
            ? `Correção salva no aparelho · ${peso} g`
            : `Pesagem salva no aparelho · ${peso} g`
        }
        consequencia="O histórico passa a mostrar o valor novo assim que o registro subir."
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
      {/* No lançamento a chave nasce aqui, e é ela que torna o reenvio da fila
          idempotente. Na correção é o id da pesagem que está sendo acertada. */}
      <input type="hidden" name="pesagem_id" value={emEdicao?.id ?? id} />

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
            {/* O contexto gravado precisa estar na lista, mesmo quando o
                formulário não o oferece para escolha nova: `anilhamento` é
                escrito pelo sistema, e sem esta opção a correção de um peso
                trocaria o contexto junto, em silêncio. */}
            {contextoDeFora ? (
              <option value={contextoDeFora}>
                {ROTULO_CONTEXTO[contextoDeFora] ?? contextoDeFora}
              </option>
            ) : null}
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
          {enviando
            ? edicao
              ? "Salvando…"
              : "Registrando…"
            : edicao
              ? "Salvar alterações"
              : "Registrar pesagem"}
        </Button>
        {edicao ? (
          <Link href={`/plantel/${aveId}/pesagens`} className={styles.cancelar}>
            Cancelar
          </Link>
        ) : null}
        {!online ? (
          <span className={styles.aviso}>
            <WifiOff size={14} aria-hidden="true" />
            Offline. Será salvo no aparelho
          </span>
        ) : null}
      </div>
    </form>
  );
}

/**
 * Apagar uma pesagem, em dois toques.
 *
 * O primeiro troca o botão pela pergunta; o segundo apaga. Não é diálogo
 * modal: a lista é longa, o alvo tem 48px e o criador está de pé — um modal
 * aqui custa um foco preso e uma tela coberta para confirmar o que já está
 * escrito na linha.
 */
export function BotaoExcluirPesagem({
  pesagemId,
  aveId,
  descricao,
}: {
  pesagemId: string;
  aveId: string;
  descricao: string;
}) {
  const [estado, acao, enviando] = useActionState<EstadoPesagem, FormData>(
    excluirPesagem,
    {},
  );
  const [confirmando, setConfirmando] = useState(false);

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "exclusao-pesagem",
    resumo: () => `Pesagem excluída · ${descricao}`,
  });

  if (salvoNoAparelho) {
    return <span className={styles.notaLinha}>Salvo no aparelho.</span>;
  }

  if (!confirmando) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirmando(true)}>
        Excluir
      </Button>
    );
  }

  return (
    <form action={acao} onSubmit={aoEnviar} className={styles.confirmacao}>
      <input type="hidden" name="pesagem_id" value={pesagemId} />
      <input type="hidden" name="passaro_id" value={aveId} />

      <span className={styles.pergunta}>Excluir mesmo?</span>
      <Button type="submit" variant="danger" size="sm" disabled={enviando}>
        {enviando ? "Excluindo…" : "Excluir"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirmando(false)}>
        Cancelar
      </Button>

      {estado.erro ? (
        <span className={styles.erroLinha} role="alert">
          {estado.erro}
        </span>
      ) : null}
      {!online ? (
        <span className={styles.notaLinha}>Offline. Será salvo no aparelho</span>
      ) : null}
    </form>
  );
}
