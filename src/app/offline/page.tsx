import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sem conexão" };

/*
 * Esta é a ÚNICA tela do produto com estilo embutido, e a regra de consumir
 * tokens por `var(--*)` não vale aqui.
 *
 * Ela é o recurso do service worker: aparece quando a rota pedida nunca foi
 * visitada neste aparelho E não há rede. Nesse momento a folha de estilo do
 * build — um arquivo com hash que talvez nunca tenha sido baixado — também não
 * carrega. Com CSS Module, ela chegava sem estilo nenhum: título minúsculo
 * encostado no canto, sem botão.
 *
 * Os valores abaixo são cópia literal de src/styles/tokens/colors.css. Se a
 * paleta mudar lá, mude aqui — são cinco cores, e é o preço de uma tela que
 * precisa funcionar quando nada mais funciona.
 */
const ESTILO = `
.sa-offline {
  --fundo: #F4F7F6;
  --cartao: #FFFFFF;
  --titulo: #163A45;
  --texto: #5A6B70;
  /* O preenchimento do botão NÃO muda com o tema: é petróleo nos dois, com
     texto branco (7,66:1). Clarear o fundo e manter o texto branco dava
     2,81:1 — o mesmo erro já cometido no botão primário. O ícone, esse sim,
     clareia: ele precisa contrastar com o fundo da página. */
  --botao: #0B5D5E;
  --botao-hover: #094A4B;
  --icone: #0B5D5E;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 12px;
  min-height: 100dvh;
  max-width: 560px;
  margin: 0 auto;
  padding: 48px 16px;
  background: var(--fundo);
  font-family: var(--font-ui, system-ui, sans-serif);
}

:root[data-theme="dark"] .sa-offline {
  --fundo: #0D1C21;
  --cartao: #12272D;
  --titulo: #E8EFEF;
  --texto: #9FB0B4;
  --icone: #4FA8A4;
}

.sa-offline h1 {
  margin: 0;
  font-family: var(--font-display, system-ui, sans-serif);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--titulo);
}

.sa-offline p {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  color: var(--texto);
}

.sa-offline a {
  display: inline-flex;
  align-items: center;
  min-height: 48px;
  margin-top: 8px;
  padding: 0 20px;
  background: var(--botao);
  color: #FFFFFF;
  border-radius: 5px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
}

.sa-offline a:hover { background: var(--botao-hover); }

.sa-offline a:focus-visible {
  outline: 2px solid var(--icone);
  outline-offset: 2px;
}

/* Lucide não carrega aqui pelo mesmo motivo do CSS: o ícone é inline. */
.sa-offline svg { color: var(--icone); }
`;

/**
 * Última linha de defesa do service worker: a tela pedida nunca foi visitada,
 * então não há nada guardado dela no aparelho.
 *
 * A cópia diz o que é verdade e o que fazer, sem culpar a rede nem mandar
 * "tentar mais tarde" — regra do CLAUDE.md. Esta rota é estática de propósito:
 * precisa funcionar sem sessão, sem banco e sem rede.
 */
export default function SemConexao() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ESTILO }} />
      <main className="sa-offline">
        {/* WifiOff da Lucide, inline: o pacote de ícones é JavaScript do build
            e, neste cenário, pode não ter sido baixado. */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 20h.01" />
          <path d="M8.5 16.429a5 5 0 0 1 7 0" />
          <path d="M5 12.859a10 10 0 0 1 5.17-2.69" />
          <path d="M19 12.859a10 10 0 0 0-2.007-1.523" />
          <path d="M2 8.82a15 15 0 0 1 4.177-2.643" />
          <path d="M22 8.82a15 15 0 0 0-11.288-3.764" />
          <path d="m2 2 20 20" />
        </svg>

        <h1>Esta tela ainda não está no aparelho</h1>
        <p>
          Sem sinal, o SisAves abre as telas que você já visitou. Esta é a
          primeira vez que ela é pedida neste aparelho, então não há o que
          mostrar ainda.
        </p>
        <p>
          O que você registrou offline continua salvo e sobe sozinho quando o
          sinal voltar.
        </p>
        {/* <a> e não <Link>: daqui queremos recarga de verdade. A navegação do
            cliente buscaria a carga RSC, que é exatamente o que não há. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/">Voltar para Hoje</a>
      </main>
    </>
  );
}
