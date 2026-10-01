import type { Metadata } from "next";
import { FormularioNovaSenha } from "./formulario";
import styles from "../layout.module.css";

export const metadata: Metadata = { title: "Nova senha" };

export default function NovaSenha() {
  return (
    <div className={styles.cartao}>
      <div className={styles.cabecalho}>
        <h1 className={styles.titulo}>Nova senha</h1>
        <p className={styles.subtitulo}>
          Depois de salvar, você entra direto no criatório.
        </p>
      </div>
      <FormularioNovaSenha />
    </div>
  );
}
