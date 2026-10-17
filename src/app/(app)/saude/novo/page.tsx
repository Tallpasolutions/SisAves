import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { opcoesDeAve } from "@/lib/dados/aves-escolha";
import { listarDoencas, listarMedicamentos, opcoesDeCasal } from "@/lib/dados/saude";
import { FormularioTratamento } from "../formulario";
import styles from "../formulario.module.css";

export const metadata: Metadata = { title: "Registrar tratamento" };

export default async function NovoTratamento({
  searchParams,
}: PageProps<"/saude/novo">) {
  const consulta = await searchParams;
  const aveEscolhida = typeof consulta.ave === "string" ? consulta.ave : null;

  const [medicamentos, doencas, aves, casais] = await Promise.all([
    listarMedicamentos(),
    listarDoencas(),
    opcoesDeAve(),
    opcoesDeCasal(),
  ]);

  return (
    <div className={styles.tela}>
      <Link href="/saude" className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Saúde
      </Link>

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Registrar tratamento</h1>
        <p className={styles.contexto}>
          O que foi aplicado, em quem, quando começou e — quando já terminou —
          quando terminou. A carência conta a partir do fim.
        </p>
      </header>

      <FormularioTratamento
        medicamentos={medicamentos}
        doencas={doencas}
        aves={aves}
        casais={casais}
        aveEscolhida={aveEscolhida}
      />
    </div>
  );
}
