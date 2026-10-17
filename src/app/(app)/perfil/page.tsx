import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Toast } from "@/components/ui";
import { obterPerfil } from "@/lib/dados/configuracoes";
import { FormularioPerfil } from "./formulario";
import styles from "@/app/(app)/configuracoes/configuracoes.module.css";

export const metadata: Metadata = { title: "Perfil" };

export default async function Perfil({ searchParams }: PageProps<"/perfil">) {
  const consulta = await searchParams;
  const perfil = await obterPerfil();
  if (!perfil) notFound();

  return (
    <div className={styles.tela}>
      <Link href="/configuracoes" className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Configurações
      </Link>

      {consulta.salvo === "1" ? (
        <Toast tone="ok" title="Perfil salvo" description="É assim que o seu nome aparece para os outros membros." />
      ) : null}

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Seu perfil</h1>
        <p className={styles.contexto}>
          O nome aparece para os outros membros do criatório.
        </p>
      </header>

      <FormularioPerfil perfil={perfil} />
    </div>
  );
}
