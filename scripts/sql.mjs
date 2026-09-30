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

const client = new pg.Client({
  host: `db.${env.SUPABASE_PROJECT_REF}.supabase.co`,
  port: 5432,
  user: "postgres",
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
