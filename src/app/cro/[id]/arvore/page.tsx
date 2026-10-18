import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArvoreA4 } from "@/components/documentos/ArvoreA4";
import { obterCertificado } from "@/lib/dados/certificados";
import { obterCriatorioAtual } from "@/lib/criatorio";
import { BarraImpressao } from "../BarraImpressao";
import styles from "./arvore.module.css";

export const metadata: Metadata = { title: "Árvore genealógica" };

/**
 * A folha da árvore, pela porta de quem emitiu.
 *
 * O contato do criador é lido AQUI, ao vivo da tabela, e não do snapshot: a
 * página pública devolve o snapshot inteiro a quem escaneia o QR, e contato
 * dentro dele seria contato publicado na internet.
 */
export default async function ArvoreDoCertificado({
  params,
}: PageProps<"/cro/[id]/arvore">) {
  const { id } = await params;
  const certificado = await obterCertificado(id);
  if (!certificado) notFound();

  const criatorio = await obterCriatorioAtual();

  const cabecalhos = await headers();
  const host = cabecalhos.get("host") ?? "sisaves.tallpa.com.br";
  const protocolo = host.startsWith("localhost") ? "http" : "https";

  return (
    <div className={styles.mesa}>
      <BarraImpressao
        numero={certificado.sequencial}
        aveId={certificado.snapshot.ave.nome}
        revogado={certificado.revogadoEm !== null}
        peca="arvore"
        certificadoId={id}
      />
      <ArvoreA4
        certificado={certificado}
        origem={`${protocolo}://${host}`}
        contato={
          criatorio?.contato_no_documento
            ? { whatsapp: criatorio.whatsapp, instagram: criatorio.instagram }
            : null
        }
      />
    </div>
  );
}
