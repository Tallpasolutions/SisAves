"use client";

import { CircleAlert, TriangleAlert, WifiOff } from "lucide-react";
import { useActionState, useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { useEnvioOffline } from "@/components/offline/useEnvioOffline";
import type { EspecieDoCriatorio } from "@/lib/dados/especies";
import { useErrosQueEnvelhecem } from "@/lib/formulario";
import {
  alternarEspecie,
  excluirEspecie,
  salvarPrazos,
  type EstadoEspecie,
} from "../acoes";
import styles from "../especies.module.css";

export function FormularioPrazos({ especie }: { especie: EspecieDoCriatorio }) {
  const [estado, acao, enviando] = useActionState<EstadoEspecie, FormData>(
    salvarPrazos,
    {},
  );
  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const [campos, setCampos] = useState({
    nome: especie.nome,
    dias_ovoscopia: String(especie.diasOvoscopia),
    dias_choco: String(especie.diasChoco),
    dias_anilha: String(especie.diasAnilha),
    janela_anilha_dias: String(especie.janelaAnilhaDias),
    dias_separa: String(especie.diasSepara),
    anilha_mm: especie.anilhaMm === null ? "" : String(especie.anilhaMm).replace(".", ","),
  });

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "especie",
    resumo: () => `Prazos · ${campos.nome}`,
  });

  const mudar = (campo: keyof typeof campos) => (valor: string) => {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
    marcar(campo);
  };

  if (salvoNoAparelho) {
    return (
      <p className={styles.nota}>
        <WifiOff size={14} aria-hidden="true" />
        Salvo no aparelho. Os prazos passam a valer quando o registro subir.
      </p>
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
      <input type="hidden" name="especie_id" value={especie.id} />

      {estado.erro ? (
        <p className={styles.alerta} role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          {estado.erro}
        </p>
      ) : null}

      <Field label="Nome" required error={erro("nome")}>
        {({ id, descritoPor, invalido }) => (
          <Input
            id={id}
            name="nome"
            size="lg"
            autoComplete="off"
            value={campos.nome}
            onChange={(e) => mudar("nome")(e.target.value)}
            aria-describedby={descritoPor}
            invalid={invalido}
            required
          />
        )}
      </Field>

      <fieldset className={styles.grupo}>
        <legend className={styles.grupoTitulo}>Prazos do ciclo</legend>
        <p className={styles.grupoNota}>
          Dias contados da postura para a ovoscopia e o choco; da eclosão para o
          anilhamento e a separação.
        </p>

        <div className={styles.linhaDupla}>
          <CampoDias
            nome="dias_ovoscopia"
            rotulo="Ovoscopia"
            dica="Dias após a postura."
            valor={campos.dias_ovoscopia}
            onMudar={mudar("dias_ovoscopia")}
            erro={erro("dias_ovoscopia")}
          />
          <CampoDias
            nome="dias_choco"
            rotulo="Choco"
            dica="Até a eclosão."
            valor={campos.dias_choco}
            onMudar={mudar("dias_choco")}
            erro={erro("dias_choco")}
          />
        </div>

        <div className={styles.linhaDupla}>
          <CampoDias
            nome="dias_anilha"
            rotulo="Anilhamento"
            dica="Dias após a eclosão."
            valor={campos.dias_anilha}
            onMudar={mudar("dias_anilha")}
            erro={erro("dias_anilha")}
          />
          <CampoDias
            nome="janela_anilha_dias"
            rotulo="Janela da anilha"
            dica="Quantos dias o anel ainda entra."
            valor={campos.janela_anilha_dias}
            onMudar={mudar("janela_anilha_dias")}
            erro={erro("janela_anilha_dias")}
          />
        </div>

        <div className={styles.linhaDupla}>
          <CampoDias
            nome="dias_separa"
            rotulo="Separação"
            dica="Dias após a eclosão."
            valor={campos.dias_separa}
            onMudar={mudar("dias_separa")}
            erro={erro("dias_separa")}
          />

          <Field label="Anilha" hint="Diâmetro em mm. Opcional." error={erro("anilha_mm")}>
            {({ id, descritoPor, invalido }) => (
              <Input
                id={id}
                name="anilha_mm"
                size="lg"
                numeric
                inputMode="decimal"
                suffix="mm"
                value={campos.anilha_mm}
                onChange={(e) => mudar("anilha_mm")(e.target.value)}
                aria-describedby={descritoPor}
                invalid={invalido}
              />
            )}
          </Field>
        </div>
      </fieldset>

      {/* O alcance da mudança, dito antes de confirmar. */}
      {especie.aves > 0 ? (
        <p className={styles.consequencia}>
          <TriangleAlert size={16} aria-hidden="true" />
          <span>
            Os prazos valem para todas as ninhadas desta espécie, inclusive as
            que já estão em curso: a situação de cada ovo é recalculada a partir
            deles toda vez que a tela abre.
          </span>
        </p>
      ) : null}

      <div className={styles.acao}>
        <Button type="submit" size="lg" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar prazos"}
        </Button>
        {!online ? (
          <span className={styles.nota}>
            <WifiOff size={14} aria-hidden="true" />
            Offline — será salvo no aparelho
          </span>
        ) : null}
      </div>
    </form>
  );
}

function CampoDias({
  nome,
  rotulo,
  dica,
  valor,
  onMudar,
  erro,
}: {
  nome: string;
  rotulo: string;
  dica: string;
  valor: string;
  onMudar: (v: string) => void;
  erro?: string;
}) {
  return (
    <Field label={rotulo} required hint={dica} error={erro}>
      {({ id, descritoPor, invalido }) => (
        <Input
          id={id}
          name={nome}
          size="lg"
          numeric
          inputMode="numeric"
          suffix="dias"
          value={valor}
          onChange={(e) => onMudar(e.target.value)}
          aria-describedby={descritoPor}
          invalid={invalido}
          required
        />
      )}
    </Field>
  );
}

/** Tirar da escolha, ou devolver a ela. */
export function BotaoAlternar({ especie }: { especie: EspecieDoCriatorio }) {
  const [estado, acao, enviando] = useActionState<EstadoEspecie, FormData>(
    alternarEspecie,
    {},
  );

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "especie",
    resumo: () => `${especie.ativa ? "Desativar" : "Reativar"} · ${especie.nome}`,
  });

  if (salvoNoAparelho) return <span className={styles.nota}>Salvo no aparelho.</span>;

  return (
    <form action={acao} onSubmit={aoEnviar} className={styles.acaoLinha}>
      <input type="hidden" name="especie_id" value={especie.id} />
      <input type="hidden" name="ativar" value={especie.ativa ? "0" : "1"} />

      <Button type="submit" variant="secondary" size="md" disabled={enviando}>
        {enviando
          ? "Salvando…"
          : especie.ativa
            ? "Tirar do cadastro"
            : "Devolver ao cadastro"}
      </Button>

      {estado.erro ? (
        <span className={styles.erroLinha} role="alert">
          {estado.erro}
        </span>
      ) : null}
      {!online ? <span className={styles.nota}>Offline — será salvo no aparelho</span> : null}
    </form>
  );
}

/**
 * Excluir, em dois toques, e só quando nenhuma ave usa a espécie.
 *
 * `passaros.especie_id` é `on delete set null`: apagar uma espécie em uso
 * deixaria as aves sem espécie e, por tabela, sem os prazos do ciclo delas.
 */
export function BotaoExcluir({ especie }: { especie: EspecieDoCriatorio }) {
  const [estado, acao, enviando] = useActionState<EstadoEspecie, FormData>(
    excluirEspecie,
    {},
  );
  const [confirmando, setConfirmando] = useState(false);

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "exclusao-especie",
    resumo: () => `Espécie excluída · ${especie.nome}`,
  });

  if (salvoNoAparelho) return <span className={styles.nota}>Salvo no aparelho.</span>;

  if (!confirmando) {
    return (
      <Button variant="ghost" size="md" onClick={() => setConfirmando(true)}>
        Excluir espécie
      </Button>
    );
  }

  return (
    <form action={acao} onSubmit={aoEnviar} className={styles.acaoLinha}>
      <input type="hidden" name="especie_id" value={especie.id} />

      <span className={styles.pergunta}>Excluir {especie.nome}?</span>
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
      {!online ? <span className={styles.nota}>Offline — será salvo no aparelho</span> : null}
    </form>
  );
}
