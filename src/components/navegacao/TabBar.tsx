"use client";

import { Bird, Egg, Menu, Sun, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationBadge } from "@/components/ui";
import styles from "./TabBar.module.css";

/**
 * Telas de formulário substituem a tab bar pela ação fixa na base, em vez de
 * empilhar as duas — docs/design/05-telas.md, decisão transversal 1. Sem isto
 * o botão de salvar fica atrás da navegação.
 */
const ROTAS_SEM_BARRA = [
  /^\/casais\/[^/]+\/postura$/,
  /^\/plantel\/nova$/,
  /^\/casais\/novo$/,
];

const DESTINOS = [
  { href: "/", rotulo: "Hoje", Icone: Sun },
  { href: "/plantel", rotulo: "Plantel", Icone: Bird },
  { href: "/casais", rotulo: "Casais", Icone: Users },
  { href: "/ovos", rotulo: "Ovos", Icone: Egg },
  { href: "/mais", rotulo: "Mais", Icone: Menu },
] as const;

export function TabBar({ tarefasPendentes = 0 }: { tarefasPendentes?: number }) {
  const caminho = usePathname();

  if (ROTAS_SEM_BARRA.some((padrao) => padrao.test(caminho))) return null;

  return (
    <nav className={styles.barra} aria-label="Navegação principal">
      {DESTINOS.map(({ href, rotulo, Icone }) => {
        const ativo = href === "/" ? caminho === "/" : caminho.startsWith(href);
        const icone = (
          // O item ativo ganha traço mais grosso: o estado não é só cor.
          <Icone size={22} strokeWidth={ativo ? 2.25 : 2} aria-hidden="true" />
        );

        return (
          <Link
            key={href}
            href={href}
            className={`${styles.item} ${ativo ? styles.ativo : ""}`}
            aria-current={ativo ? "page" : undefined}
          >
            <span className={styles.icone}>
              {href === "/" && tarefasPendentes > 0 ? (
                <NotificationBadge
                  count={tarefasPendentes}
                  rotulo={`${tarefasPendentes} tarefas hoje`}
                >
                  {icone}
                </NotificationBadge>
              ) : (
                icone
              )}
            </span>
            <span className={styles.rotulo}>{rotulo}</span>
          </Link>
        );
      })}
    </nav>
  );
}
