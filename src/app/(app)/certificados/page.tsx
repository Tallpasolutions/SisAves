import type { Metadata } from "next";
import { Award } from "lucide-react";
import Link from "next/link";
import { Badge, Button, EmptyState } from "@/components/ui";
import { listarCertificados, type Certificado } from "@/lib/dados/certificados";
import { formatarData } from "@/lib/formato";
import styles from "./certificados.module.css";

export const metadata: Metadata = { title: "Certificados" };

export default async function Certificados() {
  const certificados = await listarCertificados();
  const validos = certificados.filter((c) => c.revogadoEm === null);

  return (
    <div className={styles.tela}>
      <header className={styles.cabecalho}>
        <div className={styles.cabecalhoTextos}>
          <h1 className={styles.titulo}>Certificados</h1>
          <p className={styles.contexto}>
            {certificados.length === 0
              ? "Nenhum CRO emitido."
              : `${validos.length} ${validos.length === 1 ? "válido" : "válidos"}${
                  certificados.length > validos.length
                    ? ` · ${certificados.length - validos.length} revogado${certificados.length - validos.length === 1 ? "" : "s"}`
                    : ""
                }`}
          </p>
        </div>
        <Button href="/certificados/novo" size="lg">
          Emitir certificado
        </Button>
      </header>

      {certificados.length === 0 ? (
        <EmptyState
          icon={<Award size={28} />}
          title="Nenhum CRO emitido"
          description="O certificado prova a origem e a genealogia de uma ave anilhada. Cada emissão gera um número, um QR de validação e uma folha pronta para imprimir."
          acao={<Button href="/certificados/novo">Emitir o primeiro</Button>}
          compact
        />
      ) : (
        <ul className={styles.lista}>
          {certificados.map((c) => (
            <li key={c.id}>
              <Linha certificado={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Linha({ certificado: c }: { certificado: Certificado }) {
  const ave = c.snapshot.ave;

  return (
    <Link href={`/cro/${c.id}`} className={styles.linha}>
      <span className={styles.numero}>{String(c.sequencial).padStart(5, "0")}</span>

      <span className={styles.textos}>
        <span className={styles.nome}>{ave.nome ?? "Sem nome"}</span>
        <span className={styles.contextoLinha}>
          {[
            ave.especie,
            formatarAnilhaCurta(ave.anilha),
            `emitido em ${formatarData(c.emitidoEm)}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>

      {c.revogadoEm ? (
        <Badge tone="critico" size="sm">
          Revogado
        </Badge>
      ) : (
        <Badge tone="ok" size="sm">
          Válido
        </Badge>
      )}
    </Link>
  );
}

function formatarAnilhaCurta(anilha: Certificado["snapshot"]["ave"]["anilha"]): string {
  if (anilha.numero === null) return "sem anilha";
  return [anilha.sigla, anilha.ano, String(anilha.numero).padStart(4, "0")]
    .filter(Boolean)
    .join(" ");
}
