"use client";

import { CircleAlert, WifiOff } from "lucide-react";
import { useMemo, useState, type ChangeEvent } from "react";
import { useActionState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import type { OpcoesCadastroAve } from "@/lib/dados/cadastro";
import { descreverAve } from "@/lib/formato";
import { useErrosQueEnvelhecem, useMarcacaoFirme } from "@/lib/formulario";
import { cadastrarAve, type EstadoCadastroAve } from "./acoes";
import styles from "./nova.module.css";

const SEXOS = [
  { valor: "macho", rotulo: "Macho" },
  { valor: "femea", rotulo: "Fêmea" },
  { valor: "indefinido", rotulo: "Indefinido" },
] as const;

const ORIGENS = [
  { valor: "nascimento_proprio", rotulo: "Nasceu no criatório" },
  { valor: "compra", rotulo: "Compra" },
  { valor: "doacao_recebida", rotulo: "Doação recebida" },
  { valor: "transferencia", rotulo: "Transferência" },
] as const;

type Campos = Record<string, string>;

export function FormularioAve({ opcoes }: { opcoes: OpcoesCadastroAve }) {
  const [estado, acao, enviando] = useActionState<EstadoCadastroAve, FormData>(
    cadastrarAve,
    {},
  );

  /**
   * Todos os campos são controlados, e não é preferência de estilo: o React 19
   * reseta o formulário quando a ação termina — inclusive quando ela volta com
   * erro. Com campos soltos, quem errasse o número da anilha perderia os outros
   * doze dados e teria de digitar tudo de novo, em pé no galpão.
   */
  const [campos, setCampos] = useState<Campos>(() => ({
    nome: "",
    especie_id: opcoes.especies.length === 1 ? opcoes.especies[0].id : "",
    mutacao_id: "",
    sexo: "indefinido",
    dt_nascimento: "",
    origem: "nascimento_proprio",
    anilha_sigla: opcoes.anilha.sigla ?? "",
    anilha_criador: opcoes.anilha.criador ?? "",
    anilha_ano: String(opcoes.anilha.ano),
    anilha_numero: "",
    codigo_alternativo: "",
    pai_id: "",
    mae_id: "",
    observacoes: "",
  }));

  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const mudar =
    (campo: string) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setCampos((atual) => ({ ...atual, [campo]: e.target.value }));
      marcar(campo);
    };

  // Mutação de criatório pertence a uma espécie; a de catálogo vale para todas.
  const mutacoes = useMemo(
    () => opcoes.mutacoes.filter((m) => !m.especieId || m.especieId === campos.especie_id),
    [opcoes.mutacoes, campos.especie_id],
  );

  // Pai e mãe só fazem sentido quando a ave nasceu aqui; de uma ave comprada o
  // criador costuma ter só a descrição dos pais, que entra em observações.
  const mostrarFiliacao = campos.origem === "nascimento_proprio";

  const sugestao = opcoes.anilha.sugestao;
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <form action={acao} onSubmit={enviar} className={styles.formulario}>
      {estado.erro ? (
        <p className={styles.alerta} role="alert">
          <span className={styles.alertaIcone}>
            <CircleAlert size={16} aria-hidden="true" />
          </span>
          {estado.erro}
        </p>
      ) : null}

      <fieldset className={styles.grupo}>
        <legend className={styles.grupoTitulo}>Identificação</legend>

        <Field
          label="Nome"
          hint="Como você chama a ave. Opcional."
          error={erro("nome")}
        >
          {({ id, descritoPor, invalido }) => (
            <Input
              id={id}
              name="nome"
              size="lg"
              autoComplete="off"
              placeholder="Ex.: Tibiriçá"
              value={campos.nome}
              onChange={mudar("nome")}
              aria-describedby={descritoPor}
              invalid={invalido}
            />
          )}
        </Field>

        <Field label="Espécie" required error={erro("especie_id")}>
          {({ id, descritoPor, invalido }) => (
            <Select
              id={id}
              name="especie_id"
              size="lg"
              value={campos.especie_id}
              onChange={mudar("especie_id")}
              aria-describedby={descritoPor}
              invalid={invalido}
              required
            >
              <option value="">Escolha a espécie</option>
              {opcoes.especies.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field
          label="Mutação"
          hint={
            campos.especie_id
              ? "Opcional."
              : "Escolha a espécie para ver as mutações dela."
          }
          error={erro("mutacao_id")}
        >
          {({ id, descritoPor, invalido }) => (
            <Select
              id={id}
              name="mutacao_id"
              size="lg"
              value={campos.mutacao_id}
              onChange={mudar("mutacao_id")}
              disabled={!campos.especie_id || mutacoes.length === 0}
              aria-describedby={descritoPor}
              invalid={invalido}
            >
              <option value="">Sem mutação registrada</option>
              {mutacoes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Sexo
          valor={campos.sexo}
          onMudar={(v) => {
            setCampos((atual) => ({ ...atual, sexo: v }));
            marcar("sexo");
          }}
          erro={erro("sexo")}
        />

        <Field
          label="Nascimento"
          hint="Opcional. A idade na ficha vem desta data."
          error={erro("dt_nascimento")}
        >
          {({ id, descritoPor, invalido }) => (
            <Input
              id={id}
              name="dt_nascimento"
              type="date"
              size="lg"
              numeric
              max={hoje}
              value={campos.dt_nascimento}
              onChange={mudar("dt_nascimento")}
              aria-describedby={descritoPor}
              invalid={invalido}
            />
          )}
        </Field>

        <Field label="Origem" error={erro("origem")}>
          {({ id, descritoPor, invalido }) => (
            <Select
              id={id}
              name="origem"
              size="lg"
              value={campos.origem}
              onChange={mudar("origem")}
              aria-describedby={descritoPor}
              invalid={invalido}
            >
              {ORIGENS.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.rotulo}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </fieldset>

      <fieldset className={styles.grupo}>
        <legend className={styles.grupoTitulo}>Anilha</legend>
        <p className={styles.grupoNota}>
          A anilha é o identificador oficial da ave. Deixe em branco se ela
          ainda não foi anilhada — a ficha dirá “Sem anilha”.
        </p>

        <div className={styles.linhaDupla}>
          <Field label="Clube" error={erro("anilha_sigla")}>
            {({ id, descritoPor, invalido }) => (
              <Input
                id={id}
                name="anilha_sigla"
                size="lg"
                autoComplete="off"
                value={campos.anilha_sigla}
                onChange={mudar("anilha_sigla")}
                placeholder="SOV"
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
                value={campos.anilha_criador}
                onChange={mudar("anilha_criador")}
                placeholder="1234"
                aria-describedby={descritoPor}
                invalid={invalido}
              />
            )}
          </Field>
        </div>

        <div className={styles.linhaDupla}>
          <Field label="Ano" error={erro("anilha_ano")}>
            {({ id, descritoPor, invalido }) => (
              <Input
                id={id}
                name="anilha_ano"
                size="lg"
                numeric
                inputMode="numeric"
                value={campos.anilha_ano}
                onChange={mudar("anilha_ano")}
                aria-describedby={descritoPor}
                invalid={invalido}
              />
            )}
          </Field>

          <Field label="Número" error={erro("anilha_numero")}>
            {({ id, descritoPor, invalido }) => (
              <Input
                id={id}
                name="anilha_numero"
                size="lg"
                numeric
                inputMode="numeric"
                value={campos.anilha_numero}
                onChange={mudar("anilha_numero")}
                aria-describedby={descritoPor}
                invalid={invalido}
              />
            )}
          </Field>
        </div>

        {/* A sugestão é um BOTÃO, nunca preenchimento silencioso: o anel está
            na perna da ave e só o criador sabe qual pegou da cartela. */}
        {sugestao !== null ? (
          <div className={styles.sugestao}>
            <Button
              variant="secondary"
              size="md"
              onClick={() =>
                setCampos((atual) => ({ ...atual, anilha_numero: String(sugestao) }))
              }
              disabled={campos.anilha_numero === String(sugestao)}
            >
              Usar sugestão · {String(sugestao).padStart(4, "0")}
            </Button>
            <span className={styles.sugestaoNota}>
              Próximo número livre de {opcoes.anilha.ano} neste plantel.
            </span>
          </div>
        ) : null}

        <Field
          label="Código alternativo"
          hint="Opcional. Ex.: COBP-25-04781."
          error={erro("codigo_alternativo")}
        >
          {({ id, descritoPor, invalido }) => (
            <Input
              id={id}
              name="codigo_alternativo"
              size="lg"
              autoComplete="off"
              value={campos.codigo_alternativo}
              onChange={mudar("codigo_alternativo")}
              aria-describedby={descritoPor}
              invalid={invalido}
            />
          )}
        </Field>
      </fieldset>

      {mostrarFiliacao ? (
        <fieldset className={styles.grupo}>
          <legend className={styles.grupoTitulo}>Filiação</legend>
          <p className={styles.grupoNota}>
            Pai e mãe alimentam a árvore genealógica e o coeficiente de
            endogamia. Só aves no plantel ativo aparecem na lista.
          </p>

          <Field label="Pai" error={erro("pai_id")}>
            {({ id, descritoPor, invalido }) => (
              <Select
                id={id}
                name="pai_id"
                size="lg"
                value={campos.pai_id}
                onChange={mudar("pai_id")}
                disabled={opcoes.machos.length === 0}
                aria-describedby={descritoPor}
                invalid={invalido}
              >
                <option value="">Desconhecido</option>
                {opcoes.machos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {descreverAve(p)}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Mãe" error={erro("mae_id")}>
            {({ id, descritoPor, invalido }) => (
              <Select
                id={id}
                name="mae_id"
                size="lg"
                value={campos.mae_id}
                onChange={mudar("mae_id")}
                disabled={opcoes.femeas.length === 0}
                aria-describedby={descritoPor}
                invalid={invalido}
              >
                <option value="">Desconhecido</option>
                {opcoes.femeas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {descreverAve(p)}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </fieldset>
      ) : null}

      <Field
        label="Observações"
        hint="Opcional. De onde veio, nome dos pais quando não estão no plantel, marcas."
        error={erro("observacoes")}
      >
        {({ id, descritoPor, invalido }) => (
          <Input
            id={id}
            name="observacoes"
            size="lg"
            value={campos.observacoes}
            onChange={mudar("observacoes")}
            aria-describedby={descritoPor}
            invalid={invalido}
          />
        )}
      </Field>

      <div className={styles.acaoFixa}>
        <div className={styles.acaoFixaInterno}>
          <Button type="submit" size="lg" bloco disabled={enviando}>
            {enviando ? "Cadastrando…" : "Cadastrar ave"}
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

/**
 * Sexo em três alvos lado a lado, com o nome escrito.
 *
 * Não é `SexChip` — aquele é exibição. Aqui vale a regra de acessibilidade do
 * contrato: o sexo nunca é comunicado só por cor, e cada alvo tem 48px.
 */
function Sexo({
  valor,
  onMudar,
  erro,
}: {
  valor: string;
  onMudar: (v: string) => void;
  erro?: string;
}) {
  return (
    <fieldset className={styles.sexo}>
      <legend className={styles.rotuloSexo}>Sexo</legend>
      <div className={styles.sexoOpcoes}>
        {SEXOS.map((s) => (
          <OpcaoSexo
            key={s.valor}
            valor={s.valor}
            rotulo={s.rotulo}
            marcado={valor === s.valor}
            onMudar={onMudar}
          />
        ))}
      </div>
      {erro ? (
        <span className={styles.sexoErro} role="alert">
          <CircleAlert size={14} aria-hidden="true" />
          {erro}
        </span>
      ) : null}
    </fieldset>
  );
}

function OpcaoSexo({
  valor,
  rotulo,
  marcado,
  onMudar,
}: {
  valor: string;
  rotulo: string;
  marcado: boolean;
  onMudar: (v: string) => void;
}) {
  // O reset de formulário do React 19 desmarca o radio sem o React reaplicar.
  const ref = useMarcacaoFirme(marcado);

  return (
    <label className={styles.sexoOpcao}>
      <input
        ref={ref}
        type="radio"
        name="sexo"
        value={valor}
        checked={marcado}
        onChange={(e) => onMudar(e.target.value)}
        className={styles.sexoEntrada}
      />
      <span className={styles.sexoRotulo}>{rotulo}</span>
    </label>
  );
}
