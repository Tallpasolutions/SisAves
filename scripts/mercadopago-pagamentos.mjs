#!/usr/bin/env node
/**
 * Lista os últimos pagamentos da conta, com o motivo real da recusa.
 *
 *   node scripts/mercadopago-pagamentos.mjs
 *
 * Existe porque a tela do Checkout Pro diz só "Não foi possível processar seu
 * pagamento" — que não distingue cartão recusado de integração errada. O
 * `status_detail` da API distingue, e é ele que diz o que consertar.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

try {
  const texto = readFileSync(join(raiz, ".env.local"), "utf8");
  for (const linha of texto.split("\n")) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // Sem .env.local: a variável pode vir do ambiente.
}

const token = process.env.MP_ACCESS_TOKEN;
if (!token) {
  console.error("MP_ACCESS_TOKEN ausente no .env.local.");
  process.exit(1);
}

const resposta = await fetch(
  "https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=10",
  { headers: { Authorization: `Bearer ${token}` } },
);

if (!resposta.ok) {
  console.error(`A API devolveu ${resposta.status}: ${await resposta.text()}`);
  process.exit(1);
}

const { results = [], paging } = await resposta.json();

if (results.length === 0) {
  console.log(
    "\nNenhum pagamento nesta conta.\n\n" +
      "Se você acabou de tentar pagar e nada apareceu, o pagamento não chegou a\n" +
      "ser criado — o erro foi ANTES, na autorização do comprador, e não no\n" +
      "cartão.\n",
  );
  process.exit(0);
}

console.log(`\n${paging?.total ?? results.length} pagamento(s). Os mais recentes:\n`);

for (const p of results) {
  console.log(`  id ${p.id}`);
  console.log(`  ${p.date_created?.slice(0, 19).replace("T", " ")}  R$ ${p.transaction_amount}`);
  console.log(`  status        ${p.status}`);
  console.log(`  status_detail ${p.status_detail}   ← o motivo real`);
  console.log(`  meio          ${p.payment_type_id} / ${p.payment_method_id}`);
  console.log(`  referência    ${p.external_reference ?? "(nenhuma)"}`);
  if (p.payer?.email) console.log(`  pagador       ${p.payer.email}`);
  console.log("");
}
