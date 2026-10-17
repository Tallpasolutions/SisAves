import type { Metadata } from "next";
import { Award, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Anilha, Badge, Button, EmptyState, Toast } from "@/components/ui";
import { certificadosDaAve } from "@/lib/dados/certificados";
import { calcularEndogamia } from "@/lib/dados/casais";
import { obterAve } from "@/lib/dados/plantel";
import { formatarData, formatarPercentual } from "@/lib/formato";
import { BotaoEmitir, BotaoRevogar } from "./formulario";
import styles from "./certificado.module.css";

export const metadata: Metadata = { title: "Certificado" };

export default async function Certificado({
  params,
  searchParams,
}: PageProps<"/plantel/[id]/certificado">) {
  const [{ id }, consulta] = await Promise.all([params, searchParams]);
  const [ave, certificados] = await Promise.all([
    obterAve(id),
    certificadosDaAve(id),
  ]);
  if (!ave) notFound();

  // O coeficiente de HOJE, que é o que a emissão vai congelar. Calculado da
  // mesma função que o CRO usa, para a prévia não divergir do papel.
  const endogamia = await calcularEndogamia(ave.pai?.id, ave.mae?.id);

  const temAnilha = ave.anilha.numero !== null;
  const validos = certificados.filter((c) => c.revogadoEm === null);

  return (
    <div className={styles.tela}>
      <Link href={`/plantel/${id}`} className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        {ave.nome ?? "Ficha da ave"}
      </Link>

      {consulta.revogado === "1" ? (
        <Toast
          tone="ok"
          title="Certificado revogado"
          description="Quem escanear o QR dessa via passa a ver que ela não vale mais, com a data e o motivo."
        />
      ) : null}

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Certificado de origem</h1>
        <p className={styles.contexto}>
          {ave.nome ?? "Ave sem nome"}
          {ave.especie ? ` · ${ave.especie}` : ""}
        </p>
        <Anilha dados={ave.anilha} size="sm" tone="quiet" />
      </header>

      {/* O que o documento vai afirmar, antes de emitir. O snapshot congela
          isto: depois da emissão, corrigir a ficha não muda o papel. */}
      <section className={styles.resumo}>
        <h2 className={styles.blocoTitulo}>O que este CRO vai afirmar</h2>
        <dl className={styles.dados}>
          <Dado rotulo="Nascimento" valor={formatarData(ave.dtNascimento)} />
          <Dado
            rotulo="Filiação"
            valor={
              ave.pai || ave.mae
                ? [ave.pai?.nome ?? "pai desconhecido", ave.mae?.nome ?? "mãe desconhecida"].join(" × ")
                : "Desconhecida"
            }
          />
          <Dado
            rotulo="Endogamia"
            valor={endogamia === null ? "—" : formatarPercentual(endogamia)}
          />
        </dl>
        <p className={styles.blocoNota}>
          A genealogia de três gerações e o coeficiente de endogamia entram
          congelados no momento da emissão. Corrigir a ficha depois não altera
          um certificado já emitido — é para isso que ele guarda a própria
          cópia.
        </p>
      </section>

      {!temAnilha ? (
        <p className={styles.alerta} role="alert">
          Esta ave não tem anilha. O certificado afirma a anilha oficial — sem
          ela não há o que certificar.
        </p>
      ) : null}

      <BotaoEmitir aveId={id} temAnilha={temAnilha} jaEmitidos={validos.length} />

      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>Vias emitidas</h2>

        {certificados.length === 0 ? (
          <EmptyState
            icon={<Award size={28} />}
            title="Nenhuma via emitida"
            description="A primeira emissão gera o número, o QR de validação e a folha pronta para imprimir."
            compact
          />
        ) : (
          <ul className={styles.lista}>
            {certificados.map((c) => (
              <li key={c.id} className={styles.via}>
                <span className={styles.viaTextos}>
                  <span className={styles.viaTopo}>
                    <span className={styles.viaNumero}>
                      nº {String(c.sequencial).padStart(5, "0")}
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
                  </span>
                  <span className={styles.viaContexto}>
                    Emitido em {formatarData(c.emitidoEm)}
                    {c.snapshot.endogamia_pct !== null
                      ? ` · endogamia ${formatarPercentual(c.snapshot.endogamia_pct)}`
                      : ""}
                    {c.revogadoEm
                      ? ` · revogado em ${formatarData(c.revogadoEm)}${c.revogadoMotivo ? ` · ${c.revogadoMotivo}` : ""}`
                      : ""}
                  </span>
                  <span className={styles.viaUrl}>{c.caminhoPublico}</span>
                </span>

                <span className={styles.viaAcoes}>
                  <Button href={`/cro/${c.id}`} variant="secondary" size="sm">
                    Abrir folha
                  </Button>
                  {!c.revogadoEm ? (
                    <BotaoRevogar
                      certificadoId={c.id}
                      aveId={id}
                      numero={c.sequencial}
                    />
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
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
