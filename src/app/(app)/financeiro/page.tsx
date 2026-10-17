import type { Metadata } from "next";
import {
  Award,
  Bird,
  ChevronLeft,
  ChevronRight,
  Egg,
  Syringe,
  TrendingDown,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Anilha, Button, EmptyState, StatCard, Toast } from "@/components/ui";
import {
  listarLancamentos,
  obterSaldoMensal,
  type Lancamento,
  type MesFinanceiro,
} from "@/lib/dados/financeiro";
import {
  deslocarMes,
  iconeDaCategoria,
  mesInvalido,
  rotuloDoMes,
  rotuloVizinho,
  type IconeCategoria,
} from "@/lib/dados/financeiro-rotulos";
import { hojeNoCriatorio } from "@/lib/data";
import { encadear, formatarData, formatarMoeda } from "@/lib/formato";
import styles from "./financeiro.module.css";

export const metadata: Metadata = { title: "Financeiro" };

const GLIFO: Record<IconeCategoria, LucideIcon> = {
  Bird,
  Wallet,
  Syringe,
  Award,
  Egg,
};

/** O mês corrente no fuso do criatório — nunca `new Date()` em UTC. */
function mesCorrente(): string {
  const hoje = hojeNoCriatorio();
  return `${hoje.slice(0, 7)}-01`;
}

export default async function Financeiro({
  searchParams,
}: PageProps<"/financeiro">) {
  const consulta = await searchParams;

  const pedido = typeof consulta.mes === "string" ? consulta.mes : null;
  const corrente = mesCorrente();
  // Mês inválido na URL cai no corrente em vez de dar erro: o parâmetro é
  // navegação, não dado do criatório.
  const mes = pedido && !mesInvalido(pedido) ? pedido : corrente;

  const [serie, lancamentos] = await Promise.all([
    obterSaldoMensal(mes, 6),
    listarLancamentos(mes),
  ]);

  const atual = serie[serie.length - 1];
  const anterior = serie[serie.length - 2];
  const naoHaFuturo = mes >= corrente;

  return (
    <div className={styles.tela}>
      {consulta.registrado === "1" ? (
        <Toast
          tone="ok"
          title="Lançamento registrado"
          description="Ele já entra no saldo do mês e no gráfico do semestre."
        />
      ) : null}
      {consulta.corrigido === "1" ? (
        <Toast
          tone="ok"
          title="Lançamento corrigido"
          description="O saldo do mês foi recalculado com o valor novo."
        />
      ) : null}
      {consulta.excluido === "1" ? (
        <Toast
          tone="ok"
          title="Lançamento excluído"
          description="Ele sai do saldo. A saída da ave, quando houver, continua registrada."
        />
      ) : null}

      <header className={styles.cabecalho}>
        <div className={styles.cabecalhoTextos}>
          <h1 className={styles.titulo}>Financeiro</h1>
          <p className={styles.contexto}>{rotuloDoMes(mes)}</p>
        </div>
        <Button href={`/financeiro/novo?mes=${mes}`} size="lg">
          Novo lançamento
        </Button>
      </header>

      {/* A navegação de mês é link, não botão com estado: funciona sem
          JavaScript e um mês compartilhado abre no mês certo. */}
      <nav className={styles.meses} aria-label="Mês do financeiro">
        <Link
          href={`/financeiro?mes=${deslocarMes(mes, -1)}`}
          className={styles.mesEloAnterior}
        >
          <ChevronLeft size={18} aria-hidden="true" />
          {rotuloVizinho(deslocarMes(mes, -1), mes)}
        </Link>

        {naoHaFuturo ? (
          // Lançamento no futuro não existe: o mês seguinte não tem o que
          // mostrar, e um link vazio ensina a desconfiar da navegação.
          <span className={styles.mesEloInativo} aria-disabled="true">
            {rotuloVizinho(deslocarMes(mes, 1), mes)}
            <ChevronRight size={18} aria-hidden="true" />
          </span>
        ) : (
          <Link
            href={`/financeiro?mes=${deslocarMes(mes, 1)}`}
            className={styles.mesEloSeguinte}
          >
            {rotuloVizinho(deslocarMes(mes, 1), mes)}
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        )}
      </nav>

      <section className={styles.indicadores}>
        <StatCard
          label="Receita"
          size="md"
          value={formatarMoeda(atual.receita)}
          icon={<TrendingUp size={18} />}
        />
        <StatCard
          label="Despesa"
          size="md"
          value={formatarMoeda(atual.despesa)}
          icon={<TrendingDown size={18} />}
        />
      </section>

      {/* O único bloco de petróleo cheio da tela. A prancha `3g` tem também um
          cabeçalho em petróleo; os dois juntos violam o contrato, e o número do
          saldo é quem merece o bloco. */}
      <StatCard
        tone="brand"
        label="Saldo do mês"
        value={formatarMoeda(atual.saldo)}
        hint={
          atual.lancamentos === 0
            ? "nenhum lançamento neste mês"
            : `${atual.lancamentos} ${atual.lancamentos === 1 ? "lançamento" : "lançamentos"}` +
              (anterior && anterior.lancamentos > 0
                ? ` · ${anterior.saldo >= 0 ? "saldo de" : "saldo negativo de"} ${formatarMoeda(Math.abs(anterior.saldo))} em ${rotuloDoMes(anterior.mes).toLowerCase()}`
                : "")
        }
      />

      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>Saldo dos últimos 6 meses</h2>
        <GraficoSaldo serie={serie} mesAtivo={mes} />
      </section>

      <section className={styles.bloco}>
        <div className={styles.blocoCabecalho}>
          <h2 className={styles.blocoTitulo}>Lançamentos</h2>
          <Link href="/financeiro/categorias" className={styles.elo}>
            Categorias
          </Link>
        </div>

        {lancamentos.length === 0 ? (
          <EmptyState
            icon={<Wallet size={28} />}
            title={`Nenhum lançamento em ${rotuloDoMes(mes).toLowerCase()}`}
            description="A venda de ave com valor informado entra aqui sozinha, pela tela de saída. O resto se lança à mão."
            compact
          />
        ) : (
          <ul className={styles.lista}>
            {lancamentos.map((l) => (
              <li key={l.id}>
                <LinhaLancamento lancamento={l} mes={mes} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/**
 * Saldo por mês — SVG nenhum, barras de CSS, como no painel.
 *
 * **Sem número sobre a barra, e é de propósito.** A prancha `3g` escreve "640"
 * e "1.020" acima de cada uma: valor financeiro arredondado, que o contrato
 * proíbe em exibição, e "R$ 1.240,00" não cabe em um sexto de 390px. O valor
 * exato do mês escolhido está nos três indicadores acima, cada barra é um link
 * para o seu mês, e o rótulo acessível de cada uma carrega o número inteiro.
 *
 * Saldo negativo cresce para cima como os outros — é a magnitude que a barra
 * mostra — e vai vazado em tijolo, nunca só pela cor: o rótulo diz "negativo".
 */
function GraficoSaldo({
  serie,
  mesAtivo,
}: {
  serie: MesFinanceiro[];
  mesAtivo: string;
}) {
  const maior = Math.max(1, ...serie.map((m) => Math.abs(m.saldo)));

  return (
    <div className={styles.grafico}>
      {serie.map((m) => {
        const altura = (Math.abs(m.saldo) / maior) * 100;
        const negativo = m.saldo < 0;
        const ativo = m.mes === mesAtivo;

        return (
          <Link
            key={m.mes}
            href={`/financeiro?mes=${m.mes}`}
            className={`${styles.coluna} ${ativo ? styles.colunaAtiva : ""}`}
            aria-current={ativo ? "true" : undefined}
            aria-label={encadear(
              rotuloDoMes(m.mes),
              m.lancamentos === 0
                ? "sem lançamentos"
                : `saldo ${negativo ? "negativo de " : ""}${formatarMoeda(Math.abs(m.saldo))}`,
              m.lancamentos > 0
                ? `${m.lancamentos} ${m.lancamentos === 1 ? "lançamento" : "lançamentos"}`
                : null,
            )}
          >
            <span className={styles.trilho}>
              <span
                className={`${styles.barra} ${negativo ? styles.barraNegativa : ""} ${
                  ativo ? styles.barraAtiva : ""
                }`}
                // Mês sem lançamento não desaparece: fica o traço de 2px, que
                // é o que diferencia "fechou em zero" de "não tem barra".
                style={{ height: `${Math.max(altura, m.lancamentos > 0 ? 4 : 2)}%` }}
              />
            </span>
            <span className={`${styles.mes} ${ativo ? styles.mesAtivo : ""}`}>
              {m.rotulo}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function LinhaLancamento({
  lancamento: l,
  mes,
}: {
  lancamento: Lancamento;
  mes: string;
}) {
  const Icone = GLIFO[iconeDaCategoria(l.categoria?.icone ?? null)];
  const receita = l.tipo === "receita";

  return (
    <Link
      href={`/financeiro/${l.id}/editar?mes=${mes}`}
      className={styles.lancamento}
    >
      <span
        className={`${styles.lancamentoIcone} ${receita ? styles.iconeReceita : ""}`}
        aria-hidden="true"
      >
        <Icone size={18} />
      </span>

      <span className={styles.lancamentoTextos}>
        <span className={styles.lancamentoNome}>
          {l.descricao ?? l.categoria?.nome ?? "Lançamento sem descrição"}
        </span>
        <span className={styles.lancamentoDetalhe}>
          {encadear(
            formatarData(l.data),
            l.descricao && l.categoria ? l.categoria.nome : null,
          )}
        </span>
        {/* A ave citada é fato do lançamento, e é como o criador reencontra a
            receita da venda meses depois. */}
        {l.ave ? (
          <span className={styles.lancamentoAve}>
            <Anilha dados={l.ave.anilha} size="sm" tone="quiet" />
            {l.ave.nome ?? "Sem nome"}
          </span>
        ) : null}
      </span>

      <span
        className={`${styles.lancamentoValor} ${
          receita ? styles.valorReceita : styles.valorDespesa
        }`}
      >
        {/* O sinal vem antes do valor, com o menos tipográfico: o tipo do
            lançamento não pode ser comunicado só por cor. */}
        {receita ? "+ " : "− "}
        {formatarMoeda(l.valor)}
      </span>
    </Link>
  );
}
