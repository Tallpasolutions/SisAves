import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Sexo } from "@/components/ui";

export interface NoArvore {
  id: string;
  nome: string | null;
  sexo: Sexo;
  especie: string | null;
  mutacao: string | null;
  anilha: {
    sigla: string | null;
    criador: string | null;
    ano: number | null;
    numero: number | null;
  };
  /** Aparece em mais de um ramo da árvore. */
  repetido: boolean;
}

export interface AncestralRepetido {
  no: NoArvore;
  /** Como o criador lê: "avô paterno e avô materno". */
  posicoes: string[];
}

export interface Arvore {
  raiz: NoArvore;
  /** Slots fixos, na ordem em que a tela os desenha. Null = desconhecido. */
  pais: Array<{ caminho: string; rotulo: string; no: NoArvore | null }>;
  avos: Array<{ caminho: string; rotulo: string; no: NoArvore | null }>;
  repetidos: AncestralRepetido[];
  /** Endogamia da própria ave: o parentesco entre o pai e a mãe dela. */
  endogamiaPct: number | null;
  /** Quantos ancestrais a árvore realmente tem, fora a raiz. */
  conhecidos: number;
  /** Até onde a linhagem está registrada de fato — não a profundidade pedida. */
  geracoesRegistradas: number;
}

/**
 * Como o criador nomeia cada posição. A tela usa isto no aviso de repetição —
 * "é avô paterno e avô materno" diz muito mais que "aparece em pp e mp".
 */
const ROTULO_CAMINHO: Record<string, string> = {
  p: "Pai",
  m: "Mãe",
  pp: "Avô paterno",
  pm: "Avó paterna",
  mp: "Avô materno",
  mm: "Avó materna",
};

const CAMINHOS_PAIS = ["p", "m"];
const CAMINHOS_AVOS = ["pp", "pm", "mp", "mm"];

/** Ordem em que o criador lê a árvore: paterno antes de materno. */
const ORDEM = ["raiz", ...CAMINHOS_PAIS, ...CAMINHOS_AVOS];

interface LinhaArvore {
  passaro_id: string;
  nome: string | null;
  anilha_sigla: string | null;
  anilha_criador: string | null;
  anilha_ano: number | null;
  anilha_numero: number | null;
  sexo: Sexo;
  especie_nome: string | null;
  mutacao_nome: string | null;
  geracao: number;
  papel: string;
  caminho: string;
}

export async function obterArvore(passaroId: string): Promise<Arvore | null> {
  const supabase = await criarClienteServidor();

  // A árvore vem da função do banco, não de embeds: o PostgREST não resolve
  // relação auto-referente, e a recursão com o caminho só existe lá.
  const { data, error } = await supabase.rpc("arvore_genealogica", {
    p_passaro_id: passaroId,
    p_geracoes: 3,
  });

  if (error) {
    console.error("arvore_genealogica:", error.message);
    return null;
  }

  const linhas = (data ?? []) as LinhaArvore[];
  const raizLinha = linhas.find((l) => l.caminho === "raiz");
  if (!raizLinha) return null;

  // Um mesmo passaro_id em mais de um caminho é ancestral repetido — o caso que
  // a tela precisa destacar, porque é de onde a endogamia vem.
  const caminhosPorAve = new Map<string, string[]>();
  for (const l of linhas) {
    if (l.caminho === "raiz") continue;
    caminhosPorAve.set(l.passaro_id, [
      ...(caminhosPorAve.get(l.passaro_id) ?? []),
      l.caminho,
    ]);
  }

  const converter = (l: LinhaArvore): NoArvore => ({
    id: l.passaro_id,
    nome: l.nome,
    sexo: l.sexo,
    especie: l.especie_nome,
    mutacao: l.mutacao_nome,
    anilha: {
      sigla: l.anilha_sigla,
      criador: l.anilha_criador,
      ano: l.anilha_ano,
      numero: l.anilha_numero,
    },
    repetido: (caminhosPorAve.get(l.passaro_id)?.length ?? 0) > 1,
  });

  const porCaminho = new Map(linhas.map((l) => [l.caminho, l]));

  const slot = (caminho: string) => ({
    caminho,
    rotulo: ROTULO_CAMINHO[caminho] ?? caminho,
    no: porCaminho.has(caminho) ? converter(porCaminho.get(caminho)!) : null,
  });

  const repetidos: AncestralRepetido[] = [];
  for (const [id, caminhos] of caminhosPorAve) {
    if (caminhos.length < 2) continue;
    const linha = linhas.find((l) => l.passaro_id === id)!;
    repetidos.push({
      no: converter(linha),
      posicoes: caminhos
        .slice()
        .sort((a, b) => ORDEM.indexOf(a) - ORDEM.indexOf(b))
        .map((c) => ROTULO_CAMINHO[c] ?? c),
    });
  }

  const raiz = converter(raizLinha);
  const paiId = porCaminho.get("p")?.passaro_id;
  const maeId = porCaminho.get("m")?.passaro_id;

  return {
    raiz: { ...raiz, repetido: false },
    pais: CAMINHOS_PAIS.map(slot),
    avos: CAMINHOS_AVOS.map(slot),
    repetidos,
    endogamiaPct: await calcularEndogamiaDaAve(paiId, maeId),
    conhecidos: caminhosPorAve.size,
    geracoesRegistradas: linhas.reduce((max, l) => Math.max(max, l.geracao), 0),
  };
}

/**
 * A endogamia DA AVE é o parentesco entre o pai e a mãe dela — não entre ela e
 * alguém. Sem os dois progenitores registrados, não há o que calcular.
 */
async function calcularEndogamiaDaAve(
  paiId?: string,
  maeId?: string,
): Promise<number | null> {
  if (!paiId || !maeId) return null;

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("coeficiente_endogamia", {
    p_macho_id: paiId,
    p_femea_id: maeId,
  });

  if (error) {
    console.error("coeficiente_endogamia:", error.message);
    return null;
  }
  return data !== null ? Number(data) : null;
}

/** "Jacundá (COF 1234 · 2023 · 0001) é avô paterno e avô materno." */
export function descreverRepeticao(r: AncestralRepetido): string {
  const posicoes =
    r.posicoes.length === 2
      ? `${r.posicoes[0].toLowerCase()} e ${r.posicoes[1].toLowerCase()}`
      : r.posicoes
          .map((p, i) =>
            i === r.posicoes.length - 1 ? `e ${p.toLowerCase()}` : p.toLowerCase(),
          )
          .join(", ");
  return `${r.no.nome ?? "Uma ave sem nome"} é ${posicoes}.`;
}

/** "3 gerações" promete o que a árvore talvez não tenha. Diga o que existe. */
export function descreverProfundidade(arvore: Arvore): string {
  if (arvore.geracoesRegistradas === 0) return "sem ancestrais registrados";
  return arvore.geracoesRegistradas === 1
    ? "1 geração registrada"
    : `${arvore.geracoesRegistradas} gerações registradas`;
}
