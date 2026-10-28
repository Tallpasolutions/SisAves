"use client";

import { CircleAlert, WifiOff } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { SalvoNoAparelho } from "@/components/offline/SalvoNoAparelho";
import { useEnvioOffline } from "@/components/offline/useEnvioOffline";
import type { OpcaoAve } from "@/lib/dados/aves-escolha";
import type {
  Doenca,
  Medicamento,
  OpcaoCasal,
  Tratamento,
} from "@/lib/dados/saude";
import { hojeNoAparelho } from "@/lib/data";
import { descreverAve } from "@/lib/formato";
import { useErrosQueEnvelhecem, useMarcacaoFirme } from "@/lib/formulario";
import {
  editarTratamento,
  excluirTratamento,
  registrarTratamento,
  type EstadoSaude,
} from "./acoes";
import styles from "./formulario.module.css";

type Alvo = "ave" | "casal";

/**
 * Registro e correção de tratamento no mesmo formulário.
 *
 * O alvo é ave OU casal: trata-se o casal inteiro quando a aplicação vai na
 * água ou na ração do viveiro, que é como vermífugo e antibiótico costumam ir.
 */
export function FormularioTratamento({
  medicamentos,
  doencas,
  aves,
  casais,
  aveEscolhida,
  emEdicao,
}: {
  medicamentos: Medicamento[];
  doencas: Doenca[];
  aves: OpcaoAve[];
  casais: OpcaoCasal[];
  /** Ave já escolhida na ficha: a tela abre com ela selecionada. */
  aveEscolhida?: string | null;
  emEdicao?: Tratamento;
}) {
  const edicao = Boolean(emEdicao);

  const [estado, acao, enviando] = useActionState<EstadoSaude, FormData>(
    edicao ? editarTratamento : registrarTratamento,
    {},
  );
  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const [alvo, setAlvo] = useState<Alvo>(() => (emEdicao?.casal ? "casal" : "ave"));
  const [aveId, setAveId] = useState(
    () => emEdicao?.ave?.id ?? aveEscolhida ?? "",
  );
  const [casalId, setCasalId] = useState(() => emEdicao?.casal?.id ?? "");
  const [medicamentoId, setMedicamentoId] = useState(
    () => emEdicao?.medicamento?.id ?? "",
  );
  const [doencaId, setDoencaId] = useState(() => emEdicao?.doenca?.id ?? "");
  const [inicio, setInicio] = useState(() => emEdicao?.inicio ?? hojeNoAparelho());
  const [fim, setFim] = useState(() => emEdicao?.fim ?? "");
  const [dosagem, setDosagem] = useState(() => emEdicao?.dosagem ?? "");
  const [observacoes, setObservacoes] = useState(() => emEdicao?.observacoes ?? "");

  const refAve = useMarcacaoFirme(alvo === "ave");
  const refCasal = useMarcacaoFirme(alvo === "casal");

  const escolhido = medicamentos.find((m) => m.id === medicamentoId) ?? null;

  const { id, aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: edicao ? "edicao-tratamento" : "tratamento",
    resumo: () =>
      `${edicao ? "Correção de tratamento" : "Tratamento"} · ${escolhido?.nome ?? "sem medicamento"}`,
  });

  if (salvoNoAparelho) {
    return (
      <SalvoNoAparelho
        titulo={
          edicao ? "Correção salva no aparelho" : "Tratamento salvo no aparelho"
        }
        consequencia="Ele entra no histórico sanitário assim que o registro subir."
        voltarPara="/saude"
        rotuloVoltar="Voltar para a saúde"
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
      <input type="hidden" name="tratamento_id" value={emEdicao?.id ?? id} />

      {estado.erro ? (
        <p className={styles.alerta} role="alert">
          <span className={styles.alertaIcone}>
            <CircleAlert size={16} aria-hidden="true" />
          </span>
          {estado.erro}
        </p>
      ) : null}

      <fieldset className={styles.grupo}>
        <legend className={styles.legenda}>Quem recebeu</legend>
        <div className={styles.chips}>
          <label className={`${styles.chip} ${alvo === "ave" ? styles.chipMarcado : ""}`}>
            <input
              ref={refAve}
              type="radio"
              name="alvo"
              value="ave"
              checked={alvo === "ave"}
              onChange={() => {
                setAlvo("ave");
                marcar("passaro_id");
              }}
              className={styles.radio}
            />
            <span className={styles.chipRotulo}>Uma ave</span>
          </label>
          <label
            className={`${styles.chip} ${alvo === "casal" ? styles.chipMarcado : ""}`}
          >
            <input
              ref={refCasal}
              type="radio"
              name="alvo"
              value="casal"
              checked={alvo === "casal"}
              onChange={() => {
                setAlvo("casal");
                marcar("passaro_id");
              }}
              className={styles.radio}
            />
            <span className={styles.chipRotulo}>Um casal</span>
          </label>
        </div>
      </fieldset>

      {alvo === "ave" ? (
        <Field label="Ave" required error={erro("passaro_id")}>
          {({ id: campoId, descritoPor, invalido }) => (
            <Select
              id={campoId}
              name="passaro_id"
              size="lg"
              value={aveId}
              onChange={(e) => {
                setAveId(e.target.value);
                marcar("passaro_id");
              }}
              aria-describedby={descritoPor}
              invalid={invalido}
            >
              <option value="">Escolha a ave</option>
              {aves.map((a) => (
                <option key={a.id} value={a.id}>
                  {descreverAve(a)}
                  {/* A ave que saiu do plantel fica na lista: o tratamento
                      antigo dela precisa continuar editável. */}
                  {a.fora ? " · fora do plantel" : ""}
                </option>
              ))}
            </Select>
          )}
        </Field>
      ) : (
        <Field label="Casal" required error={erro("passaro_id")}>
          {({ id: campoId, descritoPor, invalido }) => (
            <Select
              id={campoId}
              name="casal_id"
              size="lg"
              value={casalId}
              onChange={(e) => {
                setCasalId(e.target.value);
                marcar("passaro_id");
              }}
              aria-describedby={descritoPor}
              invalid={invalido}
            >
              <option value="">Escolha o casal</option>
              {casais.map((c) => (
                <option key={c.id} value={c.id}>
                  Casal {String(c.numero).padStart(2, "0")}
                  {c.ativo ? "" : " · encerrado"}
                </option>
              ))}
            </Select>
          )}
        </Field>
      )}

      <Field
        label="Medicamento"
        hint={
          escolhido?.carenciaDias
            ? `Carência de ${escolhido.carenciaDias} ${escolhido.carenciaDias === 1 ? "dia" : "dias"}, contada do fim da aplicação.`
            : medicamentos.length === 0
              ? "Nenhum medicamento no catálogo ainda. Dá para registrar sem ele."
              : "Opcional. É dele que vem a carência."
        }
        error={erro("medicamento_id")}
      >
        {({ id: campoId, descritoPor, invalido }) => (
          <Select
            id={campoId}
            name="medicamento_id"
            size="lg"
            value={medicamentoId}
            onChange={(e) => {
              setMedicamentoId(e.target.value);
              marcar("medicamento_id");
              // A dose registrada no catálogo entra como sugestão, e só
              // quando o campo está vazio: sobrescrever o que o criador
              // digitou seria trocar a prescrição dele pela do catálogo.
              const novo = medicamentos.find((m) => m.id === e.target.value);
              if (novo?.dosagem && dosagem.trim() === "") setDosagem(novo.dosagem);
            }}
            aria-describedby={descritoPor}
            invalid={invalido}
          >
            <option value="">Sem medicamento informado</option>
            {medicamentos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
                {m.principioAtivo ? ` · ${m.principioAtivo}` : ""}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        label="Doença"
        hint="Opcional. Dá para tratar sem diagnóstico fechado."
        error={erro("doenca_id")}
      >
        {({ id: campoId, descritoPor, invalido }) => (
          <Select
            id={campoId}
            name="doenca_id"
            size="lg"
            value={doencaId}
            onChange={(e) => {
              setDoencaId(e.target.value);
              marcar("doenca_id");
            }}
            aria-describedby={descritoPor}
            invalid={invalido}
          >
            <option value="">Sem doença informada</option>
            {doencas.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
                {d.doCatalogo ? " · do catálogo" : ""}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <div className={styles.linhaDupla}>
        <Field label="Começou em" required error={erro("inicio")}>
          {({ id: campoId, descritoPor, invalido }) => (
            <Input
              id={campoId}
              name="inicio"
              type="date"
              size="lg"
              numeric
              max={hojeNoAparelho()}
              value={inicio}
              onChange={(e) => {
                setInicio(e.target.value);
                marcar("inicio");
              }}
              aria-describedby={descritoPor}
              invalid={invalido}
              required
            />
          )}
        </Field>

        <Field
          label="Terminou em"
          hint="Em branco: ainda em curso."
          error={erro("fim")}
        >
          {({ id: campoId, descritoPor, invalido }) => (
            <Input
              id={campoId}
              name="fim"
              type="date"
              size="lg"
              numeric
              value={fim}
              onChange={(e) => {
                setFim(e.target.value);
                marcar("fim");
              }}
              aria-describedby={descritoPor}
              invalid={invalido}
            />
          )}
        </Field>
      </div>

      <Field
        label="Dose"
        hint="Como foi aplicado: na água, na ração, por gota."
        error={erro("dosagem")}
      >
        {({ id: campoId, descritoPor, invalido }) => (
          <Input
            id={campoId}
            name="dosagem"
            size="lg"
            autoComplete="off"
            value={dosagem}
            onChange={(e) => {
              setDosagem(e.target.value);
              marcar("dosagem");
            }}
            aria-describedby={descritoPor}
            invalid={invalido}
          />
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
              : "Registrar tratamento"}
        </Button>
        <Link href="/saude" className={styles.cancelar}>
          Cancelar
        </Link>
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
 * Apagar um tratamento, em dois toques — a mesma escolha da pesagem e do
 * lançamento: a consequência cabe onde ela acontece.
 */
export function BotaoExcluirTratamento({
  tratamentoId,
  descricao,
}: {
  tratamentoId: string;
  descricao: string;
}) {
  const [estado, acao, enviando] = useActionState<EstadoSaude, FormData>(
    excluirTratamento,
    {},
  );
  const [confirmando, setConfirmando] = useState(false);

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "exclusao-tratamento",
    resumo: () => `Tratamento excluído · ${descricao}`,
  });

  if (salvoNoAparelho) {
    return <span className={styles.notaLinha}>Salvo no aparelho.</span>;
  }

  if (!confirmando) {
    return (
      <Button variant="ghost" size="md" onClick={() => setConfirmando(true)}>
        Excluir tratamento
      </Button>
    );
  }

  return (
    <form action={acao} onSubmit={aoEnviar} className={styles.confirmacao}>
      <input type="hidden" name="tratamento_id" value={tratamentoId} />

      <span className={styles.pergunta}>
        Excluir mesmo? Ele sai do histórico sanitário da ave.
      </span>
      <Button type="submit" variant="danger" size="md" disabled={enviando}>
        {enviando ? "Excluindo…" : "Excluir"}
      </Button>
      <Button variant="ghost" size="md" onClick={() => setConfirmando(false)}>
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
