import type { Metadata } from "next";
import { Bird, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Anilha } from "@/components/ui";
import {
  listarCategorias,
  obterLancamento,
  opcoesDeAve,
} from "@/lib/dados/financeiro";
import { mesInvalido } from "@/lib/dados/financeiro-rotulos";
import { formatarData, formatarMoeda } from "@/lib/formato";
import { BotaoExcluirLancamento, FormularioLancamento } from "../../formulario";
import styles from "../../formulario.module.css";

export const metadata: Metadata = { title: "Corrigir lançamento" };

export default async function EditarLancamento({
  params,
  searchParams,
}: PageProps<"/financeiro/[id]/editar">) {
  const { id } = await params;
  const consulta = await searchParams;

  const lancamento = await obterLancamento(id);
  if (!lancamento) notFound();

  const pedido = typeof consulta.mes === "string" ? consulta.mes : null;
  // Sem mês na URL, volta para o mês do próprio lançamento.
  const mes =
    pedido && !mesInvalido(pedido) ? pedido : `${lancamento.data.slice(0, 7)}-01`;

  const [categorias, aves] = await Promise.all([listarCategorias(), opcoesDeAve()]);

  const descricao = `${lancamento.descricao ?? lancamento.categoria?.nome ?? "lançamento"} · ${formatarMoeda(lancamento.valor)}`;

  return (
    <div className={styles.tela}>
      <Link href={`/financeiro?mes=${mes}`} className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Financeiro
      </Link>

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Corrigir lançamento</h1>
        <p className={styles.contexto}>
          {lancamento.tipo === "receita" ? "Receita" : "Despesa"} de{" "}
          {formatarMoeda(lancamento.valor)} em {formatarData(lancamento.data)}.
        </p>
      </header>

      {/* A ave citada é um vínculo, não um dado de leitura: quem corrige a
          receita da venda precisa saber que a SAÍDA da ave é outro registro e
          não muda aqui. */}
      {lancamento.ave ? (
        <div className={styles.vinculo}>
          <span>
            Este lançamento cita uma ave. Corrigir o valor aqui não muda a saída
            dela do plantel, que tem registro próprio.
          </span>
          <Link href={`/plantel/${lancamento.ave.id}`} className={styles.vinculoElo}>
            <Bird size={16} aria-hidden="true" />
            {lancamento.ave.nome ?? "Sem nome"}
            <Anilha dados={lancamento.ave.anilha} size="sm" tone="quiet" />
          </Link>
        </div>
      ) : null}

      <FormularioLancamento
        categorias={categorias}
        aves={aves}
        mes={mes}
        emEdicao={lancamento}
      />

      <div className={styles.exclusao}>
        <p className={styles.exclusaoNota}>
          Lançamento que nunca existiu se apaga; valor digitado errado se
          corrige acima. O saldo do mês é recalculado nos dois casos.
        </p>
        <BotaoExcluirLancamento
          lancamentoId={lancamento.id}
          mes={mes}
          descricao={descricao}
        />
      </div>
    </div>
  );
}
