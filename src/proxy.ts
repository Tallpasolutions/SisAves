import type { NextRequest } from "next/server";
import { atualizarSessao } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return atualizarSessao(request);
}

export const config = {
  matcher: [
    // Tudo, menos estáticos e imagens — não faz sentido validar sessão para
    // buscar um ícone, e cada passagem aqui é uma ida ao Supabase.
    //
    // `sw.js` fica de fora por necessidade, não por economia: o service worker
    // é pedido pelo navegador sem contexto de sessão, e um redirect para
    // /entrar faz o registro falhar — sem ele, não há offline nenhum.
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|brand/|icons/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|webmanifest)$).*)",
  ],
};
