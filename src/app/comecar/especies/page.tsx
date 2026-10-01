import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterCriatorioAtual } from "@/lib/criatorio";
import { SeletorEspecies, type EspecieCatalogo } from "./seletor";
import styles from "../comecar.module.css";

export const metadata: Metadata = { title: "Escolher espécies" };

export default async function Especies() {
  const criatorio = await obterCriatorioAtual();
  if (!criatorio) redirect("/comecar");

  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("especies_catalogo")
    .select("id, nome_comum, nome_cientifico, dias_choco, dias_choco_max, grupo:grupos(id, nome, ordem)")
    .order("nome_comum");

  const especies = (data ?? []).map((e) => {
    const grupo = Array.isArray(e.grupo) ? e.grupo[0] : e.grupo;
    return {
      id: e.id,
      nome_comum: e.nome_comum,
      nome_cientifico: e.nome_cientifico,
      dias_choco: e.dias_choco,
      dias_choco_max: e.dias_choco_max,
      grupo_nome: grupo?.nome ?? "Outras",
      grupo_ordem: grupo?.ordem ?? 999,
    } satisfies EspecieCatalogo;
  });

  return (
    <div className={styles.tela}>
      <main id="conteudo" className={styles.conteudo}>
        <header className={styles.cabecalho}>
          <span className={styles.passo}>Passo 2 de 2</span>
          <h1 className={styles.titulo}>O que você cria</h1>
          <p className={styles.resumo}>
            Os prazos de cada espécie movem o ciclo do ovo — é por eles que o
            sistema avisa a hora da ovoscopia, do anilhamento e da separação.
            Você pode acrescentar outras espécies depois.
          </p>
        </header>

        <SeletorEspecies especies={especies} />
      </main>
    </div>
  );
}
