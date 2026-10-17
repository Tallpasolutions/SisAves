import type { Metadata } from "next";
import { ChevronLeft, Tags } from "lucide-react";
import Link from "next/link";
import { Button, EmptyState, Toast } from "@/components/ui";
import { listarEtiquetas } from "@/lib/dados/casais";
import { LinhaEtiqueta } from "./formulario";
import styles from "./etiquetas.module.css";

export const metadata: Metadata = { title: "Etiquetas" };

export default async function Etiquetas({
  searchParams,
}: PageProps<"/casais/etiquetas">) {
  const consulta = await searchParams;
  const etiquetas = await listarEtiquetas();

  return (
    <div className={styles.tela}>
      <Link href="/casais" className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Casais
      </Link>

      {consulta.salva === "1" ? (
        <Toast
          tone="ok"
          title="Etiqueta salva"
          description="O nome novo já aparece em todos os casais que a usam."
        />
      ) : null}

      {consulta.excluida === "1" ? (
        <Toast
          tone="ok"
          title="Etiqueta excluída"
          description="Ela sai dos casais que a usavam. Nada mais muda neles."
        />
      ) : null}

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Etiquetas</h1>
        <p className={styles.contexto}>
          {etiquetas.length === 0
            ? "Nenhuma etiqueta no criatório."
            : `${etiquetas.length} ${etiquetas.length === 1 ? "etiqueta" : "etiquetas"}`}
        </p>
        <p className={styles.explicacao}>
          As etiquetas são suas, não do sistema. Elas se criam na edição de um
          casal; aqui se arrumam e se apagam.
        </p>
      </header>

      {etiquetas.length === 0 ? (
        <EmptyState
          icon={<Tags size={28} />}
          title="Sem etiquetas"
          description="Abra a edição de um casal e crie a primeira. Ela fica disponível para os outros casais na mesma hora."
          acao={<Button href="/casais">Ver os casais</Button>}
          compact
        />
      ) : (
        <ul className={styles.lista}>
          {etiquetas.map((e) => (
            <li key={e.id}>
              <LinhaEtiqueta etiqueta={e} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
