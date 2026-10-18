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
import { useTransition } from "react";
import { LogOut, UserRound } from "lucide-react";
import { sair } from "@/app/(auth)/acoes";
import { SeletorTema } from "./SeletorTema";
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
      // A ÁRVORE é sempre de uma ave e entra pela ficha. Este destino é a
      // pergunta inversa — de onde vem o plantel — mais o simulador de
      // cruzamento, que é onde o coeficiente muda uma decisão.
      { href: "/genealogia", rotulo: "Genealogia", Icone: Dna },
    ],
  },
  {
    titulo: "Gestão",
    destinos: [
      { href: "/saude", rotulo: "Saúde", Icone: Syringe },
      { href: "/financeiro", rotulo: "Financeiro", Icone: Wallet },
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
  /** Quem está logado. Sem perfil preenchido, o rodapé diz "Sua conta". */
  nomeUsuario?: string | null;
  contagens?: Partial<Record<string, number>>;
}

export function Sidebar({
  nomeCriatorio,
  nomeUsuario,
  contagens = {},
}: SidebarProps) {
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

      {/*
       * A conta, no pé.
       *
       * Faltava: o Perfil e o Sair só existiam em `/mais`, que é a quinta aba
       * do CELULAR e não tem equivalente aqui — acima de 1024px não havia como
       * sair da conta sem digitar a rota na barra de endereço. Fica no fim e
       * separado dos destinos porque sair é a única ação daqui que tira o
       * criador do produto.
       */}
      <div className={styles.conta}>
        <Link href="/perfil" className={styles.contaPerfil}>
          <span className={styles.contaIcone} aria-hidden="true">
            <UserRound size={18} />
          </span>
          <span className={styles.contaTextos}>
            <span className={styles.contaNome}>{nomeUsuario || "Sua conta"}</span>
            <span className={styles.contaResumo}>Ver perfil</span>
          </span>
        </Link>

        {/* O tema é preferência de quem opera, não configuração do criatório:
            fica junto da conta, não em Configurações. */}
        <div className={styles.tema}>
          <SeletorTema tom="escuro" />
        </div>

        <BotaoSair />
      </div>
    </nav>
  );
}

/**
 * Sair da conta.
 *
 * Sem confirmação: não destrói nada, e o caminho de volta é a tela de entrar.
 */
function BotaoSair() {
  const [enviando, iniciar] = useTransition();

  return (
    <button
      type="button"
      className={styles.sair}
      disabled={enviando}
      onClick={() => iniciar(() => void sair())}
    >
      <LogOut size={18} aria-hidden="true" />
      {enviando ? "Saindo…" : "Sair da conta"}
    </button>
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
