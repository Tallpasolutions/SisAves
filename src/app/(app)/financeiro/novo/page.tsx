import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { listarCategorias, opcoesDeAve } from "@/lib/dados/financeiro";
import { mesInvalido, rotuloDoMes } from "@/lib/dados/financeiro-rotulos";
import { hojeNoCriatorio } from "@/lib/data";
import { FormularioLancamento } from "../formulario";
import styles from "../formulario.module.css";

export const metadata: Metadata = { title: "Novo lançamento" };

export default async function NovoLancamento({
  searchParams,
}: PageProps<"/financeiro/novo">) {
  const consulta = await searchParams;
  const pedido = typeof consulta.mes === "string" ? consulta.mes : null;
  const mes =
    pedido && !mesInvalido(pedido) ? pedido : `${hojeNoCriatorio().slice(0, 7)}-01`;

  const [categorias, aves] = await Promise.all([listarCategorias(), opcoesDeAve()]);

  return (
    <div className={styles.tela}>
      <Link href={`/financeiro?mes=${mes}`} className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Financeiro
      </Link>

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Novo lançamento</h1>
        <p className={styles.contexto}>
          Receita ou despesa do criatório. O mês na tela é {rotuloDoMes(mes).toLowerCase()}.
        </p>
      </header>

      <FormularioLancamento categorias={categorias} aves={aves} mes={mes} />
    </div>
  );
}
