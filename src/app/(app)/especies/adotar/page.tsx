import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { listarCatalogo } from "@/lib/dados/especies";
import { SeletorCatalogo } from "./seletor";
import styles from "../especies.module.css";

export const metadata: Metadata = { title: "Adotar espécie" };

export default async function Adotar() {
  const catalogo = await listarCatalogo();

  return (
    <div className={styles.tela}>
      <Link href="/especies" className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Espécies
      </Link>

      <header className={styles.cabecalho}>
        <div className={styles.cabecalhoTextos}>
          <h1 className={styles.titulo}>Adotar espécie</h1>
          <p className={styles.contexto}>
            Os prazos vêm do catálogo e você ajusta depois, em cada espécie.
          </p>
        </div>
      </header>

      <SeletorCatalogo catalogo={catalogo} />
    </div>
  );
}
