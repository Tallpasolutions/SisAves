import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import styles from "./offline.module.css";

export const metadata: Metadata = { title: "Sem conexão" };

/**
 * Última linha de defesa do service worker: a tela pedida nunca foi visitada,
 * então não há nada guardado dela no aparelho.
 *
 * A cópia diz o que é verdade e o que fazer, sem culpar a rede nem mandar
 * "tentar mais tarde" — regra do CLAUDE.md. Esta rota é estática de propósito:
 * precisa funcionar sem sessão, sem banco e sem rede.
 */
export default function SemConexao() {
  return (
    <main className={styles.tela}>
      <span className={styles.icone} aria-hidden="true">
        <WifiOff size={28} />
      </span>
      <h1 className={styles.titulo}>Esta tela ainda não está no aparelho</h1>
      <p className={styles.texto}>
        Sem sinal, o SisAves abre as telas que você já visitou. Esta é a
        primeira vez que ela é pedida neste aparelho, então não há o que mostrar
        ainda.
      </p>
      <p className={styles.texto}>
        O que você registrou offline continua salvo e sobe sozinho quando o
        sinal voltar.
      </p>
      {/* <a> e não <Link>: daqui queremos recarga de verdade. A navegação do
          cliente buscaria a carga RSC, que é exatamente o que não há. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a className={styles.acao} href="/">
        Voltar para Hoje
      </a>
    </main>
  );
}
