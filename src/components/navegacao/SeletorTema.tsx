"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import styles from "./SeletorTema.module.css";

/**
 * Claro, escuro, ou o que o aparelho mandar.
 *
 * O tema escuro é obrigatório no contrato — eclosão acontece de madrugada, e o
 * criador confere o ninho com o celular na mão. Mas a escolha dele nunca teve
 * controle: `ThemeScript` já lia `localStorage["sisaves-tema"]` e **nada
 * escrevia essa chave**. Quem quisesse o escuro de dia (ou o claro à noite)
 * dependia de mudar o tema do sistema inteiro.
 *
 * Três opções e não um interruptor: "sistema" é um estado de verdade, e é o
 * padrão. Um botão de duas posições obrigaria a escolher para sempre, e perderia
 * o aparelho que escurece sozinho ao anoitecer.
 */
const CHAVE = "sisaves-tema";

type Preferencia = "sistema" | "light" | "dark";

const OPCOES: Array<{ valor: Preferencia; rotulo: string; Icone: typeof Sun }> = [
  { valor: "sistema", rotulo: "Sistema", Icone: Monitor },
  { valor: "light", rotulo: "Claro", Icone: Sun },
  { valor: "dark", rotulo: "Escuro", Icone: Moon },
];

function aplicar(preferencia: Preferencia) {
  const escuro =
    preferencia === "dark" ||
    (preferencia === "sistema" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.setAttribute("data-theme", escuro ? "dark" : "light");
}

/*
 * A preferência mora no `localStorage`, que é estado EXTERNO ao React.
 *
 * `useSyncExternalStore` é o que existe para isso: ele tem instantâneo próprio
 * para o servidor ("sistema"), então o HTML renderizado não diverge do
 * primeiro quadro do cliente, e dispensa o `setState` dentro de efeito que o
 * React 19 recusa. O tema em si não pisca: quem o aplica antes da primeira
 * pintura é o `ThemeScript`, no `<head>`.
 */
const ouvintes = new Set<() => void>();

function inscrever(aoMudar: () => void) {
  ouvintes.add(aoMudar);
  // Outra aba do mesmo criatório mudando o tema também conta.
  window.addEventListener("storage", aoMudar);
  return () => {
    ouvintes.delete(aoMudar);
    window.removeEventListener("storage", aoMudar);
  };
}

function instantaneo(): Preferencia {
  try {
    const salvo = localStorage.getItem(CHAVE);
    return salvo === "light" || salvo === "dark" ? salvo : "sistema";
  } catch {
    // Janela privada ou armazenamento bloqueado: segue o sistema.
    return "sistema";
  }
}

const noServidor = (): Preferencia => "sistema";

export function SeletorTema({ tom = "claro" }: { tom?: "claro" | "escuro" }) {
  const preferencia = useSyncExternalStore(inscrever, instantaneo, noServidor);

  // Em "sistema", o anoitecer do aparelho precisa chegar à tela sem recarregar.
  useEffect(() => {
    if (preferencia !== "sistema") return;
    const consulta = window.matchMedia("(prefers-color-scheme: dark)");
    const aoMudar = () => aplicar("sistema");
    consulta.addEventListener("change", aoMudar);
    return () => consulta.removeEventListener("change", aoMudar);
  }, [preferencia]);

  const escolher = (valor: Preferencia) => {
    try {
      if (valor === "sistema") localStorage.removeItem(CHAVE);
      else localStorage.setItem(CHAVE, valor);
    } catch {
      // Sem armazenamento a escolha vale para esta sessão, e só.
    }
    aplicar(valor);
    // `storage` não dispara na aba que escreveu: avisamos esta à mão.
    for (const aoMudar of ouvintes) aoMudar();
  };

  return (
    <div
      className={`${styles.seletor} ${tom === "escuro" ? styles.sobreEscuro : ""}`}
      role="group"
      aria-label="Tema da interface"
    >
      {OPCOES.map(({ valor, rotulo, Icone }) => {
        const marcado = preferencia === valor;
        return (
          <button
            key={valor}
            type="button"
            className={`${styles.opcao} ${marcado ? styles.marcada : ""}`}
            // O estado não é só a cor de fundo: o leitor de tela recebe
            // `aria-pressed`, e o rótulo visível ganha peso.
            aria-pressed={marcado}
            onClick={() => escolher(valor)}
          >
            <Icone size={16} aria-hidden="true" />
            <span className={styles.rotulo}>{rotulo}</span>
          </button>
        );
      })}
    </div>
  );
}
