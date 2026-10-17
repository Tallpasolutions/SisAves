import type { Metadata } from "next";
import { ChartColumn } from "lucide-react";
import Link from "next/link";
import { Badge, EmptyState, Button } from "@/components/ui";
import { anoAtual, obterRelatorios, type DesempenhoCasal } from "@/lib/dados/relatorios";
import { formatarNumero, formatarPercentual } from "@/lib/formato";
import styles from "./relatorios.module.css";

export const metadata: Metadata = { title: "Relatórios" };

export default async function Relatorios() {
  const { temporadas, casais, emCurso } = await obterRelatorios();
  const ano = anoAtual();

  return (
    <div className={styles.tela}>
      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Relatórios</h1>
        <p className={styles.contexto}>
          Os números que decidem o plantel da temporada seguinte.
        </p>
      </header>

      {/* A regra que atravessa a tela inteira, dita uma vez. */}
      <p className={styles.explicacao}>
        Toda taxa conta só o ovo que já tem desfecho. Ovo chocando não é
        fracasso — contá-lo como tal faria a eclosão despencar a cada postura
        nova, e o número passaria a medir o calendário em vez do plantel.
        {emCurso > 0
          ? ` Hoje ${emCurso} ${emCurso === 1 ? "ovo está" : "ovos estão"} em curso, fora das contas.`
          : ""}
      </p>

      {temporadas.length === 0 ? (
        <EmptyState
          icon={<ChartColumn size={28} />}
          title="Nada para somar ainda"
          description="Os relatórios se montam sozinhos a partir das posturas registradas. Registre a primeira e eles aparecem."
          acao={<Button href="/casais">Ver os casais</Button>}
          compact
        />
      ) : (
        <>
          <section className={styles.bloco}>
            <h2 className={styles.blocoTitulo}>Por temporada</h2>
            <div className={styles.rolagem}>
              <table className={styles.tabela}>
                <thead>
                  <tr>
                    <th scope="col">Ano</th>
                    <th scope="col">Posturas</th>
                    <th scope="col">Ovos</th>
                    <th scope="col">Nascidos</th>
                    <th scope="col">Anilhados</th>
                    <th scope="col">Claros</th>
                    <th scope="col">Perdas</th>
                    <th scope="col">Eclosão</th>
                  </tr>
                </thead>
                <tbody>
                  {temporadas.map((t) => {
                    const decididos = t.nascidos + t.infertis + t.perdidos;
                    return (
                      <tr key={t.ano}>
                        <th scope="row" className={styles.ano}>
                          {t.ano}
                          {t.ano === ano ? (
                            <Badge tone="ok" size="sm">
                              atual
                            </Badge>
                          ) : null}
                        </th>
                        <td>{formatarNumero(t.posturas)}</td>
                        <td>{formatarNumero(t.ovos)}</td>
                        <td>{formatarNumero(t.nascidos)}</td>
                        <td>{formatarNumero(t.anilhados)}</td>
                        <td>{formatarNumero(t.infertis)}</td>
                        <td>{formatarNumero(t.perdidos)}</td>
                        <td className={styles.taxa}>
                          {decididos === 0
                            ? "—"
                            : formatarPercentual((t.nascidos / decididos) * 100)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className={styles.bloco}>
            <h2 className={styles.blocoTitulo}>Por casal</h2>
            <p className={styles.blocoNota}>
              Do melhor para o pior aproveitamento. Casal sem ovo decidido fica
              sem taxa, não com zero.
            </p>
            <ul className={styles.lista}>
              {casais.map((c) => (
                <li key={c.casalId}>
                  <LinhaCasal casal={c} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function LinhaCasal({ casal: c }: { casal: DesempenhoCasal }) {
  return (
    <Link href={`/casais/${c.casalId}`} className={styles.casal}>
      <span className={styles.casalTextos}>
        <span className={styles.casalNome}>
          Casal {String(c.numero).padStart(2, "0")}
        </span>
        <span className={styles.casalContexto}>
          {[
            c.especie,
            `${c.ovos} ${c.ovos === 1 ? "ovo" : "ovos"}`,
            `${c.nascidos} ${c.nascidos === 1 ? "nascido" : "nascidos"}`,
            `${c.anilhados} ${c.anilhados === 1 ? "anilhado" : "anilhados"}`,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
        {/* O denominador ao lado da taxa: "100%" sobre 1 ovo decidido de 5 não
            se lê como sucesso sem ele. */}
        <span className={styles.casalBase}>
          {c.decididos === 0
            ? `${c.ovos} ${c.ovos === 1 ? "ovo ainda em curso" : "ovos ainda em curso"}`
            : `taxa sobre ${c.decididos} ${c.decididos === 1 ? "ovo decidido" : "ovos decididos"}${
                c.ovos > c.decididos ? ` · ${c.ovos - c.decididos} em curso` : ""
              }`}
        </span>
      </span>
      <span className={styles.casalTaxa}>
        {c.eclosao === null ? "—" : formatarPercentual(c.eclosao * 100)}
      </span>
    </Link>
  );
}
