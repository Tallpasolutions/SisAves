import type { Metadata } from "next";
import { ChevronLeft, Pill } from "lucide-react";
import Link from "next/link";
import { Toast } from "@/components/ui";
import { listarDoencas, listarMedicamentos } from "@/lib/dados/saude";
import { LinhaMedicamento, NovoMedicamento } from "../catalogo";
import styles from "../catalogo.module.css";

export const metadata: Metadata = { title: "Medicamentos" };

export default async function Medicamentos({
  searchParams,
}: PageProps<"/saude/medicamentos">) {
  const consulta = await searchParams;

  const [medicamentos, doencas] = await Promise.all([
    listarMedicamentos(true),
    listarDoencas(),
  ]);

  const meus = medicamentos.filter((m) => !m.doCatalogo);

  return (
    <div className={styles.tela}>
      <Link href="/saude" className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Saúde
      </Link>

      {consulta.criado === "1" ? (
        <Toast
          tone="ok"
          title="Medicamento criado"
          description="Ele já aparece ao registrar um tratamento, com a carência junto."
        />
      ) : null}
      {consulta.salvo === "1" ? (
        <Toast
          tone="ok"
          title="Medicamento salvo"
          description="A carência nova vale para os tratamentos que terminarem daqui em diante."
        />
      ) : null}
      {consulta.excluido === "1" ? (
        <Toast
          tone="ok"
          title="Medicamento excluído"
          description="Ele sai da lista de escolha. Os tratamentos antigos continuam com ele."
        />
      ) : null}

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Medicamentos</h1>
        <p className={styles.contexto}>
          {meus.length === 0
            ? "Nenhum medicamento no catálogo."
            : `${meus.length} ${meus.length === 1 ? "medicamento" : "medicamentos"}`}
        </p>
        <p className={styles.explicacao}>
          O catálogo nasce vazio e é seu: nome comercial, dose e carência saem
          da bula e da prescrição, variam por marca e não cabem numa lista
          pronta. A <strong>carência</strong> é o que o sistema calcula sozinho
          — ela conta a partir do fim de cada tratamento.
        </p>
      </header>

      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>Novo medicamento</h2>
        <NovoMedicamento doencas={doencas} />
      </section>

      {meus.length > 0 ? (
        <section className={styles.bloco}>
          <h2 className={styles.blocoTitulo}>Seus medicamentos</h2>
          <ul className={styles.lista}>
            {meus.map((m) => (
              <li key={m.id}>
                <LinhaMedicamento medicamento={m} doencas={doencas} />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className={styles.nota}>
          <Pill size={14} aria-hidden="true" />
          Dá para registrar um tratamento sem medicamento no catálogo — o que
          não existe sem ele é o cálculo da carência.
        </p>
      )}
    </div>
  );
}
