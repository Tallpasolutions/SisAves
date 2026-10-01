#!/usr/bin/env node
/**
 * Runner de SQL contra o banco do projeto.
 *
 *   node scripts/sql.mjs "select 1"
 *   node scripts/sql.mjs -f caminho/arquivo.sql
 *
 * Lê a conexão de .env.local. Usado para validar migrations, a máquina de
 * estados do ovo e o coeficiente de endogamia contra o Postgres de verdade.
 */
import { readFileSync } from "node:fs";
import pg from "pg";

function carregarEnv() {
  const texto = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const linha of texto.split("\n")) {
    const m = linha.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  return env;
}

const env = carregarEnv();
const args = process.argv.slice(2);
const sql =
  args[0] === "-f" ? readFileSync(args[1], "utf8") : args.join(" ");

if (!sql?.trim()) {
  console.error("uso: node scripts/sql.mjs \"<sql>\"  |  -f <arquivo.sql>");
  process.exit(1);
}

/*
 * Conexão pelo POOLER, não pelo host direto.
 *
 * `db.<ref>.supabase.co` passou a resolver só em IPv6 (tem AAAA, não tem A).
 * Em máquina sem rota IPv6 o Node devolve ENOTFOUND e parece que o banco caiu.
 * O pooler tem IPv4 e, em modo sessão (porta 5432), aceita DDL e transação —
 * é o que as migrations e os testes precisam.
 *
 * A região não dá para deduzir do ref do projeto; descobre-se tentando conectar.
 * Este projeto está em us-east-2. SUPABASE_DB_HOST sobrepõe, se mudar.
 */
const client = new pg.Client({
  host: env.SUPABASE_DB_HOST ?? "aws-0-us-east-2.pooler.supabase.com",
  port: 5432,
  user: `postgres.${env.SUPABASE_PROJECT_REF}`,
  password: env.SUPABASE_DB_PASSWORD,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const res = await client.query(sql);
  const resultados = Array.isArray(res) ? res : [res];
  for (const r of resultados) {
    if (r.rows?.length) console.table(r.rows);
    else console.log(`${r.command ?? "OK"} — ${r.rowCount ?? 0} linha(s)`);
  }
} catch (e) {
  console.error("ERRO:", e.message);
  if (e.detail) console.error("detalhe:", e.detail);
  if (e.hint) console.error("dica:", e.hint);
  process.exitCode = 1;
} finally {
  await client.end();
}
