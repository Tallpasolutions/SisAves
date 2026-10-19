"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { barradoPelaAssinatura, ERRO_ASSINATURA } from "@/lib/erros";

export interface EstadoCertificado {
  erro?: string;
}

/**
 * Emite um CRO para a ave.
 *
 * Sem fila offline de propósito: o certificado é um documento que vai ser
 * impresso e entregue, e numerá-lo no aparelho sem falar com o servidor daria
 * dois CRO com o mesmo número quando dois registros subissem. A numeração é
 * por criatório e vem sob trava, no banco.
 */
export async function emitirCertificado(
  _anterior: EstadoCertificado,
  dados: FormData,
): Promise<EstadoCertificado> {
  const aveId = String(dados.get("passaro_id") ?? "");
  if (!aveId) return { erro: "Ave não identificada." };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("emitir_certificado", {
    p_passaro_id: aveId,
  });

  if (error) {
    // A mensagem da função já fala a língua do domínio ("Esta ave não tem
    // anilha. O certificado afirma a anilha oficial…").
    if (error.code === "P0001") return { erro: error.message };
    // Vencido não é "tente de novo": tentar de novo nunca vai funcionar.
    if (barradoPelaAssinatura(error)) return { erro: ERRO_ASSINATURA };
    console.error("emitirCertificado:", error.message);
    return { erro: "Não foi possível emitir o certificado. Tente de novo." };
  }

  revalidatePath("/", "layout");
  // Direto para a folha: quem emite um CRO emite para imprimir.
  redirect(`/cro/${data}`);
}

/** Marca o CRO como revogado. Nunca apaga — o QR precisa poder dizer por quê. */
export async function revogarCertificado(
  _anterior: EstadoCertificado,
  dados: FormData,
): Promise<EstadoCertificado> {
  const certificadoId = String(dados.get("certificado_id") ?? "");
  const aveId = String(dados.get("passaro_id") ?? "");
  const motivo = String(dados.get("motivo") ?? "").trim();

  if (!certificadoId || !aveId) return { erro: "Certificado não identificado." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("revogar_certificado", {
    p_certificado_id: certificadoId,
    p_motivo: motivo === "" ? null : motivo.slice(0, 200),
  });

  if (error) {
    if (error.code === "P0001") return { erro: error.message };
    // Vencido não é "tente de novo": tentar de novo nunca vai funcionar.
    if (barradoPelaAssinatura(error)) return { erro: ERRO_ASSINATURA };
    console.error("revogarCertificado:", error.message);
    return { erro: "Não foi possível revogar. Tente de novo." };
  }

  revalidatePath("/", "layout");
  redirect(`/plantel/${aveId}/certificado?revogado=1`);
}
