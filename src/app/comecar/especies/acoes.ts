"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterCriatorioAtual } from "@/lib/criatorio";

export interface EstadoEspecies {
  erro?: string;
}

export async function adotarEspecies(
  _anterior: EstadoEspecies,
  dados: FormData,
): Promise<EstadoEspecies> {
  const criatorio = await obterCriatorioAtual();
  if (!criatorio) redirect("/comecar");

  const ids = dados.getAll("especie").map(String).filter(Boolean);
  if (ids.length === 0) {
    return { erro: "Selecione ao menos uma espécie para continuar." };
  }

  const supabase = await criarClienteServidor();

  const { data: catalogo, error: erroCatalogo } = await supabase
    .from("especies_catalogo")
    .select("id, nome_comum, grupo_id, dias_choco, dias_anilha, dias_separa, janela_anilha_dias, anilha_mm")
    .in("id", ids);

  if (erroCatalogo || !catalogo?.length) {
    return { erro: "Não foi possível ler o catálogo. Tente de novo." };
  }

  const semIncubacao: string[] = [];
  const linhas = [];

  for (const c of catalogo) {
    // Quando o catálogo não traz a incubação, o criador informou no formulário.
    const informado = dados.get(`choco_${c.id}`);
    const diasChoco = c.dias_choco ?? (informado ? Number(informado) : null);

    if (!diasChoco || Number.isNaN(diasChoco)) {
      semIncubacao.push(c.nome_comum);
      continue;
    }

    linhas.push({
      criatorio_id: criatorio.id,
      catalogo_id: c.id,
      grupo_id: c.grupo_id,
      nome: c.nome_comum,
      dias_choco: diasChoco,
      // A ovoscopia não vem do catálogo: 6 dias é o padrão da coluna e o
      // criador ajusta em Configurações quando quiser.
      dias_anilha: c.dias_anilha ?? 3,
      dias_separa: c.dias_separa ?? 40,
      janela_anilha_dias: c.janela_anilha_dias ?? 1,
      anilha_mm: c.anilha_mm,
    });
  }

  if (semIncubacao.length > 0) {
    const lista = semIncubacao.slice(0, 3).join(", ");
    const resto = semIncubacao.length > 3 ? ` e mais ${semIncubacao.length - 3}` : "";
    return { erro: `Informe os dias de choco de ${lista}${resto}.` };
  }

  const { error } = await supabase
    .from("especies")
    .upsert(linhas, { onConflict: "criatorio_id,nome", ignoreDuplicates: true });

  if (error) {
    return { erro: "Não foi possível salvar as espécies. Tente de novo." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
