"use client";

import {
  Award,
  Bird,
  Bell,
  ChartColumn,
  Dna,
  Egg,
  Feather,
  Settings,
  Sun,
  Syringe,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

interface Destino {
  href: string;
  rotulo: string;
  Icone: LucideIcon;
  /** Contagem à direita, só onde ela informa. */
  contagem?: number;
  /** Desenhado no handoff, ainda não construído. */
  emBreve?: boolean;
}

interface Grupo {
  titulo?: string;
  destinos: Destino[];
}

/**
 * Navegação do desktop — prancha `4a`, três grupos.
 *
 * Os destinos ainda não construídos aparecem desabilitados, com "em breve".
 * Escondê-los deixaria a navegação mentindo sobre o tamanho do produto; mandar
 * para um 404 seria pior. É a mesma regra do vazio honesto das outras telas, e
 * cada um deixa de ser "em breve" quando a fase dele entra.
 */
const GRUPOS: Grupo[] = [
  {
    destinos: [
      { href: "/painel", rotulo: "Painel", Icone: Sun },
      { href: "/plantel", rotulo: "Plantel", Icone: Bird },
      { href: "/casais", rotulo: "Casais", Icone: Users },
      { href: "/ovos", rotulo: "Ninhadas", Icone: Egg },
    ],
  },
  {
    titulo: "Genética",
    destinos: [
      // A genealogia é sempre de UMA ave: entra pela ficha, não por destino
      // próprio. Fica aqui porque o handoff a lista, e desabilitada porque não
      // existe tela de genealogia do plantel inteiro.
      { href: "#", rotulo: "Genealogia", Icone: Dna, emBreve: true },
    ],
  },
  {
    titulo: "Gestão",
    destinos: [
      { href: "#", rotulo: "Saúde", Icone: Syringe, emBreve: true },
      { href: "#", rotulo: "Financeiro", Icone: Wallet, emBreve: true },
      { href: "/certificados", rotulo: "Certificados", Icone: Award },
      { href: "/relatorios", rotulo: "Relatórios", Icone: ChartColumn },
    ],
  },
  {
    titulo: "Criatório",
    destinos: [
      { href: "/notificacoes", rotulo: "Notificações", Icone: Bell },
      { href: "/especies", rotulo: "Espécies", Icone: Feather },
      { href: "/configuracoes", rotulo: "Configurações", Icone: Settings },
    ],
  },
];

export interface SidebarProps {
  nomeCriatorio: string;
  contagens?: Partial<Record<string, number>>;
}

export function Sidebar({ nomeCriatorio, contagens = {} }: SidebarProps) {
  const caminho = usePathname();

  return (
    <nav className={styles.barra} aria-label="Navegação do criatório">
      <div className={styles.marca}>
        {/* Abaixo de 32px só o app icon — a assinatura não é legível. Aqui há
            espaço, então vai a assinatura inteira. */}
        <span className={styles.logo}>
          <span className={styles.logoSis}>Sis</span>
          <span className={styles.logoAves}>Aves</span>
        </span>
        <span className={styles.criatorio} title={nomeCriatorio}>
          {nomeCriatorio}
        </span>
      </div>

      <div className={styles.grupos}>
        {GRUPOS.map((grupo, indice) => (
          <div key={grupo.titulo ?? indice} className={styles.grupo}>
            {grupo.titulo ? (
              <span className={styles.grupoTitulo}>{grupo.titulo}</span>
            ) : null}

            {grupo.destinos.map((destino) => (
              <ItemSidebar
                key={destino.rotulo}
                destino={destino}
                contagem={contagens[destino.href]}
                ativo={
                  destino.href !== "#" &&
                  (destino.href === "/painel"
                    ? caminho === "/painel"
                    : caminho.startsWith(destino.href))
                }
              />
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
}

function ItemSidebar({
  destino,
  contagem,
  ativo,
}: {
  destino: Destino;
  contagem?: number;
  ativo: boolean;
}) {
  const { Icone, rotulo, emBreve } = destino;

  const conteudo = (
    <>
      {/* O item ativo ganha traço mais grosso: o estado não é só cor. */}
      <Icone size={18} strokeWidth={ativo ? 2.25 : 2} aria-hidden="true" />
      <span className={styles.itemRotulo}>{rotulo}</span>
      {emBreve ? (
        <span className={styles.emBreve}>em breve</span>
      ) : contagem !== undefined ? (
        <span className={styles.contagem}>{contagem}</span>
      ) : null}
    </>
  );

  if (emBreve) {
    return (
      <span className={`${styles.item} ${styles.itemInativo}`} aria-disabled="true">
        {conteudo}
      </span>
    );
  }

  return (
    <Link
      href={destino.href}
      className={`${styles.item} ${ativo ? styles.itemAtivo : ""}`}
      aria-current={ativo ? "page" : undefined}
    >
      {conteudo}
    </Link>
  );
}
