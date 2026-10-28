import type { Metadata } from "next";
import { ChevronLeft, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState, Toast } from "@/components/ui";
import { casaisQuePodemChocar, obterNinhada } from "@/lib/dados/ninhada";
import { encadear, formatarData } from "@/lib/formato";
import { BotaoDevolver, FormularioTransferencia } from "./formulario";
import styles from "./transferir.module.css";

export const metadata: Metadata = { title: "Transferir ovos" };

export default async function Transferir({
  params,
  searchParams,
}: PageProps<"/ovos/[ninhada]/transferir">) {
  const [{ ninhada: id }, consulta] = await Promise.all([params, searchParams]);
  const ninhada = await obterNinhada(id);
  if (!ninhada) notFound();

  const babas = await casaisQuePodemChocar(ninhada.casalId);
  const numero = String(ninhada.ninhadaNumero ?? 0).padStart(2, "0");
  const fora = ninhada.ovos.filter((o) => o.chocadorId !== null);

  return (
    <div className={styles.tela}>
      <Link href={`/ovos/${id}`} className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Ninhada {numero}
      </Link>

      {consulta.devolvido === "1" ? (
        <Toast
          tone="ok"
          title="Ovo de volta ao ninho de origem"
          description="A passagem continua no histórico da postura, agora com data de fim."
        />
      ) : null}

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Transferir ovos</h1>
        <p className={styles.contexto}>
          {encadear(
            `Ninhada ${numero}`,
            `Casal ${String(ninhada.casalNumero).padStart(2, "0")}`,
            `postura ${formatarData(ninhada.dataPostura)}`,
          )}
        </p>
        <p className={styles.explicacao}>
          Transferir muda só quem choca. O ovo continua sendo do casal que o
          pôs, e o filhote nasce com a filiação dele. É isso que o certificado
          vai afirmar.
        </p>
      </header>

      {/* Os que já estão fora vêm primeiro: quem abre esta tela com ovo na
          babá costuma vir para trazê-lo de volta. */}
      {fora.length > 0 ? (
        <section className={styles.grupo}>
          <h2 className={styles.grupoTitulo}>Fora do ninho</h2>
          <ul className={styles.devolucoes}>
            {fora.map((ovo) => {
              const nome =
                ovo.numeroOvo === null ? "Ovo sem número" : `Ovo ${ovo.numeroOvo}`;
              return (
                <li key={ovo.posturaId} className={styles.devolucao}>
                  <span className={styles.devolucaoTextos}>
                    <span className={styles.ovoNome}>{nome}</span>
                    <span className={styles.ovoContexto}>
                      chocando com o Casal{" "}
                      {String(ovo.chocadorNumero ?? 0).padStart(2, "0")}
                    </span>
                  </span>
                  <BotaoDevolver posturaId={ovo.posturaId} ninhadaId={id} rotulo={nome} />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {babas.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="Nenhum casal disponível"
          description="Só casal vigente recebe ovo para chocar, e este criatório não tem outro agora."
          compact
        />
      ) : (
        <FormularioTransferencia ninhada={ninhada} babas={babas} />
      )}
    </div>
  );
}
