import { criarClienteServidor } from "@/lib/supabase/servidor";

/** O que o snapshot guarda. É ele, e só ele, que o CRO imprime. */
export interface SnapshotCertificado {
  emitido_em: string;
  ave: {
    nome: string | null;
    anilha: {
      sigla: string | null;
      criador: string | null;
      ano: number | null;
      numero: number | null;
    };
    codigo_alternativo: string | null;
    sexo: string;
    dt_nascimento: string | null;
    especie: string | null;
    mutacao: string | null;
    foto_url: string | null;
  };
  criatorio: {
    nome: string;
    slug: string;
    registro_ibama: string | null;
    clube: string | null;
    nro_criador: string | null;
    cidade: string | null;
    uf: string | null;
    logo_url: string | null;
  };
  endogamia_pct: number | null;
  genealogia: Array<{
    geracao: number;
    papel: string;
    caminho: string;
    nome: string | null;
    sexo: string;
    especie: string | null;
    mutacao: string | null;
    anilha: {
      sigla: string | null;
      criador: string | null;
      ano: number | null;
      numero: number | null;
    };
  }>;
}

export interface Certificado {
  id: string;
  sequencial: number;
  hash: string;
  emitidoEm: string;
  revogadoEm: string | null;
  revogadoMotivo: string | null;
  snapshot: SnapshotCertificado;
  /** `/v/<hash>-<sequencial>` — o que o QR carrega. */
  caminhoPublico: string;
}

function paraCertificado(linha: {
  id: string;
  sequencial: number;
  hash: string;
  emitido_em: string;
  revogado_em: string | null;
  revogado_motivo: string | null;
  snapshot: unknown;
}): Certificado {
  return {
    id: linha.id,
    sequencial: linha.sequencial,
    hash: linha.hash,
    emitidoEm: linha.emitido_em,
    revogadoEm: linha.revogado_em,
    revogadoMotivo: linha.revogado_motivo,
    snapshot: linha.snapshot as SnapshotCertificado,
    caminhoPublico: `/v/${linha.hash}-${linha.sequencial}`,
  };
}

const COLUNAS = "id, sequencial, hash, emitido_em, revogado_em, revogado_motivo, snapshot";

/** Os CRO já emitidos para uma ave, do mais recente para o mais antigo. */
export async function certificadosDaAve(aveId: string): Promise<Certificado[]> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase
    .from("certificados")
    .select(COLUNAS)
    .eq("passaro_id", aveId)
    .order("emitido_em", { ascending: false });

  if (error) {
    console.error("certificadosDaAve:", error.message);
    return [];
  }

  return (data ?? []).map((l) => paraCertificado(l as never));
}

export async function obterCertificado(id: string): Promise<Certificado | null> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase
    .from("certificados")
    .select(COLUNAS)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("obterCertificado:", error.message);
    return null;
  }

  return paraCertificado(data as never);
}

/** Todos os CRO do criatório — a tela de certificados da sidebar. */
export async function listarCertificados(): Promise<Certificado[]> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase
    .from("certificados")
    .select(COLUNAS)
    .order("sequencial", { ascending: false });

  if (error) {
    console.error("listarCertificados:", error.message);
    return [];
  }

  return (data ?? []).map((l) => paraCertificado(l as never));
}

export interface ValidacaoCertificado {
  autentico: boolean;
  revogadoEm: string | null;
  revogadoMotivo: string | null;
  numero: number;
  emitidoEm: string;
  consultadoEm: string;
  dados: SnapshotCertificado;
}

/**
 * A consulta pública, anônima.
 *
 * Passa por `validar_certificado`, que é `security definer` e devolve APENAS o
 * snapshot — nenhum id interno, nenhum contato do criador. A página prova a
 * ave; não expõe o vendedor.
 */
export async function validarCertificado(
  hash: string,
  sequencial: number,
): Promise<ValidacaoCertificado | null> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase.rpc("validar_certificado", {
    p_hash: hash,
    p_sequencial: sequencial,
  });

  if (error || !data) {
    if (error) console.error("validarCertificado:", error.message);
    return null;
  }

  const bruto = data as {
    autentico: boolean;
    revogado_em: string | null;
    revogado_motivo: string | null;
    numero: number;
    emitido_em: string;
    consultado_em: string;
    dados: SnapshotCertificado;
  };

  return {
    autentico: bruto.autentico,
    revogadoEm: bruto.revogado_em,
    revogadoMotivo: bruto.revogado_motivo,
    numero: bruto.numero,
    emitidoEm: bruto.emitido_em,
    consultadoEm: bruto.consultado_em,
    dados: bruto.dados,
  };
}

/** "/v/abc123-7" quebrado nas duas partes que a função do banco recebe. */
export function lerCodigo(codigo: string): { hash: string; sequencial: number } | null {
  const corte = codigo.lastIndexOf("-");
  if (corte <= 0) return null;

  const hash = codigo.slice(0, corte);
  const sequencial = Number(codigo.slice(corte + 1));

  if (!hash || !Number.isInteger(sequencial) || sequencial <= 0) return null;
  return { hash, sequencial };
}

/**
 * Os ancestrais nas posições em que o documento os imprime.
 *
 * O `caminho` ('p', 'm', 'pp', 'pm'…) é o que distingue o avô paterno do
 * materno — `papel` sozinho diria 'pai' para os dois. Foi o motivo da
 * migration 0015.
 */
export const CAMINHOS_PAIS = ["p", "m"] as const;
export const CAMINHOS_AVOS = ["pp", "pm", "mp", "mm"] as const;
export const CAMINHOS_BISAVOS = [
  "ppp", "ppm", "pmp", "pmm", "mpp", "mpm", "mmp", "mmm",
] as const;

export function porCaminho(
  genealogia: SnapshotCertificado["genealogia"],
): Map<string, SnapshotCertificado["genealogia"][number]> {
  return new Map(genealogia.map((a) => [a.caminho, a]));
}

/**
 * O rótulo de cada posição da árvore.
 *
 * Na terceira geração são OITO posições, e o lado sozinho não basta: 'ppp' e
 * 'pmp' são ambos "paternos" e viram o mesmo rótulo, repetido quatro vezes na
 * coluna. O bisavô é nomeado pelo avô de quem ele é — "Pai do avô paterno" —,
 * que é preciso e se lê sem esforço.
 */
export function rotuloDoCaminho(caminho: string): string {
  const femea = caminho.endsWith("m");

  if (caminho.length === 1) return femea ? "Mãe" : "Pai";

  if (caminho.length === 2) {
    const lado = caminho[0] === "p" ? "paterno" : "materno";
    return femea ? `Avó ${lado}a`.replace("oa", "a") : `Avô ${lado}`;
  }

  // Terceira geração: o pai ou a mãe do ancestral de segunda geração.
  const avo = rotuloDoCaminho(caminho.slice(0, 2));
  const artigo = avo.startsWith("Avó") ? "da" : "do";
  return `${femea ? "Mãe" : "Pai"} ${artigo} ${avo.toLowerCase()}`;
}
