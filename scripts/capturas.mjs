#!/usr/bin/env node
/**
 * Gera as capturas de tela que a landing usa.
 *
 *   pnpm dev                      # em outro terminal
 *   node scripts/capturas.mjs
 *
 * Existe para que as imagens da página de venda NÃO sejam maquete nem recorte
 * feito à mão uma vez e esquecido. São o produto em execução, e quando a tela
 * mudar basta rodar isto de novo.
 *
 * `deviceScaleFactor: 2` porque a imagem vai para tela de retina: capturar em
 * 1x e exibir em 2x é o mesmo que publicar foto desfocada.
 *
 * As credenciais saem do `.env.local`, nunca do código. A conta é a de
 * desenvolvimento, e o que aparece nas imagens é o plantel de semente.
 */
import { chromium } from "playwright";
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
  console.error(
    "EMAIL_USUARIO_TESTE e SENHA_USUARIO_TESTE precisam estar no .env.local.",
  );
  process.exit(1);
}

const destino = join(raiz, "public", "capturas");
mkdirSync(destino, { recursive: true });

/** O que capturar, e em que formato. */
const TELAS = [
  { nome: "hoje", rota: "/hoje", largura: 390, altura: 844 },
  { nome: "ovos", rota: "/ovos", largura: 390, altura: 844 },
  { nome: "painel", rota: "/painel", largura: 1440, altura: 900 },
  { nome: "plantel", rota: "/plantel", largura: 1440, altura: 900 },
  { nome: "genealogia", rota: "/genealogia", largura: 1440, altura: 900 },
];

const navegador = await chromium.launch();

for (const tela of TELAS) {
  const contexto = await navegador.newContext({
    viewport: { width: tela.largura, height: tela.altura },
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

  await pagina.goto(`${base}${tela.rota}`, { waitUntil: "networkidle" });

  // O indicador de desenvolvimento do Next flutua sobre a interface e não
  // existe em produção. Deixá-lo na imagem seria mostrar o que o criador
  // nunca vai ver.
  await pagina.addStyleTag({
    content: "nextjs-portal, #__next-build-watcher { display: none !important; }",
  });

  /*
   * A faixa de assinatura muda com o vencimento e envelheceria a imagem.
   *
   * O seletor é `[data-aviso-assinatura]`, e NÃO `[class*="faixa"]`: a classe
   * `faixa` também é a da barra de gravidade de 3px da tabela de
   * movimentações. Com a assinatura em dia a faixa de aviso nem é renderizada,
   * e o `.first()` acabava removendo a barra da primeira linha da tabela —
   * um filho a menos no grid, e todas as células daquela linha andavam uma
   * coluna. A imagem saía com a data por cima do evento, e parecia bug da
   * aplicação.
   */
  await pagina
    .locator("[data-aviso-assinatura]")
    .first()
    .evaluate((el) => el.remove())
    .catch(() => {});

  /*
   * Esperar as fontes ANTES de fotografar.
   *
   * A primeira captura do painel saiu com a data e o evento da primeira linha
   * da tabela escritos um por cima do outro. O layout estava correto — as três
   * linhas têm o mesmo grid e as mesmas posições —, e o que apareceu na imagem
   * foi o instante da troca de fonte: `networkidle` não espera por ela, e o
   * refluxo aconteceu depois do clique do obturador.
   */
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.waitForTimeout(1500);

  const arquivo = join(destino, `${tela.nome}.png`);
  await pagina.screenshot({ path: arquivo });
  console.log(`  ${tela.nome.padEnd(12)} ${tela.largura}x${tela.altura}  ${arquivo}`);

  await contexto.close();
}

await navegador.close();
console.log("\nPronto. As imagens entram na landing por next/image.\n");
