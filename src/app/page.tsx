import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterCriatorioAtual } from "@/lib/criatorio";
import { sair } from "./(auth)/acoes";
import { Button, SyncStatus } from "@/components/ui";
import styles from "./home.module.css";

/**
 * Provisória: confirma que sessão, criatório e espécies chegaram até aqui.
 * Vira a tela "Hoje" (B1) na Fase 4, sobre a view vw_tarefas_hoje.
 */
export default async function Home() {
  const criatorio = await obterCriatorioAtual();
  // Sem criatório, não há o que mostrar: o onboarding é pré-requisito de tudo.
  if (!criatorio) redirect("/comecar");

  const supabase = await criarClienteServidor();
  const [{ data: perfil }, { count: especies }, { count: aves }] = await Promise.all([
    supabase.from("perfis").select("nome").maybeSingle(),
    supabase.from("especies").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("passaros").select("id", { count: "exact", head: true }).is("deleted_at", null),
  ]);

  return (
    <div className={styles.tela}>
      <main id="conteudo" className={styles.conteudo}>
        <header className={styles.cabecalho}>
          <div>
            <p className={styles.saudacao}>{perfil?.nome}</p>
            <h1 className={styles.titulo}>{criatorio.nome}</h1>
          </div>
          <SyncStatus state="online" lastSync="agora" compact />
        </header>

        <dl className={styles.indicadores}>
          <Indicador rotulo="Aves no plantel" valor={aves ?? 0} />
          <Indicador rotulo="Espécies" valor={especies ?? 0} />
          <Indicador rotulo="Casais ativos" valor={0} />
          <Indicador rotulo="Ovos em choco" valor={0} />
        </dl>

        <section className={styles.aviso}>
          <h2 className={styles.avisoTitulo}>Em construção</h2>
          <p className={styles.avisoTexto}>
            A agenda do dia entra na próxima etapa. Por enquanto, esta tela
            confirma que a sessão, o criatório e as espécies estão no lugar.
          </p>
        </section>

        <form action={sair}>
          <Button type="submit" variant="ghost" size="sm">
            Sair
          </Button>
        </form>
      </main>
    </div>
  );
}

function Indicador({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className={styles.indicador}>
      <dt className={styles.indicadorRotulo}>{rotulo}</dt>
      <dd className={styles.indicadorValor}>{valor}</dd>
    </div>
  );
}
