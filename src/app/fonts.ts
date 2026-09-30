import { Inter, Montserrat } from "next/font/google";

/**
 * Montserrat — marca e títulos (600/700).
 * Inter — interface, texto corrido e dados numéricos (400/500/600/700).
 *
 * Hospedadas por next/font em vez do @import do Google Fonts declarado em
 * tokens/fonts.css: sem request a terceiro e sem salto de layout.
 */
export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
