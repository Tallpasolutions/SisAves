import Image from "next/image";
import type { ReactNode } from "react";
import styles from "./layout.module.css";

export default function LayoutAcesso({ children }: { children: ReactNode }) {
  return (
    <div className={styles.tela}>
      <Image
        className={styles.marca}
        src="/brand/sisaves-symbol-white.svg"
        alt=""
        aria-hidden="true"
        width={760}
        height={760}
        priority
      />
      <main id="conteudo" className={styles.conteudo}>
        <Image
          className={styles.assinatura}
          src="/brand/sisaves-logo-horizontal-white.svg"
          alt="SisAves"
          width={200}
          height={36}
          priority
        />
        {children}
      </main>
    </div>
  );
}
