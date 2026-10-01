import type { Metadata } from "next";
import { ChevronLeft, Award } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui";
import styles from "../subpagina.module.css";

export const metadata: Metadata = { title: "Certificado" };

/** Placeholder honesto: a rota existe para o atalho da ficha não dar 404. */
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className={styles.tela}>
      <Link href={`/plantel/${id}`} className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Ficha da ave
      </Link>
      <EmptyState icon={<Award size={28} />} title="Certificado" description="A emissão de CRO com validação por QR Code entra na Fase 8." />
    </div>
  );
}
