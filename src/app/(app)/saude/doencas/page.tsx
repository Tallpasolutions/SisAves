import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Toast } from "@/components/ui";
import { listarDoencas, listarSintomas } from "@/lib/dados/saude";
import { LinhaDoenca, NovaDoenca } from "../catalogo";
import styles from "../catalogo.module.css";

export const metadata: Metadata = { title: "Doenças" };

export default async function Doencas({ searchParams }: PageProps<"/saude/doencas">) {
  const consulta = await searchParams;

  const [doencas, sintomas] = await Promise.all([listarDoencas(true), listarSintomas()]);

  const minhas = doencas.filter((d) => !d.doCatalogo);
  const doCatalogo = doencas.filter((d) => d.doCatalogo);

  return (
    <div className={styles.tela}>
      <Link href="/saude" className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Saúde
      </Link>

      {consulta.criada === "1" ? (
        <Toast
          tone="ok"
          title="Doença criada"
          description="Ela já aparece ao registrar um tratamento."
        />
      ) : null}
      {consulta.salva === "1" ? (
        <Toast
          tone="ok"
          title="Doença salva"
          description="Os sintomas marcados são os que você observou neste criatório."
        />
      ) : null}
      {consulta.excluido === "1" ? (
        <Toast
          tone="ok"
          title="Doença excluída"
          description="Ela sai da lista de escolha. Os tratamentos antigos continuam com ela."
        />
      ) : null}

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Doenças</h1>
        <p className={styles.contexto}>
          {minhas.length === 0
            ? `Nenhuma sua · ${doCatalogo.length} no catálogo`
            : `${minhas.length} ${minhas.length === 1 ? "sua" : "suas"} · ${doCatalogo.length} no catálogo`}
        </p>
        <p className={styles.explicacao}>
          As do catálogo vêm com o sistema e são de todos os criatórios: dá
          para escolhê-las num tratamento, não para editá-las nem marcar
          sintomas nelas. Os sintomas são o que <strong>você</strong> observou
          aqui — e por isso ficam nas doenças suas.
        </p>
      </header>

      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>Nova doença</h2>
        <NovaDoenca sintomas={sintomas} />
      </section>

      {minhas.length > 0 ? (
        <section className={styles.bloco}>
          <h2 className={styles.blocoTitulo}>Suas doenças</h2>
          <ul className={styles.lista}>
            {minhas.map((d) => (
              <li key={d.id}>
                <LinhaDoenca doenca={d} sintomas={sintomas} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>Do catálogo</h2>
        <ul className={styles.listaFixa}>
          {doCatalogo.map((d) => (
            <li key={d.id} className={styles.fixa}>
              <span className={styles.fixaTextos}>
                <span className={styles.fixaNome}>{d.nome}</span>
                <span className={styles.fixaDetalhe}>
                  {d.usos
                    ? `${d.usos} ${d.usos === 1 ? "tratamento" : "tratamentos"}`
                    : "nenhum tratamento"}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
