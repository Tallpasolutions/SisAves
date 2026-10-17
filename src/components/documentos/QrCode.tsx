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

  // O SVG da biblioteca vem com width/height fixos; o documento manda em mm.
  const ajustado = svg
    .replace(/width="[^"]*"/, `width="${tamanhoMm}mm"`)
    .replace(/height="[^"]*"/, `height="${tamanhoMm}mm"`);

  return (
    <span
      aria-label={`QR Code para ${url}`}
      role="img"
      dangerouslySetInnerHTML={{ __html: ajustado }}
    />
  );
}
