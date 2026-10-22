#!/usr/bin/env node
/**
 * Gera os templates de e-mail do Supabase Auth.
 *
 *   node scripts/templates-email.mjs
 *
 * Os templates moram no painel do Supabase, que não tem histórico nem diff.
 * Então a fonte de verdade fica aqui, versionada, e o painel recebe uma cópia.
 * Quando mudar, roda-se isto e cola-se de novo.
 *
 * **HTML de e-mail não é HTML de página.** Gmail, Outlook e Apple Mail
 * descartam `<style>`, não entendem variável CSS, e o Outlook ainda renderiza
 * por Word. Por isso: tabela em vez de flex, estilo embutido em cada tag, cor
 * literal em vez de `var(--token)`, e nenhuma imagem remota — cliente de
 * e-mail bloqueia imagem por padrão, e uma marca que não carrega é pior que
 * marca nenhuma. A assinatura é texto com as duas cores da marca.
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const destino = join(raiz, "supabase", "templates");
mkdirSync(destino, { recursive: true });

// A paleta, literal. São os mesmos valores de tokens/colors.css.
const PETROLEO = "#0B5D5E";
const AZUL = "#163A45";
const NEVE = "#F4F7F6";
const GRAFITE = "#1B2528";
const SECUNDARIO = "#5A6B70";
const BORDA = "#DBE3E3";

/*
 * A marca em PNG.
 *
 * O SVG da marca NÃO serve aqui: Gmail e Outlook não renderizam SVG em e-mail,
 * e o criador veria um quadrado vazio. PNG em escala 2 para não borrar em tela
 * de retina, servido do domínio público.
 *
 * Mesmo assim o `alt` importa: Outlook bloqueia imagem remota por padrão, e
 * nessas caixas o que aparece é o texto alternativo. Por isso ele é "SisAves",
 * e não "logo".
 */
const LOGO_LARGURA = 320; // exibida a 160, dobrada para retina
const LOGO_ALTURA = Math.round((LOGO_LARGURA * 500) / 1700);

async function gerarLogo() {
  const svg = readFileSync(
    join(raiz, "public", "brand", "sisaves-logo-horizontal.svg"),
    "utf8",
  );
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage({
    viewport: { width: LOGO_LARGURA, height: LOGO_ALTURA },
  });
  // Fundo NEVE, não branco: é a cor do corpo do e-mail. Com branco, a marca
  // aparece dentro de um retângulo claro recortado contra o fundo.
  await pagina.setContent(
    `<html><body style="margin:0;background:${NEVE};">` +
      `<div style="width:${LOGO_LARGURA}px;height:${LOGO_ALTURA}px;">` +
      svg.replace("<svg ", `<svg width="${LOGO_LARGURA}" height="${LOGO_ALTURA}" `) +
      `</div></body></html>`,
  );
  await pagina.waitForTimeout(400);
  const arquivo = join(raiz, "public", "brand", "sisaves-email.png");
  await pagina.screenshot({ path: arquivo });
  await navegador.close();
  console.log(`  marca                    ${LOGO_LARGURA}x${LOGO_ALTURA}  public/brand/sisaves-email.png\n`);
}

await gerarLogo();

/** Onde a marca é buscada pelo cliente de e-mail. */
const LOGO_URL = "https://sisaves.tallpa.com.br/brand/sisaves-email.png";

const FONTE =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** O botão. Alvo alto, cor cheia, sem gradiente. */
function botao(url, rotulo) {
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
                <tr>
                  <td align="center" bgcolor="${PETROLEO}" style="border-radius:5px;">
                    <a href="${url}" style="display:inline-block;padding:14px 28px;font-family:${FONTE};font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:5px;">${rotulo}</a>
                  </td>
                </tr>
              </table>`;
}

/** O código de seis dígitos, quando o fluxo usa OTP em vez de link. */
function codigo(valor) {
  return `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
                <tr>
                  <td align="center" bgcolor="${NEVE}" style="border:1px solid ${BORDA};border-radius:5px;padding:16px 32px;">
                    <span style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:28px;font-weight:600;letter-spacing:0.18em;color:${AZUL};">${valor}</span>
                  </td>
                </tr>
              </table>`;
}

/** A moldura comum: marca, cartão, rodapé. */
function moldura({ titulo, corpo }) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo}</title>
</head>
<body style="margin:0;padding:0;background-color:${NEVE};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${NEVE};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">

          <tr>
            <td style="padding-bottom:20px;">
              <img src="${LOGO_URL}" width="160" height="${Math.round(LOGO_ALTURA / 2)}" alt="SisAves" style="display:block;border:0;outline:none;text-decoration:none;font-family:${FONTE};font-size:22px;font-weight:700;color:${AZUL};">
            </td>
          </tr>

          <tr>
            <td bgcolor="#FFFFFF" style="border:1px solid ${BORDA};border-radius:8px;padding:32px;">
              <h1 style="margin:0 0 16px;font-family:${FONTE};font-size:20px;font-weight:600;color:${AZUL};line-height:1.3;">${titulo}</h1>
${corpo}
            </td>
          </tr>

          <tr>
            <td style="padding-top:20px;">
              <p style="margin:0;font-family:${FONTE};font-size:13px;line-height:1.5;color:${SECUNDARIO};">
                SisAves &middot; gestão de criatórios de aves ornamentais<br>
                Dúvidas? Responda para <a href="mailto:suporte@tallpa.com.br" style="color:${PETROLEO};">suporte@tallpa.com.br</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

const p = (texto) =>
  `              <p style="margin:0 0 12px;font-family:${FONTE};font-size:15px;line-height:1.55;color:${GRAFITE};">${texto}</p>`;

const nota = (texto) =>
  `              <p style="margin:16px 0 0;padding-top:16px;border-top:1px solid ${BORDA};font-family:${FONTE};font-size:13px;line-height:1.5;color:${SECUNDARIO};">${texto}</p>`;

/*
 * Os dez templates.
 *
 * Voz do contrato: informa, não celebra. Fala COM o criador, nunca em primeira
 * pessoa do sistema. Botão é verbo. Nenhum emoji, nenhum "Olá!" sem nome.
 *
 * Só uso variável que a documentação do Supabase confirma para AQUELE
 * template. Variável inexistente não falha: ela aparece escrita, literal, no
 * e-mail do criador.
 */
const TEMPLATES = [
  {
    arquivo: "01-confirmar-cadastro",
    painel: "Confirm sign up",
    assunto: "Confirme o seu e-mail no SisAves",
    titulo: "Confirme o seu e-mail",
    corpo: [
      p("Uma conta no SisAves foi criada com este endereço. Confirme para ativá-la."),
      botao("{{ .ConfirmationURL }}", "Confirmar e-mail"),
      p("Depois de confirmar, você cadastra o criatório e as espécies que cria."),
      nota("Se não foi você que pediu, ignore esta mensagem. A conta não é ativada sem esta confirmação."),
    ],
  },
  {
    arquivo: "02-convite",
    painel: "Invite user",
    assunto: "Você foi convidado para um criatório no SisAves",
    titulo: "Convite para um criatório",
    corpo: [
      p("Você recebeu acesso a um criatório no SisAves. Crie a sua conta para entrar."),
      botao("{{ .ConfirmationURL }}", "Aceitar convite"),
      p("O convite vale para este endereço de e-mail. Ao entrar, o acesso ao criatório aparece sozinho."),
      nota("Se você não conhece quem convidou, ignore esta mensagem."),
    ],
  },
  {
    arquivo: "03-link-de-acesso",
    painel: "Magic link or OTP",
    assunto: "Seu link de acesso ao SisAves",
    titulo: "Entrar no SisAves",
    corpo: [
      p("Use o link abaixo para entrar. Ele vale por uma hora e serve uma vez só."),
      botao("{{ .ConfirmationURL }}", "Entrar"),
      p("Se preferir digitar, o código é:"),
      codigo("{{ .Token }}"),
      nota("Se não foi você que pediu, ignore esta mensagem e nada acontece."),
    ],
  },
  {
    arquivo: "04-trocar-email",
    painel: "Change email address",
    assunto: "Confirme o novo e-mail da sua conta",
    titulo: "Confirme o novo e-mail",
    corpo: [
      p("Foi pedida a troca do e-mail da sua conta no SisAves, de <strong>{{ .Email }}</strong> para <strong>{{ .NewEmail }}</strong>."),
      botao("{{ .ConfirmationURL }}", "Confirmar troca"),
      p("Até esta confirmação, o acesso continua pelo endereço antigo."),
      nota("Se não foi você, <strong>troque a senha da sua conta agora</strong>. Alguém com acesso a ela está tentando mudar o endereço de contato."),
    ],
  },
  {
    arquivo: "05-redefinir-senha",
    painel: "Reset password",
    assunto: "Defina uma senha nova no SisAves",
    titulo: "Defina uma senha nova",
    corpo: [
      p("Foi pedida a redefinição da senha desta conta. Use o link abaixo para escolher uma nova."),
      botao("{{ .ConfirmationURL }}", "Definir senha nova"),
      p("O link vale por uma hora e serve uma vez só."),
      nota("Se não foi você que pediu, ignore esta mensagem. A senha atual continua valendo."),
    ],
  },
  {
    arquivo: "06-reautenticacao",
    painel: "Reauthentication",
    assunto: "Código de confirmação do SisAves",
    titulo: "Confirme que é você",
    corpo: [
      p("Digite este código para concluir a operação:"),
      codigo("{{ .Token }}"),
      p("Ele vale por poucos minutos."),
      nota("Se não foi você que pediu, alguém pode ter acesso à sua conta. Troque a senha."),
    ],
  },

  /*
   * Os quatro de segurança. Note que eles NÃO usam variável: a documentação
   * lista `OldEmail`, `Provider` e `FactorType` para esta família, mas eu não
   * confirmei cada uma por template. Variável errada não quebra o envio — ela
   * aparece escrita, literal, no e-mail de um criador que acabou de levar um
   * susto. Texto sem variável informa o mesmo e não corre esse risco.
   */
  {
    arquivo: "07-senha-alterada",
    painel: "Password changed",
    assunto: "A senha da sua conta foi alterada",
    titulo: "A senha da sua conta foi alterada",
    corpo: [
      p("A senha da sua conta no SisAves acaba de ser trocada."),
      nota("<strong>Se não foi você</strong>, peça uma redefinição de senha agora mesmo na tela de entrada e avise suporte@tallpa.com.br. Seu plantel e seus certificados continuam no lugar."),
    ],
  },
  {
    arquivo: "08-email-alterado",
    painel: "Email address changed",
    assunto: "O e-mail da sua conta foi alterado",
    titulo: "O e-mail da sua conta foi alterado",
    corpo: [
      p("O endereço de e-mail da sua conta no SisAves acaba de ser trocado."),
      nota("<strong>Se não foi você</strong>, avise suporte@tallpa.com.br agora. Esta mensagem foi enviada também para o endereço antigo."),
    ],
  },
  {
    arquivo: "09-acesso-vinculado",
    painel: "Sign-in method linked",
    assunto: "Uma nova forma de entrar foi vinculada à sua conta",
    titulo: "Nova forma de entrar vinculada",
    corpo: [
      p("Uma forma de entrar, como a conta Google, acaba de ser vinculada à sua conta no SisAves. A partir de agora ela também abre o seu criatório."),
      nota("<strong>Se não foi você</strong>, troque a senha e avise suporte@tallpa.com.br. Vincular um acesso é como entregar uma segunda chave."),
    ],
  },
  {
    arquivo: "10-acesso-removido",
    painel: "Sign-in method removed",
    assunto: "Uma forma de entrar foi removida da sua conta",
    titulo: "Forma de entrar removida",
    corpo: [
      p("Uma forma de entrar acaba de ser removida da sua conta no SisAves."),
      nota("<strong>Se não foi você</strong>, troque a senha e avise suporte@tallpa.com.br."),
    ],
  },
];

const indice = ["# Templates de e-mail do Supabase Auth", "",
  "Gerados por `node scripts/templates-email.mjs`. Cole cada arquivo em",
  "**Authentication → Emails → Templates**, no template indicado, e use o",
  "assunto da tabela.", "",
  "| Arquivo | Template no painel | Assunto |",
  "|---|---|---|"];

for (const t of TEMPLATES) {
  const html = moldura({ titulo: t.titulo, corpo: t.corpo.join("\n") });
  writeFileSync(join(destino, `${t.arquivo}.html`), html);
  indice.push(`| \`${t.arquivo}.html\` | ${t.painel} | ${t.assunto} |`);
  console.log(`  ${t.arquivo.padEnd(24)} ${t.painel}`);
}

writeFileSync(join(destino, "LEIAME.md"), indice.join("\n") + "\n");
console.log(`\n${TEMPLATES.length} templates em supabase/templates/`);

/*
 * `--previa` fotografa cada template, para conferir antes de colar no painel.
 *
 * As variáveis viram exemplo e a marca aponta para o arquivo local, senão a
 * prévia mostraria `{{ .ConfirmationURL }}` escrito e um espaço sem imagem.
 * As imagens ficam no scratchpad, fora do repositório: são conferência, não
 * entrega.
 */
if (process.argv.includes("--previa")) {
  const pasta = process.env.PREVIA_DIR || join(raiz, ".previa-email");
  mkdirSync(pasta, { recursive: true });
  const marcaEmBase64 = readFileSync(
    join(raiz, "public", "brand", "sisaves-email.png"),
  ).toString("base64");
  const navegador = await chromium.launch();

  for (const t of TEMPLATES) {
    const html = readFileSync(join(destino, `${t.arquivo}.html`), "utf8")
      .replaceAll("{{ .ConfirmationURL }}", "https://sisaves.tallpa.com.br/auth/callback")
      .replaceAll("{{ .Token }}", "480715")
      .replaceAll("{{ .Email }}", "criador@exemplo.com")
      .replaceAll("{{ .NewEmail }}", "novo@exemplo.com")
      // A marca entra embutida: `file://` não carrega a partir de setContent,
      // e sem ela a prévia mostraria só o texto alternativo.
      .replace(LOGO_URL, `data:image/png;base64,${marcaEmBase64}`);

    const pagina = await navegador.newPage({
      viewport: { width: 680, height: 600 },
      deviceScaleFactor: 2,
    });
    await pagina.setContent(html, { waitUntil: "networkidle" });
    await pagina.screenshot({ path: join(pasta, `${t.arquivo}.png`), fullPage: true });
    await pagina.close();
  }

  await navegador.close();
  console.log(`prévias em ${pasta}\n`);
} else {
  console.log("");
}
