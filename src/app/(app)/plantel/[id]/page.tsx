import type { Metadata } from "next";
import { Award, ChevronLeft, Dna, Scale } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Anilha, Badge, SexChip, Toast } from "@/components/ui";
import {
  descreverEspecie,
  descreverSituacao,
  obterAve,
  type ResumoAve,
} from "@/lib/dados/plantel";
import { descreverAve, formatarData, formatarIdade, formatarPeso } from "@/lib/formato";
import styles from "./ficha.module.css";

export async function generateMetadata({
  params,
}: PageProps<"/plantel/[id]">): Promise<Metadata> {
  const { id } = await params;
  const ave = await obterAve(id);
  return { title: ave?.nome ?? "Ave" };
}

const ROTULO_ORIGEM: Record<string, string> = {
  nascimento_proprio: "Nascida no criatório",
  compra: "Comprada",
  doacao_recebida: "Recebida em doação",
  transferencia: "Transferida",
};

export default async function Ficha({
  params,
  searchParams,
}: PageProps<"/plantel/[id]">) {
  const { id } = await params;
  const consulta = await searchParams;
  const ave = await obterAve(id);
  if (!ave) notFound();

  const situacao = descreverSituacao(ave.situacao);
  const recemCadastrada = consulta.cadastrada === "1";

  return (
    <div className={styles.tela}>
      <Link href="/plantel" className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Plantel
      </Link>

      {/* Confirmação do cadastro: o fato, e a consequência — o que esta ave
          passa a poder fazer no sistema. */}
      {recemCadastrada ? (
        <Toast
          tone="ok"
          title={`Ave cadastrada · ${descreverAve(ave)}`}
          description={
            ave.sexo === "indefinido"
              ? "Defina o sexo para que ela possa entrar num casal."
              : "Já pode entrar num casal e aparecer na genealogia dos filhotes."
          }
        />
      ) : null}

      <header className={styles.identidade}>
        <span className={styles.foto}>
          {ave.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.fotoImagem} src={ave.fotoUrl} alt={`Foto de ${ave.nome ?? "ave"}`} />
          ) : (
            // Ausência de imagem se resolve com tipografia e vazio honesto,
            // nunca com ornamento — regra do CLAUDE.md.
            <span className={styles.fotoVazia}>Sem foto</span>
          )}
        </span>

        <div className={styles.identidadeTextos}>
          <h1 className={styles.nome}>{ave.nome ?? "Sem nome"}</h1>
          <p className={styles.especie}>{descreverEspecie(ave.especie, ave.mutacao)}</p>
          <div className={styles.identidadeLinha}>
            <SexChip sexo={ave.sexo} />
            <Badge tone={situacao.tom} dot size="sm">
              {situacao.texto}
            </Badge>
          </div>
        </div>
      </header>

      <section className={styles.anilhaBloco}>
        <span className={styles.anilhaRotulo}>Anilha</span>
        <Anilha dados={ave.anilha} tone="brand" size="lg" />
        {ave.codigoAlternativo ? (
          <span className={styles.codigoAlternativo}>{ave.codigoAlternativo}</span>
        ) : null}
      </section>

      <dl className={styles.dados}>
        <Dado rotulo="Nascimento" valor={formatarData(ave.dtNascimento)} />
        <Dado rotulo="Idade" valor={formatarIdade(ave.dtNascimento)} />
        <Dado rotulo="Peso" valor={ave.pesoAtual !== null ? formatarPeso(ave.pesoAtual) : "—"} />
        <Dado rotulo="Casais" valor={String(ave.ninhadas)} />
        <Dado rotulo="Origem" valor={ROTULO_ORIGEM[ave.origem] ?? ave.origem} />
        <Dado rotulo="Portador" valor={ave.portador ?? "—"} />
      </dl>

      <section className={styles.secao}>
        <h2 className={styles.secaoTitulo}>Filiação</h2>
        <div className={styles.filiacao}>
          <Progenitor rotulo="Pai" ave={ave.pai} />
          <Progenitor rotulo="Mãe" ave={ave.mae} />
        </div>
      </section>

      <nav className={styles.atalhos} aria-label="Ações da ave">
        <Atalho href={`/plantel/${ave.id}/genealogia`} Icone={Dna} rotulo="Genealogia" />
        <Atalho href={`/plantel/${ave.id}/certificado`} Icone={Award} rotulo="Emitir CRO" />
        <Atalho href={`/plantel/${ave.id}/pesagens`} Icone={Scale} rotulo="Pesagens" />
      </nav>

      {ave.observacoes ? (
        <section className={styles.secao}>
          <h2 className={styles.secaoTitulo}>Observações</h2>
          <p className={styles.observacoes}>{ave.observacoes}</p>
        </section>
      ) : null}
    </div>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className={styles.dado}>
      <dt className={styles.dadoRotulo}>{rotulo}</dt>
      <dd className={styles.dadoValor}>{valor}</dd>
    </div>
  );
}

/** Pai e mãe são clicáveis quando existem — é assim que se sobe a árvore. */
function Progenitor({ rotulo, ave }: { rotulo: string; ave: ResumoAve | null }) {
  if (!ave) {
    return (
      <div className={`${styles.progenitor} ${styles.progenitorVazio}`}>
        <span className={styles.progenitorRotulo}>{rotulo}</span>
        <span className={styles.progenitorDesconhecido}>Desconhecido</span>
      </div>
    );
  }

  return (
    <Link href={`/plantel/${ave.id}`} className={styles.progenitor}>
      <span className={styles.progenitorRotulo}>{rotulo}</span>
      <span className={styles.progenitorNome}>{ave.nome ?? "Sem nome"}</span>
      <Anilha dados={ave.anilha} size="sm" tone="quiet" />
    </Link>
  );
}

function Atalho({
  href,
  Icone,
  rotulo,
}: {
  href: string;
  Icone: typeof Dna;
  rotulo: string;
}) {
  return (
    <Link href={href} className={styles.atalho}>
      <Icone size={20} aria-hidden="true" />
      <span>{rotulo}</span>
    </Link>
  );
}
