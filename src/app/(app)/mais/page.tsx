import type { Metadata } from "next";
import {
  Award,
  Bell,
  ChartColumn,
  ChevronRight,
  CreditCard,
  Dna,
  Feather,
  Gauge,
  Settings,
  Syringe,
  Tags,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { obterCriatorioAtual } from "@/lib/criatorio";
import { souOperador } from "@/lib/dados/operador";
import { SeletorTema } from "@/components/navegacao/SeletorTema";
import { Sair } from "./sair";
import styles from "./mais.module.css";

export const metadata: Metadata = { title: "Mais" };

interface Destino {
  href: string;
  rotulo: string;
  resumo: string;
  Icone: typeof Feather;
  emBreve?: boolean;
}

/**
 * A quinta aba do celular.
 *
 * No desktop estes destinos vivem na sidebar; no celular não havia porta
 * nenhuma para eles. O que ainda não existe aparece como "em breve" e sem
 * alvo — item que leva a lugar nenhum ensina a desconfiar do menu.
 */
const GRUPOS: Array<{ titulo: string; destinos: Destino[] }> = [
  {
    titulo: "Criatório",
    destinos: [
      {
        href: "/especies",
        rotulo: "Espécies e prazos",
        resumo: "Os dias que movem o ciclo do ovo",
        Icone: Feather,
      },
      {
        href: "/casais/etiquetas",
        rotulo: "Etiquetas",
        resumo: "Como você agrupa os casais",
        Icone: Tags,
      },
      {
        href: "/configuracoes",
        rotulo: "Configurações",
        resumo: "Nome, clube, registro IBAMA",
        Icone: Settings,
      },
      {
        href: "/configuracoes/membros",
        rotulo: "Membros",
        resumo: "Quem mais acessa este criatório",
        Icone: Users,
      },
      {
        href: "/assinatura",
        rotulo: "Assinatura",
        resumo: "Situação do acesso e pagamentos",
        Icone: CreditCard,
      },
    ],
  },
  {
    titulo: "Gestão",
    destinos: [
      {
        href: "/genealogia",
        rotulo: "Genealogia",
        resumo: "Linhagens e simulação de cruzamento",
        Icone: Dna,
      },
      {
        href: "/relatorios",
        rotulo: "Relatórios",
        resumo: "Fertilidade, nascimentos, perdas",
        Icone: ChartColumn,
      },
      {
        href: "/notificacoes",
        rotulo: "Notificações",
        resumo: "Os avisos do galpão",
        Icone: Bell,
      },
      {
        href: "/certificados",
        rotulo: "Certificados",
        resumo: "CRO emitido e validação por QR",
        Icone: Award,
      },
      {
        href: "/financeiro",
        rotulo: "Financeiro",
        resumo: "Receitas e despesas do criatório",
        Icone: Wallet,
      },
      {
        href: "/saude",
        rotulo: "Saúde",
        resumo: "Medicamentos, doenças, tratamentos",
        Icone: Syringe,
      },
    ],
  },
  {
    titulo: "Você",
    destinos: [
      {
        href: "/perfil",
        rotulo: "Perfil",
        resumo: "Seu nome e telefone",
        Icone: UserRound,
      },
    ],
  },
];

/**
 * O grupo de quem opera o SisAves.
 *
 * Fica fora de `GRUPOS` porque depende de quem está logado. A sidebar do
 * desktop já tinha o dele; esta tela não, e no celular ela é a ÚNICA porta
 * para o que não está na tab bar — então a tela existia e não tinha como
 * chegar nela.
 */
const GRUPO_OPERACAO = {
  titulo: "SisAves",
  destinos: [
    {
      href: "/operacao",
      rotulo: "Operação",
      resumo: "Assinantes, testes e contas criadas",
      Icone: Gauge,
    },
  ],
};

export default async function Mais() {
  const [criatorio, operador] = await Promise.all([
    obterCriatorioAtual(),
    souOperador(),
  ]);
  const grupos = operador ? [...GRUPOS, GRUPO_OPERACAO] : GRUPOS;

  return (
    <div className={styles.tela}>
      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Mais</h1>
        {criatorio ? (
          <p className={styles.contexto}>
            {[criatorio.nome, criatorio.clube?.sigla, criatorio.nro_criador]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
      </header>

      {grupos.map((grupo) => (
        <section key={grupo.titulo} className={styles.grupo}>
          <h2 className={styles.grupoTitulo}>{grupo.titulo}</h2>
          <ul className={styles.lista}>
            {grupo.destinos.map((d) => (
              <li key={d.rotulo}>
                <ItemDestino destino={d} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* Preferência de quem opera, não configuração do criatório — por isso
          aqui, ao lado da conta, e não em Configurações. */}
      <section className={styles.grupo}>
        <h2 className={styles.grupoTitulo}>Aparência</h2>
        <SeletorTema />
        <p className={styles.notaTema}>
          O tema escuro existe porque eclosão acontece de madrugada. Em
          &ldquo;Sistema&rdquo;, ele acompanha o aparelho.
        </p>
      </section>

      <Sair />
    </div>
  );
}

function ItemDestino({ destino }: { destino: Destino }) {
  const conteudo: ReactNode = (
    <>
      <span className={styles.icone} aria-hidden="true">
        <destino.Icone size={20} />
      </span>
      <span className={styles.textos}>
        <span className={styles.rotulo}>{destino.rotulo}</span>
        <span className={styles.resumo}>{destino.resumo}</span>
      </span>
      {destino.emBreve ? (
        <span className={styles.emBreve}>em breve</span>
      ) : (
        <ChevronRight size={18} aria-hidden="true" className={styles.seta} />
      )}
    </>
  );

  if (destino.emBreve) {
    return (
      <span className={`${styles.item} ${styles.itemInativo}`} aria-disabled="true">
        {conteudo}
      </span>
    );
  }

  return (
    <Link href={destino.href} className={styles.item}>
      {conteudo}
    </Link>
  );
}
