import {
  CAMINHOS_AVOS,
  CAMINHOS_BISAVOS,
  CAMINHOS_PAIS,
  porCaminho,
  rotuloDoCaminho,
  type Certificado,
  type SnapshotCertificado,
} from "@/lib/dados/certificados";
import { formatarData, formatarPercentual } from "@/lib/formato";
import { QrCode } from "./QrCode";
import styles from "./CertificadoA4.module.css";

/**
 * D1 — o CRO impresso, A4 retrato.
 *
 * Imprime o SNAPSHOT, nunca o banco. É a razão de o snapshot existir: a árvore
 * muda quando o criador corrige uma filiação, e um CRO emitido em 2026 precisa
 * continuar provando o que era verdade em 2026. Reimprimir esta página daqui a
 * três anos devolve o mesmo papel.
 */
export async function CertificadoA4({
  certificado,
  origem,
}: {
  certificado: Certificado;
  /** A base da URL pública — o QR precisa dela inteira. */
  origem: string;
}) {
  const { snapshot: s } = certificado;
  const url = `${origem}${certificado.caminhoPublico}`;
  const ancestrais = porCaminho(s.genealogia);

  return (
    <article className={styles.folha}>
      {/* 1 · Cabeçalho institucional */}
      <header className={styles.cabecalho}>
        <div className={styles.identidade}>
          <span className={styles.logo}>
            {s.criatorio.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.logoImagem} src={s.criatorio.logo_url} alt="" />
            ) : (
              <span className={styles.logoVazio}>Sem logotipo</span>
            )}
          </span>

          <div className={styles.criatorio}>
            <span className={styles.criatorioNome}>{s.criatorio.nome}</span>
            {s.criatorio.registro_ibama ? (
              <span className={styles.criatorioLinha}>
                Registro IBAMA {s.criatorio.registro_ibama}
              </span>
            ) : null}
            <span className={styles.criatorioLinha}>
              {[
                s.criatorio.clube,
                s.criatorio.nro_criador ? `criador ${s.criatorio.nro_criador}` : null,
                [s.criatorio.cidade, s.criatorio.uf].filter(Boolean).join("/"),
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
        </div>

        <div className={styles.numeracao}>
          <span className={styles.rotulo}>Certificado nº</span>
          <span className={styles.numero}>
            {String(certificado.sequencial).padStart(5, "0")}
          </span>
          <span className={styles.data}>{formatarData(certificado.emitidoEm)}</span>
        </div>
      </header>

      {/* Documento revogado continua existindo; o papel precisa dizer. */}
      {certificado.revogadoEm ? (
        <p className={styles.revogado}>
          <strong>Certificado revogado em {formatarData(certificado.revogadoEm)}.</strong>
          {certificado.revogadoMotivo ? ` ${certificado.revogadoMotivo}.` : ""} Esta
          via não tem validade.
        </p>
      ) : null}

      {/* 2 · Título e declaração */}
      <div>
        <h1 className={styles.titulo}>Certificado de Registro de Origem</h1>
        <p className={styles.declaracao}>
          O criatório acima declara que a ave identificada por esta anilha
          nasceu em seu plantel, recebeu anilha oficial de clube e tem a
          filiação registrada conforme os assentamentos do criatório, conforme
          reproduzido neste documento.
        </p>
      </div>

      {/* 3 · Faixa da anilha */}
      <div className={styles.faixaAnilha}>
        <span className={styles.anilha}>{formatarAnilhaDoc(s.ave.anilha)}</span>
        <span className={styles.endogamia}>
          <span className={styles.rotulo}>Coeficiente de endogamia</span>
          <span className={styles.endogamiaValor}>
            {s.endogamia_pct === null ? "—" : formatarPercentual(s.endogamia_pct)}
          </span>
        </span>
      </div>

      {/* 4 e 5 · Dados da ave e foto */}
      <div className={styles.corpo}>
        <dl className={styles.dados}>
          <Dado rotulo="Nome" valor={s.ave.nome ?? "—"} />
          <Dado rotulo="Espécie" valor={s.ave.especie ?? "—"} />
          <Dado rotulo="Mutação" valor={s.ave.mutacao ?? "—"} />
          <Dado rotulo="Sexo" valor={descreverSexo(s.ave.sexo)} />
          <Dado rotulo="Nascimento" valor={formatarData(s.ave.dt_nascimento)} />
          <Dado rotulo="Código alternativo" valor={s.ave.codigo_alternativo ?? "—"} />
        </dl>

        <div className={styles.foto}>
          <span className={styles.fotoQuadro}>
            {s.ave.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.fotoImagem} src={s.ave.foto_url} alt="" />
            ) : (
              <span className={styles.fotoVazia}>Sem foto</span>
            )}
          </span>
          <span className={styles.fotoLegenda}>
            Foto do plantel · {formatarData(certificado.emitidoEm)}
          </span>
        </div>
      </div>

      {/* 6 · Genealogia de três gerações */}
      <section className={styles.secao}>
        <h2 className={styles.secaoTitulo}>Genealogia · três gerações</h2>

        <div className={styles.arvore}>
          <Coluna titulo="Pais" caminhos={CAMINHOS_PAIS} ancestrais={ancestrais} />
          <Coluna titulo="Avós" caminhos={CAMINHOS_AVOS} ancestrais={ancestrais} />
          <Coluna titulo="Bisavós" caminhos={CAMINHOS_BISAVOS} ancestrais={ancestrais} />
        </div>

        {/* A explicação do coeficiente mora junto da árvore que o gera. */}
        <p className={styles.notaArvore}>{explicarArvore(s)}</p>
      </section>

      {/* 7 · Assinatura e validação */}
      <div className={styles.rodapeBloco}>
        <div className={styles.assinatura}>
          <div className={styles.linhaAssinatura}>
            Responsável pelo criatório · CPF
          </div>
          <p className={styles.aviso}>
            Este certificado atesta a origem e a genealogia registradas no
            criatório. Não substitui a documentação ambiental exigida pelos
            órgãos competentes.
          </p>
        </div>

        <div className={styles.validacao}>
          <span className={styles.rotulo}>Validação</span>
          <QrCode url={url} tamanhoMm={26} />
          <span className={styles.urlValidacao}>{url.replace(/^https?:\/\//, "")}</span>
        </div>
      </div>

      {/* 8 · Rodapé */}
      <footer className={styles.rodape}>
        <span>
          Emitido por <span className={styles.marca}>SisAves</span> ·
          sisaves.tallpa.com.br
        </span>
        <span>
          {s.criatorio.slug} · nº {String(certificado.sequencial).padStart(5, "0")}
        </span>
      </footer>
    </article>
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

function Coluna({
  titulo,
  caminhos,
  ancestrais,
}: {
  titulo: string;
  caminhos: readonly string[];
  ancestrais: ReturnType<typeof porCaminho>;
}) {
  return (
    <div className={styles.coluna}>
      <span className={styles.colunaTitulo}>{titulo}</span>
      {caminhos.map((caminho) => {
        const a = ancestrais.get(caminho);
        const classe = !a
          ? styles.ancestral
          : `${styles.ancestral} ${a.sexo === "femea" ? styles.femea : a.sexo === "macho" ? styles.macho : ""}`;

        return (
          <div key={caminho} className={classe}>
            <span className={styles.ancestralPapel}>{rotuloDoCaminho(caminho)}</span>
            {a ? (
              <>
                <span className={styles.ancestralNome}>{a.nome ?? "Sem nome"}</span>
                <span className={styles.ancestralAnilha}>
                  {formatarAnilhaDoc(a.anilha)}
                </span>
              </>
            ) : (
              <span className={styles.desconhecido}>Desconhecido</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * "COF 8888 · 2026 · 0301" — nunca abreviado.
 *
 * A anilha é o identificador oficial da ave: o documento inteiro existe para
 * afirmá-la, e cortá-la para caber seria cortar o que ele prova.
 */
function formatarAnilhaDoc(anilha: SnapshotCertificado["ave"]["anilha"]): string {
  if (anilha.numero === null) return "Sem anilha";
  return [
    [anilha.sigla, anilha.criador].filter(Boolean).join(" "),
    anilha.ano !== null ? String(anilha.ano) : null,
    String(anilha.numero).padStart(4, "0"),
  ]
    .filter(Boolean)
    .join(" · ");
}

function descreverSexo(sexo: string): string {
  if (sexo === "macho") return "Macho";
  if (sexo === "femea") return "Fêmea";
  return "Indefinido";
}

/** Uma linha dizendo de onde vem o coeficiente — ou que não há de onde vir. */
function explicarArvore(s: SnapshotCertificado): string {
  const nomes = new Map<string, number>();
  for (const a of s.genealogia) {
    if (!a.nome) continue;
    nomes.set(a.nome, (nomes.get(a.nome) ?? 0) + 1);
  }

  const repetidos = [...nomes.entries()]
    .filter(([, vezes]) => vezes > 1)
    .map(([nome]) => nome);

  if (repetidos.length > 0) {
    return `${repetidos.join(" e ")} aparece em mais de uma posição da árvore — é essa repetição que produz o coeficiente de endogamia acima.`;
  }

  if (s.endogamia_pct === null || s.endogamia_pct === 0) {
    return "Nenhum ancestral em comum nas três gerações registradas.";
  }

  return "O coeficiente acima vem de ancestrais em comum além da terceira geração.";
}
