import { cache } from "react";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export interface CriatorioAtual {
  id: string;
  nome: string;
  slug: string;
  nro_criador: string | null;
  registro_ibama: string | null;
  cidade: string | null;
  uf: string | null;
  logo_url: string | null;
  clube: { sigla: string; nome: string } | null;
}

/**
 * O criatório da sessão.
 *
 * `cache` dedup a consulta dentro do mesmo render: layout, página e componentes
 * podem chamar à vontade sem multiplicar idas ao banco.
 *
 * Hoje devolve o primeiro criatório do usuário. Quando existir troca de
 * criatório na interface, a escolha passa a vir de um cookie — o modelo já
 * suporta vários (o tenant é o criatório, não o usuário).
 */
export const obterCriatorioAtual = cache(async (): Promise<CriatorioAtual | null> => {
  const supabase = await criarClienteServidor();

  const { data } = await supabase
    .from("criatorios")
    .select(
      "id, nome, slug, nro_criador, registro_ibama, cidade, uf, logo_url, clube:clubes(sigla, nome)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  // O select com relação devolve objeto; o tipo gerado do PostgREST infere array.
  const clube = Array.isArray(data.clube) ? (data.clube[0] ?? null) : data.clube;

  return { ...data, clube } as CriatorioAtual;
});

/** Transforma "Criatório São José" em "criatorio-sao-jose". */
export function gerarSlug(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
