import type { Metadata } from "next";
import { ChevronLeft, Dna } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui";
import styles from "../subpagina.module.css";

export const metadata: Metadata = { title: "Genealogia" };

/** Placeholder honesto: a rota existe para o atalho da ficha não dar 404. */
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className={styles.tela}>
      <Link href={`/plantel/${id}`} className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Ficha da ave
      </Link>
      <EmptyState icon={<Dna size={28} />} title="Genealogia" description="A árvore de três gerações entra na Fase 5, sobre as funções de genealogia que já existem no banco." />
    </div>
  );
}
