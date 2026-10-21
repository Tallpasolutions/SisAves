#!/usr/bin/env node
/**
 * Reenvia a notificação de um pagamento ao nosso webhook, assinada de verdade.
 *
 *   node scripts/mercadopago-reenviar.mjs <id-do-pagamento>
 *   node scripts/mercadopago-reenviar.mjs <id> --url https://sisaves.tallpa.com.br
 *
 * Existe por uma limitação do desenvolvimento local, não do código: o
 * `notification_url` da preferência sai com o host da requisição, e em
 * localhost isso vira um endereço que o Mercado Pago não alcança. O pagamento
 * acontece, e a notificação não tem para onde ir.
 *
 * Então o circuito local fica sem a última volta — a que credita. Este script
 * fecha essa volta: monta a mesma string canônica que o Mercado Pago assina,
 * assina com o `MP_WEBHOOK_SECRET` que é nosso, e posta.
 *
 * **Não é um atalho para creditar o que não foi pago.** A rota busca o
 * pagamento na API do Mercado Pago e credita pelo status que ELA devolve; a
 * referência precisa existir em `assinatura_intencoes`; e a assinatura HMAC
 * precisa bater. Um id inventado não credita nada.
 */
import crypto from "node:crypto";
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
  // Sem .env.local: as variáveis podem vir do ambiente.
}

const args = process.argv.slice(2);
const pagamentoId = args.find((a) => !a.startsWith("--"));
const base =
  args.includes("--url") ? args[args.indexOf("--url") + 1] : "http://localhost:3000";

if (!pagamentoId) {
  console.error(
    "uso: node scripts/mercadopago-reenviar.mjs <id-do-pagamento> [--url <origem>]\n" +
      "O id sai de: node scripts/mercadopago-pagamentos.mjs",
  );
  process.exit(1);
}

const segredo = process.env.MP_WEBHOOK_SECRET;
if (!segredo) {
  console.error("MP_WEBHOOK_SECRET ausente. Painel → Webhooks → Assinatura secreta.");
  process.exit(1);
}

// A string canônica que o Mercado Pago assina. Qualquer divergência aqui e o
// receptor devolve 401 — que é exatamente o que ele deve fazer.
const ts = Date.now().toString();
const requestId = crypto.randomUUID();
const canonica = `id:${pagamentoId};request-id:${requestId};ts:${ts};`;
const v1 = crypto.createHmac("sha256", segredo).update(canonica).digest("hex");

const url = `${base.replace(/\/$/, "")}/api/mercadopago/webhook?data.id=${pagamentoId}`;

console.log(`\nreenviando pagamento ${pagamentoId}`);
console.log(`para ${url}\n`);

const resposta = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-signature": `ts=${ts},v1=${v1}`,
    "x-request-id": requestId,
  },
  body: JSON.stringify({
    type: "payment",
    action: "payment.updated",
    data: { id: pagamentoId },
  }),
});

console.log(`HTTP ${resposta.status}`);

if (resposta.status === 200) {
  console.log(
    "\nO receptor aceitou. O crédito roda DEPOIS da resposta (after()), então\n" +
      "confira o resultado no banco em um instante:\n\n" +
      '  node scripts/sql.mjs "select provedor_id, status, valor, meio from public.assinatura_pagamentos"\n',
  );
} else if (resposta.status === 401) {
  console.log(
    "\n401 — assinatura inválida. O MP_WEBHOOK_SECRET do .env.local não é o\n" +
      "mesmo da aba em que o pagamento foi feito. Teste e produção têm\n" +
      "segredos DIFERENTES.\n",
  );
} else if (resposta.status === 500) {
  console.log("\n500 — falta MP_WEBHOOK_SECRET no servidor que recebeu.\n");
} else {
  console.log(`\n${resposta.status} — inesperado. Veja o log do servidor.\n`);
}
