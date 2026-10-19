#!/usr/bin/env node
/**
 * Lista os meios de pagamento habilitados na conta do Mercado Pago.
 *
 *   node scripts/mercadopago-meios.mjs
 *
 * Existe por um ponto que ficou sem fonte verificada ao montar a Fase 10.
 * O SDK tipa `payment_methods.excluded_payment_types` como `{ id?: string }`:
 * a FORMA do campo está garantida, os VALORES possíveis não. E o desconto do
 * PIX depende exatamente desses valores — se `bank_transfer` estiver errado, a
 * preferência de R$ 270 aceita cartão e o desconto vaza para todo mundo.
 *
 * Em vez de confiar em memória, este script pergunta à conta. O que ele
 * devolver manda sobre o que está em src/lib/mercadopago/ofertas.ts.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

function lerEnv() {
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
}

lerEnv();

const token = process.env.MP_ACCESS_TOKEN;
if (!token) {
  console.error(
    "MP_ACCESS_TOKEN ausente. Pegue em mercadopago.com.br/developers/panel/app\n" +
      "→ sua app → Credenciais → Credenciais de teste, e ponha no .env.local.",
  );
  process.exit(1);
}

const resposta = await fetch("https://api.mercadopago.com/v1/payment_methods", {
  headers: { Authorization: `Bearer ${token}` },
});

if (!resposta.ok) {
  console.error(`A API devolveu ${resposta.status}: ${await resposta.text()}`);
  process.exit(1);
}

const meios = await resposta.json();
const porTipo = new Map();
for (const m of meios) {
  if (!porTipo.has(m.payment_type_id)) porTipo.set(m.payment_type_id, []);
  porTipo.get(m.payment_type_id).push(m.id);
}

console.log("\nTipos habilitados nesta conta — é o que vale em");
console.log("`payment_methods.excluded_payment_types: [{ id }]`:\n");

for (const [tipo, ids] of [...porTipo].sort()) {
  const amostra = ids.slice(0, 4).join(", ");
  const resto = ids.length > 4 ? `, +${ids.length - 4}` : "";
  console.log(`  ${tipo.padEnd(18)} ${amostra}${resto}`);
}

const temPix = porTipo.has("bank_transfer");
console.log(
  `\n${temPix ? "✓" : "✗"} 'bank_transfer' ${temPix ? "existe" : "NÃO existe"} nesta conta` +
    `${temPix ? " — é o tipo do PIX, e ofertas.ts está certo." : " — ajuste src/lib/mercadopago/ofertas.ts para o tipo correto acima."}`,
);
if (process.argv.includes("--bruto")) {
  console.log("\nTodos os meios, cru:\n");
  for (const m of meios) {
    console.log(
      `  ${String(m.id).padEnd(16)} ${String(m.payment_type_id).padEnd(16)} ${m.status}  ${m.name ?? ""}`,
    );
  }
  console.log("");
}

console.log(
  "\nConfira também se todo tipo que você NÃO quer na oferta do PIX está",
  "\nlistado em TIPOS_SEM_PIX. Tipo habilitado e não excluído aparece no",
  "\ncheckout — e seria vendido pelo preço do PIX.\n",
);
