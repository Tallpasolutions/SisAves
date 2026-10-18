import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArvoreA4 } from "@/components/documentos/ArvoreA4";
import { lerCodigo, validarCertificado } from "@/lib/dados/certificados";
import { BarraImpressao } from "../../../[id]/BarraImpressao";
import styles from "../../../[id]/arvore/arvore.module.css";

export const metadata: Metadata = {
  title: "Árvore genealógica",
  robots: { index: false, follow: false },
};

/**
 * A folha da árvore pela porta pública.
 *
 * Mesma razão da folha do CRO: quem recebeu a ave precisa poder imprimir a
 * via que lhe entregaram, e não tem login. Sem contato do criador — ele vem
 * da tabela, e por aqui só passa o snapshot.
 */
export default async function ArvorePublicaImpressa({
  params,
}: PageProps<"/cro/publico/[codigo]/arvore">) {
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
        peca="arvore"
      />
      <ArvoreA4
        certificado={{
          // O id interno não atravessa a porta pública.
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
