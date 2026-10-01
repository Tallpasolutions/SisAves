import type { Metadata } from "next";
import { ChevronLeft, Feather } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, EmptyState } from "@/components/ui";
import { obterNinhadaParaAnilhar } from "@/lib/dados/anilhamento";
import { encadear } from "@/lib/formato";
import { FormularioAnilhamento } from "./formulario";
import styles from "./anilhar.module.css";

export const metadata: Metadata = { title: "Anilhar filhote" };

export default async function Anilhar({
  params,
}: PageProps<"/ovos/[ninhada]/anilhar">) {
  const { ninhada: id } = await params;
  const ninhada = await obterNinhadaParaAnilhar(id);
  if (!ninhada) notFound();

  const numero = String(ninhada.ninhadaNumero ?? 0).padStart(2, "0");

  return (
    <div className={styles.tela}>
      <Link href="/ovos" className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Ovos
      </Link>

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Anilhar filhote</h1>
        <p className={styles.contexto}>
          {encadear(
            `Ninhada ${numero}`,
            `Casal ${String(ninhada.casalNumero).padStart(2, "0")}`,
            ninhada.especie,
          )}
        </p>
      </header>

      {/* Ninhada sem filhote na janela: ou ninguém eclodiu ainda, ou todos já
          foram anilhados. A tela diz isso em vez de mostrar formulário vazio. */}
      {ninhada.filhotes.length === 0 ? (
        <EmptyState
          icon={<Feather size={28} />}
          title="Nenhum filhote esperando anilha"
          description="Os filhotes desta ninhada já foram anilhados, ou os ovos ainda não chegaram à janela de anilhamento."
          acao={<Button href={`/casais/${ninhada.casalId}`}>Ver o casal</Button>}
          compact
        />
      ) : (
        <FormularioAnilhamento ninhada={ninhada} />
      )}
    </div>
  );
}
