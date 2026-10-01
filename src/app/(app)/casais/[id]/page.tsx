import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Anilha,
  Badge,
  Button,
  EmptyState,
  InbreedingMeter,
  SexChip,
} from "@/components/ui";
import {
  obterCasal,
  type NinhadaResumo,
  type ParceiroCasal,
} from "@/lib/dados/casais";
import { ROTULO_ESTADO, TOM_ESTADO } from "@/lib/dados/ovos";
import { encadear, formatarData } from "@/lib/formato";
import styles from "./ficha.module.css";

export async function generateMetadata({
  params,
}: PageProps<"/casais/[id]">): Promise<Metadata> {
  const { id } = await params;
  const casal = await obterCasal(id);
  return { title: casal ? `Casal ${String(casal.numero).padStart(2, "0")}` : "Casal" };
}

export default async function FichaCasal({ params }: PageProps<"/casais/[id]">) {
  const { id } = await params;
  const casal = await obterCasal(id);
  if (!casal) notFound();

  const numero = String(casal.numero).padStart(2, "0");
  const endogamia = casal.endogamiaAtual ?? casal.endogamiaPct;

  return (
    <>
      <div className={styles.tela}>
        <Link href="/casais" className={styles.voltar}>
          <ChevronLeft size={18} aria-hidden="true" />
          Casais
        </Link>

        <header className={styles.cabecalho}>
          <h1 className={styles.titulo}>Casal {numero}</h1>
          <p className={styles.contexto}>
            {encadear(
              casal.macho?.especie ?? casal.femea?.especie,
              casal.gaiola ? `gaiola ${casal.gaiola}` : null,
              `desde ${formatarData(casal.vigenciaInicio)}`,
            )}
          </p>
          <div className={styles.etiquetas}>
            <Badge tone={casal.ativo ? "ok" : "neutro"} dot size="sm">
              {casal.ativo ? "Ativo" : "Encerrado"}
            </Badge>
            {casal.estadoMaisUrgente ? (
              <Badge tone={TOM_ESTADO[casal.estadoMaisUrgente]} size="sm">
                {ROTULO_ESTADO[casal.estadoMaisUrgente]}
              </Badge>
            ) : null}
          </div>
        </header>

        <section className={styles.secao}>
          <h2 className={styles.secaoTitulo}>O par</h2>
          <div className={styles.par}>
            <Parceiro papel="Macho" parceiro={casal.macho} />
            <Parceiro papel="Fêmea" parceiro={casal.femea} />
          </div>
        </section>

        <section className={styles.secao}>
          <h2 className={styles.secaoTitulo}>Coeficiente de endogamia</h2>
          <div className={styles.cartao}>
            {endogamia !== null ? (
              <InbreedingMeter
                value={endogamia}
                showScale
                explicacao={
                  casal.explicacaoEndogamia ??
                  "Sem ancestrais em comum nas gerações registradas."
                }
              />
            ) : (
              <p className={styles.contexto}>
                O cálculo exige macho e fêmea definidos no casal.
              </p>
            )}
          </div>
        </section>

        <section className={styles.secao}>
          <h2 className={styles.secaoTitulo}>Ninhadas</h2>
          {casal.ninhadas.length === 0 ? (
            <EmptyState
              title="Nenhuma ninhada registrada"
              description="Registre a primeira postura deste casal para acompanhar o ciclo."
              compact
            />
          ) : (
            <ol className={styles.historico}>
              {casal.ninhadas.map((n, indice) => (
                <LinhaNinhada key={n.id} ninhada={n} atual={indice === 0} />
              ))}
            </ol>
          )}
        </section>

        {casal.observacoes ? (
          <section className={styles.secao}>
            <h2 className={styles.secaoTitulo}>Observações</h2>
            <p className={styles.contexto}>{casal.observacoes}</p>
          </section>
        ) : null}
      </div>

      {/* Ação fixa na base: a tela de detalhe troca a tab bar por ela.
          Só faz sentido em casal ativo — encerrado não recebe postura. */}
      {casal.ativo ? (
        <div className={styles.acaoFixa}>
          <div className={styles.acaoFixaInterno}>
            <Button bloco size="lg" disabled>
              Registrar postura
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Parceiro({
  papel,
  parceiro,
}: {
  papel: string;
  parceiro: ParceiroCasal | null;
}) {
  if (!parceiro) {
    return (
      <div className={styles.parceiro}>
        <span className={styles.parceiroPapel}>{papel}</span>
        <span className={styles.parceiroEspecie}>Não definido</span>
      </div>
    );
  }

  return (
    <Link href={`/plantel/${parceiro.id}`} className={styles.parceiro}>
      <span className={styles.parceiroPapel}>{papel}</span>
      <span className={styles.parceiroTopo}>
        <SexChip sexo={parceiro.sexo} compacta />
        <span className={styles.parceiroNome}>{parceiro.nome ?? "Sem nome"}</span>
      </span>
      <Anilha dados={parceiro.anilha} size="sm" tone="quiet" />
      <span className={styles.parceiroEspecie}>
        {encadear(parceiro.especie, parceiro.mutacao) || "Espécie não informada"}
      </span>
    </Link>
  );
}

function LinhaNinhada({ ninhada: n, atual }: { ninhada: NinhadaResumo; atual: boolean }) {
  return (
    <li className={styles.ninhada}>
      <span
        className={`${styles.marcador} ${atual ? styles.marcadorAtual : ""}`}
        aria-hidden="true"
      />
      <span className={styles.ninhadaTextos}>
        <span className={styles.ninhadaNome}>
          Ninhada {String(n.numero).padStart(2, "0")}
        </span>
        <span className={styles.ninhadaDetalhe}>
          {encadear(
            formatarData(n.iniciadaEm),
            `${n.total} ${n.total === 1 ? "ovo" : "ovos"}`,
            n.nascidos > 0 ? `${n.nascidos} ${n.nascidos === 1 ? "nascido" : "nascidos"}` : null,
            n.perdidos > 0 ? `${n.perdidos} ${n.perdidos === 1 ? "perda" : "perdas"}` : null,
          )}
        </span>
      </span>
      {n.estado ? (
        <Badge tone={TOM_ESTADO[n.estado]} size="sm">
          {ROTULO_ESTADO[n.estado]}
        </Badge>
      ) : null}
    </li>
  );
}
