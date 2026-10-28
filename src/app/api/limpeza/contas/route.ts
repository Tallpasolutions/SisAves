import { createClient } from "@supabase/supabase-js";

/**
 * Apaga, uma vez por dia, as contas que nunca confirmaram o e-mail.
 *
 * Quem chama é o cron da Vercel, configurado em `vercel.json`. A Vercel manda
 * `Authorization: Bearer <CRON_SECRET>` nas requisições que ela mesma dispara,
 * e **sem esse segredo a rota recusa** — ela está fora do `proxy.ts`, como o
 * webhook do Mercado Pago, porque quem chama não tem sessão.
 *
 * A regra de quem pode ser apagado mora na função
 * `limpar_contas_abandonadas()`, não aqui. Esta rota só decide se a chamada é
 * legítima e registra o que aconteceu.
 */
export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET;

  /*
   * Sem segredo configurado a rota NÃO roda.
   *
   * O contrário seria pior do que parece: uma rota pública que apaga contas,
   * esperando que ninguém descubra o endereço.
   */
  if (!segredo) {
    console.error("limpeza/contas: CRON_SECRET ausente");
    return new Response(null, { status: 500 });
  }

  if (request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return new Response(null, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    console.error("limpeza/contas: Supabase do servidor não configurado");
    return new Response(null, { status: 500 });
  }

  const supabase = createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // `simular` na query permite ver o que sairia sem apagar nada. Útil na
  // primeira vez que alguém liga isto, e depois de mudar a regra.
  const simular = new URL(request.url).searchParams.get("simular") === "1";

  const { data, error } = await supabase.rpc("limpar_contas_abandonadas", {
    p_dias: 1,
    p_simular: simular,
  });

  if (error) {
    console.error("limpar_contas_abandonadas:", error.message);
    return new Response(null, { status: 500 });
  }

  const contas = (data ?? []) as { email: string; apagada: boolean }[];

  // O log é o único rastro de uma remoção automática. Sem ele, uma conta
  // somem e ninguém sabe quando nem qual.
  for (const c of contas) {
    console.log(
      `limpeza/contas: ${c.apagada ? "apagada" : "apagaria"} ${c.email}`,
    );
  }

  return Response.json({
    simulado: simular,
    quantidade: contas.length,
    contas: contas.map((c) => c.email),
  });
}
