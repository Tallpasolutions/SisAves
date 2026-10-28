import { criarClienteServidor } from "@/lib/supabase/servidor";

export interface DadosPessoais {
  nome: string | null;
  cpf: string | null;
  telefone: string | null;
  preenchidoEm: string | null;
}

export async function obterDadosPessoais(): Promise<DadosPessoais | null> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("perfis")
    .select("nome, cpf, telefone, dados_em")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("obterDadosPessoais:", error.message);
    return null;
  }
  if (!data) return null;

  return {
    nome: data.nome,
    cpf: data.cpf,
    telefone: data.telefone,
    preenchidoEm: data.dados_em,
  };
}

/**
 * Se o criador já passou pelo primeiro passo.
 *
 * A pergunta é pelos TRÊS campos, não por `dados_em`. Um perfil antigo, de
 * antes desta etapa existir, tem nome vindo do cadastro e nada mais: se a
 * checagem olhasse só a data, ele seria mandado ao passo 1 e ficaria lá, já
 * que o acesso dele não passa por este fluxo.
 */
export async function dadosPessoaisPreenchidos(): Promise<boolean> {
  const dados = await obterDadosPessoais();
  return Boolean(dados?.nome && dados?.cpf && dados?.telefone);
}
