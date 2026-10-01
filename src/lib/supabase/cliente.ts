import { createBrowserClient } from "@supabase/ssr";

/** Cliente do navegador. Usa a chave anônima — toda leitura passa por RLS. */
export function criarClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
