import type { NextRequest } from "next/server";
import { atualizarSessao } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return atualizarSessao(request);
}

export const config = {
  matcher: [
    // Tudo, menos estáticos e imagens — não faz sentido validar sessão para
    // buscar um ícone, e cada passagem aqui é uma ida ao Supabase.
    "/((?!_next/static|_next/image|favicon.ico|brand/|icons/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|webmanifest)$).*)",
  ],
};
