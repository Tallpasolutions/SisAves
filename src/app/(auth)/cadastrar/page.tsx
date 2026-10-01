import type { Metadata } from "next";
import Link from "next/link";
import { FormularioCadastrar } from "./formulario";
import styles from "../layout.module.css";

export const metadata: Metadata = { title: "Criar conta" };

export default function Cadastrar() {
  return (
    <>
      <div className={styles.cartao}>
        <div className={styles.cabecalho}>
          <h1 className={styles.titulo}>Criar conta</h1>
          <p className={styles.subtitulo}>
            Depois de entrar, você cadastra o criatório e as espécies que cria.
          </p>
        </div>

        <FormularioCadastrar />
      </div>

      <p className={styles.rodape}>
        Já tem conta? <Link href="/entrar">Entrar</Link>
      </p>
    </>
  );
}
