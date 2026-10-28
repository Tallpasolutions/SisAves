import { headers } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { obterCriatorioAtual } from "@/lib/criatorio";
import { obterPerfil } from "@/lib/dados/configuracoes";
import { obterIndicadores, obterTarefasDeHoje } from "@/lib/dados/hoje";
import { obterVigencia } from "@/lib/dados/assinatura";
import { souOperador } from "@/lib/dados/operador";
import { Sair } from "./mais/sair";
import { FaixaAssinatura } from "@/components/navegacao/FaixaAssinatura";
import { Sidebar } from "@/components/navegacao/Sidebar";
import { TabBar } from "@/components/navegacao/TabBar";
import { TopBar } from "@/components/navegacao/TopBar";
import { ProvedorSincronizacao } from "@/components/offline/Sincronizacao";
import styles from "./layout.module.css";

/**
 * A casca das duas faixas.
 *
 * Os dois contextos do contrato — em pé no galpão e sentado no computador —
 * são a MESMA rota, trocada por media query. Rotas separadas duplicariam cada
 * tela e deixariam as duas versões divergirem com o tempo; e o criador que
 * abre o celular na horizontal não deveria ver um produto diferente.
 *
 * Mobile: tab bar de 5 destinos, conteúdo em 560px.
 * Desktop (>= 1024px): sidebar de 248px, top bar de 56px, conteúdo largo.
 */
export default async function LayoutApp({ children }: { children: ReactNode }) {
  // Sem criatório não há o que mostrar em nenhuma aba: o onboarding é
  // pré-requisito de todas elas, então a guarda fica no layout.
  const criatorio = await obterCriatorioAtual();
  if (!criatorio) redirect("/comecar");

  const [tarefas, indicadores, perfil, operador, vigencia, cabecalhos] =
    await Promise.all([
      obterTarefasDeHoje(),
      obterIndicadores(),
      obterPerfil(),
      souOperador(),
      obterVigencia(),
      headers(),
    ]);

  /*
   * Vencido não vê dado nenhum.
   *
   * Até aqui o bloqueio era só de escrita: quem não pagasse continuava lendo o
   * plantel inteiro. Na prática isso permitia cadastrar tudo em cinco dias e
   * usar o SisAves como consulta para sempre, de graça.
   *
   * `vigencia === null` NÃO bloqueia. É falha para o lado aberto, de
   * propósito: um defeito na consulta não pode trancar quem está pagando.
   * Quem não tem linha de assinatura é criatório recém-criado, e o gatilho da
   * 0038 cria a dele em seguida.
   *
   * O operador nunca cai aqui — `criatorio_com_acesso()` o libera na 0042.
   */
  const caminho = cabecalhos.get("x-caminho") ?? "";

  /*
   * `caminho` vazio NÃO bloqueia, e essa condição é uma trava, não um detalhe.
   *
   * Na primeira versão o cabeçalho não chegava — mutar `request.headers` no
   * middleware não propaga —, então `caminho` era vazio,
   * `"".startsWith("/assinatura")` dava falso e o layout mandava para
   * /assinatura DE DENTRO de /assinatura. Laço infinito e tela branca.
   *
   * Exigir uma rota conhecida para bloquear faz o pior caso ser "não
   * bloqueou", em vez de "travou o produto para todo mundo".
   */
  const bloqueado =
    vigencia !== null && !vigencia.comAcesso && caminho.startsWith("/");

  if (bloqueado && !caminho.startsWith("/assinatura")) {
    redirect("/assinatura");
  }

  /*
   * Casca mínima para quem está vencido: sem barra lateral, sem tab bar.
   *
   * Com a navegação normal, cada toque numa aba voltaria para cá, e no celular
   * — onde "Sair da conta" mora dentro de Mais — a pessoa ficaria presa sem
   * conseguir nem trocar de conta.
   */
  if (bloqueado) {
    return (
      <div className={styles.bloqueio}>
        <div className={styles.bloqueioInterno}>
          <Image
            src="/brand/sisaves-logo-horizontal.svg"
            alt="SisAves"
            width={140}
            height={34}
            priority
          />
          <main id="conteudo">{children}</main>
          <Sair />
        </div>
      </div>
    );
  }

  return (
    // A fila offline é estado de aplicação, não de tela: vive no layout para
    // sobreviver à navegação entre abas.
    <ProvedorSincronizacao>
      <div className={styles.app}>
        <div className={styles.lateral}>
          <Sidebar
            nomeCriatorio={criatorio.nome}
            nomeUsuario={perfil?.nome}
            souOperador={operador}
            contagens={{
              "/plantel": indicadores.aves,
              "/casais": indicadores.casaisAtivos,
              "/ovos": tarefas.length,
            }}
          />
        </div>

        <div className={styles.coluna}>
          <div className={styles.superior}>
            <TopBar iniciais={iniciaisDe(perfil?.nome || criatorio.nome)} />
          </div>

          <main id="conteudo" className={styles.conteudo}>
            {/* Antes do conteúdo, e em todas as telas: o bloqueio mora na RLS,
                e descobri-lo pelo erro do banco depois de preencher um
                formulário inteiro seria a pior forma de saber. */}
            <FaixaAssinatura />
            {children}
          </main>
        </div>

        <TabBar tarefasPendentes={tarefas.length} />
      </div>
    </ProvedorSincronizacao>
  );
}

/** "Jhoni Cleyton" -> "JC". Duas letras, como na prancha. */
function iniciaisDe(nome: string): string {
  return nome
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
