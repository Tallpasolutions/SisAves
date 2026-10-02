import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { obterCriatorioAtual } from "@/lib/criatorio";
import { obterTarefasDeHoje } from "@/lib/dados/hoje";
import { TabBar } from "@/components/navegacao/TabBar";
import { ProvedorSincronizacao } from "@/components/offline/Sincronizacao";
import styles from "./layout.module.css";

export default async function LayoutApp({ children }: { children: ReactNode }) {
  // Sem criatório não há o que mostrar em nenhuma aba: o onboarding é
  // pré-requisito de todas elas, então a guarda fica no layout.
  if (!(await obterCriatorioAtual())) redirect("/comecar");

  const tarefas = await obterTarefasDeHoje();

  return (
    // A fila offline é estado de aplicação, não de tela: vive no layout para
    // sobreviver à navegação entre abas.
    <ProvedorSincronizacao>
      <div className={styles.app}>
        <main id="conteudo" className={styles.conteudo}>
          {children}
        </main>
        <TabBar tarefasPendentes={tarefas.length} />
      </div>
    </ProvedorSincronizacao>
  );
}
