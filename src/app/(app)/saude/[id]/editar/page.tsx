import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { opcoesDeAve } from "@/lib/dados/aves-escolha";
import {
  listarDoencas,
  listarMedicamentos,
  obterTratamento,
  opcoesDeCasal,
} from "@/lib/dados/saude";
import { encadear, formatarData } from "@/lib/formato";
import { BotaoExcluirTratamento, FormularioTratamento } from "../../formulario";
import styles from "../../formulario.module.css";

export const metadata: Metadata = { title: "Corrigir tratamento" };

export default async function EditarTratamento({
  params,
}: PageProps<"/saude/[id]/editar">) {
  const { id } = await params;

  const tratamento = await obterTratamento(id);
  if (!tratamento) notFound();

  const [medicamentos, doencas, aves, casais] = await Promise.all([
    listarMedicamentos(),
    listarDoencas(),
    opcoesDeAve(),
    opcoesDeCasal(),
  ]);

  const alvo = tratamento.ave
    ? (tratamento.ave.nome ?? "Ave sem nome")
    : tratamento.casal
      ? `Casal ${String(tratamento.casal.numero).padStart(2, "0")}`
      : "Sem alvo";

  return (
    <div className={styles.tela}>
      <Link href="/saude" className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Saúde
      </Link>

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Corrigir tratamento</h1>
        <p className={styles.contexto}>
          {encadear(
            alvo,
            tratamento.medicamento?.nome,
            tratamento.fim
              ? `${formatarData(tratamento.inicio)} a ${formatarData(tratamento.fim)}`
              : `desde ${formatarData(tratamento.inicio)}`,
          )}
        </p>
      </header>

      <FormularioTratamento
        medicamentos={medicamentos}
        doencas={doencas}
        aves={aves}
        casais={casais}
        emEdicao={tratamento}
      />

      <div className={styles.exclusao}>
        <p className={styles.exclusaoNota}>
          Terminar o tratamento é preencher a data de fim acima — é dela que a
          carência conta. Excluir é para o registro que nunca deveria existir.
        </p>
        <BotaoExcluirTratamento
          tratamentoId={tratamento.id}
          descricao={encadear(alvo, tratamento.medicamento?.nome)}
        />
      </div>
    </div>
  );
}
