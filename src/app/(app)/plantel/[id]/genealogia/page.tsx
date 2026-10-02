import type { Metadata } from "next";
import { ChevronLeft, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PedigreeNode } from "@/components/ui";
import { obterAve } from "@/lib/dados/plantel";
import {
  descreverProfundidade,
  descreverRepeticao,
  obterArvore,
  type Arvore,
  type NoArvore,
} from "@/lib/dados/genealogia";
import { encadear, formatarPercentual } from "@/lib/formato";
import styles from "./genealogia.module.css";

export async function generateMetadata({
  params,
}: PageProps<"/plantel/[id]/genealogia">): Promise<Metadata> {
  const { id } = await params;
  const ave = await obterAve(id);
  return { title: ave?.nome ? `Genealogia de ${ave.nome}` : "Genealogia" };
}

export default async function Genealogia({
  params,
}: PageProps<"/plantel/[id]/genealogia">) {
  const { id } = await params;
  const arvore = await obterArvore(id);
  if (!arvore) notFound();

  return (
    <div className={styles.tela}>
      {/* Único bloco de petróleo cheio da tela. */}
      <header className={styles.cabecalho}>
        <Link
          href={`/plantel/${id}`}
          className={styles.voltar}
          aria-label="Voltar para a ficha da ave"
        >
          <ChevronLeft size={22} aria-hidden="true" />
        </Link>
        <div className={styles.cabecalhoTextos}>
          <span className={styles.titulo}>Árvore genealógica</span>
          <span className={styles.subtitulo}>
            {encadear(arvore.raiz.nome ?? "Sem nome", descreverProfundidade(arvore))}
          </span>
        </div>
      </header>

      {arvore.repetidos.length > 0 ? (
        <AvisoRepeticao arvore={arvore} />
      ) : null}

      {arvore.conhecidos === 0 ? (
        <p className={styles.semAncestral}>
          Nenhum ancestral registrado. Informe pai e mãe na ficha da ave para a
          árvore crescer.
        </p>
      ) : null}

      {/* A rolagem é horizontal de propósito: três gerações não cabem em 390px
          sem encolher a anilha, que é o dado que identifica a ave. */}
      <div className={styles.arvore}>
        <div className={styles.trilho}>
          <span className={`${styles.colunaTitulo} ${styles.tituloIndividuo}`}>
            Indivíduo
          </span>
          <span className={`${styles.colunaTitulo} ${styles.tituloPais}`}>Pais</span>
          <span className={`${styles.colunaTitulo} ${styles.tituloAvos}`}>Avós</span>

          <div className={`${styles.coluna} ${styles.colunaIndividuo}`}>
            <No no={arvore.raiz} />
          </div>

          <ConectorPais />

          <div className={`${styles.coluna} ${styles.colunaPais}`}>
            {arvore.pais.map((slot) => (
              <No key={slot.caminho} no={slot.no} posicao={slot.rotulo} compacta />
            ))}
          </div>

          <ConectorAvos />

          <div className={`${styles.coluna} ${styles.colunaAvos}`}>
            {arvore.avos.map((slot) => (
              <No key={slot.caminho} no={slot.no} posicao={slot.rotulo} compacta />
            ))}
          </div>
        </div>
      </div>

      <footer className={styles.legenda}>
        <span className={styles.item}>
          <span className={`${styles.amostra} ${styles.amostraMacho}`} aria-hidden="true" />
          Macho
        </span>
        <span className={styles.item}>
          <span className={`${styles.amostra} ${styles.amostraFemea}`} aria-hidden="true" />
          Fêmea
        </span>
        <span className={styles.item}>
          <span className={styles.amostraRepetido} aria-hidden="true" />
          Repetido
        </span>
        <span className={styles.arraste} aria-hidden="true">
          arraste →
        </span>
      </footer>
    </div>
  );
}

/**
 * O nó de um lugar da árvore.
 *
 * Nos nós conhecidos a posição se lê pelo lugar; no vazio, não — por isso ela
 * entra no próprio nó, para o criador saber QUAL avó está faltando.
 */
function No({
  no,
  posicao,
  compacta = false,
}: {
  no: NoArvore | null;
  posicao?: string;
  compacta?: boolean;
}) {
  if (!no) {
    return <PedigreeNode desconhecido posicao={posicao} compacta={compacta} />;
  }

  return (
    <PedigreeNode
      nome={no.nome}
      anilha={no.anilha}
      sexo={no.sexo}
      mutacao={no.mutacao}
      compacta={compacta}
      repetido={no.repetido}
      href={`/plantel/${no.id}`}
    />
  );
}

/**
 * O aviso fica fixo no topo porque é a razão de o criador abrir esta tela: o
 * ancestral repetido é de onde a endogamia vem, e ele precisa saber disso antes
 * de rolar a árvore atrás da coincidência.
 */
function AvisoRepeticao({ arvore }: { arvore: Arvore }) {
  const varios = arvore.repetidos.length > 1;

  return (
    <div className={styles.aviso} role="status">
      <span className={styles.avisoIcone} aria-hidden="true">
        <TriangleAlert size={18} />
      </span>
      <div className={styles.avisoTextos}>
        <span className={styles.avisoTitulo}>
          {varios
            ? `${arvore.repetidos.length} ancestrais repetidos nos dois lados`
            : "Ancestral repetido nos dois lados"}
        </span>
        <span className={styles.avisoTexto}>
          {arvore.repetidos.map(descreverRepeticao).join(" ")}
          {arvore.endogamiaPct !== null
            ? ` Endogamia ${formatarPercentual(arvore.endogamiaPct)}.`
            : ""}
        </span>
      </div>
    </div>
  );
}

/** Da raiz para os dois pais: centros em 25% e 75% da coluna. */
function ConectorPais() {
  return (
    <div className={`${styles.conector} ${styles.conectorPais}`} aria-hidden="true">
      <span className={styles.entrada} />
      <span className={styles.tronco} />
      <span className={`${styles.saida} ${styles.saidaSuperior}`} />
      <span className={`${styles.saida} ${styles.saidaInferior}`} />
    </div>
  );
}

/**
 * De cada pai para os seus dois progenitores. São dois troncos separados, um por
 * ramo: uma linha única ligando os quatro faria o lado paterno parecer continuar
 * no materno.
 */
function ConectorAvos() {
  return (
    <div className={`${styles.conector} ${styles.conectorAvos}`} aria-hidden="true">
      <span className={`${styles.entrada} ${styles.entradaPaterna}`} />
      <span className={`${styles.tronco} ${styles.troncoPaterno}`} />
      <span className={`${styles.saida} ${styles.saidaPP}`} />
      <span className={`${styles.saida} ${styles.saidaPM}`} />

      <span className={`${styles.entrada} ${styles.entradaMaterna}`} />
      <span className={`${styles.tronco} ${styles.troncoMaterno}`} />
      <span className={`${styles.saida} ${styles.saidaMP}`} />
      <span className={`${styles.saida} ${styles.saidaMM}`} />
    </div>
  );
}
