"use client";

import { CircleCheck, WifiOff } from "lucide-react";
import Link from "next/link";
import styles from "./SalvoNoAparelho.module.css";

/**
 * Confirmação de escrita feita sem rede.
 *
 * A diferença entre esta e a confirmação online é deliberada e precisa ficar
 * clara: o registro está no APARELHO, não no servidor. Dizer "salvo" sem
 * ressalva seria fingir que subiu — o que o contrato proíbe. A tela de destino
 * também não serve aqui: ela mostraria o estado de antes, sem este registro.
 */
export function SalvoNoAparelho({
  titulo,
  consequencia,
  voltarPara,
  rotuloVoltar,
}: {
  /** Fato: "Postura salva no aparelho · Ninhada 06 · 5 ovos". */
  titulo: string;
  /** O que acontece com o ciclo quando este registro subir. */
  consequencia?: string;
  voltarPara: string;
  rotuloVoltar: string;
}) {
  return (
    <section className={styles.bloco} role="status">
      <span className={styles.icone} aria-hidden="true">
        <CircleCheck size={24} />
      </span>

      <h2 className={styles.titulo}>{titulo}</h2>
      {consequencia ? <p className={styles.texto}>{consequencia}</p> : null}

      <p className={styles.aviso}>
        <WifiOff size={14} aria-hidden="true" />
        Ainda não subiu para o servidor. Sobe sozinho quando o sinal voltar, e
        até lá aparece como pendente na tela Hoje.
      </p>

      <Link href={voltarPara} className={styles.acao}>
        {rotuloVoltar}
      </Link>
    </section>
  );
}
