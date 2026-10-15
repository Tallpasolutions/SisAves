import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormularioAve } from "@/components/plantel/FormularioAve";
import styles from "@/components/plantel/FormularioAve.module.css";
import { opcoesEditarAve } from "@/lib/dados/cadastro";

export const metadata: Metadata = { title: "Editar ave" };

export default async function EditarAve({ params }: PageProps<"/plantel/[id]/editar">) {
  const { id } = await params;
  const dados = await opcoesEditarAve(id);
  if (!dados) notFound();

  return (
    <div className={styles.tela}>
      <Link href={`/plantel/${id}`} className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        {dados.nome ?? "Ave"}
      </Link>

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Editar ave</h1>
        <p className={styles.contexto}>
          Corrigir a filiação muda a árvore genealógica e o coeficiente de
          endogamia dos casais em que esta ave entra. Certificados já emitidos
          não mudam: eles guardam a genealogia do dia da emissão.
        </p>
      </header>

      <FormularioAve
        opcoes={dados.opcoes}
        modo="edicao"
        aveId={id}
        inicial={dados.valores}
        travas={dados.travaNascimento ? { nascimento: dados.travaNascimento } : undefined}
      />
    </div>
  );
}
