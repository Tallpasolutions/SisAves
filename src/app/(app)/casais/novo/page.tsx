import type { Metadata } from "next";
import { ChevronLeft, Users } from "lucide-react";
import Link from "next/link";
import { Button, EmptyState } from "@/components/ui";
import { opcoesFormarCasal } from "@/lib/dados/cadastro";
import { FormularioCasal } from "./formulario";
import styles from "./novo.module.css";

export const metadata: Metadata = { title: "Formar casal" };

export default async function FormarCasal() {
  const opcoes = await opcoesFormarCasal();
  const faltaPar = opcoes.machos.length === 0 || opcoes.femeas.length === 0;

  return (
    <div className={styles.tela}>
      <Link href="/casais" className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Casais
      </Link>

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Formar casal</h1>
        <p className={styles.contexto}>
          O coeficiente de endogamia aparece assim que você escolher as duas
          aves — antes de confirmar.
        </p>
      </header>

      {/* Sem macho ou sem fêmea no plantel ativo não há casal a formar, e a
          tela diz qual dos dois falta em vez de mostrar listas vazias. */}
      {faltaPar ? (
        <EmptyState
          icon={<Users size={28} />}
          title={
            opcoes.machos.length === 0 && opcoes.femeas.length === 0
              ? "Nenhuma ave com sexo definido"
              : opcoes.machos.length === 0
                ? "Nenhum macho no plantel ativo"
                : "Nenhuma fêmea no plantel ativo"
          }
          description="Um casal precisa de um macho e uma fêmea no plantel ativo. Ave com sexo indefinido não pode ser acasalada."
          acao={<Button href="/plantel/nova">Cadastrar ave</Button>}
          compact
        />
      ) : (
        <FormularioCasal opcoes={opcoes} />
      )}
    </div>
  );
}
