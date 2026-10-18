import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CrachaA4 } from "@/components/documentos/CrachaA4";
import { obterCertificado } from "@/lib/dados/certificados";
import { obterCriatorioAtual } from "@/lib/criatorio";
import { BarraImpressao } from "../BarraImpressao";
import styles from "./cracha.module.css";

export const metadata: Metadata = { title: "Crachá de gaiola" };

export default async function ChrachaDoCertificado({
  params,
}: PageProps<"/cro/[id]/cracha">) {
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
        peca="cracha"
        certificadoId={id}
      />
      <CrachaA4
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
