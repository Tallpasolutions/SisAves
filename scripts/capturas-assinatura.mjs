#!/usr/bin/env node
/**
 * Fotografa o que o criador vê conforme a assinatura se aproxima do fim.
 *
 *   pnpm dev                                  # em outro terminal
 *   node scripts/capturas-assinatura.mjs
 *
 * São estados que dependem da DATA, e por isso difíceis de conferir: para ver
 * "vence em 2 dias" seria preciso esperar o dia chegar. Aqui o estado é
 * montado no banco, fotografado, e desfeito.
 *
 * **Mexe só no criatório de teste.** O `where` cruza com o e-mail da conta de
 * desenvolvimento; nenhum criatório de cliente é tocado. E o valor original é
 * lido antes e restaurado no fim, inclusive se algo falhar no meio.
 */
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
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

const base = process.env.CAPTURAS_URL || "http://localhost:3000";
const email = process.env.EMAIL_USUARIO_TESTE;
const senha = process.env.SENHA_USUARIO_TESTE;

if (!email || !senha) {
  console.error("EMAIL_USUARIO_TESTE e SENHA_USUARIO_TESTE no .env.local.");
  process.exit(1);
}

/** O `where` que amarra tudo ao criatório de desenvolvimento. */
const SO_O_DE_TESTE = `criatorio_id in (
  select c.id from public.criatorios c
    join auth.users u on u.id = c.owner_id
   where u.email = '${email}'
)`;

function sql(consulta) {
  return execFileSync("node", [join(raiz, "scripts", "sql.mjs"), consulta], {
    cwd: raiz,
    encoding: "utf8",
  });
}

const ESTADOS = [
  {
    nome: "1-em-dia",
    titulo: "Assinatura em dia, sem aviso",
    dias: 200,
    status: "ativa",
    rota: "/hoje",
  },
  {
    nome: "2-vencendo",
    titulo: "Faltam 2 dias",
    dias: 2,
    status: "teste",
    rota: "/hoje",
  },
  {
    nome: "3-ultimo-dia",
    titulo: "Termina hoje",
    dias: 0,
    status: "teste",
    rota: "/hoje",
  },
  {
    nome: "4-vencido",
    titulo: "Vencido: o acesso para",
    dias: -1,
    status: "vencida",
    rota: "/plantel",
  },
];

// Guarda o estado real ANTES de qualquer mudança.
const original = sql(
  `select status::text || '|' || coalesce(fim::text,'') as v from public.assinaturas where ${SO_O_DE_TESTE}`,
);
const casado = original.match(/'(\w+)\|([\d-]*)'/);
if (!casado) {
  console.error("Não consegui ler a assinatura de teste. Abortando sem mexer.");
  process.exit(1);
}
const [, statusOriginal, fimOriginal] = casado;
console.log(`\noriginal: ${statusOriginal} até ${fimOriginal}\n`);

const destino = join(raiz, ".previa-assinatura");
mkdirSync(destino, { recursive: true });

const navegador = await chromium.launch();

try {
  for (const estado of ESTADOS) {
    sql(
      `update public.assinaturas set status = '${estado.status}', ` +
        `fim = public.hoje() + ${estado.dias} where ${SO_O_DE_TESTE}`,
    );

    for (const [largura, altura, sufixo] of [
      [390, 844, "celular"],
      [1440, 900, "computador"],
    ]) {
      const contexto = await navegador.newContext({
        viewport: { width: largura, height: altura },
        deviceScaleFactor: 2,
        locale: "pt-BR",
        timezoneId: "America/Sao_Paulo",
      });
      const pagina = await contexto.newPage();

      await pagina.goto(`${base}/entrar`, { waitUntil: "networkidle" });
      await pagina.getByRole("textbox", { name: /e-mail/i }).fill(email);
      await pagina.getByRole("textbox", { name: /senha/i }).fill(senha);
      await pagina.getByRole("button", { name: /^entrar$/i }).click();
      await pagina.waitForURL((u) => !u.pathname.startsWith("/entrar"), {
        timeout: 30_000,
      });

      await pagina.goto(`${base}${estado.rota}`, { waitUntil: "networkidle" });
      await pagina.addStyleTag({
        content: "nextjs-portal { display: none !important; }",
      });
      await pagina.evaluate(() => document.fonts.ready);
      await pagina.waitForTimeout(1200);

      const arquivo = join(destino, `${estado.nome}-${sufixo}.png`);
      await pagina.screenshot({ path: arquivo });
      await contexto.close();
    }

    console.log(`  ${estado.nome.padEnd(14)} ${estado.titulo}`);
  }
} finally {
  // Restaura SEMPRE, inclusive se uma captura falhar no meio.
  sql(
    `update public.assinaturas set status = '${statusOriginal}', ` +
      `fim = '${fimOriginal}'::date where ${SO_O_DE_TESTE}`,
  );
  console.log(`\nrestaurado: ${statusOriginal} até ${fimOriginal}`);
  await navegador.close();
}

console.log(`\nimagens em ${destino}\n`);
