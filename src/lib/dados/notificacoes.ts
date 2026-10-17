import { criarClienteServidor } from "@/lib/supabase/servidor";

export interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  corpo: string | null;
  link: string | null;
  lidaEm: string | null;
  criadaEm: string;
  dia: string | null;
}

export const TOM_NOTIFICACAO: Record<string, "acao" | "neutro" | "info"> = {
  anilhar: "acao",
  verificar: "neutro",
  separar: "neutro",
  sistema: "info",
};

/**
 * Os avisos, com os do dia gerados na hora.
 *
 * Enquanto não houver agendador, é o próprio uso que materializa a agenda — e
 * é por isso que o push ainda não substitui abrir o aplicativo. A função do
 * banco é idempotente por (usuário, tipo, postura, dia), então chamar aqui a
 * cada abertura não multiplica nada.
 */
export async function listarNotificacoes(): Promise<{
  notificacoes: Notificacao[];
  naoLidas: number;
}> {
  const supabase = await criarClienteServidor();

  const { error: erroGerar } = await supabase.rpc("gerar_notificacoes");
  if (erroGerar) console.error("gerar_notificacoes:", erroGerar.message);

  const { data, error } = await supabase
    .from("notificacoes")
    .select("id, tipo, titulo, corpo, link, lida_em, created_at, referencia_dia")
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    console.error("listarNotificacoes:", error.message);
    return { notificacoes: [], naoLidas: 0 };
  }

  const notificacoes = ((data ?? []) as Array<{
    id: string;
    tipo: string;
    titulo: string;
    corpo: string | null;
    link: string | null;
    lida_em: string | null;
    created_at: string;
    referencia_dia: string | null;
  }>).map((n) => ({
    id: n.id,
    tipo: n.tipo,
    titulo: n.titulo,
    corpo: n.corpo,
    link: n.link,
    lidaEm: n.lida_em,
    criadaEm: n.created_at,
    dia: n.referencia_dia,
  }));

  return {
    notificacoes,
    naoLidas: notificacoes.filter((n) => n.lidaEm === null).length,
  };
}

/**
 * O push depende de uma chave VAPID que ainda não existe.
 *
 * Sem ela o navegador não assina nada, e um botão "Ativar avisos" que não
 * ativa avisos é pior que a ausência dele. A tela pergunta por isto e diz o
 * que falta, em vez de prometer.
 */
export function pushConfigurado(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
}
