import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterCasal } from "@/lib/dados/casais";
import { FormularioPostura } from "./formulario";
import styles from "./postura.module.css";

export const metadata: Metadata = { title: "Registrar postura" };

export default async function RegistrarPostura({
  params,
}: PageProps<"/casais/[id]/postura">) {
  const { id } = await params;
  const casal = await obterCasal(id);
  if (!casal) notFound();

  // Os prazos da espécie do casal alimentam as previsões mostradas em tela.
  const especieId = await obterEspecieDoCasal(casal.macho?.id, casal.femea?.id);
  const prazos = especieId ? await obterPrazos(especieId) : null;

  return (
    <div className={styles.tela}>
      <Link href={`/casais/${id}`} className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Casal {String(casal.numero).padStart(2, "0")}
      </Link>

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Registrar postura</h1>
        <p className={styles.contexto}>
          Casal {String(casal.numero).padStart(2, "0")}
          {casal.macho?.especie ? ` · ${casal.macho.especie}` : ""}
          {casal.gaiola ? ` · gaiola ${casal.gaiola}` : ""}
        </p>
      </header>

      <FormularioPostura
        casalId={id}
        casalNumero={casal.numero}
        proximaNinhada={(casal.ninhadas[0]?.numero ?? 0) + 1}
        prazos={prazos}
      />
    </div>
  );
}

/** A espécie do casal vem do macho, com a fêmea como alternativa. */
async function obterEspecieDoCasal(machoId?: string, femeaId?: string) {
  const ids = [machoId, femeaId].filter((v): v is string => Boolean(v));
  if (!ids.length) return null;

  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("passaros")
    .select("id, especie_id")
    .in("id", ids);

  const porId = new Map((data ?? []).map((p) => [p.id, p.especie_id]));
  return (machoId ? porId.get(machoId) : null) ?? (femeaId ? porId.get(femeaId) : null) ?? null;
}

async function obterPrazos(especieId: string) {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("especies")
    .select("nome, dias_choco, dias_ovoscopia, dias_anilha, janela_anilha_dias, dias_separa")
    .eq("id", especieId)
    .maybeSingle();
  return data ?? null;
}
