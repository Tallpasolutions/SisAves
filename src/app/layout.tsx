import type { Metadata, Viewport } from "next";
import { inter, montserrat } from "./fonts";
import { ThemeScript } from "./theme-script";
import "./globals.css";

const DESCRICAO =
  "Gestão de criatório de aves ornamentais: plantel, casais, ciclo do ovo, genealogia e CRO.";

/**
 * O endereço do site, para o Next montar URL ABSOLUTA no Open Graph.
 *
 * WhatsApp, Telegram e afins não resolvem caminho relativo: sem isto, o
 * `og:image` sai como "/opengraph-image" e nenhum deles monta o cartão.
 */
const SITE = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://sisaves.tallpa.com.br",
);

export const metadata: Metadata = {
  metadataBase: SITE,
  title: {
    default: "SisAves",
    template: "%s · SisAves",
  },
  description: DESCRICAO,
  applicationName: "SisAves",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "SisAves",
    title: "SisAves",
    description: DESCRICAO,
    url: SITE,
    locale: "pt_BR",
  },
  // O cartão grande: o resumo do WhatsApp segue o mesmo par de metas.
  twitter: { card: "summary_large_image", title: "SisAves", description: DESCRICAO },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0B5D5E" },
    { media: "(prefers-color-scheme: dark)", color: "#0D1C21" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: ThemeScript grava data-theme antes da hidratação,
    // então o HTML do servidor e o do cliente divergem nesse atributo de propósito.
    <html
      lang="pt-BR"
      className={`${montserrat.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <a className="skip-link" href="#conteudo">
          Ir para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
