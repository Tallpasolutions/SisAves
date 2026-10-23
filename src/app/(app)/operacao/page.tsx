import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CircleAlert, TriangleAlert } from "lucide-react";
import {
  listarContas,
  listarCriatorios,
  listarPagamentos,
  resumir,
  souOperador,
  type ContaNoPainel,
  type CriatorioNoPainel,
} from "@/lib/dados/operador";
import { formatarData, formatarMoeda } from "@/lib/formato";
import styles from "./operacao.module.css";

export const metadata: Metadata = { title: "Operação" };

/**
 * O painel de quem opera o SisAves.
 *
 * Mostra os criatórios de todos os clientes — a única tela do produto que faz
 * isso. Por isso duas guardas, e elas não são redundantes:
 *
 * 1. `notFound()` aqui, para quem não é operador não descobrir que a rota
 *    existe. Um 403 confirmaria o endereço; o 404 não diz nada.
 * 2. O `where public.sou_admin()` das views, que é a guarda de verdade. Se
 *    esta página tivesse um defeito e renderizasse para qualquer um, as
 *    consultas voltariam vazias assim mesmo.
 *
 * É leitura, só. Estender teste, cancelar assinatura e apagar criatório são
 * ações destrutivas sobre o dado de um cliente, e entram depois, uma a uma,
 * com registro de quem fez.
 */
export default async function Operacao() {
  if (!(await souOperador())) notFound();

  const [criatorios, contas, pagamentos] = await Promise.all([
    listarCriatorios(),
    listarContas(),
    listarPagamentos(),
  ]);
  const resumo = resumir(criatorios, contas, pagamentos);

  const semCriatorio = contas.filter((c) => !c.temCriatorio && !c.eMembro);

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Operação</h1>
        <p className={styles.subtitulo}>
          Quem assinou, quem está testando e quem vence nos próximos dias.
        </p>
      </header>

      <section className={styles.indicadores}>
        <Indicador rotulo="Contas criadas" valor={resumo.contas} />
        <Indicador
          rotulo="Criatórios"
          valor={resumo.criatorios}
          nota={`${resumo.contasSemCriatorio} conta${resumo.contasSemCriatorio === 1 ? "" : "s"} sem criatório`}
        />
        <Indicador rotulo="Em teste" valor={resumo.emTeste} />
        <Indicador rotulo="Assinantes" valor={resumo.ativos} destaque />
      </section>

      <section className={styles.indicadores}>
        <Indicador
          rotulo="Vencendo em 7 dias"
          valor={resumo.vencendo}
          atencao={resumo.vencendo > 0}
        />
        <Indicador rotulo="Vencidos" valor={resumo.vencidos} />
        <Indicador rotulo="Recebido" valor={formatarMoeda(resumo.receita)} />
      </section>

      {/* A lacuna entre criar conta e cadastrar criatório é o abandono mais
          caro: a pessoa quis entrar e parou na primeira tela. Uma contagem de
          inscritos sozinha esconderia isso. */}
      {semCriatorio.length > 0 ? (
        <section className={styles.secao}>
          <h2 className={styles.secaoTitulo}>
            Pararam antes de cadastrar o criatório
          </h2>
          <p className={styles.secaoNota}>
            Criaram conta e não concluíram. É onde o funil vaza.
          </p>
          <TabelaContas contas={semCriatorio} />
        </section>
      ) : null}

      <section className={styles.secao}>
        <h2 className={styles.secaoTitulo}>Criatórios</h2>
        {criatorios.length === 0 ? (
          <p className={styles.vazio}>Nenhum criatório cadastrado ainda.</p>
        ) : (
          <TabelaCriatorios criatorios={criatorios} />
        )}
      </section>

      <section className={styles.secao}>
        <h2 className={styles.secaoTitulo}>Pagamentos</h2>
        {pagamentos.length === 0 ? (
          <p className={styles.vazio}>Nenhum pagamento registrado ainda.</p>
        ) : (
          <div className={styles.rolagem}>
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Criatório</th>
                  <th scope="col">Meio</th>
                  <th scope="col">Situação</th>
                  <th scope="col" className={styles.numerico}>
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((p) => (
                  <tr key={p.id}>
                    <td className={styles.numerico}>{formatarData(p.pagoEm)}</td>
                    <td>{p.criatorio}</td>
                    <td>{descreverMeio(p.meio)}</td>
                    <td>{descreverStatus(p.status)}</td>
                    <td className={styles.numerico}>
                      {p.valor === null ? "—" : formatarMoeda(p.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className={styles.rodapeNota}>
        Esta tela mostra contagens do plantel de cada criatório, nunca o
        conteúdo dele. As aves, a genealogia e os certificados dos clientes
        continuam fora do alcance desta porta.
      </p>
    </div>
  );
}

function Indicador({
  rotulo,
  valor,
  nota,
  destaque = false,
  atencao = false,
}: {
  rotulo: string;
  valor: number | string;
  nota?: string;
  destaque?: boolean;
  atencao?: boolean;
}) {
  return (
    <article
      className={`${styles.indicador} ${destaque ? styles.indicadorDestaque : ""} ${atencao ? styles.indicadorAtencao : ""}`}
    >
      <span className={styles.indicadorRotulo}>{rotulo}</span>
      <span className={styles.indicadorValor}>{valor}</span>
      {nota ? <span className={styles.indicadorNota}>{nota}</span> : null}
    </article>
  );
}

function TabelaCriatorios({ criatorios }: { criatorios: CriatorioNoPainel[] }) {
  return (
    <div className={styles.rolagem}>
      <table className={styles.tabela}>
        <thead>
          <tr>
            <th scope="col">Criatório</th>
            <th scope="col">Dono</th>
            <th scope="col">Entrou</th>
            <th scope="col">Situação</th>
            <th scope="col" className={styles.numerico}>
              Aves
            </th>
            <th scope="col" className={styles.numerico}>
              Ninhadas
            </th>
            <th scope="col" className={styles.numerico}>
              CRO
            </th>
            <th scope="col">Última atividade</th>
          </tr>
        </thead>
        <tbody>
          {criatorios.map((c) => (
            <tr key={c.id}>
              <td>
                <span className={styles.nome}>{c.nome}</span>
                <span className={styles.detalhe}>
                  {[c.clube, [c.cidade, c.uf].filter(Boolean).join("/")]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </span>
              </td>
              <td>
                <span className={styles.nome}>{c.donoNome ?? "—"}</span>
                <span className={styles.detalhe}>{c.donoEmail}</span>
              </td>
              <td className={styles.numerico}>{formatarData(c.criadoEm)}</td>
              <td>
                <Situacao criatorio={c} />
              </td>
              <td className={styles.numerico}>{c.aves}</td>
              <td className={styles.numerico}>{c.ninhadas}</td>
              <td className={styles.numerico}>{c.certificados}</td>
              <td className={styles.numerico}>
                {c.ultimaAtividade ? formatarData(c.ultimaAtividade) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Situacao({ criatorio: c }: { criatorio: CriatorioNoPainel }) {
  if (!c.comAcesso) {
    return (
      <span className={`${styles.chip} ${styles.chipVencido}`}>
        <CircleAlert size={13} aria-hidden="true" />
        Vencido
        {c.fim ? ` · ${formatarData(c.fim)}` : ""}
      </span>
    );
  }

  const vencendo = c.diasRestantes !== null && c.diasRestantes <= 7;
  const rotulo = c.status === "teste" ? "Teste" : "Ativo";

  return (
    <span
      className={`${styles.chip} ${vencendo ? styles.chipVencendo : styles.chipAtivo}`}
    >
      {vencendo ? <TriangleAlert size={13} aria-hidden="true" /> : null}
      {rotulo}
      {c.diasRestantes !== null
        ? ` · ${c.diasRestantes} dia${c.diasRestantes === 1 ? "" : "s"}`
        : ""}
    </span>
  );
}

function TabelaContas({ contas }: { contas: ContaNoPainel[] }) {
  return (
    <div className={styles.rolagem}>
      <table className={styles.tabela}>
        <thead>
          <tr>
            <th scope="col">Nome</th>
            <th scope="col">E-mail</th>
            <th scope="col">Criou a conta</th>
            <th scope="col">E-mail confirmado</th>
            <th scope="col">Último acesso</th>
          </tr>
        </thead>
        <tbody>
          {contas.map((c) => (
            <tr key={c.id}>
              <td>{c.nome ?? "—"}</td>
              <td>{c.email}</td>
              <td className={styles.numerico}>{formatarData(c.criadaEm)}</td>
              <td>{c.emailConfirmado ? "Sim" : "Não"}</td>
              <td className={styles.numerico}>
                {c.ultimoAcesso ? formatarData(c.ultimoAcesso) : "Nunca entrou"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function descreverStatus(status: string): string {
  if (status === "approved") return "Aprovado";
  if (status === "pending") return "Pendente";
  if (status === "in_process") return "Em análise";
  if (status === "rejected") return "Recusado";
  if (status === "cancelled") return "Cancelado";
  if (status === "refunded") return "Devolvido";
  return status;
}

function descreverMeio(meio: string | null): string {
  if (meio === "bank_transfer") return "PIX";
  if (meio === "credit_card") return "Cartão de crédito";
  if (meio === "debit_card") return "Cartão de débito";
  if (meio === "account_money") return "Saldo Mercado Pago";
  if (meio === "ticket") return "Boleto";
  return meio ?? "—";
}
