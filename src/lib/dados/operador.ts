import { criarClienteServidor } from "@/lib/supabase/servidor";

/**
 * Os dados do painel de quem opera o SisAves.
 *
 * Tudo aqui atravessa a fronteira do multi-tenant, e a trava NÃO está neste
 * arquivo: está no `where public.sou_admin()` das views. Se alguém chamar
 * estas funções sem ser operador, recebe listas vazias — não erro, não exceção,
 * não dado de outro. A aplicação não é a guarda; o banco é.
 */

export interface ResumoOperador {
  contas: number;
  contasSemCriatorio: number;
  criatorios: number;
  emTeste: number;
  ativos: number;
  vencidos: number;
  receita: number;
  /** Criatórios cujo teste ou assinatura vence nos próximos 7 dias. */
  vencendo: number;
}

export interface CriatorioNoPainel {
  id: string;
  nome: string;
  cidade: string | null;
  uf: string | null;
  clube: string | null;
  donoEmail: string;
  donoNome: string | null;
  criadoEm: string;
  status: string | null;
  fim: string | null;
  diasRestantes: number | null;
  comAcesso: boolean;
  aves: number;
  casais: number;
  ninhadas: number;
  certificados: number;
  ultimaAtividade: string | null;
}

export interface ContaNoPainel {
  id: string;
  email: string;
  nome: string | null;
  criadaEm: string;
  emailConfirmado: boolean;
  ultimoAcesso: string | null;
  temCriatorio: boolean;
  eMembro: boolean;
}

export interface PagamentoNoPainel {
  id: string;
  pagoEm: string;
  status: string;
  valor: number | null;
  meio: string | null;
  criatorio: string;
  donoEmail: string;
}

/** Se a sessão pode ver este painel. A resposta vem do banco, não daqui. */
export async function souOperador(): Promise<boolean> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("sou_admin");
  if (error) {
    console.error("sou_admin:", error.message);
    return false;
  }
  return data === true;
}

export async function listarCriatorios(): Promise<CriatorioNoPainel[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("vw_admin_criatorios")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("vw_admin_criatorios:", error.message);
    return [];
  }

  return (data ?? []).map((c) => ({
    id: c.id,
    nome: c.nome,
    cidade: c.cidade,
    uf: c.uf,
    clube: c.clube,
    donoEmail: c.dono_email,
    donoNome: c.dono_nome,
    criadoEm: c.criado_em,
    status: c.assinatura_status,
    fim: c.assinatura_fim,
    diasRestantes: c.dias_restantes,
    comAcesso: c.com_acesso,
    aves: Number(c.aves),
    casais: Number(c.casais),
    ninhadas: Number(c.ninhadas),
    certificados: Number(c.certificados),
    ultimaAtividade: c.ultima_atividade,
  }));
}

export async function listarContas(): Promise<ContaNoPainel[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("vw_admin_contas")
    .select("*")
    .order("conta_criada_em", { ascending: false });

  if (error) {
    console.error("vw_admin_contas:", error.message);
    return [];
  }

  return (data ?? []).map((u) => ({
    id: u.id,
    email: u.email,
    nome: u.nome,
    criadaEm: u.conta_criada_em,
    emailConfirmado: u.email_confirmado,
    ultimoAcesso: u.last_sign_in_at,
    temCriatorio: u.tem_criatorio,
    eMembro: u.e_membro,
  }));
}

export async function listarPagamentos(): Promise<PagamentoNoPainel[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("vw_admin_pagamentos")
    .select("*")
    .order("pago_em", { ascending: false })
    .limit(50);

  if (error) {
    console.error("vw_admin_pagamentos:", error.message);
    return [];
  }

  return (data ?? []).map((p) => ({
    id: p.id,
    pagoEm: p.pago_em,
    status: p.status,
    valor: p.valor === null ? null : Number(p.valor),
    meio: p.meio,
    criatorio: p.criatorio,
    donoEmail: p.dono_email,
  }));
}

/**
 * O resumo é contado em cima das listas, não por consultas separadas.
 *
 * São dezenas de linhas, não milhares — e com consultas separadas os números
 * do topo poderiam discordar da tabela logo abaixo, que é o jeito mais rápido
 * de alguém deixar de confiar num painel.
 */
export function resumir(
  criatorios: CriatorioNoPainel[],
  contas: ContaNoPainel[],
  pagamentos: PagamentoNoPainel[],
): ResumoOperador {
  return {
    contas: contas.length,
    contasSemCriatorio: contas.filter((c) => !c.temCriatorio && !c.eMembro).length,
    criatorios: criatorios.length,
    emTeste: criatorios.filter((c) => c.status === "teste" && c.comAcesso).length,
    ativos: criatorios.filter((c) => c.status === "ativa" && c.comAcesso).length,
    vencidos: criatorios.filter((c) => !c.comAcesso).length,
    vencendo: criatorios.filter(
      (c) => c.comAcesso && c.diasRestantes !== null && c.diasRestantes <= 7,
    ).length,
    receita: pagamentos
      .filter((p) => p.status === "approved")
      .reduce((soma, p) => soma + (p.valor ?? 0), 0),
  };
}
