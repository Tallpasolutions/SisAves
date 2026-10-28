import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Rotas que não exigem sessão. */
// `/offline` é a tela que o service worker serve quando não há rede. Exigir
// sessão nela seria pedir uma ida ao servidor justamente quando não há
// servidor alcançável.
const PUBLICAS = [
  // A landing. Note que `${p}/` para "/" vira "//", que nenhum caminho real
  // começa — então isto libera a raiz e nada mais.
  "/",
  "/entrar",
  "/cadastrar",
  "/recuperar-senha",
  "/auth",
  "/v",
  // A folha do CRO pela porta pública: quem recebeu a ave precisa poder
  // imprimir a via que lhe entregaram, e não tem login.
  "/cro/publico",
  "/offline",
  /*
   * O cartão de compartilhamento. Quem busca esta imagem é o robô do WhatsApp
   * (ou do Telegram, ou do LinkedIn), que não tem cookie nenhum: com sessão
   * exigida, ele recebia um 307 para a tela de login e o resumo saía sem
   * imagem. Não há o que proteger aqui — é a marca e uma frase.
   */
  "/opengraph-image",
  /*
   * O mapa do site e as regras de varredura. Mesmo caso do cartão acima: quem
   * busca estes arquivos é um robô sem cookie, e com sessão exigida ele recebia
   * 307 para /entrar — ou seja, o Google leria a tela de login no lugar do
   * sitemap, e nunca saberia que a landing existe.
   */
  "/robots.txt",
  "/sitemap.xml",
  /*
   * O webhook do Mercado Pago. Quem posta aqui é o servidor deles, que não tem
   * cookie nenhum: com sessão exigida ele recebia 307 para /entrar e a
   * notificação do pagamento nunca chegava — o criador pagaria e continuaria
   * vencido. A rota não fica desprotegida por isso: ela valida HMAC-SHA256 do
   * `x-signature` antes de olhar o corpo.
   */
  "/api/mercadopago",
  /*
   * A limpeza diária de contas não confirmadas. Quem chama é o cron da
   * Vercel, que não tem cookie — com sessão exigida ele receberia 307 e a
   * rotina nunca rodaria. A rota exige `Authorization: Bearer <CRON_SECRET>`
   * e recusa qualquer chamada sem ele.
   */
  "/api/limpeza",
];

function ehPublica(pathname: string) {
  return PUBLICAS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Renova a sessão a cada navegação e barra rota privada sem login.
 *
 * O `getUser()` é obrigatório aqui: ele revalida o token no servidor do
 * Supabase. Ler a sessão do cookie sem validar aceitaria um cookie forjado.
 */
export async function atualizarSessao(request: NextRequest) {
  /*
   * A rota, para o layout do app poder decidir o bloqueio sem descobrir onde
   * está. Um Server Component não enxerga o caminho — `usePathname` é de
   * cliente —, e fazer a checagem aqui no middleware custaria uma ida ao banco
   * a cada navegação, inclusive nas telas que já consultam.
   */
  // Um `Headers` NOVO, não `request.headers.set(...)`.
  //
  // Mutar o objeto original não propaga: o cabeçalho não chegava ao layout,
  // `caminho` vinha vazio, `"".startsWith("/assinatura")` dava falso, e o
  // layout redirecionava para /assinatura a partir da própria /assinatura.
  // Laço infinito, tela branca, e o log com dezenas de GET seguidos.
  const cabecalhos = new Headers(request.headers);
  cabecalhos.set("x-caminho", request.nextUrl.pathname);

  let resposta = NextResponse.next({ request: { headers: cabecalhos } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          resposta = NextResponse.next({ request: { headers: cabecalhos } });
          for (const { name, value, options } of cookiesToSet) {
            resposta.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !ehPublica(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    // Volta para onde a pessoa queria ir depois de entrar.
    if (pathname !== "/") url.searchParams.set("destino", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/entrar" || pathname === "/cadastrar")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return resposta;
}
