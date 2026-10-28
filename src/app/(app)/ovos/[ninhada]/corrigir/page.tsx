import type { Metadata } from "next";
import { ChevronLeft, Egg } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, EmptyState, Toast } from "@/components/ui";
import { MARCOS_DESFAZIVEIS } from "@/lib/dados/marcos";
import { obterNinhada } from "@/lib/dados/ninhada";
import { encadear, formatarData } from "@/lib/formato";
import { LinhaCorrecao } from "./formulario";
import styles from "./corrigir.module.css";

export const metadata: Metadata = { title: "Corrigir registros" };

export default async function Corrigir({
  params,
  searchParams,
}: PageProps<"/ovos/[ninhada]/corrigir">) {
  const [{ ninhada: id }, consulta] = await Promise.all([params, searchParams]);
  const ninhada = await obterNinhada(id);
  if (!ninhada) notFound();

  const numero = String(ninhada.ninhadaNumero ?? 0).padStart(2, "0");
  const comRegistro = ninhada.ovos.filter((o) => o.desfaziveis.length > 0);
  const desfeito = MARCOS_DESFAZIVEIS.find((m) => m.valor === consulta.desfeito);
  const redatado = MARCOS_DESFAZIVEIS.find((m) => m.valor === consulta.redatado);

  return (
    <div className={styles.tela}>
      <Link href={`/ovos/${id}`} className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Ninhada {numero}
      </Link>

      {desfeito ? (
        <Toast
          tone="ok"
          title={`${desfeito.desfeito} · Ninhada ${numero}`}
          description="O ovo volta ao ciclo e o estado dele passa a ser derivado dos prazos da espécie de novo."
        />
      ) : null}

      {redatado ? (
        <Toast
          tone="ok"
          title={`${redatado.redatado} · Ninhada ${numero}`}
          description="O marco continua registrado; só a data mudou, e os prazos passam a contar dela."
        />
      ) : null}

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Corrigir registros</h1>
        <p className={styles.contexto}>
          {encadear(
            `Ninhada ${numero}`,
            `Casal ${String(ninhada.casalNumero).padStart(2, "0")}`,
            `postura ${formatarData(ninhada.dataPostura)}`,
          )}
        </p>
        <p className={styles.explicacao}>
          Mudar a data mantém o registro e recalcula os prazos a partir dela.
          Desfazer apaga o que foi registrado e devolve o ovo ao ciclo.
        </p>
      </header>

      {comRegistro.length === 0 ? (
        <EmptyState
          icon={<Egg size={28} />}
          title="Nada a corrigir"
          description="Esta ninhada só tem a postura registrada, ou o que foi marcado já não pode ser desfeito. Filhote anilhado, por exemplo, virou ave no plantel."
          acao={<Button href={`/ovos/${id}`}>Voltar para a ninhada</Button>}
          compact
        />
      ) : (
        <ul className={styles.ovos}>
          {comRegistro.map((ovo) => (
            <li key={ovo.posturaId}>
              <LinhaCorrecao ovo={ovo} ninhadaId={id} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
