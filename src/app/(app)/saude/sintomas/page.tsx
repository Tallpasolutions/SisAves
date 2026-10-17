import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Toast } from "@/components/ui";
import { listarSintomas } from "@/lib/dados/saude";
import { LinhaSintoma, NovoSintoma } from "../catalogo";
import styles from "../catalogo.module.css";

export const metadata: Metadata = { title: "Sintomas" };

export default async function Sintomas({ searchParams }: PageProps<"/saude/sintomas">) {
  const consulta = await searchParams;
  const sintomas = await listarSintomas();

  const meus = sintomas.filter((s) => !s.doCatalogo);
  const doCatalogo = sintomas.filter((s) => s.doCatalogo);

  return (
    <div className={styles.tela}>
      <Link href="/saude" className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Saúde
      </Link>

      {consulta.criado === "1" ? (
        <Toast
          tone="ok"
          title="Sintoma criado"
          description="Ele já aparece para marcar nas suas doenças."
        />
      ) : null}
      {consulta.salvo === "1" ? (
        <Toast
          tone="ok"
          title="Sintoma salvo"
          description="O nome novo aparece em todas as doenças que o marcam."
        />
      ) : null}
      {consulta.excluido === "1" ? (
        <Toast
          tone="ok"
          title="Sintoma excluído"
          description="Ele sai das doenças que o listavam. Nada mais muda nelas."
        />
      ) : null}

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Sintomas</h1>
        <p className={styles.contexto}>
          {meus.length === 0
            ? `Nenhum seu · ${doCatalogo.length} no catálogo`
            : `${meus.length} ${meus.length === 1 ? "seu" : "seus"} · ${doCatalogo.length} no catálogo`}
        </p>
        <p className={styles.explicacao}>
          O sintoma é o que se vê na ave, dito no vocabulário do galpão. Os do
          catálogo vêm com o sistema; os seus se criam aqui e entram na lista
          de marcação das suas doenças.
        </p>
      </header>

      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>Novo sintoma</h2>
        <NovoSintoma />
      </section>

      {meus.length > 0 ? (
        <section className={styles.bloco}>
          <h2 className={styles.blocoTitulo}>Seus sintomas</h2>
          <ul className={styles.lista}>
            {meus.map((s) => (
              <li key={s.id}>
                <LinhaSintoma sintoma={s} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>Do catálogo</h2>
        <ul className={styles.listaFixa}>
          {doCatalogo.map((s) => (
            <li key={s.id} className={styles.fixa}>
              <span className={styles.fixaTextos}>
                <span className={styles.fixaNome}>{s.nome}</span>
                {s.descricao ? (
                  <span className={styles.fixaDetalhe}>{s.descricao}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
