import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Marco, MarcoDesfazivel } from "@/lib/dados/marcos";
import type { EstadoOvo } from "@/lib/dados/estados-do-ovo";
import { formatarData } from "@/lib/formato";

export interface OvoDaNinhada {
  posturaId: string;
  numeroOvo: number | null;
  estado: EstadoOvo;
  dataPostura: string;
  ovoscopiaEm: string | null;
  fertil: boolean | null;
  dataEclosao: string | null;
  dataAnilhamento: string | null;
  dataSeparacao: string | null;
  desfechoEm: string | null;
  desfechoMotivo: string | null;
  previsaoOvoscopia: string | null;
  previsaoEclosao: string | null;
  previsaoAnilhamento: string | null;
  previsaoSeparacao: string | null;
  limiteAnilhamento: string | null;
  anilhamentoVencido: boolean;
  /** Preenchido quando o filhote já foi anilhado e virou ave no plantel. */
  passaroId: string | null;
  /** Os marcos que fazem sentido para este ovo hoje. Vazio = fora do ciclo. */
  marcos: Marco[];
  /** O que já foi registrado e ainda pode ser desfeito, se tiver sido engano. */
  desfaziveis: MarcoDesfazivel[];
}

export interface NinhadaCompleta {
  ninhadaId: string;
  ninhadaNumero: number | null;
  casalId: string;
  casalNumero: number;
  especie: string | null;
  dataPostura: string;
  ovos: OvoDaNinhada[];
  /** Ovos esperando anilha: a ação tem tela própria, com o número do anel. */
  paraAnilhar: number;
  /** Ovos que ainda aceitam alguma marca. */
  emCurso: number;
}

interface Linha {
  id: string;
  casal_id: string;
  casal_numero: number;
  ninhada_numero: number | null;
  numero_ovo: number | null;
  data_postura: string;
  ovoscopia_em: string | null;
  fertil: boolean | null;
  data_eclosao: string | null;
  data_anilhamento: string | null;
  data_separacao: string | null;
  desfecho: string | null;
  desfecho_em: string | null;
  desfecho_motivo: string | null;
  passaro_id: string | null;
  especie_nome: string | null;
  situacao: EstadoOvo;
  previsao_ovoscopia: string | null;
  previsao_eclosao: string | null;
  previsao_anilhamento: string | null;
  previsao_separacao: string | null;
  limite_anilhamento: string | null;
  anilhamento_vencido: boolean;
}

/**
 * A ninhada ovo por ovo, com o que cada um aceita de marca hoje.
 *
 * Quem decide os marcos é esta função, e não a tela: a mesma regra precisa
 * valer para o que o botão oferece e para o que `registrar_marcos` aceita, e
 * duplicá-la em TSX é como as duas versões divergem.
 */
export async function obterNinhada(
  ninhadaId: string,
): Promise<NinhadaCompleta | null> {
  const supabase = await criarClienteServidor();

  const { data, error } = await supabase
    .from("vw_posturas")
    // Literal numa linha só: o cliente do Supabase deriva o tipo do retorno
    // da própria string, e concatenar apaga essa inferência.
    .select(
      "id, casal_id, casal_numero, ninhada_numero, numero_ovo, data_postura, ovoscopia_em, fertil, data_eclosao, data_anilhamento, data_separacao, desfecho, desfecho_em, desfecho_motivo, passaro_id, especie_nome, situacao, previsao_ovoscopia, previsao_eclosao, previsao_anilhamento, previsao_separacao, limite_anilhamento, anilhamento_vencido",
    )
    .eq("ninhada_id", ninhadaId)
    .order("numero_ovo", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("obterNinhada:", error.message);
    return null;
  }

  const linhas = (data ?? []) as Linha[];
  if (linhas.length === 0) return null;

  const ovos = linhas.map(paraOvo);

  return {
    ninhadaId,
    ninhadaNumero: linhas[0].ninhada_numero,
    casalId: linhas[0].casal_id,
    casalNumero: linhas[0].casal_numero,
    especie: linhas[0].especie_nome,
    dataPostura: linhas[0].data_postura,
    ovos,
    paraAnilhar: ovos.filter((o) => o.estado === "anilhar").length,
    emCurso: ovos.filter((o) => o.marcos.length > 0).length,
  };
}

function paraOvo(l: Linha): OvoDaNinhada {
  return {
    posturaId: l.id,
    numeroOvo: l.numero_ovo,
    estado: l.situacao,
    dataPostura: l.data_postura,
    ovoscopiaEm: l.ovoscopia_em,
    fertil: l.fertil,
    dataEclosao: l.data_eclosao,
    dataAnilhamento: l.data_anilhamento,
    dataSeparacao: l.data_separacao,
    desfechoEm: l.desfecho_em,
    desfechoMotivo: l.desfecho_motivo,
    previsaoOvoscopia: l.previsao_ovoscopia,
    previsaoEclosao: l.previsao_eclosao,
    previsaoAnilhamento: l.previsao_anilhamento,
    previsaoSeparacao: l.previsao_separacao,
    limiteAnilhamento: l.limite_anilhamento,
    anilhamentoVencido: l.anilhamento_vencido,
    passaroId: l.passaro_id,
    marcos: marcosDisponiveis(l),
    desfaziveis: marcosDesfaziveis(l),
  };
}

/**
 * O que dá para desfazer neste ovo.
 *
 * Espelha as guardas de `desfazer_marco` (0023). A função do banco é a
 * garantia; isto é o que a tela oferece, e as duas precisam concordar — botão
 * que existe para ser recusado é botão que ensina a desconfiar da tela.
 */
function marcosDesfaziveis(l: Linha): MarcoDesfazivel[] {
  const desfaziveis: MarcoDesfazivel[] = [];

  if (l.desfecho !== null) desfaziveis.push("desfecho");
  if (l.data_separacao !== null) desfaziveis.push("separacao");

  // Anilhado, o filhote virou ave no plantel e a eclosão é o fato que o criou.
  if (l.data_eclosao !== null && l.data_anilhamento === null && l.data_separacao === null) {
    desfaziveis.push("eclosao");
  }

  // Ovo claro desfaz-se pelo desfecho, que devolve a ovoscopia junto.
  if (l.ovoscopia_em !== null && l.desfecho !== "infertil" && l.data_eclosao === null) {
    desfaziveis.push("ovoscopia");
  }

  return desfaziveis;
}

/**
 * Quais marcas o ovo aceita, derivado dos fatos já gravados — as mesmas
 * condições que a função do banco verifica.
 *
 * Nenhuma marca depende de prazo. Oferecer "Nasceu" só perto da previsão
 * pareceria mais arrumado e seria uma armadilha: eclosão fora do prazo
 * acontece, e o criador precisa registrar o que viu, não o que era esperado.
 */
function marcosDisponiveis(l: Linha): Marco[] {
  // Fora do ciclo: declarado perdido, declarado claro, ou já separado.
  if (l.desfecho !== null || l.fertil === false || l.data_separacao !== null) {
    return [];
  }

  const marcos: Marco[] = [];

  if (l.data_eclosao === null) {
    // Ovoscopia só antes da eclosão, e só uma vez: refazê-la é edição.
    if (l.ovoscopia_em === null) marcos.push("fertil", "infertil");
    marcos.push("eclodiu");
  }

  // Separar exige anilha. A função do banco recusa o contrário, porque
  // 'separado' é terminal e apagaria a janela de anilhamento.
  if (l.data_anilhamento !== null) marcos.push("separado");

  marcos.push("perdido");
  return marcos;
}

/**
 * O que vem a seguir nesta ninhada, com data.
 *
 * Alimenta a consequência da confirmação — o contrato pede fato + consequência
 * com data, e a data que interessa é a do próximo passo no galpão.
 */
export function proximoPasso(n: NinhadaCompleta): string | null {
  const prazos: Array<{ data: string; frase: string }> = [];

  for (const o of n.ovos) {
    if (o.marcos.length === 0) continue;

    if (o.estado === "anilhar" && o.limiteAnilhamento) {
      prazos.push({
        data: o.limiteAnilhamento,
        frase: o.anilhamentoVencido
          ? `Anilhamento atrasado desde ${formatarData(o.limiteAnilhamento)}.`
          : `Anilhar até ${formatarData(o.limiteAnilhamento)}.`,
      });
    } else if (o.dataEclosao === null && o.ovoscopiaEm === null && o.previsaoOvoscopia) {
      prazos.push({
        data: o.previsaoOvoscopia,
        frase: `Ovoscopia prevista para ${formatarData(o.previsaoOvoscopia)}.`,
      });
    } else if (o.dataEclosao === null && o.previsaoEclosao) {
      prazos.push({
        data: o.previsaoEclosao,
        frase: `Eclosão prevista para ${formatarData(o.previsaoEclosao)}.`,
      });
    } else if (o.dataAnilhamento === null && o.previsaoAnilhamento) {
      // Filhote nascido e ainda sem anilha: a janela do anel vem antes da
      // separação, e é o prazo que fecha.
      prazos.push({
        data: o.previsaoAnilhamento,
        frase: `Anilhamento previsto para ${formatarData(o.previsaoAnilhamento)}.`,
      });
    } else if (o.dataSeparacao === null && o.previsaoSeparacao) {
      prazos.push({
        data: o.previsaoSeparacao,
        frase: `Separação prevista para ${formatarData(o.previsaoSeparacao)}.`,
      });
    }
  }

  if (prazos.length === 0) return null;
  prazos.sort((a, b) => a.data.localeCompare(b.data));
  return prazos[0].frase;
}
