#!/usr/bin/env node
/**
 * Cria (ou remove) uma conta de teste já confirmada, para exercitar login e
 * onboarding sem depender de e-mail.
 *
 *   node scripts/usuario-teste.mjs criar
 *   node scripts/usuario-teste.mjs limpar
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
const EMAIL = "teste@sisaves.local";
const SENHA = "sisaves-teste-2026";

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
  await fetch(`${BASE}/users/${id}`, { method: "DELETE", headers: cabecalhos });
}

const comando = process.argv[2] ?? "criar";
const usuarios = await listar();
const existente = usuarios.find((u) => u.email === EMAIL);

if (comando === "limpar") {
  if (existente) {
    await remover(existente.id);
    console.log("conta de teste removida");
  } else {
    console.log("nada a remover");
  }
} else {
  if (existente) await remover(existente.id);

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
  console.log("conta criada:", EMAIL, "/ senha:", SENHA);
  console.log("id:", u.id);
}
