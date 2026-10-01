import type { Metadata } from "next";
import Link from "next/link";
import { FormularioRecuperar } from "./formulario";
import styles from "../layout.module.css";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecuperarSenha() {
  return (
    <>
      <div className={styles.cartao}>
        <div className={styles.cabecalho}>
          <h1 className={styles.titulo}>Recuperar senha</h1>
          <p className={styles.subtitulo}>
            Enviamos um link para você definir uma senha nova.
          </p>
        </div>
        <FormularioRecuperar />
      </div>

      <p className={styles.rodape}>
        Lembrou a senha? <Link href="/entrar">Entrar</Link>
      </p>
    </>
  );
}
