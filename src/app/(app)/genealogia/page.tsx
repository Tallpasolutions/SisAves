import type { Metadata } from "next";
import { ChevronRight, Dna, TriangleAlert } from "lucide-react";
import Link from "next/link";
import {
  Anilha,
  Badge,
  Button,
  EmptyState,
  InbreedingMeter,
  SexChip,
  faixaEndogamia,
} from "@/components/ui";
import { opcoesFormarCasal } from "@/lib/dados/cadastro";
import { calcularEndogamia, explicarEndogamia } from "@/lib/dados/casais";
import {
  listarLinhagens,
  obterCobertura,
  type Linhagem,
} from "@/lib/dados/genealogia";
import { descreverAve, encadear } from "@/lib/formato";
import { SeletorDoPar } from "./simulador";
import styles from "./genealogia.module.css";

export const metadata: Metadata = { title: "Genealogia" };

export default async function Genealogia({
  searchParams,
}: PageProps<"/genealogia">) {
  const consulta = await searchParams;

  const [opcoes, linhagens, cobertura] = await Promise.all([
    opcoesFormarCasal(),
    listarLinhagens(),
    obterCobertura(),
  ]);

  // Id que não está na lista é ignorado: a URL é navegação, não dado do
  // criatório, e um par inventado não pode virar um coeficiente na tela.
  const machoId =
    typeof consulta.macho === "string" &&
    opcoes.machos.some((m) => m.id === consulta.macho)
      ? consulta.macho
      : "";
  const femeaId =
    typeof consulta.femea === "string" &&
    opcoes.femeas.some((f) => f.id === consulta.femea)
      ? consulta.femea
      : "";

  const par = machoId && femeaId;

  const [endogamia, explicacao] = par
    ? await Promise.all([
        calcularEndogamia(machoId, femeaId),
        explicarEndogamia(machoId, femeaId),
      ])
    : [null, null];

  const macho = opcoes.machos.find((m) => m.id === machoId) ?? null;
  const femea = opcoes.femeas.find((f) => f.id === femeaId) ?? null;
  const faixa = endogamia !== null ? faixaEndogamia(endogamia) : null;

  // Espécies diferentes não são impedimento de cálculo, mas são a primeira
  // coisa que o criador quer ver antes de decidir — e o coeficiente sozinho
  // não diria nada sobre isso.
  const especiesDiferentes =
    macho?.especieId && femea?.especieId && macho.especieId !== femea.especieId;

  return (
    <div className={styles.tela}>
      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Genealogia</h1>
        <p className={styles.contexto}>
          {encadear(
            linhagens.length === 0
              ? "Nenhuma linhagem registrada"
              : `${linhagens.length} ${linhagens.length === 1 ? "linhagem" : "linhagens"}`,
            `${cobertura.comParCompleto} de ${cobertura.ativas} aves com pai e mãe registrados`,
          )}
        </p>
        <p className={styles.explicacao}>
          A árvore de uma ave se abre na ficha dela. Esta tela responde a
          pergunta inversa — de onde vem este plantel — e deixa simular um
          cruzamento antes de formar o casal.
        </p>
      </header>

      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>Simular cruzamento</h2>

        <div className={styles.cartao}>
          <SeletorDoPar
            machos={opcoes.machos}
            femeas={opcoes.femeas}
            machoId={machoId}
            femeaId={femeaId}
          />

          {!par ? (
            <p className={styles.espera}>
              Escolha um macho e uma fêmea. O coeficiente aparece antes de o
              casal existir — é essa a hora em que ele muda uma decisão.
            </p>
          ) : (
            <>
              {especiesDiferentes ? (
                <p className={styles.aviso}>
                  <TriangleAlert size={16} aria-hidden="true" />
                  {macho?.especie ?? "Espécie do macho"} e{" "}
                  {femea?.especie ?? "espécie da fêmea"} são espécies
                  diferentes. O cálculo vale; o cruzamento é outra conversa.
                </p>
              ) : null}

              <InbreedingMeter
                value={endogamia ?? 0}
                showScale
                explicacao={
                  explicacao ??
                  "Sem ancestrais em comum nas gerações registradas."
                }
              />

              <div className={styles.resultado}>
                <ParDaSimulacao
                  rotulo="Macho"
                  ave={macho ? descreverAve(macho) : "—"}
                  href={macho ? `/plantel/${macho.id}/genealogia` : null}
                />
                <ParDaSimulacao
                  rotulo="Fêmea"
                  ave={femea ? descreverAve(femea) : "—"}
                  href={femea ? `/plantel/${femea.id}/genealogia` : null}
                />
              </div>

              <div className={styles.acoes}>
                {/* O simulador existe para terminar numa decisão. O par
                    escolhido vai junto para a formação do casal. */}
                <Button
                  href={`/casais/novo?macho=${machoId}&femea=${femeaId}`}
                  variant={faixa === "risco" ? "secondary" : "primary"}
                  size="md"
                >
                  Formar este casal
                </Button>
                {faixa === "risco" ? (
                  <span className={styles.nota}>
                    Acima de 12,5% o acasalamento é desaconselhado. O sistema
                    não impede — a decisão é do criador.
                  </span>
                ) : null}
              </div>
            </>
          )}
        </div>
      </section>

      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>Linhagens do plantel</h2>
        <p className={styles.blocoNota}>
          Cada fundador é uma ave sem pai nem mãe no sistema — quase sempre a
          que você comprou ou recebeu. O pedigree dela está no papel do
          vendedor, e é ali que a árvore dos descendentes para.
        </p>

        {linhagens.length === 0 ? (
          <EmptyState
            icon={<Dna size={28} />}
            title="Nenhuma linhagem registrada"
            description="A primeira linhagem aparece quando uma ave do plantel tiver filhos registrados com filiação."
            compact
          />
        ) : (
          <ul className={styles.lista}>
            {linhagens.map((l) => (
              <li key={l.id}>
                <LinhaLinhagem linhagem={l} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>Cobertura</h2>
        <dl className={styles.cobertura}>
          <Numero rotulo="Pai e mãe" valor={cobertura.comParCompleto} />
          <Numero rotulo="Um só" valor={cobertura.comUmProgenitor} />
          <Numero rotulo="Nenhum" valor={cobertura.semProgenitor} />
        </dl>

        {cobertura.nascidasAquiSemFiliacao > 0 ? (
          <p className={styles.falta}>
            {cobertura.nascidasAquiSemFiliacao}{" "}
            {cobertura.nascidasAquiSemFiliacao === 1
              ? "ave nasceu neste criatório e está sem filiação registrada"
              : "aves nasceram neste criatório e estão sem filiação registrada"}
            . Ave comprada sem progenitor é normal — essa é a origem da
            linhagem. Nascida aqui sem pai nem mãe é registro faltando, e a
            filiação se corrige na edição da ave.
          </p>
        ) : (
          <p className={styles.blocoNota}>
            Toda ave nascida neste criatório tem filiação registrada. As sem
            progenitor vieram de fora, e é nelas que as linhagens começam.
          </p>
        )}
      </section>
    </div>
  );
}

function ParDaSimulacao({
  rotulo,
  ave,
  href,
}: {
  rotulo: string;
  ave: string;
  href: string | null;
}) {
  return (
    <div className={styles.parItem}>
      <span className={styles.parRotulo}>{rotulo}</span>
      {href ? (
        <Link href={href} className={styles.parElo}>
          {ave}
        </Link>
      ) : (
        <span>{ave}</span>
      )}
    </div>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className={styles.numero}>
      <dt className={styles.numeroRotulo}>{rotulo}</dt>
      <dd className={styles.numeroValor}>{valor}</dd>
    </div>
  );
}

function LinhaLinhagem({ linhagem: l }: { linhagem: Linhagem }) {
  return (
    <Link href={`/plantel/${l.id}/genealogia`} className={styles.linhagem}>
      <SexChip sexo={l.sexo} compacta />

      <span className={styles.linhagemTextos}>
        <span className={styles.linhagemNome}>{l.nome ?? "Sem nome"}</span>
        <Anilha dados={l.anilha} size="sm" tone="quiet" />
        <span className={styles.linhagemDetalhe}>
          {encadear(
            l.especie,
            `${l.descendentes} ${l.descendentes === 1 ? "descendente" : "descendentes"}`,
            `${l.geracoes} ${l.geracoes === 1 ? "geração" : "gerações"}`,
          )}
        </span>
      </span>

      {/* Fundador que saiu do plantel segue fundando a linhagem: o que ele
          deixou continua aqui. A lista diz, em vez de esconder. */}
      {l.fora ? (
        <Badge tone="neutro" size="sm">
          Fora do plantel
        </Badge>
      ) : null}

      <ChevronRight size={18} aria-hidden="true" className={styles.seta} />
    </Link>
  );
}
