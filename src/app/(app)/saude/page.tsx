import type { Metadata } from "next";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Pill,
  Stethoscope,
  Syringe,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { Anilha, Badge, Button, EmptyState, Toast } from "@/components/ui";
import {
  listarDoencas,
  listarMedicamentos,
  listarSintomas,
  listarTratamentos,
  type Tratamento,
} from "@/lib/dados/saude";
import { opcoesDeAve } from "@/lib/dados/aves-escolha";
import { descreverAve, encadear, formatarData } from "@/lib/formato";
import { hojeNoCriatorio } from "@/lib/data";
import styles from "./saude.module.css";

export const metadata: Metadata = { title: "Saúde" };

export default async function Saude({ searchParams }: PageProps<"/saude">) {
  const consulta = await searchParams;

  /*
   * `?ave=` transforma a tela no histórico sanitário de UMA ave — é por onde
   * a ficha chega aqui. Rota própria para isso seria uma segunda lista de
   * tratamentos para manter, com as mesmas regras de carência.
   */
  const aveId = typeof consulta.ave === "string" ? consulta.ave : null;

  const [tratamentos, medicamentos, doencas, sintomas, aves] = await Promise.all([
    listarTratamentos(aveId ?? undefined),
    listarMedicamentos(),
    listarDoencas(),
    listarSintomas(),
    aveId ? opcoesDeAve() : Promise.resolve([]),
  ]);

  const ave = aveId ? (aves.find((a) => a.id === aveId) ?? null) : null;

  const emCurso = tratamentos.filter((t) => t.emCurso);
  const emCarencia = tratamentos.filter((t) => !t.emCurso && t.carenciaAtiva);
  const encerrados = tratamentos.filter((t) => !t.emCurso && !t.carenciaAtiva);

  return (
    <div className={styles.tela}>
      {consulta.registrado === "1" ? (
        <Toast
          tone="ok"
          title="Tratamento registrado"
          description="Ele entra no histórico sanitário da ave e conta a carência quando terminar."
        />
      ) : null}
      {consulta.corrigido === "1" ? (
        <Toast
          tone="ok"
          title="Tratamento corrigido"
          description="As datas novas valem também para a carência."
        />
      ) : null}
      {consulta.excluido === "1" ? (
        <Toast
          tone="ok"
          title="Tratamento excluído"
          description="Ele sai do histórico. O medicamento continua no catálogo."
        />
      ) : null}

      {ave ? (
        <Link href={`/plantel/${ave.id}`} className={styles.voltar}>
          <ChevronLeft size={18} aria-hidden="true" />
          {ave.nome ?? "Ficha da ave"}
        </Link>
      ) : null}

      <header className={styles.cabecalho}>
        <div className={styles.cabecalhoTextos}>
          <h1 className={styles.titulo}>
            {ave ? "Histórico sanitário" : "Saúde"}
          </h1>
          <p className={styles.contexto}>
            {ave ? `${descreverAve(ave)} · ` : ""}
            {emCurso.length === 0
              ? "Nenhum tratamento em curso"
              : `${emCurso.length} ${emCurso.length === 1 ? "tratamento em curso" : "tratamentos em curso"}`}
            {emCarencia.length > 0
              ? ` · ${emCarencia.length} em carência`
              : ""}
          </p>
        </div>
        <Button href={ave ? `/saude/novo?ave=${ave.id}` : "/saude/novo"} size="lg">
          Registrar tratamento
        </Button>
      </header>

      {tratamentos.length === 0 ? (
        <EmptyState
          icon={<Syringe size={28} />}
          title={
            ave
              ? "Esta ave não tem tratamento registrado"
              : "Nenhum tratamento registrado"
          }
          description="O histórico sanitário começa no primeiro registro: o que foi aplicado, em quem, quando começou e quando terminou."
          compact
        />
      ) : null}

      {emCurso.length > 0 ? (
        <section className={styles.bloco}>
          <h2 className={styles.blocoTitulo}>Em curso</h2>
          <ul className={styles.lista}>
            {emCurso.map((t) => (
              <li key={t.id}>
                <LinhaTratamento tratamento={t} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* O único elemento âmbar da tela, e com prazo de verdade: enquanto a
          carência corre, a ave não deveria ser vendida nem exposta. */}
      {emCarencia.length > 0 ? (
        <section className={styles.bloco}>
          <h2 className={styles.blocoTitulo}>Em carência</h2>
          <p className={styles.aviso}>
            {/* `TriangleAlert` é o glifo de atenção no léxico do contrato;
                `Thermometer` lá significa incubação. */}
            <TriangleAlert size={16} aria-hidden="true" />
            Tratamento encerrado, carência correndo. A data é a do fim da
            aplicação mais os dias do medicamento.
          </p>
          <ul className={styles.lista}>
            {emCarencia.map((t) => (
              <li key={t.id}>
                <LinhaTratamento tratamento={t} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {encerrados.length > 0 ? (
        <section className={styles.bloco}>
          <h2 className={styles.blocoTitulo}>Encerrados</h2>
          <ul className={styles.lista}>
            {encerrados.slice(0, 12).map((t) => (
              <li key={t.id}>
                <LinhaTratamento tratamento={t} />
              </li>
            ))}
          </ul>
          {encerrados.length > 12 ? (
            <p className={styles.nota}>
              Mostrando os 12 mais recentes de {encerrados.length}. O histórico
              completo de cada ave fica na ficha dela.
            </p>
          ) : null}
        </section>
      ) : null}

      {ave ? (
        <p className={styles.nota}>
          <Link href="/saude" className={styles.elo}>
            Ver os tratamentos de todo o criatório
          </Link>
        </p>
      ) : (
      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>Catálogos</h2>
        <ul className={styles.catalogos}>
          <Catalogo
            href="/saude/medicamentos"
            Icone={Pill}
            rotulo="Medicamentos"
            resumo={
              medicamentos.length === 0
                ? "Nenhum — o catálogo nasce vazio, com o que está na sua prateleira"
                : `${medicamentos.length} ${medicamentos.length === 1 ? "medicamento" : "medicamentos"} · a carência sai daqui`
            }
          />
          <Catalogo
            href="/saude/doencas"
            Icone={Stethoscope}
            rotulo="Doenças"
            resumo={`${doencas.length} ${doencas.length === 1 ? "doença" : "doenças"} · com os sintomas que você observou`}
          />
          <Catalogo
            href="/saude/sintomas"
            Icone={ClipboardList}
            rotulo="Sintomas"
            resumo={`${sintomas.length} ${sintomas.length === 1 ? "sintoma" : "sintomas"} · o vocabulário do que se vê no galpão`}
          />
        </ul>
      </section>
      )}
    </div>
  );
}

function Catalogo({
  href,
  Icone,
  rotulo,
  resumo,
}: {
  href: string;
  Icone: typeof Pill;
  rotulo: string;
  resumo: string;
}) {
  return (
    <li>
      <Link href={href} className={styles.catalogo}>
        <span className={styles.catalogoIcone} aria-hidden="true">
          <Icone size={20} />
        </span>
        <span className={styles.catalogoTextos}>
          <span className={styles.catalogoRotulo}>{rotulo}</span>
          <span className={styles.catalogoResumo}>{resumo}</span>
        </span>
        <ChevronRight size={18} aria-hidden="true" className={styles.seta} />
      </Link>
    </li>
  );
}

function LinhaTratamento({ tratamento: t }: { tratamento: Tratamento }) {
  const alvo = t.ave
    ? (t.ave.nome ?? "Ave sem nome")
    : t.casal
      ? `Casal ${String(t.casal.numero).padStart(2, "0")}`
      : "Alvo não informado";

  const dias = t.emCurso ? diasDesde(t.inicio) : null;

  return (
    <Link href={`/saude/${t.id}/editar`} className={styles.tratamento}>
      <span className={styles.tratamentoTopo}>
        <span className={styles.tratamentoAlvo}>{alvo}</span>
        {t.emCurso ? (
          <Badge tone="info" size="sm">
            Em curso
          </Badge>
        ) : t.carenciaAtiva ? (
          // Âmbar: é prazo correndo, não informação de arquivo.
          <Badge tone="acao" size="sm">
            Carência até {formatarData(t.carenciaAte)}
          </Badge>
        ) : (
          <Badge tone="neutro" size="sm">
            Encerrado
          </Badge>
        )}
      </span>

      {t.ave ? <Anilha dados={t.ave.anilha} size="sm" tone="quiet" /> : null}

      <span className={styles.tratamentoDetalhe}>
        {encadear(
          t.medicamento?.nome ?? "Sem medicamento informado",
          t.doenca?.nome,
          t.dosagem,
        )}
      </span>

      <span className={styles.tratamentoDatas}>
        {encadear(
          t.fim
            ? `${formatarData(t.inicio)} a ${formatarData(t.fim)}`
            : `desde ${formatarData(t.inicio)}`,
          dias !== null ? `${dias} ${dias === 1 ? "dia" : "dias"}` : null,
          // Em curso, a carência existe mas a data ainda não: ela conta do fim.
          t.emCurso && t.carenciaDias
            ? `carência de ${t.carenciaDias} ${t.carenciaDias === 1 ? "dia" : "dias"} a contar do fim`
            : null,
        )}
      </span>
    </Link>
  );
}

function diasDesde(inicio: string): number {
  const a = new Date(`${inicio}T00:00:00`).getTime();
  const b = new Date(`${hojeNoCriatorio()}T00:00:00`).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}
