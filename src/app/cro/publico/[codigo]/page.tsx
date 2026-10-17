import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { CertificadoA4 } from "@/components/documentos/CertificadoA4";
import { lerCodigo, validarCertificado } from "@/lib/dados/certificados";
import { BarraImpressao } from "../../[id]/BarraImpressao";
import styles from "../../[id]/cro.module.css";

export const metadata: Metadata = {
  title: "Certificado",
  robots: { index: false, follow: false },
};

/**
 * A mesma folha, pela porta pública.
 *
 * Quem recebe a ave precisa poder imprimir a via que lhe entregaram — e não
 * tem login. Lê por `validar_certificado`, a mesma função anônima da página de
 * validação: nenhum id interno, nenhum contato do criador.
 */
export default async function CroPublico({
  params,
}: PageProps<"/cro/publico/[codigo]">) {
  const { codigo } = await params;
  const lido = lerCodigo(codigo);
  if (!lido) notFound();

  const validacao = await validarCertificado(lido.hash, lido.sequencial);
  if (!validacao) notFound();

  const cabecalhos = await headers();
  const host = cabecalhos.get("host") ?? "sisaves.tallpa.com.br";
  const protocolo = host.startsWith("localhost") ? "http" : "https";

  return (
    <div className={styles.mesa}>
      <BarraImpressao
        numero={validacao.numero}
        aveId={validacao.dados.ave.nome}
        revogado={!validacao.autentico}
      />
      <CertificadoA4
        certificado={{
          // O id interno não atravessa a porta pública: a folha não precisa
          // dele, e expô-lo daria um identificador para varrer.
          id: "",
          sequencial: validacao.numero,
          hash: lido.hash,
          emitidoEm: validacao.emitidoEm,
          revogadoEm: validacao.revogadoEm,
          revogadoMotivo: validacao.revogadoMotivo,
          snapshot: validacao.dados,
          caminhoPublico: `/v/${codigo}`,
        }}
        origem={`${protocolo}://${host}`}
      />
    </div>
  );
}
