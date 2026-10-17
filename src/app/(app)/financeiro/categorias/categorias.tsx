"use client";

import {
  Award,
  Bird,
  CircleAlert,
  Egg,
  Syringe,
  Wallet,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { useActionState, useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { useEnvioOffline } from "@/components/offline/useEnvioOffline";
import type { CategoriaFinanceira } from "@/lib/dados/financeiro";
import {
  ICONES_CATEGORIA,
  TIPOS_LANCAMENTO,
  iconeDaCategoria,
  type IconeCategoria,
  type TipoLancamento,
} from "@/lib/dados/financeiro-rotulos";
import { useErrosQueEnvelhecem, useMarcacaoFirme } from "@/lib/formulario";
import { excluirCategoria, salvarCategoria, type EstadoCategoria } from "../acoes";
import styles from "./categorias.module.css";

const GLIFO: Record<IconeCategoria, LucideIcon> = { Bird, Wallet, Syringe, Award, Egg };

/** O ícone é vocabulário, não enfeite: o léxico do contrato nomeia cada um. */
const ROTULO_ICONE: Record<IconeCategoria, string> = {
  Bird: "Ave",
  Wallet: "Dinheiro",
  Syringe: "Saúde",
  Award: "Certificado",
  Egg: "Ninhada",
};

export function NovaCategoria() {
  const [estado, acao, enviando] = useActionState<EstadoCategoria, FormData>(
    salvarCategoria,
    {},
  );
  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoLancamento>("despesa");
  const [icone, setIcone] = useState<IconeCategoria>("Wallet");

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "categoria-financeira",
    resumo: () => `Categoria · ${nome || "sem nome"}`,
  });

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
      {estado.erro ? (
        <p className={styles.alerta} role="alert">
          <CircleAlert size={14} aria-hidden="true" />
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
            placeholder="Ração, veterinário, anilhas…"
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

      <fieldset className={styles.grupo}>
        <legend className={styles.legenda}>Tipo</legend>
        <div className={styles.chips}>
          {TIPOS_LANCAMENTO.map((t) => (
            <Escolha
              key={t.valor}
              nomeCampo="tipo_novo"
              valor={t.valor}
              rotulo={t.rotulo}
              marcada={tipo === t.valor}
              onEscolher={(v) => {
                setTipo(v as TipoLancamento);
                marcar("tipo");
              }}
            />
          ))}
        </div>
      </fieldset>
      {/* O valor vai em campo oculto: o grupo de rádios precisa de nome único
          para não se misturar com os das linhas de edição. */}
      <input type="hidden" name="tipo" value={tipo} />

      <SeletorIcone
        nomeCampo="icone_novo"
        escolhido={icone}
        onEscolher={(v) => {
          setIcone(v);
          marcar("icone");
        }}
        erro={erro("icone")}
      />
      <input type="hidden" name="icone" value={icone} />

      <div className={styles.acao}>
        <Button type="submit" size="md" disabled={enviando || nome.trim().length < 2}>
          {enviando ? "Criando…" : "Criar categoria"}
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

export function LinhaCategoria({ categoria }: { categoria: CategoriaFinanceira }) {
  return (
    <div className={styles.categoria}>
      <FormularioCategoria categoria={categoria} />
      <BotaoExcluir categoria={categoria} />
    </div>
  );
}

function FormularioCategoria({ categoria }: { categoria: CategoriaFinanceira }) {
  const [estado, acao, enviando] = useActionState<EstadoCategoria, FormData>(
    salvarCategoria,
    {},
  );
  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const [nome, setNome] = useState(categoria.nome);
  const [icone, setIcone] = useState<IconeCategoria>(
    iconeDaCategoria(categoria.icone),
  );

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "categoria-financeira",
    resumo: () => `Categoria · ${nome}`,
  });

  const mudou =
    nome.trim() !== categoria.nome || icone !== iconeDaCategoria(categoria.icone);

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
      <input type="hidden" name="categoria_id" value={categoria.id} />
      {/* O tipo não se edita: ele decide em que lado do saldo a categoria
          aparece, e trocá-lo deixaria os lançamentos antigos no lado errado.
          Vai no formulário porque a ação valida os três campos juntos. */}
      <input type="hidden" name="tipo" value={categoria.tipo} />

      {estado.erro ? (
        <p className={styles.alerta} role="alert">
          <CircleAlert size={14} aria-hidden="true" />
          {estado.erro}
        </p>
      ) : null}

      <Field
        label="Nome"
        hint={
          categoria.usos === undefined
            ? `Categoria de ${categoria.tipo}.`
            : categoria.usos === 0
              ? `Categoria de ${categoria.tipo} · nenhum lançamento a usa.`
              : `Categoria de ${categoria.tipo} · ${categoria.usos} ${categoria.usos === 1 ? "lançamento" : "lançamentos"}.`
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

      <SeletorIcone
        nomeCampo={`icone_${categoria.id}`}
        escolhido={icone}
        onEscolher={(v) => {
          setIcone(v);
          marcar("icone");
        }}
        erro={erro("icone")}
      />
      <input type="hidden" name="icone" value={icone} />

      <div className={styles.acao}>
        <Button
          type="submit"
          variant="secondary"
          size="md"
          disabled={enviando || !mudou}
        >
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

function SeletorIcone({
  nomeCampo,
  escolhido,
  onEscolher,
  erro,
}: {
  nomeCampo: string;
  escolhido: IconeCategoria;
  onEscolher: (v: IconeCategoria) => void;
  erro?: string;
}) {
  return (
    <fieldset className={styles.grupo}>
      <legend className={styles.legenda}>Ícone</legend>
      <div className={styles.icones}>
        {ICONES_CATEGORIA.map((nome) => (
          <EscolhaIcone
            key={nome}
            nomeCampo={nomeCampo}
            valor={nome}
            marcada={escolhido === nome}
            onEscolher={onEscolher}
          />
        ))}
      </div>
      {erro ? (
        <p className={styles.erro} role="alert">
          {erro}
        </p>
      ) : null}
    </fieldset>
  );
}

function EscolhaIcone({
  nomeCampo,
  valor,
  marcada,
  onEscolher,
}: {
  nomeCampo: string;
  valor: IconeCategoria;
  marcada: boolean;
  onEscolher: (v: IconeCategoria) => void;
}) {
  // O reset do React 19 desmarca o radio sem o React reaplicar.
  const ref = useMarcacaoFirme(marcada);
  const Icone = GLIFO[valor];

  return (
    <label className={`${styles.icone} ${marcada ? styles.iconeMarcado : ""}`}>
      <input
        ref={ref}
        type="radio"
        name={nomeCampo}
        value={valor}
        checked={marcada}
        onChange={() => onEscolher(valor)}
        className={styles.marca}
      />
      <Icone size={18} aria-hidden="true" />
      {/* O ícone nunca vai sozinho: o rótulo nomeia o que ele significa. */}
      <span className={styles.iconeRotulo}>{ROTULO_ICONE[valor]}</span>
    </label>
  );
}

function Escolha({
  nomeCampo,
  valor,
  rotulo,
  marcada,
  onEscolher,
}: {
  nomeCampo: string;
  valor: string;
  rotulo: string;
  marcada: boolean;
  onEscolher: (v: string) => void;
}) {
  const ref = useMarcacaoFirme(marcada);

  return (
    <label className={`${styles.chip} ${marcada ? styles.chipMarcado : ""}`}>
      <input
        ref={ref}
        type="radio"
        name={nomeCampo}
        value={valor}
        checked={marcada}
        onChange={() => onEscolher(valor)}
        className={styles.marca}
      />
      <span className={styles.chipRotulo}>{rotulo}</span>
    </label>
  );
}

/**
 * Excluir em dois toques, com a consequência na pergunta.
 *
 * Os lançamentos que usam a categoria **ficam com ela**: a exclusão é lógica e
 * nada no histórico se reescreve. A pergunta diz quantos são, porque é esse o
 * número que faz o criador parar.
 */
function BotaoExcluir({ categoria }: { categoria: CategoriaFinanceira }) {
  const [estado, acao, enviando] = useActionState<EstadoCategoria, FormData>(
    excluirCategoria,
    {},
  );
  const [confirmando, setConfirmando] = useState(false);

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "exclusao-categoria",
    resumo: () => `Categoria excluída · ${categoria.nome}`,
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
      <input type="hidden" name="categoria_id" value={categoria.id} />

      <span className={styles.pergunta}>
        {!categoria.usos
          ? "Excluir esta categoria?"
          : `Excluir? Os ${categoria.usos} ${categoria.usos === 1 ? "lançamento" : "lançamentos"} que a usam continuam com ela.`}
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
