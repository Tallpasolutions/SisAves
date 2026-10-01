import type { Metadata } from "next";
import { ChevronLeft, Feather } from "lucide-react";
import Link from "next/link";
import { Button, EmptyState } from "@/components/ui";
import { opcoesCadastroAve } from "@/lib/dados/cadastro";
import { FormularioAve } from "./formulario";
import styles from "./nova.module.css";

export const metadata: Metadata = { title: "Cadastrar ave" };

export default async function CadastrarAve() {
  const opcoes = await opcoesCadastroAve();

  return (
    <div className={styles.tela}>
      <Link href="/plantel" className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Plantel
      </Link>

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Cadastrar ave</h1>
        <p className={styles.contexto}>
          A espécie define os prazos do ciclo do ovo. A anilha identifica a ave
          em tudo o que vem depois.
        </p>
      </header>

      {/* Sem espécie adotada não há prazo, e sem prazo não há ciclo — então a
          tela manda resolver isso antes de pedir qualquer outro dado. */}
      {opcoes.especies.length === 0 ? (
        <EmptyState
          icon={<Feather size={28} />}
          title="Nenhuma espécie no criatório"
          description="Adote ao menos uma espécie do catálogo. É dela que vêm os dias de choco, ovoscopia, anilhamento e separação."
          acao={<Button href="/comecar/especies">Escolher espécies</Button>}
          compact
        />
      ) : (
        <FormularioAve opcoes={opcoes} />
      )}
    </div>
  );
}
