import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert, CircleCheck, Clock } from "lucide-react";
import { Payment } from "mercadopago";
import { clienteMercadoPago, mercadoPagoConfigurado } from "@/lib/mercadopago/cliente";
import styles from "../assinatura.module.css";

export const metadata: Metadata = { title: "Retorno do pagamento" };

/**
 * A volta do Checkout Pro.
 *
 * **Reconfere no servidor.** O `back_url` traz `collection_status` no query
 * param, e query param é texto que o navegador edita — quem trocasse
 * `?collection_status=rejected` por `approved` veria "pagamento aprovado" numa
 * tela do SisAves. A verdade sai de `Payment.get()`.
 *
 * E esta tela não credita nada: quem move a vigência é o webhook, que chega
 * assinado. Aqui só se informa o criador do que aconteceu — inclusive quando
 * ele fecha a aba e nunca passa por aqui.
 */
export default async function RetornoDoPagamento({
  searchParams,
}: PageProps<"/assinatura/retorno">) {
  const params = await searchParams;
  const idPagamento =
    primeiro(params.collection_id) ?? primeiro(params.payment_id);

  const status = await conferir(idPagamento);

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>{TITULOS[status]}</h1>
        <p className={styles.subtitulo}>{SUBTITULOS[status]}</p>
      </header>

      <p
        className={`${styles.alerta} ${status === "aprovado" ? styles.alertaOk : status === "recusado" ? styles.alertaErro : styles.alertaAviso}`}
        role="status"
      >
        <span className={styles.alertaIcone}>
          {status === "aprovado" ? (
            <CircleCheck size={16} aria-hidden="true" />
          ) : status === "recusado" ? (
            <CircleAlert size={16} aria-hidden="true" />
          ) : (
            <Clock size={16} aria-hidden="true" />
          )}
        </span>
        {MENSAGENS[status]}
      </p>

      <p className={styles.rodapeNota}>
        <Link className={styles.link} href="/assinatura">
          Ver a situação da assinatura
        </Link>
      </p>
    </div>
  );
}

type Situacao = "aprovado" | "pendente" | "recusado" | "desconhecido";

const TITULOS: Record<Situacao, string> = {
  aprovado: "Pagamento aprovado",
  pendente: "Pagamento em processamento",
  recusado: "Pagamento não concluído",
  desconhecido: "Voltando do Mercado Pago",
};

const SUBTITULOS: Record<Situacao, string> = {
  aprovado: "A assinatura do criatório foi renovada.",
  pendente: "Falta a confirmação do Mercado Pago.",
  recusado: "Nenhum valor foi cobrado.",
  desconhecido: "Não foi possível conferir este pagamento agora.",
};

const MENSAGENS: Record<Situacao, string> = {
  aprovado:
    "A vigência é atualizada pela confirmação do Mercado Pago, que costuma chegar em segundos. Se a situação abaixo ainda não mudou, recarregue em um minuto.",
  pendente:
    "PIX leva alguns minutos e boleto pode levar dias úteis. Assim que o Mercado Pago confirmar, a assinatura é liberada sozinha — não é preciso pagar de novo.",
  recusado:
    "Nada foi cobrado. Você pode tentar outra vez, por outro meio de pagamento.",
  desconhecido:
    "Se você concluiu o pagamento, a confirmação chega pelo Mercado Pago e a assinatura é liberada sozinha.",
};

async function conferir(id: string | null): Promise<Situacao> {
  if (!id || !mercadoPagoConfigurado()) return "desconhecido";

  try {
    const pagamento = await new Payment(clienteMercadoPago()).get({ id });
    if (pagamento.status === "approved") return "aprovado";
    if (pagamento.status === "pending" || pagamento.status === "in_process") {
      return "pendente";
    }
    if (pagamento.status === "rejected" || pagamento.status === "cancelled") {
      return "recusado";
    }
    return "desconhecido";
  } catch (erro) {
    console.error("mercadopago/retorno:", erro);
    return "desconhecido";
  }
}

function primeiro(valor: string | string[] | undefined): string | null {
  if (typeof valor === "string") return valor;
  if (Array.isArray(valor)) return valor[0] ?? null;
  return null;
}
