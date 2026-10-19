import { MercadoPagoConfig } from "mercadopago";

/**
 * O cliente do Mercado Pago. Só no servidor.
 *
 * `MP_ACCESS_TOKEN` não tem o prefixo `NEXT_PUBLIC_` de propósito: se tivesse,
 * o Next o costuraria no bundle do navegador e o token do criatório estaria na
 * fonte da página. Não há cliente do Checkout Pro — a ida é um redirect — então
 * nada deste arquivo precisa chegar ao navegador.
 */
export function clienteMercadoPago(): MercadoPagoConfig {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      "MP_ACCESS_TOKEN ausente. Pegue em mercadopago.com.br/developers/panel/app → sua app → Credenciais → Teste.",
    );
  }
  return new MercadoPagoConfig({ accessToken });
}

/** Se o Mercado Pago está configurado — a tela decide o que mostrar com isto. */
export function mercadoPagoConfigurado(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

/**
 * A origem pela qual a requisição chegou, para montar `back_urls` e
 * `notification_url`.
 *
 * Vem do cabeçalho, como o QR do CRO: assim localhost e produção se resolvem
 * sozinhos, sem uma variável a mais para esquecer de trocar.
 */
export function origemDaRequisicao(cabecalhos: Headers): string {
  const host = cabecalhos.get("host") ?? "localhost:3000";
  const protocolo =
    cabecalhos.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}

/**
 * Se a origem é pública e HTTPS.
 *
 * A API de preferências **recusa** `auto_return: "approved"` quando
 * `back_urls.success` é localhost — não ignora, recusa antes de criar a
 * preferência. Então o campo entra condicionalmente.
 */
export function origemPublica(origem: string): boolean {
  return (
    /^https:\/\//i.test(origem) &&
    !/^https:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::|\/|$)/i.test(origem)
  );
}
