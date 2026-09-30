import styles from "./page.module.css";

/**
 * Página provisória da Fase 0. Serve para confirmar que os tokens, as famílias
 * tipográficas e os dois temas estão ligados. Sai na Fase 2, quando entram o
 * login (B4) e o onboarding de criatório.
 */
export default function Home() {
  return (
    <main id="conteudo" className={styles.main}>
      <div className={styles.bloco}>
        <p className={styles.overline}>Fundação</p>
        <h1 className={styles.titulo}>SisAves</h1>
        <p className={styles.texto}>
          Gestão de criatório de aves ornamentais. Plantel, casais, ciclo do ovo,
          genealogia e CRO.
        </p>
      </div>

      <dl className={styles.checagem}>
        <div className={styles.item}>
          <dt>Tipografia</dt>
          <dd>Montserrat e Inter servidas localmente</dd>
        </div>
        <div className={styles.item}>
          <dt>Anilha</dt>
          <dd className={styles.anilha}>SOV 1234 · 2026 · 0087</dd>
        </div>
        <div className={styles.item}>
          <dt>Coeficiente de endogamia</dt>
          <dd className={styles.numero}>3,13%</dd>
        </div>
      </dl>
    </main>
  );
}
