import { criarClienteServidor } from "@/lib/supabase/servidor";
import { obterCriatorioAtual } from "@/lib/criatorio";

export interface DadosCriatorio {
  id: string;
  nome: string;
  slug: string;
  clubeId: string | null;
  nroCriador: string | null;
  registroIbama: string | null;
  cidade: string | null;
  uf: string | null;
  instagram: string | null;
  whatsapp: string | null;
  logoUrl: string | null;
  /** Se WhatsApp e Instagram saem nas peças impressas. */
  contatoNoDocumento: boolean;
  /** Certificados já emitidos: é o que trava o slug. */
  certificados: number;
}

export interface OpcaoClube {
  id: string;
  sigla: string;
  nome: string;
}

export async function obterConfiguracoes(): Promise<{
  criatorio: DadosCriatorio;
  clubes: OpcaoClube[];
} | null> {
  const supabase = await criarClienteServidor();
  const atual = await obterCriatorioAtual();
  if (!atual) return null;

  const [{ data }, { data: clubes }, { count }] = await Promise.all([
    supabase
      .from("criatorios")
      .select(
        "id, nome, slug, clube_id, nro_criador, registro_ibama, cidade, uf, instagram, whatsapp, logo_url, contato_no_documento",
      )
      .eq("id", atual.id)
      .maybeSingle(),
    supabase.from("clubes").select("id, sigla, nome").order("sigla"),
    supabase
      .from("certificados")
      .select("id", { count: "exact", head: true })
      .is("revogado_em", null),
  ]);

  if (!data) return null;

  return {
    criatorio: {
      id: data.id,
      nome: data.nome,
      slug: data.slug,
      clubeId: data.clube_id,
      nroCriador: data.nro_criador,
      registroIbama: data.registro_ibama,
      cidade: data.cidade,
      uf: data.uf,
      instagram: data.instagram,
      whatsapp: data.whatsapp,
      logoUrl: data.logo_url,
      contatoNoDocumento: data.contato_no_documento,
      certificados: count ?? 0,
    },
    clubes: (clubes ?? []) as OpcaoClube[],
  };
}

export interface DadosPerfil {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
}

export async function obterPerfil(): Promise<DadosPerfil | null> {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("perfis")
    .select("id, nome, telefone")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    nome: data?.nome ?? "",
    telefone: data?.telefone ?? null,
    // O e-mail vive em `auth.users`, não em `perfis`: vem da sessão, e é só
    // leitura — trocá-lo é mudar a credencial, não o perfil.
    email: user.email ?? null,
  };
}

export interface Membro {
  usuarioId: string;
  nome: string;
  papel: string;
  desde: string;
  eDono: boolean;
  /** O próprio usuário da sessão, que não pode se remover. */
  souEu: boolean;
}

export interface Convite {
  id: string;
  email: string;
  papel: string;
  criadoEm: string;
}

export const PAPEIS: Record<string, { rotulo: string; resumo: string }> = {
  proprietario: { rotulo: "Proprietário", resumo: "Dono do criatório. Faz tudo." },
  operador: { rotulo: "Operador", resumo: "Registra e corrige. Não administra membros." },
  leitor: { rotulo: "Leitor", resumo: "Só consulta. Não escreve nada." },
};

export async function listarMembros(): Promise<{
  membros: Membro[];
  convites: Convite[];
} | null> {
  const supabase = await criarClienteServidor();
  const atual = await obterCriatorioAtual();
  if (!atual) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: membros }, { data: convites }] = await Promise.all([
    supabase
      .from("vw_membros")
      .select("usuario_id, nome, papel, desde, e_dono")
      .eq("criatorio_id", atual.id)
      .order("desde"),
    supabase
      .from("criatorio_convites")
      .select("id, email, papel, criado_em")
      .eq("criatorio_id", atual.id)
      .is("aceito_em", null)
      .is("recusado_em", null)
      .order("criado_em"),
  ]);

  return {
    membros: ((membros ?? []) as Array<{
      usuario_id: string;
      nome: string;
      papel: string;
      desde: string;
      e_dono: boolean;
    }>).map((m) => ({
      usuarioId: m.usuario_id,
      nome: m.nome,
      papel: m.papel,
      desde: m.desde,
      eDono: m.e_dono,
      souEu: m.usuario_id === user?.id,
    })),
    convites: ((convites ?? []) as Array<{
      id: string;
      email: string;
      papel: string;
      criado_em: string;
    }>).map((c) => ({
      id: c.id,
      email: c.email,
      papel: c.papel,
      criadoEm: c.criado_em,
    })),
  };
}
