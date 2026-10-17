import { criarClienteServidor } from "@/lib/supabase/servidor";
import { CONTEXTOS_PESAGEM, ROTULO_CONTEXTO } from "@/lib/dados/contextos-de-pesagem";

// Reexportado para as telas de servidor importarem de um lugar só.
export { CONTEXTOS_PESAGEM, ROTULO_CONTEXTO };


export interface Pesagem {
  id: string;
  data: string;
  pesoGramas: number;
  contexto: string | null;
  observacoes: string | null;
  /** Diferença para a pesagem anterior, em gramas. Null na primeira. */
  variacao: number | null;
  /** Dias desde a pesagem anterior — o ganho só se lê junto com o intervalo. */
  diasDesdeAnterior: number | null;
}

export interface HistoricoPeso {
  aveId: string;
  nome: string | null;
  dtNascimento: string | null;
  pesagens: Pesagem[];
}

/**
 * O histórico de peso da ave, da mais recente para a mais antiga.
 *
 * A variação é calculada aqui e não no banco: ela depende da ordem da série
 * inteira, e uma view por linha teria de refazer a janela a cada leitura.
 */
export async function obterHistoricoPeso(
  aveId: string,
): Promise<HistoricoPeso | null> {
  const supabase = await criarClienteServidor();

  const [{ data: ave }, { data: linhas, error }] = await Promise.all([
    supabase
      .from("passaros")
      .select("id, nome, dt_nascimento")
      .eq("id", aveId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("pesagens")
      .select("id, data, peso_gramas, contexto, observacoes")
      .eq("passaro_id", aveId)
      .is("deleted_at", null)
      .order("data", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (!ave) return null;
  if (error) {
    console.error("obterHistoricoPeso:", error.message);
    return null;
  }

  const crescente = ((linhas ?? []) as Array<{
    id: string;
    data: string;
    peso_gramas: string | number;
    contexto: string | null;
    observacoes: string | null;
  }>).map((l, i, todas) => {
    const peso = Number(l.peso_gramas);
    const anterior = i > 0 ? todas[i - 1] : null;
    return {
      id: l.id,
      data: l.data,
      pesoGramas: peso,
      contexto: l.contexto,
      observacoes: l.observacoes,
      variacao: anterior ? peso - Number(anterior.peso_gramas) : null,
      diasDesdeAnterior: anterior ? diasEntre(anterior.data, l.data) : null,
    };
  });

  return {
    aveId: ave.id,
    nome: ave.nome,
    dtNascimento: ave.dt_nascimento,
    // A tela lê de cima para baixo começando pela mais recente; o cálculo da
    // variação precisava da ordem oposta.
    pesagens: crescente.reverse(),
  };
}

function diasEntre(de: string, ate: string): number {
  const a = new Date(`${de}T00:00:00`).getTime();
  const b = new Date(`${ate}T00:00:00`).getTime();
  return Math.round((b - a) / 86_400_000);
}
