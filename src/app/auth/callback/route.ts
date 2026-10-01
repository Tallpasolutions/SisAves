import { NextResponse, type NextRequest } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/servidor";

/**
 * Volta do OAuth e do link de confirmação de e-mail: troca o código por sessão.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const destino = searchParams.get("destino") ?? "/";

  if (code) {
    const supabase = await criarClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${destino}`);
  }

  return NextResponse.redirect(`${origin}/entrar?erro=callback`);
}
