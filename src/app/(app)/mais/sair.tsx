"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";
import { Button } from "@/components/ui";
import { sair } from "@/app/(auth)/acoes";
import styles from "./mais.module.css";

/**
 * Sair da conta.
 *
 * Sem confirmação: não destrói nada, e o caminho de volta é a tela de entrar.
 * Fica no fim da lista, separado dos destinos, porque é a única ação aqui que
 * tira o criador do produto.
 */
export function Sair() {
  const [enviando, iniciar] = useTransition();

  return (
    <div className={styles.sair}>
      <Button
        variant="secondary"
        size="lg"
        disabled={enviando}
        iconeEsquerda={<LogOut size={18} aria-hidden="true" />}
        onClick={() => iniciar(() => void sair())}
      >
        {enviando ? "Saindo…" : "Sair da conta"}
      </Button>
    </div>
  );
}
