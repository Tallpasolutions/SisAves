import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Server Component, Server Action e Route Handler.
 *
 * Também usa a chave anônima: a sessão vem do cookie e a RLS continua valendo.
 * A `service_role` nunca entra aqui — ela ignora RLS e fica reservada a
 * migrations, testes e ao webhook de pagamento.
 */
export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component não pode gravar cookie. Quem renova a sessão é o
            // middleware, então ignorar aqui é seguro.
          }
        },
      },
    },
  );
}
