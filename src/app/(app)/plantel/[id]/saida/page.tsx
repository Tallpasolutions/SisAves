import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Anilha } from "@/components/ui";
import { descreverEspecie, obterAve } from "@/lib/dados/plantel";
import { encadear } from "@/lib/formato";
import { FormularioSaida } from "./formulario";
import styles from "./saida.module.css";

export const metadata: Metadata = { title: "Registrar saída" };

export default async function Saida({ params }: PageProps<"/plantel/[id]/saida">) {
  const { id } = await params;
  const ave = await obterAve(id);
  if (!ave) notFound();

  // Ave que já saiu não sai de novo. A ficha é que oferece o caminho de volta,
  // quando ele existe.
  if (ave.situacao !== "ativo") {
    return (
      <div className={styles.tela}>
        <Link href={`/plantel/${ave.id}`} className={styles.voltar}>
          <ChevronLeft size={18} aria-hidden="true" />
          {ave.nome ?? "Ave"}
        </Link>
        <header className={styles.cabecalho}>
          <h1 className={styles.titulo}>Esta ave já saiu do plantel</h1>
          <p className={styles.contexto}>
            A ficha mostra quando e para onde, e é de lá que ela volta, quando
            o caso admite volta.
          </p>
        </header>
      </div>
    );
  }

  return (
    <div className={styles.tela}>
      <Link href={`/plantel/${ave.id}`} className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        {ave.nome ?? "Ave"}
      </Link>

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Registrar saída</h1>
        <p className={styles.contexto}>
          {encadear(ave.nome, descreverEspecie(ave.especie, ave.mutacao))}
        </p>
        <Anilha dados={ave.anilha} size="sm" tone="quiet" />
      </header>

      <FormularioSaida ave={ave} />
    </div>
  );
}
