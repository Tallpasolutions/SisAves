import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { EmptyState, Button } from "@/components/ui";
import {
  avesCertificaveis,
  previaDoCertificado,
} from "@/lib/dados/certificados";
import { CertificadoA4 } from "@/components/documentos/CertificadoA4";
import { PainelEscolha } from "./painel";
import styles from "../certificados.module.css";

export const metadata: Metadata = { title: "Emitir certificado" };

/**
 * C3 — o editor de CRO.
 *
 * Painel de 340px à esquerda, folha A4 ao vivo à direita. A prévia vem da
 * MESMA função que a emissão congela (`montar_snapshot_certificado`), para o
 * que se vê na tela ser exatamente o que sai no papel.
 *
 * A escolha vem por parâmetro de URL, não por estado de cliente: a prévia é
 * uma folha inteira renderizada no servidor, e refazê-la no navegador a cada
 * tecla seria pedir ao cliente que reimplementasse o documento.
 */
export default async function NovoCertificado({
  searchParams,
}: PageProps<"/certificados/novo">) {
  const consulta = await searchParams;
  const aveId = typeof consulta.ave === "string" ? consulta.ave : null;
  const busca = typeof consulta.busca === "string" ? consulta.busca : "";

  const aves = await avesCertificaveis();
  const escolhida = aveId ? aves.find((a) => a.id === aveId) : null;
  const previa = escolhida ? await previaDoCertificado(escolhida.id) : null;

  return (
    <div className={styles.editor}>
      <aside className={styles.painel}>
        <Link href="/certificados" className={styles.voltar}>
          <ChevronLeft size={18} aria-hidden="true" />
          Certificados
        </Link>

        <header className={styles.painelCabecalho}>
          <h1 className={styles.painelTitulo}>Emitir certificado</h1>
          <p className={styles.painelNota}>
            Só ave anilhada: o documento afirma a anilha oficial.
          </p>
        </header>

        <PainelEscolha
          aves={aves}
          escolhida={escolhida?.id ?? null}
          buscaInicial={busca}
        />
      </aside>

      <section className={styles.prevía} aria-label="Prévia do certificado">
        {previa && escolhida ? (
          <>
            <p className={styles.avisoPrevia}>
              Prévia. O número do certificado é gerado na emissão, e a
              genealogia abaixo é congelada nesse momento.
            </p>
            <div className={styles.folhaReduzida}>
              <CertificadoA4
                certificado={{
                  id: "",
                  sequencial: 0,
                  hash: "previa",
                  emitidoEm: new Date().toISOString(),
                  revogadoEm: null,
                  revogadoMotivo: null,
                  snapshot: previa,
                  caminhoPublico: "/v/previa-0",
                }}
                origem="https://sisaves.tallpa.com.br"
              />
            </div>
          </>
        ) : (
          <EmptyState
            icon={<ChevronLeft size={28} />}
            title="Escolha a ave"
            description="A folha aparece aqui do jeito que vai sair impressa, com a genealogia de três gerações e o coeficiente de endogamia."
            acao={<Button href="/plantel">Ver o plantel</Button>}
            compact
          />
        )}
      </section>
    </div>
  );
}
