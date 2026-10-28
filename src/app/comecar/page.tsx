import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { obterCriatorioAtual } from "@/lib/criatorio";
import {
  dadosPessoaisPreenchidos,
  obterDadosPessoais,
} from "@/lib/dados/perfil-pessoal";
import { FormularioDadosPessoais } from "./formulario";
import styles from "./comecar.module.css";

export const metadata: Metadata = { title: "Seus dados" };

/**
 * Passo 1 de 3: quem é o criador.
 *
 * Esta rota é também o destino do layout do app quando não há criatório, então
 * ela precisa encaminhar: quem já se apresentou vai direto ao passo 2, e quem
 * já tem criatório não devia estar aqui.
 */
export default async function Comecar() {
  if (await obterCriatorioAtual()) redirect("/hoje");
  if (await dadosPessoaisPreenchidos()) redirect("/comecar/criatorio");

  // O nome costuma vir do cadastro; aproveitar poupa uma digitação.
  const dados = await obterDadosPessoais();

  return (
    <div className={styles.tela}>
      <main id="conteudo" className={styles.conteudo}>
        <header className={styles.cabecalho}>
          <span className={styles.passo}>Passo 1 de 3</span>
          <h1 className={styles.titulo}>Seus dados</h1>
          <p className={styles.resumo}>
            Antes do criatório, precisamos saber quem é você. São três campos e
            você só preenche uma vez.
          </p>
        </header>

        <FormularioDadosPessoais nome={dados?.nome} telefone={dados?.telefone} />
      </main>
    </div>
  );
}
