import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CertificadoA4 } from "@/components/documentos/CertificadoA4";
import { obterCertificado } from "@/lib/dados/certificados";
import { BarraImpressao } from "./BarraImpressao";
import styles from "./cro.module.css";

export const metadata: Metadata = { title: "Certificado" };

/**
 * A folha pronta para imprimir.
 *
 * Fora do grupo `(app)` de propósito: sem sidebar, sem tab bar, sem nada que
 * saia no papel. O PDF nasce da impressão do navegador — a peça já foi
 * desenhada em mm para sair pronta, e gerar PDF no servidor exigiria um
 * Chrome headless em função serverless para ganhar nada.
 */
export default async function Cro({ params }: PageProps<"/cro/[id]">) {
  const { id } = await params;
  const certificado = await obterCertificado(id);
  if (!certificado) notFound();

  const cabecalhos = await headers();
  const host = cabecalhos.get("host") ?? "sisaves.tallpa.com.br";
  const protocolo = host.startsWith("localhost") ? "http" : "https";

  return (
    <div className={styles.mesa}>
      <BarraImpressao
        numero={certificado.sequencial}
        aveId={certificado.snapshot.ave.nome}
        revogado={certificado.revogadoEm !== null}
      />
      <CertificadoA4 certificado={certificado} origem={`${protocolo}://${host}`} />
    </div>
  );
}
