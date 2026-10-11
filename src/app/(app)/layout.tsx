import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { obterCriatorioAtual } from "@/lib/criatorio";
import { obterIndicadores, obterTarefasDeHoje } from "@/lib/dados/hoje";
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

  const [tarefas, indicadores] = await Promise.all([
    obterTarefasDeHoje(),
    obterIndicadores(),
  ]);

  return (
    // A fila offline é estado de aplicação, não de tela: vive no layout para
    // sobreviver à navegação entre abas.
    <ProvedorSincronizacao>
      <div className={styles.app}>
        <div className={styles.lateral}>
          <Sidebar
            nomeCriatorio={criatorio.nome}
            contagens={{
              "/plantel": indicadores.aves,
              "/casais": indicadores.casaisAtivos,
              "/ovos": tarefas.length,
            }}
          />
        </div>

        <div className={styles.coluna}>
          <div className={styles.superior}>
            <TopBar
              nomeCriatorio={criatorio.nome}
              iniciais={iniciaisDe(criatorio.nome)}
            />
          </div>

          <main id="conteudo" className={styles.conteudo}>
            {children}
          </main>
        </div>

        <TabBar tarefasPendentes={tarefas.length} />
      </div>
    </ProvedorSincronizacao>
  );
}

/** "Criatório Tibiriçá" -> "CT". Duas letras, como na prancha. */
function iniciaisDe(nome: string): string {
  return nome
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
