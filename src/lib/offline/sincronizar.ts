"use client";

import {
  listar,
  paraFormData,
  registrarFalha,
  remover,
  type ItemFila,
  type TipoEscrita,
} from "./fila";

/**
 * O que a Server Action devolve quando não deu certo. Toda ação do SisAves
 * segue esta forma: `erro` geral ou `campos`/`porFilhote` por campo.
 */
export interface RespostaAcao {
  erro?: string;
  campos?: Record<string, string>;
  porFilhote?: Record<string, string>;
}

export type Executor = (dados: FormData) => Promise<RespostaAcao | void>;

export interface ResultadoSincronizacao {
  enviados: number;
  pendentes: number;
  falhas: number;
}

/**
 * Erro de dado não se resolve tentando de novo.
 *
 * Uma anilha que já existe no plantel vai continuar existindo na décima
 * tentativa. Reenviar para sempre encheria a fila de lixo e esconderia o que
 * ainda tem chance. Estes ficam parados, com o erro guardado, para o criador
 * resolver — e é por isso que a tela lista os pendentes com o motivo.
 */
function ehErroDeDado(resposta: RespostaAcao): boolean {
  return Boolean(resposta.campos || resposta.porFilhote);
}

/**
 * O servidor já tinha aplicado esta escrita.
 *
 * Acontece quando a primeira tentativa chegou e só a resposta se perdeu — o
 * caso clássico de rede ruim. A chave é a mesma, então o banco recusa a
 * duplicata, e isso é SUCESSO: o registro está lá. Tratar como falha deixaria
 * o item pendente para sempre.
 */
function jaAplicado(resposta: RespostaAcao): boolean {
  const mensagens = [
    resposta.erro,
    ...Object.values(resposta.campos ?? {}),
    ...Object.values(resposta.porFilhote ?? {}),
  ].filter(Boolean) as string[];

  return mensagens.some(
    (m) => m.includes("já foi anilhado") || m.includes("já foi registrado"),
  );
}

/** Espera crescente entre tentativas: 1min, 2, 4, 8… até 30min. */
export function esperaDaTentativa(tentativas: number): number {
  return Math.min(30, 2 ** Math.max(0, tentativas - 1)) * 60_000;
}

function podeTentar(item: ItemFila, agora: number): boolean {
  if (item.tentativas === 0) return true;
  // `criadoEm` não muda; a espera conta do último registro de falha, que é
  // aproximado por tentativas — suficiente para não martelar o servidor.
  return agora - item.criadoEm >= esperaDaTentativa(item.tentativas);
}

/**
 * Esvazia a fila, em ordem de registro.
 *
 * A ordem importa: anilhar um filhote antes de cadastrar o casal que o gerou
 * falharia, e a ordem em que o criador registrou é a ordem correta por
 * construção. Por isso o primeiro item que falha interrompe a rodada — seguir
 * em frente embaralharia a dependência.
 */
export async function sincronizar(
  executores: Record<TipoEscrita, Executor>,
): Promise<ResultadoSincronizacao> {
  const itens = await listar();
  const agora = Date.now();
  let enviados = 0;
  let falhas = 0;

  for (const item of itens) {
    if (!podeTentar(item, agora)) continue;

    try {
      // A ação redireciona em caso de sucesso; no cliente isso vira exceção
      // de navegação, que também significa "deu certo".
      const resposta = (await executores[item.tipo](paraFormData(item))) ?? {};

      if (!resposta.erro && !ehErroDeDado(resposta)) {
        await remover(item.id);
        enviados += 1;
        continue;
      }

      if (jaAplicado(resposta)) {
        await remover(item.id);
        enviados += 1;
        continue;
      }

      const motivo =
        resposta.erro ??
        Object.values(resposta.campos ?? resposta.porFilhote ?? {})[0] ??
        "Não foi possível enviar.";

      await registrarFalha(item.id, motivo);
      falhas += 1;

      // Erro de dado não melhora com o tempo, mas também não impede o
      // próximo: ele é de outro registro. Erro de rede, sim — a rodada para.
      if (!ehErroDeDado(resposta)) break;
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : String(erro);
      // Redirecionamento do Next não é falha: é o sucesso da Server Action.
      if (mensagem.includes("NEXT_REDIRECT")) {
        await remover(item.id);
        enviados += 1;
        continue;
      }
      await registrarFalha(item.id, "Sem conexão com o servidor.");
      falhas += 1;
      break;
    }
  }

  const restantes = await listar();
  return { enviados, pendentes: restantes.length, falhas };
}
