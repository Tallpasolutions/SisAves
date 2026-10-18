"use client";

import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui";
import styles from "./cro.module.css";

/** As peças que saem do mesmo certificado. */
export type Peca = "certificado" | "arvore" | "cracha";

const OUTRAS: Record<Peca, { rotulo: string; caminho: string }[]> = {
  certificado: [
    { rotulo: "Ver a árvore", caminho: "/arvore" },
    { rotulo: "Ver o crachá", caminho: "/cracha" },
  ],
  arvore: [
    { rotulo: "Ver o certificado", caminho: "" },
    { rotulo: "Ver o crachá", caminho: "/cracha" },
  ],
  cracha: [
    { rotulo: "Ver o certificado", caminho: "" },
    { rotulo: "Ver a árvore", caminho: "/arvore" },
  ],
};

const NOTA: Record<Peca, string> = {
  certificado: "Imprima em A4 retrato, sem redimensionar. O PDF sai pela própria impressão.",
  arvore: "Imprima em A4 PAISAGEM, sem redimensionar. O PDF sai pela própria impressão.",
  cracha: "Imprima em A4 e recorte na linha. Cabem dois crachás por folha.",
};

/**
 * A barra que não sai no papel.
 *
 * `@media print` a esconde inteira — ela existe só para a tela, e um botão
 * "Imprimir" impresso dentro do certificado seria o tipo de detalhe que faz o
 * comprador duvidar do documento.
 */
export function BarraImpressao({
  numero,
  aveId,
  revogado,
  peca = "certificado",
  certificadoId,
}: {
  numero: number;
  aveId: string | null;
  revogado: boolean;
  peca?: Peca;
  /** Sem id, a barra não oferece as outras peças (é a via pública). */
  certificadoId?: string;
}) {
  return (
    <div className={styles.barra}>
      <div className={styles.barraTextos}>
        <span className={styles.barraTitulo}>
          Certificado nº {String(numero).padStart(5, "0")}
          {aveId ? ` · ${aveId}` : ""}
        </span>
        <span className={styles.barraNota}>
          {revogado
            ? "Este certificado está revogado. A via impressa sai com a tarja."
            : NOTA[peca]}
        </span>
      </div>

      <div className={styles.barraAcoes}>
        {/* As três peças saem do mesmo certificado e do mesmo snapshot: trocar
            entre elas é navegação, não emissão nova. */}
        {certificadoId
          ? OUTRAS[peca].map((outra) => (
              <Button
                key={outra.rotulo}
                href={`/cro/${certificadoId}${outra.caminho}`}
                variant="ghost"
                size="md"
              >
                {outra.rotulo}
              </Button>
            ))
          : null}
        <Button
          variant="secondary"
          size="md"
          iconeEsquerda={<ArrowLeft size={18} aria-hidden="true" />}
          onClick={() => window.history.back()}
        >
          Voltar
        </Button>
        <Button
          size="md"
          iconeEsquerda={<Printer size={18} aria-hidden="true" />}
          onClick={() => window.print()}
        >
          Imprimir
        </Button>
      </div>
    </div>
  );
}
