#!/usr/bin/env node
/**
 * Cria, atualiza a senha ou remove a conta de teste, para exercitar login e
 * onboarding sem depender de e-mail.
 *
 *   node scripts/usuario-teste.mjs criar    # cria, ou troca a senha se já existe
 *   node scripts/usuario-teste.mjs limpar   # remove
 *
 * **A senha vem de `SENHA_USUARIO_TESTE`, no `.env.local`, e não do código.**
 * Ela esteve escrita aqui até 17/10/2026, num repositório público: qualquer
 * pessoa que achasse o repositório entrava na conta — que existe no projeto
 * Supabase de verdade, não num banco local. O histórico do git guarda a senha
 * antiga para sempre, então tirá-la daqui só resolve junto com a troca da
 * senha da conta, que é o que `criar` passou a fazer.
 *
 * Nada neste arquivo imprime a senha. Terminal vira captura de tela, e
 * captura de tela vira anexo.
 *
 * Usa fetch direto na API administrativa em vez de @supabase/supabase-js:
 * a biblioteca exige Node 22 (WebSocket nativo) e a máquina está no Node 20.
 * Service role — só local, nunca no cliente.
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);

const BASE = `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin`;
const CHAVE = env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = env.EMAIL_USUARIO_TESTE || "teste@sisaves.local";
const SENHA = env.SENHA_USUARIO_TESTE;

// Sem valor padrão de propósito: um fallback no código devolveria o problema
// que este arquivo acabou de resolver.
if (!SENHA) {
  console.error(
    "Defina SENHA_USUARIO_TESTE no .env.local (o arquivo está fora do git).",
  );
  process.exit(1);
}

const cabecalhos = {
  apikey: CHAVE,
  Authorization: `Bearer ${CHAVE}`,
  "Content-Type": "application/json",
};

async function listar() {
  const r = await fetch(`${BASE}/users?per_page=200`, { headers: cabecalhos });
  const j = await r.json();
  return j.users ?? [];
}

async function remover(id) {
  const r = await fetch(`${BASE}/users/${id}`, {
    method: "DELETE",
    headers: cabecalhos,
  });
  if (!r.ok) {
    const corpo = await r.json().catch(() => ({}));
    throw new Error(corpo.msg ?? corpo.message ?? `HTTP ${r.status}`);
  }
}

const comando = process.argv[2] ?? "criar";
const usuarios = await listar();
const existente = usuarios.find((u) => u.email === EMAIL);

if (comando === "limpar") {
  if (!existente) {
    console.log("nada a remover");
  } else {
    try {
      await remover(existente.id);
      console.log("conta de teste removida");
    } catch (erro) {
      // `criatorios.owner_id` é ON DELETE RESTRICT: a conta que tem criatório
      // não se apaga, e a resposta da API precisa ser lida — ignorá-la fazia o
      // script seguir em frente e falhar depois, com a mensagem errada.
      console.error("não foi possível remover:", erro.message);
      console.error(
        "A conta é dona de um criatório. Apague o criatório antes, ou guarde-a.",
      );
      process.exit(1);
    }
  }
} else if (existente) {
  /*
   * Conta que já existe tem a SENHA trocada, não é recriada.
   *
   * Recriar significaria apagar o usuário — recusado pelo banco enquanto
   * houver criatório — e, se passasse, levaria junto o criatório de
   * desenvolvimento inteiro, com as aves, os casais e as ninhadas da semente.
   */
  const r = await fetch(`${BASE}/users/${existente.id}`, {
    method: "PUT",
    headers: cabecalhos,
    body: JSON.stringify({ password: SENHA, email_confirm: true }),
  });
  const u = await r.json();
  if (!r.ok) {
    console.error("ERRO:", u.msg ?? u.message ?? JSON.stringify(u));
    process.exit(1);
  }
  console.log("senha da conta de teste atualizada:", EMAIL);
  console.log("o valor é o de SENHA_USUARIO_TESTE, no .env.local");
} else {
  const r = await fetch(`${BASE}/users`, {
    method: "POST",
    headers: cabecalhos,
    body: JSON.stringify({
      email: EMAIL,
      password: SENHA,
      email_confirm: true,
      user_metadata: { nome: "Criador de Teste" },
    }),
  });
  const u = await r.json();
  if (!r.ok) {
    console.error("ERRO:", u.msg ?? u.message ?? JSON.stringify(u));
    process.exit(1);
  }
  console.log("conta criada:", EMAIL);
  console.log("a senha é a de SENHA_USUARIO_TESTE, no .env.local");
  console.log("id:", u.id);
}
