import type { Metadata } from "next";
import { ChevronLeft, Scale } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, EmptyState, Toast } from "@/components/ui";
import {
  obterHistoricoPeso,
  ROTULO_CONTEXTO,
  type Pesagem,
} from "@/lib/dados/pesagens";
import { formatarData, formatarPeso } from "@/lib/formato";
import { FormularioPesagem } from "./formulario";
import styles from "./pesagens.module.css";

export const metadata: Metadata = { title: "Pesagens" };

export default async function Pesagens({
  params,
  searchParams,
}: PageProps<"/plantel/[id]/pesagens">) {
  const [{ id }, consulta] = await Promise.all([params, searchParams]);
  const historico = await obterHistoricoPeso(id);
  if (!historico) notFound();

  const atual = historico.pesagens[0] ?? null;

  return (
    <div className={styles.tela}>
      <Link href={`/plantel/${id}`} className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        {historico.nome ?? "Ficha da ave"}
      </Link>

      {consulta.registrada === "1" && atual ? (
        <Toast
          tone="ok"
          title={`Pesagem registrada · ${formatarPeso(atual.pesoGramas)} · ${formatarData(atual.data)}`}
          description={
            atual.variacao !== null
              ? descreverVariacao(atual)
              : "É a primeira pesagem desta ave."
          }
        />
      ) : null}

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Pesagens</h1>
        <p className={styles.contexto}>
          {historico.pesagens.length === 0
            ? "Nenhuma pesagem registrada."
            : `${historico.pesagens.length} ${historico.pesagens.length === 1 ? "registro" : "registros"} · atual ${formatarPeso(atual!.pesoGramas)}`}
        </p>
      </header>

      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>Nova pesagem</h2>
        <FormularioPesagem aveId={id} nome={historico.nome} />
      </section>

      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>Histórico</h2>

        {historico.pesagens.length === 0 ? (
          <EmptyState
            icon={<Scale size={28} />}
            title="Sem pesagens"
            description="O peso ao anilhamento entra sozinho quando o filhote é anilhado. As demais são registradas aqui."
            compact
          />
        ) : (
          <ul className={styles.lista}>
            {historico.pesagens.map((p) => (
              <li key={p.id} className={styles.linha}>
                <span className={styles.linhaTextos}>
                  <span className={styles.peso}>{formatarPeso(p.pesoGramas)}</span>
                  <span className={styles.linhaContexto}>
                    {formatarData(p.data)}
                    {p.observacoes ? ` · ${p.observacoes}` : ""}
                  </span>
                </span>

                <span className={styles.linhaLateral}>
                  {p.contexto ? (
                    <Badge tone="neutro" size="sm">
                      {ROTULO_CONTEXTO[p.contexto] ?? p.contexto}
                    </Badge>
                  ) : null}
                  {/* O sinal vai no texto, não só na cor: "+2,3 g" e "−1,0 g"
                      se distinguem sem enxergar cor nenhuma. */}
                  {p.variacao !== null ? (
                    <span className={styles.variacao}>{formatarVariacao(p.variacao)}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** "+2,3 g" · "−1,0 g" · "sem variação" — menos-matemático, não hífen. */
function formatarVariacao(gramas: number): string {
  if (gramas === 0) return "sem variação";
  const sinal = gramas > 0 ? "+" : "−";
  return `${sinal}${formatarPeso(Math.abs(gramas))}`;
}

function descreverVariacao(p: Pesagem): string {
  const variacao = p.variacao ?? 0;
  const dias = p.diasDesdeAnterior ?? 0;
  const intervalo =
    dias === 0 ? "no mesmo dia" : `em ${dias} ${dias === 1 ? "dia" : "dias"}`;

  if (variacao === 0) return `Mesmo peso da pesagem anterior, ${intervalo}.`;
  return `${formatarVariacao(variacao)} ${intervalo}.`;
}
