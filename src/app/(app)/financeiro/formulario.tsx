"use client";

import { CircleAlert, WifiOff } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { SalvoNoAparelho } from "@/components/offline/SalvoNoAparelho";
import { useEnvioOffline } from "@/components/offline/useEnvioOffline";
import type { CategoriaFinanceira, Lancamento, OpcaoAveLancamento } from "@/lib/dados/financeiro";
import { TIPOS_LANCAMENTO, type TipoLancamento } from "@/lib/dados/financeiro-rotulos";
import { hojeNoAparelho } from "@/lib/data";
import { descreverAve, formatarMoeda } from "@/lib/formato";
import { useErrosQueEnvelhecem, useMarcacaoFirme } from "@/lib/formulario";
import {
  editarLancamento,
  excluirLancamento,
  registrarLancamento,
  type EstadoLancamento,
} from "./acoes";
import styles from "./formulario.module.css";

/**
 * Lançamento e correção no mesmo formulário.
 *
 * São os mesmos seis campos e as mesmas regras; duas cópias garantiriam que a
 * próxima validação entrasse só numa — foi a lição da pesagem.
 */
export function FormularioLancamento({
  categorias,
  aves,
  mes,
  emEdicao,
}: {
  categorias: CategoriaFinanceira[];
  aves: OpcaoAveLancamento[];
  /** O mês que estava na tela, para o cancelar voltar onde estava. */
  mes: string;
  emEdicao?: Lancamento;
}) {
  const edicao = Boolean(emEdicao);

  const [estado, acao, enviando] = useActionState<EstadoLancamento, FormData>(
    edicao ? editarLancamento : registrarLancamento,
    {},
  );
  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const [tipo, setTipo] = useState<TipoLancamento>(() => emEdicao?.tipo ?? "despesa");
  // "1.340,50", como o criador digitou e como a lista mostra. O ponto de
  // milhar é retirado antes de validar, dos dois lados.
  const [valor, setValor] = useState(() =>
    emEdicao ? formatarDecimal(emEdicao.valor) : "",
  );
  const [data, setData] = useState(
    () => emEdicao?.data ?? `${mes.slice(0, 7)}-${diaInicialDoMes(mes)}`,
  );
  const [categoriaId, setCategoriaId] = useState(() => emEdicao?.categoria?.id ?? "");
  const [descricao, setDescricao] = useState(() => emEdicao?.descricao ?? "");
  const [aveId, setAveId] = useState(() => emEdicao?.ave?.id ?? "");

  /*
   * A lista de categorias segue o tipo escolhido — e a categoria JÁ GRAVADA
   * entra de volta mesmo quando não cabe no filtro.
   *
   * É a terceira vez que esta armadilha aparece no projeto (progenitores,
   * contexto de pesagem, e agora aqui): um `<select>` filtrado numa tela de
   * edição some com o valor guardado, o campo cai para vazio, e salvar outro
   * dado apaga a categoria em silêncio.
   */
  const doTipo = categorias.filter((c) => c.tipo === tipo);
  const guardada = emEdicao?.categoria;
  const guardadaFora =
    guardada && !doTipo.some((c) => c.id === guardada.id) ? guardada : null;

  const refTipoReceita = useMarcacaoFirme(tipo === "receita");
  const refTipoDespesa = useMarcacaoFirme(tipo === "despesa");

  const { id, aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    // A correção é idempotente por natureza: gravar os mesmos valores duas
    // vezes dá o mesmo resultado.
    tipo: edicao ? "edicao-lancamento" : "lancamento",
    resumo: () =>
      `${edicao ? "Correção de lançamento" : tipo === "receita" ? "Receita" : "Despesa"} · ${
        formatarMoeda(Number(valor.replace(/\./g, "").replace(",", "."))) || "?"
      }`,
  });

  if (salvoNoAparelho) {
    return (
      <SalvoNoAparelho
        titulo={`${edicao ? "Correção" : tipo === "receita" ? "Receita" : "Despesa"} salva no aparelho`}
        consequencia="O saldo do mês passa a contar com ela assim que o registro subir."
        voltarPara={`/financeiro?mes=${mes}`}
        rotuloVoltar="Voltar para o financeiro"
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
      {/* No lançamento a chave nasce aqui, e é ela que torna o reenvio da fila
          idempotente. Na correção é o id do lançamento que está sendo acertado. */}
      <input type="hidden" name="lancamento_id" value={emEdicao?.id ?? id} />

      {estado.erro ? (
        <p className={styles.alerta} role="alert">
          <span className={styles.alertaIcone}>
            <CircleAlert size={16} aria-hidden="true" />
          </span>
          {estado.erro}
        </p>
      ) : null}

      <fieldset className={styles.grupo}>
        <legend className={styles.legenda}>Tipo</legend>
        <div className={styles.chips}>
          {TIPOS_LANCAMENTO.map((t) => (
            <label
              key={t.valor}
              className={`${styles.chip} ${tipo === t.valor ? styles.chipMarcado : ""}`}
            >
              <input
                ref={t.valor === "receita" ? refTipoReceita : refTipoDespesa}
                type="radio"
                name="tipo"
                value={t.valor}
                checked={tipo === t.valor}
                onChange={() => {
                  setTipo(t.valor);
                  // A categoria do outro tipo não serve: trocar o tipo sem
                  // limpar deixaria "Ração" numa receita.
                  if (!categorias.some((c) => c.id === categoriaId && c.tipo === t.valor)) {
                    setCategoriaId("");
                  }
                  marcar("tipo");
                  marcar("categoria_id");
                }}
                className={styles.radio}
              />
              <span className={styles.chipRotulo}>{t.rotulo}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.linhaDupla}>
        <Field label="Valor" required error={erro("valor")}>
          {({ id: campoId, descritoPor, invalido }) => (
            <Input
              id={campoId}
              name="valor"
              size="lg"
              numeric
              inputMode="decimal"
              prefix="R$"
              autoFocus
              value={valor}
              onChange={(e) => {
                setValor(e.target.value);
                marcar("valor");
              }}
              aria-describedby={descritoPor}
              invalid={invalido}
              required
            />
          )}
        </Field>

        <Field label="Data" required error={erro("data")}>
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
        label="Categoria"
        hint="Opcional. É por ela que o relatório separa ração de veterinário."
        error={erro("categoria_id")}
      >
        {({ id: campoId, descritoPor, invalido }) => (
          <Select
            id={campoId}
            name="categoria_id"
            size="lg"
            value={categoriaId}
            onChange={(e) => {
              setCategoriaId(e.target.value);
              marcar("categoria_id");
            }}
            aria-describedby={descritoPor}
            invalid={invalido}
          >
            <option value="">Sem categoria</option>
            {guardadaFora ? (
              <option value={guardadaFora.id}>
                {guardadaFora.nome} (categoria de {guardadaFora.tipo})
              </option>
            ) : null}
            {doTipo.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
                {c.chave ? " · do sistema" : ""}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        label="Descrição"
        hint="O que o criador vai procurar daqui a seis meses."
        error={erro("descricao")}
      >
        {({ id: campoId, descritoPor, invalido }) => (
          <Input
            id={campoId}
            name="descricao"
            size="lg"
            autoComplete="off"
            value={descricao}
            onChange={(e) => {
              setDescricao(e.target.value);
              marcar("descricao");
            }}
            aria-describedby={descritoPor}
            invalid={invalido}
          />
        )}
      </Field>

      <Field
        label="Ave"
        hint="Opcional. Liga o valor a uma ave — é como a receita da venda se reencontra."
        error={erro("passaro_id")}
      >
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
            <option value="">Nenhuma ave</option>
            {aves.map((a) => (
              <option key={a.id} value={a.id}>
                {descreverAve(a)}
                {/* A ave que saiu do plantel continua na lista: a receita da
                    venda é justamente dela. A lista diz, em vez de esconder. */}
                {a.fora ? " · fora do plantel" : ""}
              </option>
            ))}
          </Select>
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
              : "Registrar lançamento"}
        </Button>
        <Link href={`/financeiro?mes=${mes}`} className={styles.cancelar}>
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

/** 1.340,50 — o número como o teclado pt-BR o escreve, sem o "R$" do prefixo. */
function formatarDecimal(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

/**
 * O dia que o campo de data sugere.
 *
 * No mês corrente é hoje; num mês passado é o dia 1º, porque "hoje" cairia
 * fora do mês que o criador está olhando e a guarda de futuro o recusaria.
 */
function diaInicialDoMes(mes: string): string {
  const hoje = hojeNoAparelho();
  return hoje.slice(0, 7) === mes.slice(0, 7) ? hoje.slice(8, 10) : "01";
}

/**
 * Apagar um lançamento, em dois toques.
 *
 * O primeiro troca o botão pela pergunta; o segundo apaga. Mesma escolha da
 * pesagem: a consequência cabe onde ela acontece, e um modal custaria foco
 * preso e tela coberta para confirmar o que já está escrito ali.
 */
export function BotaoExcluirLancamento({
  lancamentoId,
  mes,
  descricao,
}: {
  lancamentoId: string;
  mes: string;
  descricao: string;
}) {
  const [estado, acao, enviando] = useActionState<EstadoLancamento, FormData>(
    excluirLancamento,
    {},
  );
  const [confirmando, setConfirmando] = useState(false);

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "exclusao-lancamento",
    resumo: () => `Lançamento excluído · ${descricao}`,
  });

  if (salvoNoAparelho) {
    return <span className={styles.notaLinha}>Salvo no aparelho.</span>;
  }

  if (!confirmando) {
    return (
      <Button variant="ghost" size="md" onClick={() => setConfirmando(true)}>
        Excluir lançamento
      </Button>
    );
  }

  return (
    <form action={acao} onSubmit={aoEnviar} className={styles.confirmacao}>
      <input type="hidden" name="lancamento_id" value={lancamentoId} />
      <input type="hidden" name="mes" value={mes} />

      <span className={styles.pergunta}>
        Excluir mesmo? Ele sai do saldo do mês.
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
