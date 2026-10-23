#!/usr/bin/env node
/**
 * Mostra o link de recuperação de senha que o Supabase geraria, sem enviar.
 *
 *   node scripts/link-de-recuperacao.mjs <email>
 *
 * Existe porque "o link me levou para a tela errada" é um defeito que só
 * aparece no e-mail de outra pessoa. A API de admin monta o mesmo link que
 * sairia na mensagem, e aí dá para LER para onde ele aponta em vez de deduzir.
 *
 * O ponto em observação é o `redirect_to`: a aplicação pede
 * `/auth/...?destino=/nova-senha`, e se o Supabase não reconhecer essa URL na
 * lista de Redirect URLs ele a descarta e usa a Site URL. O criador cai na
 * raiz, a raiz manda para o painel, e quem não tem criatório termina no
 * cadastro de criatório — que foi exatamente o relato.
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

const email = process.argv[2];
const origem = process.argv[3] || "http://localhost:3000";
// Quarto argumento: um `redirect_to` inteiro, para isolar se o que o Supabase
// recusa é a URL ou o parâmetro pendurado nela.
const pedido = process.argv[4] || `${origem}/auth/callback?destino=/nova-senha`;

if (!email) {
  console.error("uso: node scripts/link-de-recuperacao.mjs <email> [origem] [redirect_to]");
  process.exit(1);
}

const resposta = await fetch(
  `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/generate_link`,
  {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "recovery",
      email,
      redirect_to: pedido,
    }),
  },
);

const corpo = await resposta.json();

if (!resposta.ok) {
  console.error(`HTTP ${resposta.status}: ${corpo.msg ?? corpo.message}`);
  process.exit(1);
}

const link = corpo.properties?.action_link ?? corpo.action_link;
const url = new URL(link);
const redirect = url.searchParams.get("redirect_to");

console.log("\nPEDIDO");
console.log(`  redirect_to  ${pedido}`);
console.log("\nO QUE O SUPABASE DEVOLVEU");
console.log(`  redirect_to  ${redirect ?? "(nenhum)"}`);
console.log(`  tipo         ${url.searchParams.get("type")}`);

const preservou = redirect?.includes("destino=");
console.log(
  `\n${preservou ? "✓" : "✗"} o parâmetro destino ${preservou ? "SOBREVIVEU" : "FOI DESCARTADO"}`,
);
if (!preservou) {
  console.log(
    "\n  É a causa: sem `destino`, o callback usa o padrão e manda para o\n" +
      "  painel. Quem não tem criatório cai no cadastro de criatório.\n",
  );
}
if (process.argv.includes("--mostrar-link")) {
  // O link INTEIRO carrega um token de uso único que entra na conta. Só sai
  // com pedido explícito, e nunca deve ser colado em lugar nenhum.
  console.log("LINK COMPLETO (token de uso único — não compartilhe)");
  console.log(`  ${link}\n`);
}

console.log("");
