import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obterCasal } from "@/lib/dados/casais";
import { FormularioCasal } from "./formulario";
import styles from "./editar.module.css";

export const metadata: Metadata = { title: "Editar casal" };

export default async function EditarCasal({ params }: PageProps<"/casais/[id]/editar">) {
  const { id } = await params;
  const casal = await obterCasal(id);
  if (!casal) notFound();

  const numero = String(casal.numero).padStart(2, "0");

  return (
    <div className={styles.tela}>
      <Link href={`/casais/${id}`} className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Casal {numero}
      </Link>

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Editar casal {numero}</h1>
        <p className={styles.contexto}>
          A vigência decide quais posturas cabem neste casal. É aqui também que
          o casal se encerra.
        </p>
      </header>

      <FormularioCasal casal={casal} />
    </div>
  );
}
