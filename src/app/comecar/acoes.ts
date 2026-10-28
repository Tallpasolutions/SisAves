"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { celularValido, cpfValido, soDigitos } from "@/lib/cpf";

export interface EstadoDadosPessoais {
  erro?: string;
  campos?: Record<string, string>;
}

/**
 * O primeiro passo: quem é o criador.
 *
 * O CPF é conferido aqui, com dígitos verificadores, e não só na restrição do
 * banco: a tabela recusa o que não tiver onze dígitos, mas não sabe dizer que
 * o número está errado — e "violação de restrição" não é mensagem para
 * ninguém.
 */
export async function salvarDadosPessoais(
  _anterior: EstadoDadosPessoais,
  dados: FormData,
): Promise<EstadoDadosPessoais> {
  const nome = String(dados.get("nome") ?? "").trim();
  const cpfBruto = String(dados.get("cpf") ?? "");
  const telefoneBruto = String(dados.get("telefone") ?? "");

  const campos: Record<string, string> = {};

  if (nome.length < 3) {
    campos.nome = "Informe o seu nome completo.";
  } else if (!nome.includes(" ")) {
    campos.nome = "Informe nome e sobrenome.";
  }

  const cpf = soDigitos(cpfBruto);
  if (!cpf) {
    campos.cpf = "Informe o seu CPF.";
  } else if (!cpfValido(cpf)) {
    // Cita o que foi digitado: quem erra um dígito costuma não enxergar qual.
    campos.cpf = `O CPF ${cpfBruto.trim()} não confere. Verifique os números.`;
  }

  const telefone = soDigitos(telefoneBruto);
  if (!telefone) {
    campos.telefone = "Informe o seu celular com DDD.";
  } else if (!celularValido(telefone)) {
    campos.telefone = "Informe o celular com DDD, como (48) 99179-3316.";
  }

  if (Object.keys(campos).length > 0) return { campos };

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { error } = await supabase
    .from("perfis")
    .update({ nome, cpf, telefone, dados_em: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    /*
     * 23505 é o índice único do CPF.
     *
     * Dizer "este CPF já está em outra conta" confirma a um estranho que
     * aquele CPF é cliente do SisAves. Mas aqui a pessoa está logada e
     * digitando o próprio documento, e a alternativa — um erro genérico —
     * deixaria quem perdeu o acesso à conta antiga sem entender nada. O texto
     * não revela QUAL conta, e manda falar com o suporte.
     */
    if (error.code === "23505") {
      return {
        campos: {
          cpf:
            "Já existe uma conta no SisAves com este CPF. Entre por ela, ou " +
            "escreva para suporte@tallpa.com.br se não tiver mais acesso.",
        },
      };
    }
    console.error("salvarDadosPessoais:", error.message);
    return { erro: "Não foi possível salvar. Tente de novo em instantes." };
  }

  revalidatePath("/", "layout");
  redirect("/comecar/criatorio");
}
