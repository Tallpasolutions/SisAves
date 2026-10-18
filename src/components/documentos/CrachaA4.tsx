import {
  CAMINHOS_AVOS,
  CAMINHOS_BISAVOS,
  CAMINHOS_PAIS,
  porCaminho,
  rotuloDoCaminho,
  type Certificado,
  type SnapshotCertificado,
} from "@/lib/dados/certificados";
import { formatarAnilha, formatarData } from "@/lib/formato";
import { QrCode } from "./QrCode";
import styles from "./CrachaA4.module.css";

/**
 * O crachá de gaiola — frente e verso.
 *
 * A peça que fica pendurada no viveiro: de um lado quem é a ave, do outro de
 * quem ela veio e o QR. Sai do mesmo snapshot do certificado e carrega o mesmo
 * código de validação.
 *
 * As duas faces vêm lado a lado na folha, como no documento que o criador já
 * usa: recorta-se o par e colam-se as costas. Dois pares por A4.
 *
 * **O verso leva TRÊS gerações, não quatro.** Num cartão de 62 mm de altura, a
 * quarta geração são dezesseis linhas de 3,7 mm — abaixo do limite de leitura
 * do papel, onde nome de ave vira mancha com forma de dado. Quem precisa das
 * quatro tem a folha da árvore e o QR, que abre a árvore inteira no telefone.
 */
export function CrachaA4({
  certificado,
  origem,
  contato,
  pares = 2,
}: {
  certificado: Certificado;
  origem: string;
  contato?: { whatsapp: string | null; instagram: string | null } | null;
  pares?: number;
}) {
  return (
    <div className={styles.folha}>
      {Array.from({ length: pares }, (_, i) => (
        <div key={i} className={styles.par}>
          <Frente certificado={certificado} contato={contato} />
          {/* A dobra fica entre as duas faces. */}
          <span className={styles.dobra} aria-hidden="true" />
          <Verso certificado={certificado} origem={origem} />
        </div>
      ))}

      <p className={styles.instrucao}>
        Recorte o par pelo contorno e cole as duas faces costas com costas. A
        linha tracejada do meio é a dobra.
      </p>
    </div>
  );
}

function Frente({
  certificado,
  contato,
}: {
  certificado: Certificado;
  contato?: { whatsapp: string | null; instagram: string | null } | null;
}) {
  const s = certificado.snapshot;
  const ancestrais = porCaminho(s.genealogia);

  return (
    <article className={`${styles.cartao} ${styles.frente}`}>
      <div className={styles.criatorio}>
        {s.criatorio.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.logo} src={s.criatorio.logo_url} alt="" />
        ) : null}
        <div className={styles.criatorioTextos}>
          <span className={styles.criatorioNome}>{s.criatorio.nome}</span>
          <span className={styles.criatorioDados}>
            {[
              s.criatorio.clube && s.criatorio.nro_criador
                ? `${s.criatorio.clube} ${s.criatorio.nro_criador}`
                : s.criatorio.clube,
              [s.criatorio.cidade, s.criatorio.uf].filter(Boolean).join("/") || null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
      </div>

      <h1 className={styles.nome}>{s.ave.nome ?? "Sem nome"}</h1>
      <p className={styles.anilha}>{formatarAnilha(s.ave.anilha) ?? "Sem anilha"}</p>

      <dl className={styles.dados}>
        <Dado rotulo="Espécie" valor={s.ave.especie ?? "—"} />
        <Dado rotulo="Sexo" valor={descreverSexo(s.ave.sexo)} />
        <Dado rotulo="Nascimento" valor={formatarData(s.ave.dt_nascimento)} />
        {s.ave.mutacao ? <Dado rotulo="Mutação" valor={s.ave.mutacao} /> : null}
      </dl>

      <div className={styles.filiacao}>
        <Progenitor rotulo="Pai" ancestral={ancestrais.get("p")} />
        <Progenitor rotulo="Mãe" ancestral={ancestrais.get("m")} />
      </div>

      {contato?.whatsapp || contato?.instagram ? (
        <p className={styles.contato}>
          {[contato?.whatsapp, contato?.instagram].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </article>
  );
}

function Verso({
  certificado,
  origem,
}: {
  certificado: Certificado;
  origem: string;
}) {
  const s = certificado.snapshot;
  const ancestrais = porCaminho(s.genealogia);
  const url = `${origem}${certificado.caminhoPublico}`;

  return (
    <article className={`${styles.cartao} ${styles.verso}`}>
      <div className={styles.versoTopo}>
        <div className={styles.versoTextos}>
          <span className={styles.versoRotulo}>Genealogia</span>
          <span className={styles.versoAve}>{s.ave.nome ?? "Sem nome"}</span>
          <span className={styles.versoNumero}>
            CRO Nº {String(certificado.sequencial).padStart(4, "0")}
          </span>
        </div>
        <div className={styles.versoQr}>
          <QrCode url={url} tamanhoMm={15} />
          <span className={styles.versoValide}>Valide aqui</span>
        </div>
      </div>

      {/* Oito linhas de grade: os bisavós são oito, e é a geração mais
          numerosa que cabe legível num cartão de gaiola. */}
      <div className={styles.arvore}>
        <ColunaVerso titulo="Pais" caminhos={CAMINHOS_PAIS} linhas={4} ancestrais={ancestrais} />
        <ColunaVerso titulo="Avós" caminhos={CAMINHOS_AVOS} linhas={2} ancestrais={ancestrais} />
        <ColunaVerso
          titulo="Bisavós"
          caminhos={CAMINHOS_BISAVOS}
          linhas={1}
          ancestrais={ancestrais}
        />
      </div>
    </article>
  );
}

function ColunaVerso({
  titulo,
  caminhos,
  linhas,
  ancestrais,
}: {
  titulo: string;
  caminhos: readonly string[];
  linhas: number;
  ancestrais: Map<string, SnapshotCertificado["genealogia"][number]>;
}) {
  return (
    <div className={styles.coluna}>
      <span className={styles.colunaTitulo}>{titulo}</span>
      <div className={styles.grade}>
        {caminhos.map((caminho, indice) => {
          const ancestral = ancestrais.get(caminho);
          const macho = ancestral?.sexo === "macho";
          const femea = ancestral?.sexo === "femea";

          return (
            <div
              key={caminho}
              className={`${styles.celula} ${indice % 2 === 0 ? styles.primeiroDoPar : ""}`}
              style={{ gridRow: `span ${linhas}` }}
            >
              <span
                className={[
                  styles.noMini,
                  macho ? styles.miniMacho : femea ? styles.miniFemea : "",
                  ancestral ? "" : styles.miniVazio,
                ]
                  .filter(Boolean)
                  .join(" ")}
                title={rotuloDoCaminho(caminho)}
              >
                {ancestral?.nome ?? "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Progenitor({
  rotulo,
  ancestral,
}: {
  rotulo: string;
  ancestral: SnapshotCertificado["genealogia"][number] | undefined;
}) {
  const macho = rotulo === "Pai";

  return (
    <div className={`${styles.progenitor} ${macho ? styles.pai : styles.mae}`}>
      <span className={styles.progenitorRotulo}>{rotulo}</span>
      <span className={styles.progenitorNome}>
        {ancestral?.nome ?? "Não registrado"}
      </span>
    </div>
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

function descreverSexo(sexo: string): string {
  if (sexo === "macho") return "Macho";
  if (sexo === "femea") return "Fêmea";
  return "Indefinido";
}
