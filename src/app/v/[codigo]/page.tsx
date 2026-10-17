import type { Metadata } from "next";
import { CircleAlert, CircleCheck, Download } from "lucide-react";
import { notFound } from "next/navigation";
import { Anilha, Badge, SexChip } from "@/components/ui";
import {
  lerCodigo,
  porCaminho,
  validarCertificado,
  type SnapshotCertificado,
} from "@/lib/dados/certificados";
import { formatarData, formatarPercentual } from "@/lib/formato";
import styles from "./validacao.module.css";

export const metadata: Metadata = {
  title: "Validação de certificado",
  // Página de consulta, não de conteúdo: nada a indexar, e indexar o endereço
  // de um certificado específico seria o oposto da privacidade do criador.
  robots: { index: false, follow: false },
};

/**
 * D2 — a página que abre ao escanear o QR.
 *
 * Anônima: sem login, sem menu, sem tab bar. Lê `validar_certificado`, que é
 * `security definer` e devolve APENAS o snapshot — nenhum id interno, nenhum
 * contato do criador. A página prova a ave; não expõe o vendedor.
 */
export default async function Validacao({ params }: PageProps<"/v/[codigo]">) {
  const { codigo } = await params;
  const lido = lerCodigo(codigo);
  if (!lido) notFound();

  const validacao = await validarCertificado(lido.hash, lido.sequencial);
  if (!validacao) notFound();

  const s: SnapshotCertificado = validacao.dados;
  const ancestrais = porCaminho(s.genealogia);
  const pai = ancestrais.get("p");
  const mae = ancestrais.get("m");

  return (
    <main className={styles.tela}>
      {/* O selo vem primeiro. A confiança vem do selo e do dado bruto, nunca
          de adjetivo. */}
      {validacao.autentico ? (
        <section className={styles.selo}>
          <span className={styles.seloIcone} aria-hidden="true">
            <CircleCheck size={28} />
          </span>
          <h1 className={styles.seloTitulo}>Certificado autêntico</h1>
          <p className={styles.seloTexto}>
            Este certificado consta no registro do SisAves e não foi alterado
            desde a emissão.
          </p>
          <span className={styles.consulta}>
            Consultado em {formatarDataHora(validacao.consultadoEm)}
          </span>
        </section>
      ) : (
        <section className={`${styles.selo} ${styles.seloRevogado}`}>
          <span className={styles.seloIcone} aria-hidden="true">
            <CircleAlert size={28} />
          </span>
          <h1 className={styles.seloTitulo}>Certificado revogado</h1>
          <p className={styles.seloTexto}>
            O criatório revogou este certificado em{" "}
            {formatarData(validacao.revogadoEm)}.
            {validacao.revogadoMotivo ? ` Motivo: ${validacao.revogadoMotivo}.` : ""} Os
            dados abaixo são os que constavam na emissão.
          </p>
          <span className={styles.consulta}>
            Consultado em {formatarDataHora(validacao.consultadoEm)}
          </span>
        </section>
      )}

      {/* Cartão da ave */}
      <section className={styles.cartao}>
        <span className={styles.foto}>
          {s.ave.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.fotoImagem} src={s.ave.foto_url} alt="" />
          ) : (
            <span className={styles.fotoVazia}>Sem foto</span>
          )}
        </span>

        <div className={styles.cartaoTextos}>
          <h2 className={styles.nome}>{s.ave.nome ?? "Sem nome"}</h2>
          <p className={styles.especie}>
            {[s.ave.especie, s.ave.mutacao].filter(Boolean).join(" · ") ||
              "Espécie não informada"}
          </p>
          <div className={styles.cartaoLinha}>
            <SexChip sexo={s.ave.sexo as "macho" | "femea" | "indefinido"} />
          </div>
        </div>
      </section>

      <div className={styles.anilhaBloco}>
        <span className={styles.rotulo}>Anilha</span>
        <Anilha dados={s.ave.anilha} tone="brand" size="lg" />
      </div>

      <dl className={styles.dados}>
        <Dado rotulo="Nascimento" valor={formatarData(s.ave.dt_nascimento)} />
        <Dado
          rotulo="Certificado nº"
          valor={String(validacao.numero).padStart(5, "0")}
        />
        <Dado rotulo="Emitido em" valor={formatarData(validacao.emitidoEm)} />
        <Dado
          rotulo="Endogamia"
          valor={
            s.endogamia_pct === null ? "—" : formatarPercentual(s.endogamia_pct)
          }
        />
      </dl>

      {/* Criatório emissor: o que identifica a origem, e só isso. */}
      <section className={styles.secao}>
        <h2 className={styles.secaoTitulo}>Criatório emissor</h2>
        <div className={styles.criatorio}>
          <span className={styles.monograma} aria-hidden="true">
            {s.criatorio.nome.slice(0, 1).toUpperCase()}
          </span>
          <div className={styles.criatorioTextos}>
            <span className={styles.criatorioNome}>{s.criatorio.nome}</span>
            <span className={styles.criatorioLinha}>
              {[
                s.criatorio.registro_ibama
                  ? `IBAMA ${s.criatorio.registro_ibama}`
                  : null,
                s.criatorio.clube,
                [s.criatorio.cidade, s.criatorio.uf].filter(Boolean).join("/"),
              ]
                .filter(Boolean)
                .join(" · ") || "Sem registro informado"}
            </span>
          </div>
        </div>
      </section>

      {/* Genealogia resumida: só pai e mãe. */}
      <section className={styles.secao}>
        <h2 className={styles.secaoTitulo}>Filiação</h2>
        <div className={styles.filiacao}>
          <Progenitor papel="Pai" ancestral={pai} />
          <Progenitor papel="Mãe" ancestral={mae} />
        </div>
        <p className={styles.nota}>
          As três gerações completas constam no certificado impresso.
        </p>
      </section>

      <div className={styles.acao}>
        <a href={`/cro/publico/${codigo}`} className={styles.botao}>
          <Download size={18} aria-hidden="true" />
          Ver o certificado completo
        </a>
      </div>

      {/* Decisão de privacidade registrada em 06-documentos-e-site.md. */}
      <p className={styles.privacidade}>
        Esta consulta é pública e não exibe nenhum contato do criador. Ela prova
        a ave, não apresenta o vendedor.
      </p>
    </main>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className={styles.dado}>
      <dt className={styles.dadoRotulo}>{rotulo}</dt>
      <dd className={styles.dadoValor}>{valor}</dd>
    </div>
  );
}

function Progenitor({
  papel,
  ancestral,
}: {
  papel: string;
  ancestral: SnapshotCertificado["genealogia"][number] | undefined;
}) {
  if (!ancestral) {
    return (
      <div className={`${styles.progenitor} ${styles.progenitorVazio}`}>
        <span className={styles.progenitorPapel}>{papel}</span>
        <span className={styles.progenitorDesconhecido}>Desconhecido</span>
      </div>
    );
  }

  const classe =
    ancestral.sexo === "femea"
      ? `${styles.progenitor} ${styles.femea}`
      : ancestral.sexo === "macho"
        ? `${styles.progenitor} ${styles.macho}`
        : styles.progenitor;

  return (
    <div className={classe}>
      <span className={styles.progenitorPapel}>{papel}</span>
      <span className={styles.progenitorNome}>{ancestral.nome ?? "Sem nome"}</span>
      <Anilha dados={ancestral.anilha} size="sm" tone="quiet" />
    </div>
  );
}

/** "17/10/2026 às 21:40" — a consulta é datada, e a hora importa. */
function formatarDataHora(iso: string): string {
  const data = new Date(iso);
  return `${formatarData(iso)} às ${data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })}`;
}
