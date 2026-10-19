"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { CADASTRO_ABERTO, LOGIN_GOOGLE_ABERTO } from "@/lib/portas";

export interface EstadoFormulario {
  erro?: string;
  aviso?: string;
}

/**
 * Mensagens de erro do Supabase vêm em inglês e genéricas. Traduzir aqui
 * mantém a voz do produto: direta, sem culpa e dizendo o que fazer.
 */
function traduzirErro(mensagem: string): string {
  const m = mensagem.toLowerCase();
  if (m.includes("invalid login credentials")) {
    return "E-mail ou senha não conferem. Verifique e tente de novo.";
  }
  if (m.includes("email not confirmed")) {
    return "Confirme o e-mail pelo link que enviamos antes de entrar.";
  }
  if (m.includes("user already registered")) {
    return "Já existe conta com este e-mail. Entre em vez de cadastrar.";
  }
  if (m.includes("password should be at least")) {
    return "A senha precisa de pelo menos 8 caracteres.";
  }
  if (m.includes("rate limit") || m.includes("too many")) {
    return "Tentativas demais em pouco tempo. Aguarde alguns minutos.";
  }
  return "Não foi possível concluir. Tente de novo em instantes.";
}

export async function entrar(
  _anterior: EstadoFormulario,
  dados: FormData,
): Promise<EstadoFormulario> {
  const email = String(dados.get("email") ?? "").trim();
  const senha = String(dados.get("senha") ?? "");
  const destino = String(dados.get("destino") ?? "") || "/";

  if (!email || !senha) {
    return { erro: "Preencha o e-mail e a senha." };
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) return { erro: traduzirErro(error.message) };

  await aceitarConvitesPendentes(supabase);

  revalidatePath("/", "layout");
  redirect(destino);
}

/**
 * Transforma em acesso os convites endereçados a este e-mail.
 *
 * Roda no login e não a cada navegação: o convite é raro, e uma chamada por
 * tela renderizada seria um custo permanente para um evento que acontece uma
 * vez. Falha em silêncio de propósito — quem acabou de acertar a senha não
 * pode ser barrado porque um convite não pôde ser lido.
 */
async function aceitarConvitesPendentes(
  supabase: Awaited<ReturnType<typeof criarClienteServidor>>,
): Promise<void> {
  const { error } = await supabase.rpc("aceitar_convites");
  if (error) console.error("aceitar_convites:", error.message);
}

export async function cadastrar(
  _anterior: EstadoFormulario,
  dados: FormData,
): Promise<EstadoFormulario> {
  // Mesma razão do Google: a tela do /cadastrar nem monta o formulário, e a
  // ação recusa de todo jeito.
  if (!CADASTRO_ABERTO) {
    return {
      erro:
        "O cadastro de novas contas está fechado no momento. " +
        "Fale com quem administra o criatório para receber um convite.",
    };
  }

  const nome = String(dados.get("nome") ?? "").trim();
  const email = String(dados.get("email") ?? "").trim();
  const senha = String(dados.get("senha") ?? "");

  if (!nome) return { erro: "Informe o seu nome." };
  if (!email) return { erro: "Informe o e-mail." };
  if (senha.length < 8) return { erro: "A senha precisa de pelo menos 8 caracteres." };

  const supabase = await criarClienteServidor();
  const origem = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      // O trigger tg_novo_usuario lê 'nome' daqui para criar o perfil.
      data: { nome },
      emailRedirectTo: `${origem}/auth/callback`,
    },
  });

  if (error) return { erro: traduzirErro(error.message) };

  // Sem sessão na resposta = o projeto exige confirmação de e-mail.
  if (!data.session) {
    return {
      aviso: `Enviamos um link de confirmação para ${email}. Abra o e-mail para ativar a conta.`,
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function entrarComGoogle() {
  // A tela não mostra o botão quando a porta está fechada, mas Server Action é
  // endpoint: esconder o botão não impede um POST. A recusa mora aqui.
  if (!LOGIN_GOOGLE_ABERTO) redirect("/entrar?erro=google-desligado");

  const supabase = await criarClienteServidor();
  const origem = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origem}/auth/callback` },
  });

  if (error || !data.url) redirect("/entrar?erro=google");
  redirect(data.url);
}

export async function sair() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/entrar");
}

export async function pedirRecuperacao(
  _anterior: EstadoFormulario,
  dados: FormData,
): Promise<EstadoFormulario> {
  const email = String(dados.get("email") ?? "").trim();
  if (!email) return { erro: "Informe o e-mail da conta." };

  const supabase = await criarClienteServidor();
  const origem = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origem}/auth/callback?destino=/nova-senha`,
  });

  // Resposta igual existindo ou não a conta: dizer "esse e-mail não existe"
  // entregaria a quem tem conta aqui. O aviso é sempre o mesmo.
  return {
    aviso: `Se houver conta com ${email}, enviamos um link para redefinir a senha.`,
  };
}

export async function definirNovaSenha(
  _anterior: EstadoFormulario,
  dados: FormData,
): Promise<EstadoFormulario> {
  const senha = String(dados.get("senha") ?? "");
  const confirmacao = String(dados.get("confirmacao") ?? "");

  if (senha.length < 8) return { erro: "A senha precisa de pelo menos 8 caracteres." };
  if (senha !== confirmacao) return { erro: "As duas senhas não conferem." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) return { erro: traduzirErro(error.message) };

  revalidatePath("/", "layout");
  redirect("/");
}
