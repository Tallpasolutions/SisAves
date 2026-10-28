#!/usr/bin/env node
/**
 * Cria e apaga uma conta descartável, para exercitar o onboarding.
 *
 *   node scripts/usuario-descartavel.mjs criar
 *   node scripts/usuario-descartavel.mjs criar --manter
 *   node scripts/usuario-descartavel.mjs limpar
 *
 * `--manter` deixa as contas anteriores de pé. Serve a um cenário só, mas é o
 * cenário que mais importa: o mesmo CPF chegando por um segundo e-mail, que é
 * como alguém transformaria cinco dias de teste em infinitos.
 *
 * O cadastro de criador só aparece para quem ainda não tem criatório, e as
 * contas sem criatório que existem no banco são de CLIENTES de verdade. Entrar
 * na conta de um cliente para conferir uma tela é inaceitável, e derrubar o
 * criatório de desenvolvimento para recriá-lo depois é pior.
 *
 * Daí esta conta: nasce confirmada, com senha conhecida, num domínio que não
 * existe. `limpar` remove todas as que este script criou.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

const env = Object.fromEntries(
  readFileSync(join(raiz, ".env.local"), "utf8")
    .split("\n")
    .map((l) => l.match(/^([A-Z0-9_]+)=(.*)$/))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);

const BASE = `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin`;
const cabecalhos = {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

/** O sufixo marca a conta como descartável, e `limpar` procura por ele. */
const MARCA = "@descartavel.invalid";
const SENHA = "descartavel-sisaves-2026";

const comando = process.argv[2] ?? "criar";

const lista = await (
  await fetch(`${BASE}/users?per_page=200`, { headers: cabecalhos })
).json();
const descartaveis = (lista.users ?? []).filter((u) =>
  u.email?.endsWith(MARCA),
);

if (comando === "limpar") {
  for (const u of descartaveis) {
    await fetch(`${BASE}/users/${u.id}`, {
      method: "DELETE",
      headers: cabecalhos,
    });
    console.log(`  removida  ${u.email}`);
  }
  console.log(descartaveis.length ? "" : "  nada a remover\n");
  process.exit(0);
}

// Uma de cada vez: duas contas descartáveis só confundem quem for olhar.
if (!process.argv.includes("--manter")) {
  for (const u of descartaveis) {
    await fetch(`${BASE}/users/${u.id}`, {
      method: "DELETE",
      headers: cabecalhos,
    });
  }
}

const email = `onboarding${Date.now()}${MARCA}`;
const resposta = await fetch(`${BASE}/users`, {
  method: "POST",
  headers: cabecalhos,
  body: JSON.stringify({
    email,
    password: SENHA,
    email_confirm: true,
    user_metadata: { nome: "Criador Descartável" },
  }),
});

if (!resposta.ok) {
  const corpo = await resposta.json().catch(() => ({}));
  console.error(`HTTP ${resposta.status}: ${corpo.msg ?? corpo.message}`);
  process.exit(1);
}

console.log(`\n  ${email}`);
console.log(`  ${SENHA}\n`);
console.log("  Entre com ela e o onboarding começa no passo 1.");
console.log("  Depois: node scripts/usuario-descartavel.mjs limpar\n");
