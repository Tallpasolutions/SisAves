import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * O cartão que aparece quando alguém cola o endereço no WhatsApp.
 *
 * Gerado com `next/og` em vez de um PNG commitado: a peça nasce das MESMAS
 * medidas e cores do resto do produto, e muda junto quando a marca mudar. É
 * renderizado uma vez, no build, porque a rota é estática.
 *
 * A assinatura vem do SVG da marca, não de texto: o traçado já é a tipografia
 * aprovada, e reconstruí-la com fonte de sistema daria um "SisAves" parecido —
 * que é o pior resultado possível para uma logo.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "SisAves — gestão de criatório de aves ornamentais";

/**
 * Lido do disco e embutido em data URI.
 *
 * Satori não busca arquivo por caminho relativo e, no build, não há servidor
 * de pé para atender uma URL absoluta.
 */
function marca(): string {
  const svg = readFileSync(
    join(process.cwd(), "public/brand/sisaves-logo-horizontal-white.svg"),
  );
  return `data:image/svg+xml;base64,${svg.toString("base64")}`;
}

export default function Imagem() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          /*
           * O BLOCO é centrado, o texto dentro dele continua à esquerda.
           *
           * O contrato manda alinhar à esquerda, e isso vale para tela. Aqui a
           * peça é recortada por quem a exibe: o WhatsApp mostra o cartão
           * inteiro na conversa, mas usa um corte aproximadamente quadrado em
           * pré-visualizações menores. Composição encostada na margem perde a
           * assinatura nesse corte.
           */
          alignItems: "center",
          justifyContent: "center",
          /* Petróleo literal: a peça não tem tema, e `var(--*)` não existe aqui. */
          backgroundColor: "#0B5D5E",
          padding: "0 96px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        {/* `img` aqui é o do satori, não o do navegador: `next/image` não
            existe dentro de uma ImageResponse. */}
        <img src={marca()} alt="SisAves" width={620} height={182} />

        <div
          style={{
            marginTop: 28,
            fontSize: 38,
            lineHeight: 1.35,
            /* Branco puro sobre petróleo; o texto é o único elemento além da
               assinatura, e vazio honesto cuida do resto. */
            color: "#FFFFFF",
          }}
        >
          Gestão de criatório de aves ornamentais
        </div>

        <div style={{ marginTop: 14, fontSize: 28, color: "#B9D5D5" }}>
          Plantel · casais · ciclo do ovo · genealogia · CRO
        </div>
        </div>
      </div>
    ),
    size,
  );
}
