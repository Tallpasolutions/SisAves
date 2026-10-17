import type { Metadata } from "next";
import {
  Award,
  Bird,
  ChevronLeft,
  Egg,
  Syringe,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Toast } from "@/components/ui";
import { listarCategorias } from "@/lib/dados/financeiro";
import { iconeDaCategoria, type IconeCategoria } from "@/lib/dados/financeiro-rotulos";
import { LinhaCategoria, NovaCategoria } from "./categorias";
import styles from "./categorias.module.css";

export const metadata: Metadata = { title: "Categorias" };

const GLIFO: Record<IconeCategoria, LucideIcon> = { Bird, Wallet, Syringe, Award, Egg };

export default async function Categorias({
  searchParams,
}: PageProps<"/financeiro/categorias">) {
  const consulta = await searchParams;
  const categorias = await listarCategorias(true);

  const doSistema = categorias.filter((c) => c.chave !== null);
  const doCriatorio = categorias.filter((c) => c.chave === null);

  return (
    <div className={styles.tela}>
      <Link href="/financeiro" className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Financeiro
      </Link>

      {consulta.criada === "1" ? (
        <Toast
          tone="ok"
          title="Categoria criada"
          description="Ela já aparece na lista de escolha ao lançar uma receita ou despesa."
        />
      ) : null}
      {consulta.salva === "1" ? (
        <Toast
          tone="ok"
          title="Categoria salva"
          description="O nome novo já aparece nos lançamentos que a usam."
        />
      ) : null}
      {consulta.excluida === "1" ? (
        <Toast
          tone="ok"
          title="Categoria excluída"
          description="Ela sai da lista de escolha. Os lançamentos antigos continuam com ela."
        />
      ) : null}

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Categorias</h1>
        <p className={styles.contexto}>
          {doCriatorio.length === 0
            ? "Nenhuma categoria sua."
            : `${doCriatorio.length} ${doCriatorio.length === 1 ? "categoria sua" : "categorias suas"} · ${doSistema.length} do sistema`}
        </p>
        <p className={styles.explicacao}>
          A categoria é o que separa ração de veterinário no fim do mês. As do
          sistema vêm prontas e não se editam — é por elas que a venda de ave
          sabe onde lançar a receita.
        </p>
      </header>

      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>Nova categoria</h2>
        <NovaCategoria />
      </section>

      {doCriatorio.length > 0 ? (
        <section className={styles.bloco}>
          <h2 className={styles.blocoTitulo}>Suas categorias</h2>
          <ul className={styles.lista}>
            {doCriatorio.map((c) => (
              <li key={c.id}>
                <LinhaCategoria categoria={c} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>Do sistema</h2>
        <ul className={styles.listaFixa}>
          {doSistema.map((c) => {
            const Icone = GLIFO[iconeDaCategoria(c.icone)];
            return (
              <li key={c.id} className={styles.fixa}>
                <span className={styles.fixaIcone} aria-hidden="true">
                  <Icone size={18} />
                </span>
                <span className={styles.fixaTextos}>
                  <span className={styles.fixaNome}>{c.nome}</span>
                  <span className={styles.fixaDetalhe}>
                    {c.tipo === "receita" ? "Receita" : "Despesa"}
                    {c.usos
                      ? ` · ${c.usos} ${c.usos === 1 ? "lançamento" : "lançamentos"}`
                      : " · nenhum lançamento"}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
