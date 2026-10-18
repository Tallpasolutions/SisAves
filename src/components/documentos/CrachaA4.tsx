import {
  porCaminho,
  type Certificado,
  type SnapshotCertificado,
} from "@/lib/dados/certificados";
import { formatarAnilha, formatarData } from "@/lib/formato";
import { QrCode } from "./QrCode";
import styles from "./CrachaA4.module.css";

/**
 * O crachá de gaiola.
 *
 * A peça que fica pendurada no viveiro, onde o criador olha de passagem e o
 * visitante lê de perto: quem é a ave, de quem ela veio, e o QR para conferir
 * o resto. Sai do mesmo snapshot do certificado e carrega o mesmo QR.
 *
 * **Sem a árvore.** O documento antigo põe as quatro gerações numa miniatura
 * de 40 mm, onde nenhum nome é legível — é ornamento com forma de dado. Aqui
 * ficam pai e mãe, que é o que se consulta diante da gaiola; a linhagem
 * inteira está na folha da árvore e atrás do QR.
 *
 * Dois por folha A4 retrato, com linha de corte entre eles: o criador
 * raramente imprime um só.
 */
export function CrachaA4({
  certificado,
  origem,
  contato,
  copias = 2,
}: {
  certificado: Certificado;
  origem: string;
  contato?: { whatsapp: string | null; instagram: string | null } | null;
  copias?: number;
}) {
  return (
    <div className={styles.folha}>
      {Array.from({ length: copias }, (_, i) => (
        <Cartao
          key={i}
          certificado={certificado}
          origem={origem}
          contato={contato}
          primeiro={i === 0}
        />
      ))}
    </div>
  );
}

function Cartao({
  certificado,
  origem,
  contato,
  primeiro,
}: {
  certificado: Certificado;
  origem: string;
  contato?: { whatsapp: string | null; instagram: string | null } | null;
  primeiro: boolean;
}) {
  const s = certificado.snapshot;
  const ancestrais = porCaminho(s.genealogia);
  const url = `${origem}${certificado.caminhoPublico}`;

  return (
    <>
      {!primeiro ? <div className={styles.corte} aria-hidden="true" /> : null}

      <article className={styles.cartao}>
        <div className={styles.identidade}>
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
                  [s.criatorio.cidade, s.criatorio.uf].filter(Boolean).join("/") ||
                    null,
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
            <Dado rotulo="Nascimento" valor={formatarData(s.ave.dt_nascimento)} />
            <Dado rotulo="Sexo" valor={descreverSexo(s.ave.sexo)} />
            {s.ave.mutacao ? <Dado rotulo="Mutação" valor={s.ave.mutacao} /> : null}
          </dl>

          <div className={styles.filiacao}>
            <Progenitor rotulo="Pai" ancestral={ancestrais.get("p")} />
            <Progenitor rotulo="Mãe" ancestral={ancestrais.get("m")} />
          </div>
        </div>

        <div className={styles.lado}>
          <QrCode url={url} tamanhoMm={22} />
          <span className={styles.numero}>
            CRO Nº {String(certificado.sequencial).padStart(4, "0")}
          </span>
          {contato?.whatsapp ? (
            <span className={styles.contato}>{contato.whatsapp}</span>
          ) : null}
        </div>
      </article>
    </>
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
      {ancestral ? (
        <span className={styles.progenitorAnilha}>
          {formatarAnilha(ancestral.anilha) ?? "sem anilha"}
        </span>
      ) : null}
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
