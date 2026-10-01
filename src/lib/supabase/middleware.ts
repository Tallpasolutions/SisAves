import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Rotas que não exigem sessão. */
const PUBLICAS = ["/entrar", "/cadastrar", "/recuperar-senha", "/auth", "/v"];

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
  let resposta = NextResponse.next({ request });

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
          resposta = NextResponse.next({ request });
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
