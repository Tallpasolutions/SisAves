"use client";

import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui";
import styles from "./cro.module.css";

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
}: {
  numero: number;
  aveId: string | null;
  revogado: boolean;
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
            : "Imprima em A4, sem redimensionar. O PDF sai pela própria impressão."}
        </span>
      </div>

      <div className={styles.barraAcoes}>
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
