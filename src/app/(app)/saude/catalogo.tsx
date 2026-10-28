"use client";

import { CircleAlert, WifiOff } from "lucide-react";
import { useActionState, useState, type ReactNode } from "react";
import { Button, Field, Input } from "@/components/ui";
import { useEnvioOffline } from "@/components/offline/useEnvioOffline";
import type { Doenca, ItemCatalogo, Medicamento } from "@/lib/dados/saude";
import type { TipoEscrita } from "@/lib/offline/fila";
import { useErrosQueEnvelhecem, useMarcacaoFirme } from "@/lib/formulario";
import {
  excluirDoenca,
  excluirMedicamento,
  excluirSintoma,
  salvarDoenca,
  salvarMedicamento,
  salvarSintoma,
  type EstadoSaude,
} from "./acoes";
import styles from "./catalogo.module.css";

/*
 * Os três catálogos da saúde — medicamentos, doenças e sintomas.
 *
 * Um arquivo só porque são a mesma mecânica: formulário de criação no topo,
 * uma linha editável por item e exclusão em dois toques. O que muda entre eles
 * são os campos, e isso cada componente diz por si.
 *
 * Item do catálogo compartilhado (`doCatalogo`) não aparece aqui com
 * controles: ele é de todos, e a tela o lista à parte, como as categorias de
 * sistema no financeiro.
 */

// -----------------------------------------------------------------------------
// Medicamentos
// -----------------------------------------------------------------------------

export function NovoMedicamento({ doencas }: { doencas: Doenca[] }) {
  return <FormularioMedicamento doencas={doencas} />;
}

export function LinhaMedicamento({
  medicamento,
  doencas,
}: {
  medicamento: Medicamento;
  doencas: Doenca[];
}) {
  return (
    <div className={styles.item}>
      <FormularioMedicamento medicamento={medicamento} doencas={doencas} />
      <BotaoExcluir
        campo="medicamento_id"
        id={medicamento.id}
        acao={excluirMedicamento}
        tipo="exclusao-medicamento"
        resumo={`Medicamento excluído · ${medicamento.nome}`}
        pergunta={
          medicamento.usos
            ? `Excluir? Os ${medicamento.usos} ${medicamento.usos === 1 ? "tratamento" : "tratamentos"} que o citam continuam com ele.`
            : "Excluir este medicamento?"
        }
      />
    </div>
  );
}

function FormularioMedicamento({
  medicamento,
  doencas,
}: {
  medicamento?: Medicamento;
  doencas: Doenca[];
}) {
  const edicao = Boolean(medicamento);

  const [estado, acao, enviando] = useActionState<EstadoSaude, FormData>(
    salvarMedicamento,
    {},
  );
  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const [nome, setNome] = useState(() => medicamento?.nome ?? "");
  const [principio, setPrincipio] = useState(() => medicamento?.principioAtivo ?? "");
  const [dosagem, setDosagem] = useState(() => medicamento?.dosagem ?? "");
  const [carencia, setCarencia] = useState(() =>
    medicamento?.carenciaDias !== null && medicamento?.carenciaDias !== undefined
      ? String(medicamento.carenciaDias)
      : "",
  );
  const [observacoes, setObservacoes] = useState(() => medicamento?.observacoes ?? "");
  const [marcadas, setMarcadas] = useState<string[]>(() => medicamento?.doencas ?? []);

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    // Gravar os mesmos valores duas vezes dá o mesmo resultado, e o conjunto
    // de doenças é escrito inteiro pela função do banco: não precisa de chave.
    tipo: "medicamento",
    resumo: () => `Medicamento · ${nome || "sem nome"}`,
  });

  if (salvoNoAparelho) return <SalvoAqui />;

  return (
    <form
      action={acao}
      onSubmit={(evento) => {
        enviar();
        aoEnviar(evento);
      }}
      className={styles.formulario}
    >
      {edicao ? (
        <input type="hidden" name="medicamento_id" value={medicamento!.id} />
      ) : null}

      <Alerta mensagem={estado.erro} />

      <Field
        label="Nome"
        hint={
          edicao && medicamento?.usos
            ? `Em ${medicamento.usos} ${medicamento.usos === 1 ? "tratamento" : "tratamentos"}.`
            : "Como está escrito no frasco."
        }
        required
        error={erro("nome")}
      >
        {({ id, descritoPor, invalido }) => (
          <Input
            id={id}
            name="nome"
            size="lg"
            autoComplete="off"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              marcar("nome");
            }}
            aria-describedby={descritoPor}
            invalid={invalido}
            required
          />
        )}
      </Field>

      <div className={styles.linhaDupla}>
        <Field label="Princípio ativo" hint="Opcional." error={erro("principio_ativo")}>
          {({ id, descritoPor, invalido }) => (
            <Input
              id={id}
              name="principio_ativo"
              size="lg"
              autoComplete="off"
              value={principio}
              onChange={(e) => {
                setPrincipio(e.target.value);
                marcar("principio_ativo");
              }}
              aria-describedby={descritoPor}
              invalid={invalido}
            />
          )}
        </Field>

        <Field
          label="Carência"
          hint="Dias de espera depois do fim."
          error={erro("carencia_dias")}
        >
          {({ id, descritoPor, invalido }) => (
            <Input
              id={id}
              name="carencia_dias"
              size="lg"
              numeric
              inputMode="numeric"
              suffix="dias"
              value={carencia}
              onChange={(e) => {
                setCarencia(e.target.value);
                marcar("carencia_dias");
              }}
              aria-describedby={descritoPor}
              invalid={invalido}
            />
          )}
        </Field>
      </div>

      <Field
        label="Dose de referência"
        hint="Entra como sugestão ao registrar um tratamento."
        error={erro("dosagem")}
      >
        {({ id, descritoPor, invalido }) => (
          <Input
            id={id}
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
        {({ id, descritoPor, invalido }) => (
          <Input
            id={id}
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

      <Marcacoes
        legenda="Trata"
        vazio="Nenhuma doença no catálogo ainda."
        nomeCampo="doencas"
        grupo={`med_${medicamento?.id ?? "novo"}`}
        opcoes={doencas.map((d) => ({ id: d.id, nome: d.nome }))}
        marcadas={marcadas}
        onAlternar={setMarcadas}
      />

      <Acao
        enviando={enviando}
        edicao={edicao}
        online={online}
        rotulo="medicamento"
        habilitado={nome.trim().length >= 2}
      />
    </form>
  );
}

// -----------------------------------------------------------------------------
// Doenças
// -----------------------------------------------------------------------------

export function NovaDoenca({ sintomas }: { sintomas: ItemCatalogo[] }) {
  return <FormularioDoenca sintomas={sintomas} />;
}

export function LinhaDoenca({
  doenca,
  sintomas,
}: {
  doenca: Doenca;
  sintomas: ItemCatalogo[];
}) {
  return (
    <div className={styles.item}>
      <FormularioDoenca doenca={doenca} sintomas={sintomas} />
      <BotaoExcluir
        campo="doenca_id"
        id={doenca.id}
        acao={excluirDoenca}
        tipo="exclusao-doenca"
        resumo={`Doença excluída · ${doenca.nome}`}
        pergunta={
          doenca.usos
            ? `Excluir? Os ${doenca.usos} ${doenca.usos === 1 ? "tratamento" : "tratamentos"} que a citam continuam com ela.`
            : "Excluir esta doença?"
        }
      />
    </div>
  );
}

function FormularioDoenca({
  doenca,
  sintomas,
}: {
  doenca?: Doenca;
  sintomas: ItemCatalogo[];
}) {
  const edicao = Boolean(doenca);

  const [estado, acao, enviando] = useActionState<EstadoSaude, FormData>(
    salvarDoenca,
    {},
  );
  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const [nome, setNome] = useState(() => doenca?.nome ?? "");
  const [descricao, setDescricao] = useState(() => doenca?.descricao ?? "");
  const [marcados, setMarcados] = useState<string[]>(() => doenca?.sintomas ?? []);

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "doenca",
    resumo: () => `Doença · ${nome || "sem nome"}`,
  });

  if (salvoNoAparelho) return <SalvoAqui />;

  return (
    <form
      action={acao}
      onSubmit={(evento) => {
        enviar();
        aoEnviar(evento);
      }}
      className={styles.formulario}
    >
      {edicao ? <input type="hidden" name="doenca_id" value={doenca!.id} /> : null}

      <Alerta mensagem={estado.erro} />

      <Field
        label="Nome"
        hint={
          edicao && doenca?.usos
            ? `Em ${doenca.usos} ${doenca.usos === 1 ? "tratamento" : "tratamentos"}.`
            : undefined
        }
        required
        error={erro("nome")}
      >
        {({ id, descritoPor, invalido }) => (
          <Input
            id={id}
            name="nome"
            size="lg"
            autoComplete="off"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              marcar("nome");
            }}
            aria-describedby={descritoPor}
            invalid={invalido}
            required
          />
        )}
      </Field>

      <Field label="Descrição" hint="Opcional." error={erro("descricao")}>
        {({ id, descritoPor, invalido }) => (
          <Input
            id={id}
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

      <Marcacoes
        legenda="Sintomas observados"
        vazio="Nenhum sintoma no catálogo ainda."
        nomeCampo="sintomas"
        grupo={`doe_${doenca?.id ?? "nova"}`}
        opcoes={sintomas.map((s) => ({ id: s.id, nome: s.nome }))}
        marcadas={marcados}
        onAlternar={setMarcados}
      />

      <Acao
        enviando={enviando}
        edicao={edicao}
        online={online}
        rotulo="doença"
        habilitado={nome.trim().length >= 2}
      />
    </form>
  );
}

// -----------------------------------------------------------------------------
// Sintomas
// -----------------------------------------------------------------------------

export function NovoSintoma() {
  return <FormularioSintoma />;
}

export function LinhaSintoma({ sintoma }: { sintoma: ItemCatalogo }) {
  return (
    <div className={styles.item}>
      <FormularioSintoma sintoma={sintoma} />
      <BotaoExcluir
        campo="sintoma_id"
        id={sintoma.id}
        acao={excluirSintoma}
        tipo="exclusao-sintoma"
        resumo={`Sintoma excluído · ${sintoma.nome}`}
        pergunta="Excluir este sintoma? Ele sai das doenças que o listam."
      />
    </div>
  );
}

function FormularioSintoma({ sintoma }: { sintoma?: ItemCatalogo }) {
  const edicao = Boolean(sintoma);

  const [estado, acao, enviando] = useActionState<EstadoSaude, FormData>(
    salvarSintoma,
    {},
  );
  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const [nome, setNome] = useState(() => sintoma?.nome ?? "");
  const [descricao, setDescricao] = useState(() => sintoma?.descricao ?? "");

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "sintoma",
    resumo: () => `Sintoma · ${nome || "sem nome"}`,
  });

  if (salvoNoAparelho) return <SalvoAqui />;

  return (
    <form
      action={acao}
      onSubmit={(evento) => {
        enviar();
        aoEnviar(evento);
      }}
      className={styles.formulario}
    >
      {edicao ? <input type="hidden" name="sintoma_id" value={sintoma!.id} /> : null}

      <Alerta mensagem={estado.erro} />

      <Field label="Nome" required error={erro("nome")}>
        {({ id, descritoPor, invalido }) => (
          <Input
            id={id}
            name="nome"
            size="lg"
            autoComplete="off"
            placeholder="O que se vê na ave"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              marcar("nome");
            }}
            aria-describedby={descritoPor}
            invalid={invalido}
            required
          />
        )}
      </Field>

      <Field label="Descrição" hint="Opcional." error={erro("descricao")}>
        {({ id, descritoPor, invalido }) => (
          <Input
            id={id}
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

      <Acao
        enviando={enviando}
        edicao={edicao}
        online={online}
        rotulo="sintoma"
        habilitado={nome.trim().length >= 2}
      />
    </form>
  );
}

// -----------------------------------------------------------------------------
// Peças compartilhadas
// -----------------------------------------------------------------------------

function Alerta({ mensagem }: { mensagem?: string }): ReactNode {
  if (!mensagem) return null;
  return (
    <p className={styles.alerta} role="alert">
      <CircleAlert size={14} aria-hidden="true" />
      {mensagem}
    </p>
  );
}

function SalvoAqui() {
  return (
    <p className={styles.nota}>
      <WifiOff size={14} aria-hidden="true" />
      Salvo no aparelho. Sobe quando o sinal voltar.
    </p>
  );
}

function Acao({
  enviando,
  edicao,
  online,
  rotulo,
  habilitado,
}: {
  enviando: boolean;
  edicao: boolean;
  online: boolean;
  rotulo: string;
  habilitado: boolean;
}) {
  return (
    <div className={styles.acao}>
      <Button
        type="submit"
        variant={edicao ? "secondary" : "primary"}
        size="md"
        disabled={enviando || !habilitado}
      >
        {enviando
          ? edicao
            ? "Salvando…"
            : "Criando…"
          : edicao
            ? "Salvar"
            : `Criar ${rotulo}`}
      </Button>
      {!online ? (
        <span className={styles.nota}>
          <WifiOff size={14} aria-hidden="true" />
          Offline. Será salvo no aparelho
        </span>
      ) : null}
    </div>
  );
}

/**
 * Conjunto de marcações — os vínculos N:N da saúde.
 *
 * Vai como `checkbox` e não como `<select multiple>`: a roda do sistema no
 * celular não mostra seleção múltipla de forma legível, e o alvo de 44px vale
 * para cada item.
 */
function Marcacoes({
  legenda,
  vazio,
  nomeCampo,
  grupo,
  opcoes,
  marcadas,
  onAlternar,
}: {
  legenda: string;
  vazio: string;
  nomeCampo: string;
  grupo: string;
  opcoes: Array<{ id: string; nome: string }>;
  marcadas: string[];
  onAlternar: (novas: string[]) => void;
}) {
  return (
    <fieldset className={styles.grupo}>
      <legend className={styles.legenda}>{legenda}</legend>
      {opcoes.length === 0 ? (
        <p className={styles.nota}>{vazio}</p>
      ) : (
        <div className={styles.marcacoes}>
          {opcoes.map((o) => (
            <Marcacao
              key={o.id}
              nomeCampo={nomeCampo}
              grupo={grupo}
              opcao={o}
              marcada={marcadas.includes(o.id)}
              onAlternar={() =>
                onAlternar(
                  marcadas.includes(o.id)
                    ? marcadas.filter((m) => m !== o.id)
                    : [...marcadas, o.id],
                )
              }
            />
          ))}
        </div>
      )}
    </fieldset>
  );
}

function Marcacao({
  nomeCampo,
  grupo,
  opcao,
  marcada,
  onAlternar,
}: {
  nomeCampo: string;
  grupo: string;
  opcao: { id: string; nome: string };
  marcada: boolean;
  onAlternar: () => void;
}) {
  // O reset do React 19 desmarca o checkbox no DOM sem o React reaplicar.
  const ref = useMarcacaoFirme(marcada);

  return (
    <label
      className={`${styles.marcacao} ${marcada ? styles.marcacaoMarcada : ""}`}
      key={`${grupo}_${opcao.id}`}
    >
      <input
        ref={ref}
        type="checkbox"
        name={nomeCampo}
        value={opcao.id}
        checked={marcada}
        onChange={onAlternar}
        className={styles.caixa}
      />
      <span className={styles.marcacaoRotulo}>{opcao.nome}</span>
    </label>
  );
}

/**
 * Excluir em dois toques, com a consequência na pergunta — a mesma escolha do
 * catálogo de etiquetas e do de categorias.
 */
function BotaoExcluir({
  campo,
  id,
  acao: acaoServidor,
  tipo,
  resumo,
  pergunta,
}: {
  campo: string;
  id: string;
  acao: (estado: EstadoSaude, dados: FormData) => Promise<EstadoSaude>;
  tipo: TipoEscrita;
  resumo: string;
  pergunta: string;
}) {
  const [estado, acao, enviando] = useActionState<EstadoSaude, FormData>(
    acaoServidor,
    {},
  );
  const [confirmando, setConfirmando] = useState(false);

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo,
    resumo: () => resumo,
  });

  if (salvoNoAparelho) return <span className={styles.nota}>Salvo no aparelho.</span>;

  if (!confirmando) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirmando(true)}>
        Excluir
      </Button>
    );
  }

  return (
    <form action={acao} onSubmit={aoEnviar} className={styles.confirmacao}>
      <input type="hidden" name={campo} value={id} />

      <span className={styles.pergunta}>{pergunta}</span>
      <Button type="submit" variant="danger" size="sm" disabled={enviando}>
        {enviando ? "Excluindo…" : "Excluir"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirmando(false)}>
        Cancelar
      </Button>

      {estado.erro ? (
        <span className={styles.erro} role="alert">
          {estado.erro}
        </span>
      ) : null}
      {!online ? (
        <span className={styles.nota}>Offline. Será salvo no aparelho</span>
      ) : null}
    </form>
  );
}
