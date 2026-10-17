#!/usr/bin/env node
/**
 * Roda os testes de banco e resume o resultado.
 *
 *   node scripts/testar.mjs
 *
 * Existe por um erro concreto: a checagem usada antes era
 * `node scripts/sql.mjs -f <teste> | grep -c FALHOU`, e ela devolve zero tanto
 * quando tudo passa quanto quando o script MORRE antes de chegar ao veredito.
 * Dois arquivos ficaram quebrados sem ninguém ver.
 *
 * Aqui, arquivo que não produz asserção nenhuma é falha, e erro de SQL é
 * falha. Sai com código 1 se algo falhar — para servir de porta de CI.
 */
import { readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const aqui = dirname(fileURLToPath(import.meta.url));
const pasta = join(aqui, "..", "supabase", "tests");
const runner = join(aqui, "sql.mjs");

const arquivos = readdirSync(pasta).filter((n) => n.endsWith(".sql")).sort();
let totalOk = 0;
let problemas = 0;

for (const arquivo of arquivos) {
  let saida;
  try {
    saida = execFileSync("node", [runner, "-f", join(pasta, arquivo)], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (erro) {
    saida = `${erro.stdout ?? ""}${erro.stderr ?? ""}`;
  }

  // Conta LINHAS, não ocorrências: o cenário cujo valor esperado é a própria
  // string 'ok' aparece três vezes na mesma linha da tabela.
  const linhas = saida.split("\n");
  const ok = linhas.filter((l) => /'ok'\s*│\s*$/.test(l)).length;
  const falhou = linhas.filter((l) => l.includes("FALHOU")).length;
  const erro = /^ERRO/m.test(saida);
  const vazio = ok === 0 && falhou === 0;

  totalOk += ok;
  const ruim = falhou > 0 || erro || vazio;
  if (ruim) problemas += 1;

  const estado = erro
    ? "ERRO"
    : vazio
      ? "SEM ASSERÇÃO"
      : falhou > 0
        ? `${falhou} FALHOU`
        : "ok";

  console.log(`${arquivo.padEnd(32)} ${String(ok).padStart(3)} asserções  ${estado}`);

  if (erro) {
    const linha = saida.split("\n").find((l) => l.startsWith("ERRO"));
    if (linha) console.log(`${"".padEnd(32)} ${linha}`);
  }
}

console.log(`\n${totalOk} asserções em ${arquivos.length} arquivos.`);
if (problemas) {
  console.error(`${problemas} arquivo(s) com problema.`);
  process.exit(1);
}
