import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obterEspecie } from "@/lib/dados/especies";
import { BotaoAlternar, BotaoExcluir, FormularioPrazos } from "./formulario";
import styles from "../especies.module.css";

export async function generateMetadata({
  params,
}: PageProps<"/especies/[id]">): Promise<Metadata> {
  const { id } = await params;
  const especie = await obterEspecie(id);
  return { title: especie?.nome ?? "Espécie" };
}

export default async function Especie({ params }: PageProps<"/especies/[id]">) {
  const { id } = await params;
  const especie = await obterEspecie(id);
  if (!especie) notFound();

  return (
    <div className={styles.tela}>
      <Link href="/especies" className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Espécies
      </Link>

      <header className={styles.cabecalho}>
        <div className={styles.cabecalhoTextos}>
          <h1 className={styles.titulo}>{especie.nome}</h1>
          <p className={styles.contexto}>
            {especie.aves === 0
              ? "Nenhuma ave desta espécie no plantel."
              : `${especie.aves} ${especie.aves === 1 ? "ave" : "aves"} no plantel.`}
          </p>
        </div>
      </header>

      <FormularioPrazos especie={especie} />

      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>Tirar de uso</h2>
        <p className={styles.blocoNota}>
          {especie.ativa
            ? "Tirar do cadastro esconde a espécie na hora de cadastrar ave. O que já foi registrado com ela segue valendo, com estes prazos."
            : "Esta espécie está fora do cadastro. Devolvê-la ao cadastro a faz aparecer de novo na hora de cadastrar ave."}
        </p>

        <div className={styles.acoes}>
          <BotaoAlternar especie={especie} />
          {/* Só quando nenhuma ave usa: apagar em uso deixaria aves sem
              espécie e, por tabela, sem os prazos do ciclo delas. */}
          {especie.aves === 0 ? <BotaoExcluir especie={especie} /> : null}
        </div>
      </section>
    </div>
  );
}
