import type { Metadata } from "next";
import { ChevronLeft, Egg } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, EmptyState, Toast } from "@/components/ui";
import { obterNinhada, proximoPasso } from "@/lib/dados/ninhada";
import { encadear, formatarData } from "@/lib/formato";
import { FormularioConferencia } from "./formulario";
import styles from "./ninhada.module.css";

export async function generateMetadata({
  params,
}: PageProps<"/ovos/[ninhada]">): Promise<Metadata> {
  const { ninhada: id } = await params;
  const ninhada = await obterNinhada(id);
  if (!ninhada) return { title: "Ninhada" };
  return { title: `Ninhada ${String(ninhada.ninhadaNumero ?? 0).padStart(2, "0")}` };
}

export default async function Ninhada({
  params,
  searchParams,
}: PageProps<"/ovos/[ninhada]">) {
  const [{ ninhada: id }, busca] = await Promise.all([params, searchParams]);
  const ninhada = await obterNinhada(id);
  if (!ninhada) notFound();

  const numero = String(ninhada.ninhadaNumero ?? 0).padStart(2, "0");
  const passo = proximoPasso(ninhada);

  // Confirmação da conferência que acabou de ser gravada.
  const transferidos = Number(busca.transferidos);
  const bruto = Number(busca.conferidos);
  const conferidos = Number.isFinite(bruto) && busca.conferidos !== undefined
    ? bruto
    : null;

  return (
    <div className={styles.tela}>
      <Link href="/ovos" className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Ovos
      </Link>

      {conferidos !== null ? (
        conferidos === 0 ? (
          /* Zero aplicados não é erro: os marcos já estavam gravados. Dizer
             "registrado" aqui seria afirmar uma escrita que não houve. */
          <Toast
            tone="info"
            title="Nada mudou nesta ninhada"
            description="Os ovos marcados já tinham esse registro."
          />
        ) : (
          <Toast
            tone="ok"
            title={`Conferência registrada · ${conferidos} ${conferidos === 1 ? "ovo" : "ovos"}`}
            description={passo ?? "O ciclo desta ninhada está encerrado."}
          />
        )
      ) : null}

      {Number.isFinite(transferidos) && transferidos > 0 ? (
        <Toast
          tone="ok"
          title={`${transferidos} ${transferidos === 1 ? "ovo transferido" : "ovos transferidos"}`}
          description="Eles passam a aparecer no casal que está chocando. A filiação dos filhotes continua sendo a deste casal."
        />
      ) : null}

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Ninhada {numero}</h1>
        <p className={styles.contexto}>
          {encadear(
            `Casal ${String(ninhada.casalNumero).padStart(2, "0")}`,
            ninhada.especie,
            `postura ${formatarData(ninhada.dataPostura)}`,
            `${ninhada.ovos.length} ${ninhada.ovos.length === 1 ? "ovo" : "ovos"}`,
          )}
        </p>
      </header>

      {/* O anilhamento tem tela própria: ele pede o número do anel, o nome e o
          peso de cada filhote, e é a ação com prazo vencendo. */}
      {ninhada.paraAnilhar > 0 ? (
        <section className={styles.anilhar}>
          <div className={styles.anilharTextos}>
            <span className={styles.anilharTitulo}>
              {ninhada.paraAnilhar === 1
                ? "1 filhote esperando anilha"
                : `${ninhada.paraAnilhar} filhotes esperando anilha`}
            </span>
            <span className={styles.anilharNota}>
              A anilha precisa do número do anel, e tem tela própria.
            </span>
          </div>
          <Button href={`/ovos/${ninhada.ninhadaId}/anilhar`} variant="secondary" size="md">
            Anilhar
          </Button>
        </section>
      ) : null}

      {ninhada.emCurso === 0 ? (
        <EmptyState
          icon={<Egg size={28} />}
          title="Ninhada encerrada"
          description="Todos os ovos desta ninhada já têm desfecho registrado. Nada a conferir no ninho."
          acao={<Button href={`/casais/${ninhada.casalId}`}>Ver o casal</Button>}
          compact
        />
      ) : null}

      {/* Onde o ovo ESTÁ, que pode não ser onde ele nasceu. Sem isto o criador
          procura na gaiola errada — que é o problema que a transferência
          existe para resolver. */}
      {ninhada.transferidos > 0 ? (
        <p className={styles.chocador}>
          {ninhada.transferidos === 1
            ? "1 ovo desta ninhada está sendo chocado por outro casal."
            : `${ninhada.transferidos} ovos desta ninhada estão sendo chocados por outro casal.`}{" "}
          A filiação dos filhotes continua sendo a deste casal.
        </p>
      ) : null}

      <FormularioConferencia ninhada={ninhada} />

      {/* Fora do formulário de propósito: <form> dentro de <form> é inválido,
          e o gesto é outro — ali se registra o que se viu, aqui se apaga o que
          não aconteceu. */}
      {ninhada.emCurso > 0 ? (
        <div className={styles.corrigir}>
          <Link href={`/ovos/${ninhada.ninhadaId}/transferir`} className={styles.elo}>
            Passar ovos para outro casal chocar
          </Link>
        </div>
      ) : null}

      {ninhada.ovos.some((o) => o.desfaziveis.length > 0) ? (
        <div className={styles.corrigir}>
          <Link href={`/ovos/${ninhada.ninhadaId}/corrigir`} className={styles.elo}>
            Corrigir um registro desta ninhada
          </Link>
        </div>
      ) : null}
    </div>
  );
}
