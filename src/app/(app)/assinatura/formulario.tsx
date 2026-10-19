"use client";

import { CircleAlert } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui";
import { irParaCheckout, type EstadoAssinatura } from "./acoes";
import styles from "./assinatura.module.css";

/**
 * Os dois botões de pagamento.
 *
 * São dois, e não um com seletor de meio, porque o desconto obriga: no
 * Checkout Pro o comprador escolhe o meio na página do Mercado Pago, DEPOIS de
 * o preço já estar fixado na preferência. Para cobrar R$ 270 no PIX e R$ 290
 * no cartão, a escolha precisa acontecer aqui.
 */
export function FormularioAssinatura({ renovacao }: { renovacao: boolean }) {
  const [estado, acao, enviando] = useActionState<EstadoAssinatura, FormData>(
    irParaCheckout,
    {},
  );

  return (
    <>
      {estado.erro ? (
        <p className={`${styles.alerta} ${styles.alertaErro}`} role="alert">
          <span className={styles.alertaIcone}>
            <CircleAlert size={16} aria-hidden="true" />
          </span>
          {estado.erro}
        </p>
      ) : null}

      <div className={styles.planos}>
        <Plano
          acao={acao}
          enviando={enviando}
          oferta="anual-pix"
          meio="PIX"
          valor="R$ 270,00"
          nota="Confirmação em minutos."
          destaque
        />
        <Plano
          acao={acao}
          enviando={enviando}
          oferta="anual-cartao"
          meio="Cartão"
          valor="R$ 290,00"
          nota="Crédito ou débito, em uma página segura do Mercado Pago."
        />
      </div>

      {enviando ? (
        <p className={styles.carregando} role="status">
          Abrindo o Mercado Pago…
        </p>
      ) : null}

      <p className={styles.rodapeNota}>
        {renovacao
          ? "A renovação soma ao prazo que ainda resta — pagar adiantado não perde os dias que sobraram."
          : "São doze meses a partir da confirmação do pagamento."}{" "}
        O SisAves não vê nem guarda os dados do seu cartão: o pagamento acontece
        inteiro no Mercado Pago.
      </p>
    </>
  );
}

function Plano({
  acao,
  enviando,
  oferta,
  meio,
  valor,
  nota,
  destaque = false,
}: {
  acao: (dados: FormData) => void;
  enviando: boolean;
  oferta: string;
  meio: string;
  valor: string;
  nota: string;
  destaque?: boolean;
}) {
  return (
    <form action={acao} className={styles.plano}>
      <input type="hidden" name="oferta" value={oferta} />
      <span className={styles.planoMeio}>{meio}</span>
      <span className={styles.planoValor}>{valor}</span>
      <span className={styles.planoPeriodo}>por ano</span>
      <p className={styles.planoNota}>{nota}</p>
      <Button
        type="submit"
        size="lg"
        bloco
        variant={destaque ? "primary" : "secondary"}
        disabled={enviando}
        data-mp-checkout-cta="checkout-pro"
      >
        Pagar com Mercado Pago
      </Button>
    </form>
  );
}
