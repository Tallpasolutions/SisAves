import {
  CAMINHOS_AVOS,
  CAMINHOS_BISAVOS,
  CAMINHOS_PAIS,
  CAMINHOS_TRISAVOS,
  porCaminho,
  rotuloDoCaminho,
  type SnapshotCertificado,
} from "@/lib/dados/certificados";
import { formatarAnilha } from "@/lib/formato";
import styles from "./arvore.module.css";

/**
 * A árvore na tela de validação pública.
 *
 * Quem abre esta página está com o papel na mão e o celular na outra: a
 * genealogia que ele vê aqui tem de ser a MESMA que está impressa, ou a
 * conferência não conclui nada. Antes só saíam pai e mãe, e o resto ficava
 * para a folha — o que obriga a confiar justamente no documento que se foi
 * conferir.
 *
 * Em rolagem horizontal, como a B6: quatro gerações não cabem na largura de
 * um telefone, e espremê-las deixaria o nome ilegível, que é o único dado que
 * importa aqui.
 */
export function ArvorePublica({
  genealogia,
}: {
  genealogia: SnapshotCertificado["genealogia"];
}) {
  const ancestrais = porCaminho(genealogia);
  const repetidos = ancestraisRepetidos(genealogia);

  // Certificado emitido antes da quarta geração entrar não tem trisavô
  // nenhum: a coluna vazia não acrescenta nada e sai.
  const temTrisavos = CAMINHOS_TRISAVOS.some((c) => ancestrais.has(c));

  const colunas = [
    { titulo: "Pais", caminhos: CAMINHOS_PAIS, linhas: 8 },
    { titulo: "Avós", caminhos: CAMINHOS_AVOS, linhas: 4 },
    { titulo: "Bisavós", caminhos: CAMINHOS_BISAVOS, linhas: 2 },
    ...(temTrisavos
      ? [{ titulo: "Trisavós", caminhos: CAMINHOS_TRISAVOS, linhas: 1 }]
      : []),
  ];

  return (
    <>
      <div className={styles.rolagem}>
        <div className={styles.arvore}>
          {colunas.map(({ titulo, caminhos, linhas }) => (
            <div key={titulo} className={styles.coluna}>
              <span className={styles.colunaTitulo}>{titulo}</span>
              <div className={styles.grade}>
                {caminhos.map((caminho, indice) => (
                  <div
                    key={caminho}
                    className={`${styles.celula} ${indice % 2 === 0 ? styles.primeiroDoPar : ""}`}
                    style={{ gridRow: `span ${linhas}` }}
                  >
                    <No
                      ancestral={ancestrais.get(caminho)}
                      posicao={rotuloDoCaminho(caminho)}
                      repetidos={repetidos}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className={styles.legenda}>
        Posição em branco é ancestral não registrado no criatório — não é
        ancestral desconhecido.
        {repetidos.size > 0 ? (
          <>
            {" "}
            <strong className={styles.legendaRepetido}>
              O contorno em âmbar marca quem aparece em mais de um ramo
            </strong>{" "}
            — é de onde vem o coeficiente de endogamia.
          </>
        ) : null}
      </p>
    </>
  );
}

function No({
  ancestral,
  posicao,
  repetidos,
}: {
  ancestral: SnapshotCertificado["genealogia"][number] | undefined;
  posicao: string;
  repetidos: Set<string>;
}) {
  if (!ancestral) {
    return (
      <div className={`${styles.no} ${styles.vazio}`}>
        <span aria-hidden="true">—</span>
        <span className="visually-hidden">{posicao} · não registrado</span>
      </div>
    );
  }

  const macho = ancestral.sexo === "macho";
  const femea = ancestral.sexo === "femea";
  const chave = chaveDoAncestral(ancestral);
  const repetido = chave !== null && repetidos.has(chave);

  return (
    <div
      className={[
        styles.no,
        macho ? styles.macho : femea ? styles.femea : styles.indefinido,
        repetido ? styles.repetido : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className={styles.posicao}>{posicao}</span>
      <span className={styles.nome}>
        {ancestral.nome ?? "Sem nome"}
        {/* A letra acompanha a faixa: cor não pode ser o único sinal. */}
        <span className={styles.sexo} aria-hidden="true">
          {macho ? "M" : femea ? "F" : "—"}
        </span>
      </span>
      <span className={styles.anilha}>
        {formatarAnilha(ancestral.anilha) ?? "sem anilha"}
      </span>
      {repetido ? (
        <span className="visually-hidden">Aparece em mais de um ramo</span>
      ) : null}
    </div>
  );
}

/** Comparado pela anilha: o snapshot não guarda id interno, de propósito. */
function ancestraisRepetidos(
  genealogia: SnapshotCertificado["genealogia"],
): Set<string> {
  const contagem = new Map<string, number>();
  for (const a of genealogia) {
    const chave = chaveDoAncestral(a);
    if (!chave) continue;
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }
  return new Set(
    [...contagem.entries()].filter(([, n]) => n > 1).map(([chave]) => chave),
  );
}

function chaveDoAncestral(
  a: SnapshotCertificado["genealogia"][number],
): string | null {
  const anilha = formatarAnilha(a.anilha);
  if (anilha) return `anilha:${anilha}`;
  return a.nome ? `nome:${a.nome.toLowerCase()}` : null;
}
