import Link from "next/link";
import { CircleAlert, TriangleAlert } from "lucide-react";
import { obterVigencia } from "@/lib/dados/assinatura";
import { souOperador } from "@/lib/dados/operador";
import styles from "./FaixaAssinatura.module.css";

/**
 * O aviso de assinatura, no alto de todas as telas.
 *
 * Existe por causa de onde o bloqueio mora: a RLS recusa a escrita no banco, e
 * o erro que sobe de lá é "new row violates row-level security policy". O
 * criador que descobrisse o bloqueio assim teria preenchido o formulário
 * inteiro para receber uma frase em inglês sobre política de linha.
 *
 * Então avisa ANTES — no teste que está acabando e no vencimento que já
 * aconteceu. É o único âmbar de ação da tela, e só aparece quando há prazo
 * correndo: fora disso não desenha nada.
 */
export async function FaixaAssinatura() {
  const [vigencia, operador] = await Promise.all([
    obterVigencia(),
    souOperador(),
  ]);
  if (!vigencia) return null;

  /*
   * Operador não recebe aviso de vencimento.
   *
   * A 0042 o liberou do bloqueio, mas a faixa continuou contando os dias do
   * período de teste do criatório dele. Um prazo que não vai acontecer, no
   * topo de toda tela, todo dia — e que ensina a ignorar a faixa justamente
   * quando ela for verdadeira para um cliente.
   */
  if (operador) return null;

  // Vencido: a escrita está barrada agora.
  if (!vigencia.comAcesso) {
    return (
      <p
        className={`${styles.faixa} ${styles.vencida}`}
        role="status"
        data-aviso-assinatura
      >
        <span className={styles.icone}>
          <CircleAlert size={18} aria-hidden="true" />
        </span>
        <span className={styles.texto}>
          <strong>Assinatura vencida.</strong> O criatório está em pausa.
          Assine e você encontra tudo como deixou.
        </span>
        <Link className={styles.acao} href="/assinatura">
          Ver assinatura
        </Link>
      </p>
    );
  }

  // Vencendo: avisa com antecedência proporcional ao que resta. Teste de cinco
  // dias avisa desde o começo; ano pago só no último mês.
  const dias = vigencia.diasRestantes;
  if (dias === null) return null;
  const emTeste = vigencia.status === "teste";
  if (dias > (emTeste ? 5 : 15)) return null;

  return (
    <p
      className={`${styles.faixa} ${styles.vencendo}`}
      role="status"
      data-aviso-assinatura
    >
      <span className={styles.icone}>
        <TriangleAlert size={18} aria-hidden="true" />
      </span>
      <span className={styles.texto}>
        {emTeste ? "Período de teste" : "Assinatura"}{" "}
        {dias <= 0
          ? "termina hoje"
          : `termina em ${dias} ${dias === 1 ? "dia" : "dias"}`}
        . Quando acabar, o criatório entra em pausa até você assinar. Nada é
        apagado.
      </span>
      <Link className={styles.acao} href="/assinatura">
        Assinar
      </Link>
    </p>
  );
}
