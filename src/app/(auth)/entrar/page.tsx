import type { Metadata } from "next";
import Link from "next/link";
import { FormularioEntrar } from "./formulario";
import styles from "../layout.module.css";

export const metadata: Metadata = { title: "Entrar" };

export default async function Entrar({
  searchParams,
}: PageProps<"/entrar">) {
  const params = await searchParams;
  const destino = typeof params.destino === "string" ? params.destino : "/";
  const erroUrl =
    params.erro === "google"
      ? "Não foi possível entrar com o Google. Tente de novo ou use e-mail e senha."
      : params.erro === "callback"
        ? "O link expirou ou já foi usado. Peça um novo."
        : undefined;

  return (
    <>
      <div className={styles.cartao}>
        <div className={styles.cabecalho}>
          <h1 className={styles.titulo}>Entrar</h1>
          <p className={styles.subtitulo}>Acesse o seu criatório.</p>
        </div>

        <FormularioEntrar destino={destino} erroInicial={erroUrl} />
      </div>

      <p className={styles.rodape}>
        Ainda não tem conta? <Link href="/cadastrar">Cadastre-se</Link>
      </p>
    </>
  );
}
