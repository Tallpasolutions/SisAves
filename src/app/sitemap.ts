import type { MetadataRoute } from "next";

/**
 * O mapa do site.
 *
 * Só o que é público E vale indexar. As páginas de validação (`/v/<codigo>`)
 * são públicas mas ficam fora: são uma por certificado emitido, não têm
 * audiência de busca, e listá-las entregaria a um varredor a lista inteira dos
 * códigos — justamente o que o hash aleatório do certificado existe para
 * impedir.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://sisaves.tallpa.com.br";
  const agora = new Date();

  return [
    { url: base, lastModified: agora, changeFrequency: "monthly", priority: 1 },
    {
      url: `${base}/entrar`,
      lastModified: agora,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
