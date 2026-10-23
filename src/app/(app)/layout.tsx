import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { obterCriatorioAtual } from "@/lib/criatorio";
import { obterPerfil } from "@/lib/dados/configuracoes";
import { obterIndicadores, obterTarefasDeHoje } from "@/lib/dados/hoje";
import { souOperador } from "@/lib/dados/operador";
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

  const [tarefas, indicadores, perfil, operador] = await Promise.all([
    obterTarefasDeHoje(),
    obterIndicadores(),
    obterPerfil(),
    souOperador(),
  ]);

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
