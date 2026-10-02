import type { Metadata } from "next";
import { CircleCheck, Egg, Feather, Sun, Thermometer, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, EmptyState } from "@/components/ui";
import { IndicadorSync } from "@/components/offline/IndicadorSync";
import { PainelPendentes } from "@/components/offline/PainelPendentes";
import { obterCriatorioAtual } from "@/lib/criatorio";
import {
  descreverTarefa,
  detalharTarefa,
  obterIndicadores,
  obterTarefasDeHoje,
  type SituacaoTarefa,
  type Tarefa,
} from "@/lib/dados/hoje";
import { formatarNumero } from "@/lib/formato";
import styles from "./hoje.module.css";

export const metadata: Metadata = { title: "Hoje" };

const ICONE: Record<SituacaoTarefa, ReactNode> = {
  anilhar: <Feather size={18} />,
  verificar: <Egg size={18} />,
  nascendo: <Thermometer size={18} />,
  separar: <Users size={18} />,
};

export default async function Hoje() {
  const [criatorio, tarefas, indicadores] = await Promise.all([
    obterCriatorioAtual(),
    obterTarefasDeHoje(),
    obterIndicadores(),
  ]);

  const urgentes = tarefas.filter((t) => t.situacao === "anilhar");

  return (
    <div className={styles.tela}>
      <header className={styles.cabecalho}>
        <div>
          <p className={styles.rotuloCriatorio}>Criatório</p>
          <h1 className={styles.nomeCriatorio}>{criatorio?.nome}</h1>
        </div>
        <IndicadorSync compact />
      </header>

      {/* Só aparece sem rede ou com registro esperando envio. */}
      <PainelPendentes />

      {/* Único bloco de petróleo cheio da tela. */}
      <section className={styles.destaque}>
        <span className={styles.destaqueIcone} aria-hidden="true">
          <Sun size={20} />
        </span>
        <div>
          <p className={styles.destaqueTitulo}>{resumoDoDia(tarefas.length, urgentes.length)}</p>
          <p className={styles.destaqueTexto}>{detalheDoDia(tarefas, urgentes)}</p>
        </div>
      </section>

      <section className={styles.secao}>
        <h2 className={styles.secaoTitulo}>Tarefas de hoje</h2>

        {tarefas.length === 0 ? (
          <EmptyState
            icon={<CircleCheck size={28} />}
            title="Nenhuma tarefa para hoje"
            description="Nenhuma ninhada precisa de ovoscopia, anilhamento ou separação agora."
            compact
          />
        ) : (
          <ul className={styles.tarefas}>
            {tarefas.map((t) => (
              <li key={t.chave}>
                <LinhaTarefa tarefa={t} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.secao}>
        <h2 className={styles.secaoTitulo}>Plantel</h2>
        <dl className={styles.indicadores}>
          <Indicador rotulo="Aves ativas" valor={indicadores.aves} />
          <Indicador rotulo="Casais ativos" valor={indicadores.casaisAtivos} />
          <Indicador rotulo="Ovos em choco" valor={indicadores.ovosEmChoco} />
          <Indicador rotulo="Nascimentos no mês" valor={indicadores.nascimentosNoMes} />
        </dl>
      </section>
    </div>
  );
}

/**
 * A tarefa de anilhar abre o anilhamento; as outras ainda não têm para onde ir.
 *
 * É a única acionável hoje, e também a única com prazo que fecha — fazer dela
 * um link é o caminho mais curto entre ver a pendência e resolvê-la.
 */
function LinhaTarefa({ tarefa: t }: { tarefa: Tarefa }) {
  const conteudo = (
    <>
      <span className={styles.tarefaIcone} aria-hidden="true">
        {ICONE[t.situacao]}
      </span>
      <div className={styles.tarefaTextos}>
        <span className={styles.tarefaTitulo}>{descreverTarefa(t)}</span>
        <span className={styles.tarefaDetalhe}>{detalharTarefa(t)}</span>
      </div>
      {t.situacao === "anilhar" ? (
        <Badge tone="acao" size="sm" icon={<Feather size={12} />}>
          {t.anilhamentoVencido ? "Atrasado" : "Hoje"}
        </Badge>
      ) : null}
    </>
  );

  const classe = `${styles.tarefa} ${t.situacao === "anilhar" ? styles.tarefaUrgente : ""}`;

  if (t.situacao === "anilhar" && t.ninhadaId) {
    return (
      <Link href={`/ovos/${t.ninhadaId}/anilhar`} className={classe}>
        {conteudo}
      </Link>
    );
  }
  return <article className={classe}>{conteudo}</article>;
}

function Indicador({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className={styles.indicador}>
      <dt className={styles.indicadorRotulo}>{rotulo}</dt>
      <dd className={styles.indicadorValor}>{formatarNumero(valor)}</dd>
    </div>
  );
}

/** Contagem antes do substantivo, e o fato sem adjetivo. */
function resumoDoDia(total: number, urgentes: number): string {
  if (total === 0) return "Nada pendente no galpão";
  if (urgentes > 0) {
    return `${urgentes} ${urgentes === 1 ? "ninhada precisa" : "ninhadas precisam"} de anilha hoje`;
  }
  return `${total} ${total === 1 ? "tarefa" : "tarefas"} para hoje`;
}

function detalheDoDia(tarefas: Tarefa[], urgentes: Tarefa[]): string {
  if (tarefas.length === 0) {
    return "Os prazos das suas espécies estão em dia.";
  }
  if (urgentes.length > 0) {
    const filhotes = urgentes.reduce((soma, t) => soma + t.quantidade, 0);
    // A janela de anilhamento é o que o criador não pode perder: dizer o
    // prazo é mais útil que dizer que é urgente.
    return `${filhotes} ${filhotes === 1 ? "filhote" : "filhotes"} na janela de anilhamento. Passada a janela, a anilha não entra mais.`;
  }
  return "Veja a lista abaixo, do mais urgente para o menos.";
}
