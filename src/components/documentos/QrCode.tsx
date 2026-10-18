import QRCode from "qrcode";

/**
 * O QR do certificado, como SVG embutido.
 *
 * SVG e não PNG porque o destino é papel: o comprador lê um quadrado de 26 mm
 * impresso, e um bitmap desse tamanho sai serrilhado em qualquer impressora.
 * Gerado no servidor, sem JavaScript no cliente — a página do CRO precisa
 * imprimir igual com ou sem rede.
 *
 * Correção de erro em nível M (15%): o papel dobra, mancha e desbota, e o
 * nível L não perdoa nada disso. Alto demais engrossa o padrão e piora a
 * leitura no tamanho pequeno.
 */
export async function QrCode({
  url,
  tamanhoMm = 26,
}: {
  url: string;
  tamanhoMm?: number;
}) {
  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#0B5D5E", light: "#FFFFFF" },
  });

  /*
   * A biblioteca emite o SVG com `viewBox` e NENHUM width/height.
   *
   * A primeira versão disto trocava um `width="…"` que não existe no texto —
   * não trocava nada, e o SVG saía sem tamanho nenhum. Num contêiner flex
   * isso colapsa para 0x0: o certificado foi para produção com o QR
   * invisível, que é o oposto do que a peça existe para fazer. A conferência
   * que deixou passar olhou se a URL estava no HTML e se havia um `<svg>`;
   * presença não é renderização.
   *
   * Injetar no `<svg ` funciona independentemente do que a biblioteca
   * resolva emitir — é acrescentar atributo, não substituir.
   */
  const ajustado = svg.replace(
    "<svg ",
    `<svg width="${tamanhoMm}mm" height="${tamanhoMm}mm" `,
  );

  return (
    <span
      aria-label={`QR Code para ${url}`}
      role="img"
      // `block` tira o espaço de linha de base embaixo do SVG, que no papel
      // viraria um desalinhamento de meio milímetro.
      style={{ display: "block", width: `${tamanhoMm}mm`, height: `${tamanhoMm}mm` }}
      dangerouslySetInnerHTML={{ __html: ajustado }}
    />
  );
}
