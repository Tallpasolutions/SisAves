import type { Metadata } from "next";
import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-react";
import { obterVigencia, listarPagamentos } from "@/lib/dados/assinatura";
import { mercadoPagoConfigurado } from "@/lib/mercadopago/cliente";
import { PIX_ATIVO } from "@/lib/mercadopago/ofertas";
import { formatarData, formatarMoeda } from "@/lib/formato";
import { FormularioAssinatura } from "./formulario";
import styles from "./assinatura.module.css";

export const metadata: Metadata = { title: "Assinatura" };

export default async function Assinatura() {
  const [vigencia, pagamentos] = await Promise.all([
    obterVigencia(),
    listarPagamentos(),
  ]);
  const configurado = mercadoPagoConfigurado();

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Assinatura</h1>
        <p className={styles.subtitulo}>
          O acesso ao SisAves para o seu criatório.
        </p>
      </header>

      <Situacao vigencia={vigencia} />

      {configurado ? (
        <section className={styles.secao}>
          <h2 className={styles.secaoTitulo}>
            {vigencia?.vigente ? "Renovar" : "Assinar"}
          </h2>
          <FormularioAssinatura
            renovacao={Boolean(vigencia?.vigente)}
            pixAtivo={PIX_ATIVO}
          />
        </section>
      ) : (
        <p className={`${styles.alerta} ${styles.alertaAviso}`} role="status">
          <span className={styles.alertaIcone}>
            <TriangleAlert size={16} aria-hidden="true" />
          </span>
          O pagamento ainda não está configurado neste ambiente. Falta a
          credencial do Mercado Pago no servidor.
        </p>
      )}

      {pagamentos.length > 0 ? (
        <section className={styles.secao}>
          <h2 className={styles.secaoTitulo}>Pagamentos</h2>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th scope="col">Data</th>
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
                  <td>{formatarData(p.em)}</td>
                  <td>{descreverMeio(p.meio)}</td>
                  <td>{descreverStatus(p.status)}</td>
                  <td className={styles.numerico}>
                    {p.valor === null ? "—" : formatarMoeda(p.valor)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}
    </div>
  );
}

function Situacao({
  vigencia,
}: {
  vigencia: Awaited<ReturnType<typeof obterVigencia>>;
}) {
  // Criatório que nunca passou pelo checkout não tem linha nenhuma. É estado
  // de primeira classe, não erro: é a situação de todo criador no primeiro dia.
  if (!vigencia) {
    return (
      <section className={styles.situacao}>
        <span className={styles.situacaoRotulo}>Situação</span>
        <p className={styles.situacaoValor}>Sem assinatura</p>
        <p className={styles.situacaoNota}>
          O plantel, as ninhadas e os certificados continuam seus, assinando ou
          não. A assinatura libera o registro de novos dados.
        </p>
      </section>
    );
  }

  const vencida = !vigencia.vigente && vigencia.status !== "teste";
  const vencendo =
    vigencia.vigente &&
    vigencia.diasRestantes !== null &&
    vigencia.diasRestantes <= 30;

  return (
    <section
      className={`${styles.situacao} ${vencida ? styles.situacaoVencida : ""}`}
    >
      <span className={styles.situacaoRotulo}>Situação</span>
      <p className={styles.situacaoValor}>
        <span className={styles.situacaoIcone}>
          {vencida ? (
            <CircleAlert size={18} aria-hidden="true" />
          ) : (
            <CircleCheck size={18} aria-hidden="true" />
          )}
        </span>
        {rotuloDaSituacao(vigencia.status)}
        {vigencia.fim ? (
          <span className={styles.situacaoAte}>
            {vencida ? "venceu em" : "até"} {formatarData(vigencia.fim)}
          </span>
        ) : null}
      </p>

      {vencendo ? (
        <p className={styles.situacaoNota}>
          Faltam {vigencia.diasRestantes}{" "}
          {vigencia.diasRestantes === 1 ? "dia" : "dias"}. Renovar agora soma ao
          prazo que ainda resta.
        </p>
      ) : null}

      {vencida ? (
        <p className={styles.situacaoNota}>
          O acesso ao criatório está pausado. Tudo o que você cadastrou
          continua guardado e volta assim que o pagamento for confirmado:
          nenhuma ave, ninhada ou certificado foi apagado.
        </p>
      ) : null}
    </section>
  );
}

function rotuloDaSituacao(status: string): string {
  if (status === "ativa") return "Ativa";
  if (status === "teste") return "Em teste";
  if (status === "pendente") return "Pagamento pendente";
  if (status === "vencida") return "Vencida";
  if (status === "cancelada") return "Cancelada";
  return status;
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
