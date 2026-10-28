"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { gerarSlug } from "@/lib/criatorio";

export interface EstadoOnboarding {
  erro?: string;
}

export async function criarCriatorio(
  _anterior: EstadoOnboarding,
  dados: FormData,
): Promise<EstadoOnboarding> {
  const nome = String(dados.get("nome") ?? "").trim();
  const clubeId = String(dados.get("clube_id") ?? "") || null;
  const nroCriador = String(dados.get("nro_criador") ?? "").trim() || null;
  const registroIbama = String(dados.get("registro_ibama") ?? "").trim() || null;
  const cidade = String(dados.get("cidade") ?? "").trim() || null;
  const uf = String(dados.get("uf") ?? "").trim().toUpperCase() || null;

  if (!nome) return { erro: "Informe o nome do criatório." };

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const base = gerarSlug(nome) || "criatorio";

  // O slug é a URL pública dos certificados e precisa ser único e estável.
  // Tenta o natural e, se já existir, acrescenta sufixo — em vez de falhar na
  // cara de quem está se cadastrando.
  let slug = base;
  for (let tentativa = 2; tentativa <= 60; tentativa++) {
    const { data: existe } = await supabase
      .from("criatorios")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existe) break;
    slug = `${base}-${tentativa}`.slice(0, 50);
  }

  const { error } = await supabase.from("criatorios").insert({
    owner_id: user.id,
    nome,
    slug,
    clube_id: clubeId,
    nro_criador: nroCriador,
    registro_ibama: registroIbama,
    cidade,
    uf,
  });

  if (error) {
    return error.code === "23505"
      ? { erro: "Já existe um criatório com esse endereço. Ajuste o nome." }
      : { erro: "Não foi possível criar o criatório. Tente de novo." };
  }

  revalidatePath("/", "layout");
  redirect("/comecar/especies");
}
