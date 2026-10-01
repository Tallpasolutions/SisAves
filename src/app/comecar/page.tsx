import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterCriatorioAtual } from "@/lib/criatorio";
import { FormularioCriatorio } from "./formulario";
import styles from "./comecar.module.css";

export const metadata: Metadata = { title: "Cadastrar criatório" };

export default async function Comecar() {
  // Quem já tem criatório não passa por aqui de novo.
  if (await obterCriatorioAtual()) redirect("/");

  const supabase = await criarClienteServidor();
  const { data: clubes } = await supabase
    .from("clubes")
    .select("id, sigla, nome, uf")
    .eq("ativo", true)
    .order("sigla");

  return (
    <div className={styles.tela}>
      <main id="conteudo" className={styles.conteudo}>
        <header className={styles.cabecalho}>
          <span className={styles.passo}>Passo 1 de 2</span>
          <h1 className={styles.titulo}>Cadastrar criatório</h1>
          <p className={styles.resumo}>
            Esses dados aparecem nos certificados e crachás que você emitir.
          </p>
        </header>

        <FormularioCriatorio clubes={clubes ?? []} />
      </main>
    </div>
  );
}
