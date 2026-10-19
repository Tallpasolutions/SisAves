import type { Metadata } from "next";
import { CircleAlert } from "lucide-react";
import Link from "next/link";
import { FormularioCadastrar } from "./formulario";
import { CADASTRO_ABERTO } from "@/lib/portas";
import styles from "../layout.module.css";

export const metadata: Metadata = { title: "Criar conta" };

export default function Cadastrar() {
  // Com o cadastro fechado, o formulário nem monta: preencher três campos
  // para receber uma recusa no fim é desrespeito com o tempo de quem tentou.
  if (!CADASTRO_ABERTO) {
    return (
      <>
        <div className={styles.cartao}>
          <div className={styles.cabecalho}>
            <h1 className={styles.titulo}>Cadastro fechado</h1>
            <p className={styles.subtitulo}>
              O SisAves está em testes e não aceita contas novas no momento.
            </p>
          </div>

          <p className={`${styles.alerta} ${styles.alertaAviso}`} role="status">
            <span className={styles.alertaIcone}>
              <CircleAlert size={16} aria-hidden="true" />
            </span>
            Se você recebeu um convite para um criatório, entre com o e-mail do
            convite e o acesso aparece sozinho.
          </p>
        </div>

        <p className={styles.rodape}>
          Já tem conta? <Link href="/entrar">Entrar</Link>
        </p>
      </>
    );
  }

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
