"use client";

import { CircleAlert, WifiOff } from "lucide-react";
import { useActionState, useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { useEnvioOffline } from "@/components/offline/useEnvioOffline";
import type { EtiquetaDoCriatorio } from "@/lib/dados/casais";
import { CORES_ETIQUETA } from "@/lib/dados/etiquetas";
import { useErrosQueEnvelhecem, useMarcacaoFirme } from "@/lib/formulario";
import { excluirEtiqueta, renomearEtiqueta, type EstadoEtiqueta } from "./acoes";
import styles from "./etiquetas.module.css";

export function LinhaEtiqueta({ etiqueta }: { etiqueta: EtiquetaDoCriatorio }) {
  return (
    <div className={styles.etiqueta}>
      <FormularioEtiqueta etiqueta={etiqueta} />
      <BotaoExcluir etiqueta={etiqueta} />
    </div>
  );
}

function FormularioEtiqueta({ etiqueta }: { etiqueta: EtiquetaDoCriatorio }) {
  const [estado, acao, enviando] = useActionState<EstadoEtiqueta, FormData>(
    renomearEtiqueta,
    {},
  );
  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const [nome, setNome] = useState(etiqueta.nome);
  const [cor, setCor] = useState(etiqueta.cor);

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "etiqueta",
    resumo: () => `Etiqueta · ${nome}`,
  });

  const mudou = nome.trim() !== etiqueta.nome || cor !== etiqueta.cor;

  if (salvoNoAparelho) {
    return (
      <p className={styles.nota}>
        <WifiOff size={14} aria-hidden="true" />
        Salvo no aparelho. Sobe quando o sinal voltar.
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
      <input type="hidden" name="etiqueta_id" value={etiqueta.id} />

      {estado.erro ? (
        <p className={styles.alerta} role="alert">
          <CircleAlert size={14} aria-hidden="true" />
          {estado.erro}
        </p>
      ) : null}

      <Field
        label="Nome"
        hint={
          etiqueta.casais === 0
            ? "Não está em nenhum casal."
            : `Em ${etiqueta.casais} ${etiqueta.casais === 1 ? "casal" : "casais"}.`
        }
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

      <fieldset className={styles.cores}>
        <legend className={styles.coresTitulo}>Cor</legend>
        <div className={styles.coresOpcoes}>
          {CORES_ETIQUETA.map((c) => (
            <ChipCor
              key={c.valor}
              valor={c.valor}
              rotulo={c.rotulo}
              classe={c.classe}
              nomeCampo={`cor_${etiqueta.id}`}
              marcada={cor === c.valor}
              onEscolher={setCor}
            />
          ))}
        </div>
      </fieldset>

      {/* O valor vai num campo oculto: o grupo de rádios precisa de nome
          único por etiqueta para não se misturar com o das outras linhas. */}
      <input type="hidden" name="cor" value={cor} />

      <div className={styles.acao}>
        <Button type="submit" variant="secondary" size="md" disabled={enviando || !mudou}>
          {enviando ? "Salvando…" : "Salvar"}
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

function ChipCor({
  valor,
  rotulo,
  classe,
  nomeCampo,
  marcada,
  onEscolher,
}: {
  valor: string;
  rotulo: string;
  classe: string;
  nomeCampo: string;
  marcada: boolean;
  onEscolher: (v: string) => void;
}) {
  // O reset do React 19 desmarca o radio sem o React reaplicar.
  const ref = useMarcacaoFirme(marcada);

  return (
    <label className={`${styles.cor} ${marcada ? styles.corMarcada : ""}`}>
      <input
        ref={ref}
        type="radio"
        name={nomeCampo}
        value={valor}
        checked={marcada}
        onChange={() => onEscolher(valor)}
        className={styles.marca}
      />
      <span className={`${styles.ponto} ${styles[classe]}`} aria-hidden="true" />
      <span className={styles.corRotulo}>{rotulo}</span>
    </label>
  );
}

/**
 * Excluir em dois toques: o primeiro troca o botão pela pergunta, que diz de
 * quantos casais a etiqueta sai. Não é diálogo modal — a consequência cabe na
 * própria linha, e um modal aqui só esconderia a lista atrás dela.
 */
function BotaoExcluir({ etiqueta }: { etiqueta: EtiquetaDoCriatorio }) {
  const [estado, acao, enviando] = useActionState<EstadoEtiqueta, FormData>(
    excluirEtiqueta,
    {},
  );
  const [confirmando, setConfirmando] = useState(false);

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "exclusao-etiqueta",
    resumo: () => `Etiqueta excluída · ${etiqueta.nome}`,
  });

  if (salvoNoAparelho) {
    return <span className={styles.nota}>Salvo no aparelho.</span>;
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
      <input type="hidden" name="etiqueta_id" value={etiqueta.id} />

      <span className={styles.pergunta}>
        {etiqueta.casais === 0
          ? "Excluir esta etiqueta?"
          : `Excluir? Ela sai de ${etiqueta.casais} ${etiqueta.casais === 1 ? "casal" : "casais"}.`}
      </span>

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
        <span className={styles.nota}>Offline — será salvo no aparelho</span>
      ) : null}
    </form>
  );
}
