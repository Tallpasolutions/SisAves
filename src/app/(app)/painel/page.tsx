import type { Metadata } from "next";
import { Bird, Egg, Feather, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Anilha, Badge, Button, EmptyState, StatCard } from "@/components/ui";
import {
  descreverTarefa,
  detalharTarefa,
  obterTarefasDeHoje,
  type SituacaoTarefa,
  type Tarefa,
} from "@/lib/dados/hoje";
import {
  descreverMovimentacao,
  GRAVIDADE_MOVIMENTACAO,
  listarMovimentacoes,
  obterIndicadoresPainel,
  obterNascimentosPorMes,
  obterResumoTemporada,
  ROTULO_MOVIMENTACAO,
  type MesDeNascimentos,
  type Movimentacao,
} from "@/lib/dados/painel";
import { formatarData, formatarNumero, formatarPercentual } from "@/lib/formato";
import styles from "./painel.module.css";

export const metadata: Metadata = { title: "Painel do criatório" };

const ICONE_INDICADOR: ReactNode[] = [
  <Bird key="aves" size={18} />,
  <Users key="casais" size={18} />,
  <Egg key="ovos" size={18} />,
  <Feather key="nascimentos" size={18} />,
];

const ICONE_TAREFA: Record<SituacaoTarefa, ReactNode> = {
  anilhar: <Feather size={18} />,
  verificar: <Egg size={18} />,
  nascendo: <Bird size={18} />,
  separar: <Users size={18} />,
};

export default async function Painel() {
  const [indicadores, meses, resumo, tarefas, movimentacoes] = await Promise.all([
    obterIndicadoresPainel(),
    obterNascimentosPorMes(),
    obterResumoTemporada(),
    obterTarefasDeHoje(),
    listarMovimentacoes(8),
  ]);

  return (
    <div className={styles.tela}>
      <section className={styles.indicadores}>
        {indicadores.map((indicador, i) => (
          <StatCard
            key={indicador.rotulo}
            label={indicador.rotulo}
            value={formatarNumero(indicador.valor)}
            icon={ICONE_INDICADOR[i]}
            hint={indicador.ajuda}
            // Único bloco de petróleo cheio da tela: o indicador da temporada,
            // que é o que o criador acompanha de mês a mês.
            tone={i === 3 ? "brand" : "neutro"}
            trend={i === 3 && indicador.ajuda.startsWith("+") ? "up" : undefined}
            trendLabel={i === 3 && indicador.ajuda.startsWith("+") ? indicador.ajuda : undefined}
          />
        ))}
      </section>

      <section className={styles.meio}>
        <GraficoNascimentos meses={meses} resumo={resumo} />
        <PainelTarefas tarefas={tarefas} endogamiaMedia={resumo.endogamiaMedia} />
      </section>

      <section className={styles.movimentacoes}>
        <header className={styles.secaoCabecalho}>
          <h2 className={styles.secaoTitulo}>Últimas movimentações</h2>
          <Link href="/ovos" className={styles.verTudo}>
            Ver o ciclo
          </Link>
        </header>

        {movimentacoes.length === 0 ? (
          <EmptyState
            title="Nada registrado ainda"
            description="Postura, eclosão, anilhamento e pesagem aparecem aqui conforme você registra."
            compact
          />
        ) : (
          <div className={styles.tabela} role="table" aria-label="Últimas movimentações">
            <div className={styles.cabecalhoLinha} role="row">
              <span />
              <span role="columnheader">Data</span>
              <span role="columnheader">Evento</span>
              <span role="columnheader">Anilha</span>
              <span role="columnheader">Casal</span>
              <span role="columnheader">Situação</span>
            </div>

            {movimentacoes.map((m) => (
              <LinhaMovimentacao key={m.chave} movimentacao={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * Nascimentos por mês — SVG à mão, não biblioteca.
 *
 * O design proíbe escala multicolorida: todas as barras em petróleo-200, só o
 * mês corrente em petróleo-700. Mês que ainda não chegou não é zero — é
 * desconhecido, e vai em cinza, com "—" no lugar do número.
 */
function GraficoNascimentos({
  meses,
  resumo,
}: {
  meses: MesDeNascimentos[];
  resumo: Awaited<ReturnType<typeof obterResumoTemporada>>;
}) {
  const maior = Math.max(1, ...meses.map((m) => m.nascimentos));

  return (
    <article className={styles.cartao}>
      <header className={styles.cartaoCabecalho}>
        <h2 className={styles.cartaoTitulo}>Nascimentos por mês</h2>
        <span className={styles.cartaoResumo}>
          {[
            String(resumo.ano),
            `${resumo.filhotes} ${resumo.filhotes === 1 ? "filhote" : "filhotes"}`,
            resumo.eclosaoMedia !== null
              ? `eclosão média ${formatarPercentual(resumo.eclosaoMedia, 0)}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </header>

      <div className={styles.grafico}>
        {meses.map((m) => {
          const altura = m.futuro ? 0 : (m.nascimentos / maior) * 100;
          const classe = [
            styles.barra,
            m.atual ? styles.barraAtual : null,
            m.futuro ? styles.barraFutura : null,
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={m.mes} className={styles.coluna}>
              <span className={`${styles.valor} ${m.atual ? styles.valorAtual : ""}`}>
                {m.futuro ? "—" : m.nascimentos}
              </span>
              <div className={styles.trilho}>
                <div
                  className={classe}
                  style={{ height: m.futuro ? "8px" : `max(4px, ${altura}%)` }}
                  role="img"
                  aria-label={
                    m.futuro
                      ? `${m.rotulo}: mês ainda não começou`
                      : `${m.rotulo}: ${m.nascimentos} ${m.nascimentos === 1 ? "filhote" : "filhotes"}`
                  }
                />
              </div>
              <span className={`${styles.mes} ${m.atual ? styles.mesAtual : ""}`}>
                {m.rotulo}
              </span>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function PainelTarefas({
  tarefas,
  endogamiaMedia,
}: {
  tarefas: Tarefa[];
  endogamiaMedia: number | null;
}) {
  // Só as três primeiras: o painel informa, a tela Ovos é onde se trabalha.
  const visiveis = tarefas.slice(0, 3);

  return (
    <article className={styles.cartao}>
      <header className={styles.cartaoCabecalho}>
        <h2 className={styles.cartaoTitulo}>Tarefas pendentes</h2>
        <span className={styles.cartaoResumo}>{tarefas.length}</span>
      </header>

      {visiveis.length === 0 ? (
        <p className={styles.semTarefa}>
          Nenhuma ninhada precisa de ovoscopia, anilhamento ou separação agora.
        </p>
      ) : (
        <ul className={styles.tarefas}>
          {visiveis.map((t) => {
            const urgente = t.situacao === "anilhar";
            return (
              <li
                key={t.chave}
                className={`${styles.tarefa} ${urgente ? styles.tarefaUrgente : ""}`}
              >
                <span
                  className={`${styles.tarefaIcone} ${urgente ? styles.tarefaIconeUrgente : ""}`}
                  aria-hidden="true"
                >
                  {ICONE_TAREFA[t.situacao]}
                </span>
                <span className={styles.tarefaTextos}>
                  <span className={styles.tarefaTitulo}>{descreverTarefa(t)}</span>
                  <span className={styles.tarefaDetalhe}>{detalharTarefa(t)}</span>
                </span>
                {/* Único elemento âmbar de ação da tela, e só com prazo
                    fechando — o anilhamento. */}
                {urgente && t.ninhadaId ? (
                  <Button
                    href={`/ovos/${t.ninhadaId}/anilhar`}
                    variant="accent"
                    size="sm"
                  >
                    Anilhar
                  </Button>
                ) : (
                  // As demais abrem a ninhada, onde a marca é registrada.
                  // Postura antiga, sem ninhada, cai na lista de ovos.
                  <Button
                    href={t.ninhadaId ? `/ovos/${t.ninhadaId}` : "/ovos"}
                    variant="secondary"
                    size="sm"
                  >
                    Abrir
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <footer className={styles.rodapeCartao}>
        <span className={styles.rodapeRotulo}>Endogamia média do plantel</span>
        <span className={styles.rodapeValor}>
          {endogamiaMedia !== null ? formatarPercentual(endogamiaMedia) : "—"}
        </span>
      </footer>
    </article>
  );
}

function LinhaMovimentacao({ movimentacao: m }: { movimentacao: Movimentacao }) {
  const gravidade = GRAVIDADE_MOVIMENTACAO[m.tipo];
  const temAnilha = m.anilha.ano !== null && m.anilha.numero !== null;

  return (
    <div
      className={`${styles.linha} ${gravidade === "critico" ? styles.linhaCritica : ""}`}
      role="row"
    >
      {/* Faixa de gravidade de 3px: o outro dos dois únicos lugares do produto
          com barra colorida à esquerda. */}
      <span
        className={`${styles.faixa} ${styles[`faixa_${gravidade}`]}`}
        aria-hidden="true"
      />
      <span className={styles.celulaData} role="cell">
        {formatarData(m.data)}
      </span>
      <span className={styles.celulaEvento} role="cell">
        {descreverMovimentacao(m)}
      </span>
      <span role="cell">
        {temAnilha ? (
          <Anilha dados={m.anilha} size="sm" tone="quiet" />
        ) : (
          <span className={styles.vazio}>—</span>
        )}
      </span>
      <span className={styles.celulaCasal} role="cell">
        {m.casalNumero !== null ? (
          <Link href={`/casais/${m.casalId}`} className={styles.elo}>
            Casal {String(m.casalNumero).padStart(2, "0")}
          </Link>
        ) : (
          <span className={styles.vazio}>—</span>
        )}
      </span>
      <span role="cell">
        <Badge tone={gravidade} size="sm">
          {ROTULO_MOVIMENTACAO[m.tipo]}
        </Badge>
      </span>
    </div>
  );
}
