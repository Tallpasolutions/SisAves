import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterCriatorioAtual } from "@/lib/criatorio";

export interface Vigencia {
  status: "teste" | "ativa" | "pendente" | "vencida" | "cancelada";
  plano: string;
  inicio: string;
  fim: string | null;
  valor: number | null;
  vigente: boolean;
  diasRestantes: number | null;
  comAcesso: boolean;
  ultimoPagamentoEm: string | null;
}

export interface Pagamento {
  id: string;
  status: string;
  valor: number | null;
  meio: string | null;
  em: string;
}

/**
 * A vigência da assinatura do criatório atual.
 *
 * `null` quando ainda não existe linha — criatório que nunca passou pelo
 * checkout. A tela trata isso como estado próprio, não como erro: é a situação
 * de todo criador antes do primeiro pagamento.
 */
export async function obterVigencia(): Promise<Vigencia | null> {
  const supabase = await criarClienteServidor();
  const atual = await obterCriatorioAtual();
  if (!atual) return null;

  const { data } = await supabase
    .from("vw_assinatura")
    .select(
      "status, plano, inicio, fim, valor, vigente, dias_restantes, com_acesso, ultimo_pagamento_em",
    )
    .eq("criatorio_id", atual.id)
    .maybeSingle();

  if (!data) return null;

  return {
    status: data.status,
    plano: data.plano,
    inicio: data.inicio,
    fim: data.fim,
    valor: data.valor === null ? null : Number(data.valor),
    vigente: data.vigente,
    diasRestantes: data.dias_restantes,
    comAcesso: data.com_acesso,
    ultimoPagamentoEm: data.ultimo_pagamento_em,
  };
}

/** Os pagamentos já registrados, para o criador conferir o que pagou. */
export async function listarPagamentos(): Promise<Pagamento[]> {
  const supabase = await criarClienteServidor();
  const atual = await obterCriatorioAtual();
  if (!atual) return [];

  const { data } = await supabase
    .from("assinatura_pagamentos")
    .select("id, status, valor, meio, created_at, assinaturas!inner(criatorio_id)")
    .eq("assinaturas.criatorio_id", atual.id)
    .order("created_at", { ascending: false })
    .limit(12);

  return (data ?? []).map((p) => ({
    id: p.id,
    status: p.status,
    valor: p.valor === null ? null : Number(p.valor),
    meio: p.meio,
    em: p.created_at,
  }));
}
