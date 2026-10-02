"use client";

import { CircleAlert, TriangleAlert, WifiOff } from "lucide-react";
import { useActionState, useState, type ChangeEvent } from "react";
import { Button, Field, Input } from "@/components/ui";
import { SalvoNoAparelho } from "@/components/offline/SalvoNoAparelho";
import { useEnvioOffline } from "@/components/offline/useEnvioOffline";
import type { FilhoteParaAnilhar, NinhadaParaAnilhar } from "@/lib/dados/anilhamento";
import { formatarData } from "@/lib/formato";
import { useErrosQueEnvelhecem, useMarcacaoFirme } from "@/lib/formulario";
import { anilharFilhotes, type EstadoAnilhamento } from "./acoes";
import styles from "./anilhar.module.css";

interface DadosFilhote {
  marcado: boolean;
  numero: string;
  nome: string;
  peso: string;
}

export function FormularioAnilhamento({ ninhada }: { ninhada: NinhadaParaAnilhar }) {
  const [estado, acao, enviando] = useActionState<EstadoAnilhamento, FormData>(
    anilharFilhotes,
    {},
  );
  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const [sigla, setSigla] = useState(ninhada.anilha.sigla ?? "");
  const [criador, setCriador] = useState(ninhada.anilha.criador ?? "");
  const [ano, setAno] = useState(String(ninhada.anilha.ano));
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));

  const [filhotes, setFilhotes] = useState<Record<string, DadosFilhote>>(() =>
    Object.fromEntries(
      ninhada.filhotes.map((f) => [
        f.posturaId,
        { marcado: true, numero: "", nome: "", peso: "" },
      ]),
    ),
  );

  const atualizar = (id: string, mudanca: Partial<DadosFilhote>) =>
    setFilhotes((atual) => ({ ...atual, [id]: { ...atual[id], ...mudanca } }));

  const marcados = ninhada.filhotes.filter((f) => filhotes[f.posturaId]?.marcado);
  const sugestao = ninhada.anilha.sugestao;

  /**
   * Numera os filhotes marcados em sequência a partir da sugestão.
   *
   * É um BOTÃO, nunca preenchimento silencioso: os anéis saem da cartela em
   * ordem, mas só o criador sabe em qual número ela está — e qual anel entrou
   * em qual filhote.
   */
  const numerarEmSequencia = () => {
    if (sugestao === null) return;
    setFilhotes((atual) => {
      const novo = { ...atual };
      let proximo = sugestao;
      for (const f of ninhada.filhotes) {
        if (!novo[f.posturaId]?.marcado) continue;
        novo[f.posturaId] = { ...novo[f.posturaId], numero: String(proximo) };
        proximo += 1;
      }
      return novo;
    });
  };

  /*
   * O anilhamento não manda chave própria: quem garante a idempotência é a
   * função `anilhar_filhotes`, que recusa filhote já anilhado com mensagem do
   * domínio. O reenvio da fila reconhece essa recusa como sucesso.
   */
  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "anilhamento",
    resumo: () =>
      `Anilhamento · Ninhada ${String(ninhada.ninhadaNumero ?? 0).padStart(2, "0")} · ${marcados.length} ${
        marcados.length === 1 ? "filhote" : "filhotes"
      }`,
  });

  const jaNumerado =
    sugestao !== null &&
    marcados.length > 0 &&
    marcados.every((f, i) => filhotes[f.posturaId]?.numero === String(sugestao + i));

  if (salvoNoAparelho) {
    return (
      <SalvoNoAparelho
        titulo={`Anilhamento salvo no aparelho · ${marcados.length} ${marcados.length === 1 ? "filhote" : "filhotes"}`}
        consequencia="Os filhotes entram no plantel, com a filiação do casal, assim que o registro subir."
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

      <fieldset className={styles.grupo}>
        <legend className={styles.grupoTitulo}>A anilha</legend>
        <p className={styles.grupoNota}>
          Clube, criador e ano são os mesmos para a ninhada toda. O número é de
          cada filhote.
        </p>

        <div className={styles.linhaTripla}>
          <Field label="Clube" error={erro("anilha_sigla")}>
            {({ id, descritoPor, invalido }) => (
              <Input
                id={id}
                name="anilha_sigla"
                size="lg"
                autoComplete="off"
                value={sigla}
                onChange={(e) => {
                  setSigla(e.target.value);
                  marcar("anilha_sigla");
                }}
                aria-describedby={descritoPor}
                invalid={invalido}
              />
            )}
          </Field>

          <Field label="Criador" error={erro("anilha_criador")}>
            {({ id, descritoPor, invalido }) => (
              <Input
                id={id}
                name="anilha_criador"
                size="lg"
                numeric
                autoComplete="off"
                value={criador}
                onChange={(e) => {
                  setCriador(e.target.value);
                  marcar("anilha_criador");
                }}
                aria-describedby={descritoPor}
                invalid={invalido}
              />
            )}
          </Field>

          <Field label="Ano" required error={erro("anilha_ano")}>
            {({ id, descritoPor, invalido }) => (
              <Input
                id={id}
                name="anilha_ano"
                size="lg"
                numeric
                inputMode="numeric"
                value={ano}
                onChange={(e) => {
                  setAno(e.target.value);
                  marcar("anilha_ano");
                }}
                aria-describedby={descritoPor}
                invalid={invalido}
                required
              />
            )}
          </Field>
        </div>

        <Field label="Anilhado em" required error={erro("data_anilhamento")}>
          {({ id, descritoPor, invalido }) => (
            <Input
              id={id}
              name="data_anilhamento"
              type="date"
              size="lg"
              numeric
              max={new Date().toISOString().slice(0, 10)}
              value={data}
              onChange={(e) => {
                setData(e.target.value);
                marcar("data_anilhamento");
              }}
              aria-describedby={descritoPor}
              invalid={invalido}
              required
            />
          )}
        </Field>
      </fieldset>

      <section className={styles.grupo}>
        <h2 className={styles.grupoTitulo}>
          Os filhotes · {marcados.length} de {ninhada.filhotes.length}
        </h2>

        <ul className={styles.filhotes}>
          {ninhada.filhotes.map((f, indice) => (
            <li key={f.posturaId}>
              <LinhaFilhote
                filhote={f}
                ordem={indice + 1}
                dados={filhotes[f.posturaId]}
                onMudar={(m) => atualizar(f.posturaId, m)}
                erro={estado.porFilhote?.[f.posturaId]}
              />
            </li>
          ))}
        </ul>

        {sugestao !== null ? (
          <div className={styles.sugestao}>
            <Button
              variant="secondary"
              size="md"
              onClick={numerarEmSequencia}
              disabled={jaNumerado || marcados.length === 0}
            >
              Numerar a partir de {String(sugestao).padStart(4, "0")}
            </Button>
            <span className={styles.sugestaoNota}>
              Próximo número livre de {ninhada.anilha.ano} neste plantel.
            </span>
          </div>
        ) : null}
      </section>

      <div className={styles.acaoFixa}>
        <div className={styles.acaoFixaInterno}>
          <Button type="submit" size="lg" bloco disabled={enviando}>
            {enviando
              ? "Anilhando…"
              : marcados.length === 1
                ? "Anilhar 1 filhote"
                : `Anilhar ${marcados.length} filhotes`}
          </Button>
          {!online ? (
            <span className={styles.aviso}>
              <WifiOff size={14} aria-hidden="true" />
              Offline — será salvo no aparelho
            </span>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function LinhaFilhote({
  filhote,
  ordem,
  dados,
  onMudar,
  erro,
}: {
  filhote: FilhoteParaAnilhar;
  ordem: number;
  dados: DadosFilhote;
  onMudar: (m: Partial<DadosFilhote>) => void;
  erro?: string;
}) {
  // O reset de formulário do React 19 desmarca o checkbox sem o React reaplicar.
  const refMarca = useMarcacaoFirme(dados.marcado);

  const mudar =
    (campo: keyof DadosFilhote) => (e: ChangeEvent<HTMLInputElement>) =>
      onMudar({ [campo]: e.target.value });

  return (
    <div className={`${styles.filhote} ${dados.marcado ? "" : styles.filhoteFora}`}>
      <input type="hidden" name="postura_id" value={filhote.posturaId} />

      <label className={styles.filhoteTopo}>
        <input
          ref={refMarca}
          type="checkbox"
          name={`anilhar_${filhote.posturaId}`}
          checked={dados.marcado}
          onChange={(e) => onMudar({ marcado: e.target.checked })}
          className={styles.marca}
        />
        <span className={styles.filhoteTextos}>
          <span className={styles.filhoteNome}>Filhote {ordem}</span>
          <span className={styles.filhoteContexto}>
            {filhote.numeroOvo !== null ? `ovo ${filhote.numeroOvo} · ` : ""}
            nasceu {formatarData(filhote.dataEclosao)}
          </span>
        </span>
      </label>

      {filhote.vencido ? (
        <p className={styles.atraso}>
          <TriangleAlert size={14} aria-hidden="true" />
          Janela encerrada em {formatarData(filhote.limiteAnilhamento)}. A anilha
          já não entra na perna sem forçar.
        </p>
      ) : null}

      {dados.marcado ? (
        <div className={styles.filhoteCampos}>
          <Field label="Número da anilha" required error={erro}>
            {({ id, descritoPor, invalido }) => (
              <Input
                id={id}
                name={`numero_${filhote.posturaId}`}
                size="lg"
                numeric
                inputMode="numeric"
                value={dados.numero}
                onChange={mudar("numero")}
                aria-describedby={descritoPor}
                invalid={invalido}
                required
              />
            )}
          </Field>

          <div className={styles.linhaDupla}>
            <Field label="Nome">
              {({ id, descritoPor }) => (
                <Input
                  id={id}
                  name={`nome_${filhote.posturaId}`}
                  size="lg"
                  autoComplete="off"
                  value={dados.nome}
                  onChange={mudar("nome")}
                  aria-describedby={descritoPor}
                />
              )}
            </Field>

            <Field label="Peso">
              {({ id, descritoPor }) => (
                <Input
                  id={id}
                  name={`peso_${filhote.posturaId}`}
                  size="lg"
                  numeric
                  inputMode="decimal"
                  suffix="g"
                  value={dados.peso}
                  onChange={mudar("peso")}
                  aria-describedby={descritoPor}
                />
              )}
            </Field>
          </div>
        </div>
      ) : null}
    </div>
  );
}
