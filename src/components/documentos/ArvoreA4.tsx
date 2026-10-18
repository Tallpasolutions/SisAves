import {
  CAMINHOS_AVOS,
  CAMINHOS_BISAVOS,
  CAMINHOS_PAIS,
  CAMINHOS_TRISAVOS,
  porCaminho,
  rotuloDoCaminho,
  type Certificado,
  type SnapshotCertificado,
} from "@/lib/dados/certificados";
import { formatarAnilha, formatarData, formatarPercentual } from "@/lib/formato";
import { QrCode } from "./QrCode";
import styles from "./ArvoreA4.module.css";

/**
 * A árvore genealógica em A4 paisagem — quatro gerações.
 *
 * Companheira do CRO, não substituta: o certificado (D1, retrato) afirma a
 * origem com o texto de autenticidade; esta folha mostra a linhagem. As duas
 * saem do MESMO snapshot e carregam o MESMO QR, então validam juntas.
 *
 * Paisagem por necessidade aritmética: a quarta geração são dezesseis
 * posições, e dezesseis caixas legíveis não cabem na largura de um A4 em pé.
 *
 * **O desenho é o da B6, não o do sistema antigo.** De lá veio o que aparece —
 * quatro gerações, estes dados —, não como aparece: nada de pílula verde para
 * macho e vermelha para fêmea (a paleta é fechada, e cor não pode ser o único
 * sinal), e nada de "INDEFINIDO" repetido dezesseis vezes. O sexo vai na faixa
 * de 3px à esquerda E na letra; a posição sem ancestral registrado fica vazia,
 * porque a geometria já diz qual posição é.
 *
 * Medidas em mm e pt, cores literais: é papel, e papel não tem tema escuro.
 */
export function ArvoreA4({
  certificado,
  origem,
  contato,
}: {
  certificado: Certificado;
  /** "https://sisaves.tallpa.com.br" — de onde o QR aponta. */
  origem: string;
  /** Lido ao vivo da tabela, nunca do snapshot: telefone muda, e o snapshot
      é o que a página pública devolve a quem não tem login. */
  contato?: { whatsapp: string | null; instagram: string | null } | null;
}) {
  const s = certificado.snapshot;
  const ancestrais = porCaminho(s.genealogia);
  const repetidos = ancestraisRepetidos(s.genealogia);
  const url = `${origem}${certificado.caminhoPublico}`;

  const temContato = Boolean(contato?.whatsapp || contato?.instagram);

  return (
    <article className={styles.folha}>
      <header className={styles.cabecalho}>
        <div className={styles.cabecalhoMarca}>
          {s.criatorio.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.logo} src={s.criatorio.logo_url} alt="" />
          ) : null}
          <div>
            <h1 className={styles.titulo}>Árvore genealógica</h1>
          <p className={styles.subtitulo}>
            {[
              s.criatorio.nome,
              s.criatorio.clube && s.criatorio.nro_criador
                ? `${s.criatorio.clube} ${s.criatorio.nro_criador}`
                : s.criatorio.clube,
              s.criatorio.registro_ibama
                ? `IBAMA ${s.criatorio.registro_ibama}`
                : null,
              [s.criatorio.cidade, s.criatorio.uf].filter(Boolean).join("/") || null,
            ]
              .filter(Boolean)
              .join(" · ")}
            </p>
          </div>
        </div>

        <div className={styles.numero}>
          <span className={styles.numeroRotulo}>Certificado</span>
          <span className={styles.numeroValor}>
            Nº {String(certificado.sequencial).padStart(4, "0")}
          </span>
          <span className={styles.numeroData}>
            Emitido em {formatarData(certificado.emitidoEm)}
          </span>
        </div>
      </header>

      <div className={styles.corpo}>
        <aside className={styles.lateral}>
          <section className={styles.ave}>
            <span className={styles.rotulo}>A ave</span>
            <h2 className={styles.aveNome}>{s.ave.nome ?? "Sem nome"}</h2>
            <p className={styles.aveAnilha}>
              {formatarAnilha(s.ave.anilha) ?? "Sem anilha"}
            </p>

            <dl className={styles.dados}>
              <Dado rotulo="Espécie" valor={s.ave.especie ?? "—"} />
              {s.ave.especie_cientifica ? (
                <Dado
                  rotulo="Nome científico"
                  valor={s.ave.especie_cientifica}
                  italico
                />
              ) : null}
              {s.ave.mutacao ? <Dado rotulo="Mutação" valor={s.ave.mutacao} /> : null}
              <Dado rotulo="Nascimento" valor={formatarData(s.ave.dt_nascimento)} />
              <Dado rotulo="Sexo" valor={descreverSexo(s.ave.sexo)} />
              {s.endogamia_pct !== null ? (
                <Dado
                  rotulo="Endogamia"
                  valor={formatarPercentual(s.endogamia_pct)}
                />
              ) : null}
            </dl>
          </section>

          <section className={styles.validacao}>
            <QrCode url={url} tamanhoMm={26} />
            <div className={styles.validacaoTextos}>
              <span className={styles.rotulo}>Validação</span>
              <p className={styles.validacaoUrl}>{url.replace(/^https?:\/\//, "")}</p>
              <p className={styles.validacaoNota}>
                Aponte a câmera e confira os dados com esta folha.
              </p>
            </div>
          </section>

          {temContato ? (
            <section className={styles.contato}>
              <span className={styles.rotulo}>Criador</span>
              {contato?.whatsapp ? (
                <p className={styles.contatoLinha}>WhatsApp {contato.whatsapp}</p>
              ) : null}
              {contato?.instagram ? (
                <p className={styles.contatoLinha}>Instagram {contato.instagram}</p>
              ) : null}
            </section>
          ) : null}
        </aside>

        {/* As quatro colunas. Cada uma tem dezesseis linhas de grade; o nó
            ocupa tantas linhas quanto a geração pede — oito na dos pais, uma
            na dos trisavós —, e é isso que alinha cada par com o filho. */}
        <div className={styles.arvore}>
          <Coluna
            titulo="Pais"
            caminhos={CAMINHOS_PAIS}
            linhas={8}
            ancestrais={ancestrais}
            repetidos={repetidos}
            destaque
          />
          <Coluna
            titulo="Avós"
            caminhos={CAMINHOS_AVOS}
            linhas={4}
            ancestrais={ancestrais}
            repetidos={repetidos}
          />
          <Coluna
            titulo="Bisavós"
            caminhos={CAMINHOS_BISAVOS}
            linhas={2}
            ancestrais={ancestrais}
            repetidos={repetidos}
          />
          <Coluna
            titulo="Trisavós"
            caminhos={CAMINHOS_TRISAVOS}
            linhas={1}
            ancestrais={ancestrais}
            repetidos={repetidos}
            compacta
          />
        </div>
      </div>

      <footer className={styles.rodape}>
        <span>
          A linhagem registrada no criatório até a quarta geração. Posição em
          branco é ancestral não registrado — não é ancestral desconhecido.
          {repetidos.size > 0 ? (
            <>
              {" "}
              <strong className={styles.rodapeDestaque}>
                Contorno em âmbar: ancestral que aparece em mais de um ramo
              </strong>{" "}
              — é de onde vem o coeficiente de endogamia.
            </>
          ) : null}
        </span>
        <span className={styles.rodapeMarca}>SisAves</span>
      </footer>
    </article>
  );
}

/**
 * Quem aparece em mais de um ramo da árvore.
 *
 * Comparado pela ANILHA, não por id: o snapshot não guarda id interno de
 * propósito — ele é devolvido inteiro a quem escaneia o QR. A anilha é o que
 * identifica a ave no papel, e é também o que um humano compararia olhando a
 * folha. Sem anilha, resta o nome.
 */
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

function Coluna({
  titulo,
  caminhos,
  linhas,
  ancestrais,
  repetidos,
  destaque,
  compacta,
}: {
  titulo: string;
  caminhos: readonly string[];
  /** Quantas linhas da grade de 16 cada nó desta coluna ocupa. */
  linhas: number;
  ancestrais: Map<string, SnapshotCertificado["genealogia"][number]>;
  repetidos: Set<string>;
  destaque?: boolean;
  compacta?: boolean;
}) {
  return (
    <div className={styles.coluna}>
      <span className={styles.colunaTitulo}>{titulo}</span>
      <div className={styles.colunaGrade}>
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
              destaque={destaque}
              compacta={compacta}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function No({
  ancestral,
  posicao,
  repetidos,
  destaque,
  compacta,
}: {
  ancestral: SnapshotCertificado["genealogia"][number] | undefined;
  posicao: string;
  repetidos: Set<string>;
  destaque?: boolean;
  compacta?: boolean;
}) {
  if (!ancestral) {
    return (
      <div className={`${styles.no} ${styles.noVazio}`} title={`${posicao} · não registrado`}>
        <span className={styles.vazioMarca} aria-hidden="true">
          —
        </span>
        <span className="visually-hidden">{posicao} · não registrado</span>
      </div>
    );
  }

  const femea = ancestral.sexo === "femea";
  const macho = ancestral.sexo === "macho";
  const chave = chaveDoAncestral(ancestral);
  const repetido = chave !== null && repetidos.has(chave);

  return (
    <div
      className={[
        styles.no,
        femea ? styles.noFemea : macho ? styles.noMacho : styles.noIndefinido,
        destaque ? styles.noDestaque : "",
        compacta ? styles.noCompacto : "",
        repetido ? styles.noRepetido : "",
      ]
        .filter(Boolean)
        .join(" ")}
      title={repetido ? `${posicao} · aparece em mais de um ramo` : posicao}
    >
      <span className={styles.noTopo}>
        <span className={styles.noNome}>{ancestral.nome ?? "Sem nome"}</span>
        {/* A letra existe porque a faixa sozinha é cor, e cor não pode ser o
            único sinal — vale no papel em preto e branco também. */}
        <span className={styles.noSexo} aria-hidden="true">
          {macho ? "M" : femea ? "F" : "—"}
        </span>
      </span>
      <span className={styles.noAnilha}>
        {formatarAnilha(ancestral.anilha) ?? "sem anilha"}
      </span>
    </div>
  );
}

function Dado({
  rotulo,
  valor,
  italico,
}: {
  rotulo: string;
  valor: string;
  italico?: boolean;
}) {
  return (
    <div className={styles.dado}>
      <dt className={styles.dadoRotulo}>{rotulo}</dt>
      <dd className={`${styles.dadoValor} ${italico ? styles.dadoItalico : ""}`}>
        {valor}
      </dd>
    </div>
  );
}

function descreverSexo(sexo: string): string {
  if (sexo === "macho") return "Macho";
  if (sexo === "femea") return "Fêmea";
  return "Indefinido";
}
