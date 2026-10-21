import type { MetadataRoute } from "next";

/**
 * O que o robô pode varrer.
 *
 * A landing e nada mais. O que está atrás de login não precisa ser bloqueado
 * por aqui — o `proxy.ts` já devolve 307 para quem não tem sessão —, mas
 * declarar é melhor que depender disso: regra em arquivo é auditável, redirect
 * é comportamento.
 *
 * `/v/` fica de FORA do bloqueio de propósito. É a validação pública do
 * certificado, e ela existe justamente para ser alcançável. Mas também não
 * entra no sitemap: são milhares de códigos que só interessam a quem tem o
 * papel na mão.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/cro/",
        "/comecar",
        "/painel",
        "/plantel",
        "/casais",
        "/ovos",
        "/hoje",
        "/genealogia",
        "/saude",
        "/financeiro",
        "/certificados",
        "/relatorios",
        "/configuracoes",
        "/assinatura",
        "/perfil",
        "/mais",
        "/notificacoes",
        "/especies",
        "/ds",
      ],
    },
    sitemap: "https://sisaves.tallpa.com.br/sitemap.xml",
  };
}
