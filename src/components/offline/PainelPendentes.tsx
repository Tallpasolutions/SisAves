"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui";
import { descreverItem } from "@/lib/offline/fila";
import { useSincronizacao } from "./Sincronizacao";
import styles from "./PainelPendentes.module.css";

/**
 * O estado "sem conexão" da tela Hoje — prancha `2h`.
 *
 * Duas coisas que a cópia precisa dizer, e que o legado não dizia: que o dado
 * NÃO se perdeu, e que as tarefas na tela são as do último envio, não as de
 * agora. Sem a segunda, o criador acha que a agenda está vazia quando na
 * verdade ela só está velha.
 */
export function PainelPendentes() {
  const { online, pendentes, enviando, ultimoEnvio, sincronizarAgora } =
    useSincronizacao();
  const [dispensado, setDispensado] = useState(false);

  if (online && pendentes.length === 0) return null;
  if (dispensado && online) return null;

  return (
    <section className={styles.painel} aria-label="Estado da sincronização">
      {!online && !dispensado ? (
        <div className={styles.semRede}>
          <span className={styles.semRedeIcone} aria-hidden="true">
            <WifiOff size={22} />
          </span>
          <div className={styles.semRedeTextos}>
            <span className={styles.semRedeTitulo}>Sem conexão com o servidor</span>
            <span className={styles.semRedeTexto}>
              {ultimoEnvio
                ? `Última sincronização às ${ultimoEnvio}. `
                : ""}
              As tarefas de hoje abaixo são as do último envio.
            </span>
          </div>
        </div>
      ) : null}

      {pendentes.length > 0 ? (
        <div className={styles.cartao}>
          <div className={styles.cartaoTopo}>
            <span className={styles.cartaoIcone} aria-hidden="true">
              <RefreshCw size={18} className={enviando ? styles.girando : undefined} />
            </span>
            <span className={styles.cartaoTitulo}>
              {pendentes.length}{" "}
              {pendentes.length === 1
                ? "registro pendente no aparelho"
                : "registros pendentes no aparelho"}
            </span>
          </div>

          <ul className={styles.lista}>
            {pendentes.map((item) => (
              <li key={item.id} className={styles.item}>
                <span className={styles.itemTexto}>{descreverItem(item)}</span>
                {/* O motivo fica à vista: erro de dado não se resolve sozinho,
                    e o criador precisa saber o que corrigir. */}
                {item.ultimoErro && item.tentativas > 0 ? (
                  <span className={styles.itemErro}>{item.ultimoErro}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.acoes}>
        <Button
          variant="secondary"
          size="lg"
          bloco
          onClick={() => void sincronizarAgora()}
          disabled={enviando || pendentes.length === 0}
          iconeEsquerda={<RefreshCw size={18} />}
        >
          {enviando ? "Sincronizando…" : "Tentar sincronizar agora"}
        </Button>

        {!online && !dispensado ? (
          <Button variant="ghost" size="lg" bloco onClick={() => setDispensado(true)}>
            Continuar offline
          </Button>
        ) : null}
      </div>

      <p className={styles.garantia}>
        Nada se perde: o registro fica no aparelho e sobe sozinho quando o sinal
        voltar.
      </p>
    </section>
  );
}
