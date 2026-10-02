"use client";

/**
 * Fila de escrita no aparelho.
 *
 * O galpão não tem sinal. Quando a rede falha, o registro não se perde nem
 * finge que subiu: ele fica aqui, o criador vê quantos estão pendentes, e eles
 * sobem sozinhos quando o sinal voltar.
 *
 * IndexedDB e não localStorage porque isto é dado do criatório, não preferência
 * de interface: precisa sobreviver a fechar o app e não pode competir pelos
 * 5 MB de um armazenamento síncrono que trava a thread da interface.
 */

const BANCO = "sisaves-offline";
const DEPOSITO = "fila";
const VERSAO = 1;

export type TipoEscrita = "postura" | "anilhamento" | "ave" | "casal";

export interface ItemFila {
  /**
   * Gerado no cliente e usado como chave primária da linha no Postgres.
   * É o que torna o reenvio idempotente: se a primeira tentativa chegou ao
   * servidor e só a resposta se perdeu, a segunda bate na chave e é
   * reconhecida como já aplicada, em vez de duplicar a ninhada.
   */
  id: string;
  tipo: TipoEscrita;
  /** Pares, não objeto: `postura_id` se repete no anilhamento. */
  campos: Array<[string, string]>;
  /** "Postura · Casal 04 · 5 ovos" — o que o criador lê na lista de pendentes. */
  resumo: string;
  criadoEm: number;
  tentativas: number;
  ultimoErro?: string;
}

function abrir(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const pedido = indexedDB.open(BANCO, VERSAO);
    pedido.onupgradeneeded = () => {
      const bd = pedido.result;
      if (!bd.objectStoreNames.contains(DEPOSITO)) {
        const deposito = bd.createObjectStore(DEPOSITO, { keyPath: "id" });
        // A ordem de envio é a ordem em que o criador registrou: anilhar antes
        // de cadastrar o pai inverteria a genealogia.
        deposito.createIndex("criadoEm", "criadoEm");
      }
    };
    pedido.onsuccess = () => resolve(pedido.result);
    pedido.onerror = () => reject(pedido.error);
  });
}

async function comDeposito<T>(
  modo: IDBTransactionMode,
  executar: (deposito: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const bd = await abrir();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transacao = bd.transaction(DEPOSITO, modo);
      const pedido = executar(transacao.objectStore(DEPOSITO));
      pedido.onsuccess = () => resolve(pedido.result);
      pedido.onerror = () => reject(pedido.error);
      transacao.onabort = () => reject(transacao.error);
    });
  } finally {
    bd.close();
  }
}

/** O ambiente pode não ter IndexedDB (janela privada, navegador antigo). */
export function filaDisponivel(): boolean {
  return typeof indexedDB !== "undefined";
}

export async function enfileirar(
  item: Omit<ItemFila, "criadoEm" | "tentativas">,
): Promise<void> {
  await comDeposito("readwrite", (d) =>
    d.put({ ...item, criadoEm: Date.now(), tentativas: 0 }),
  );
}

/** Em ordem de registro — é a ordem em que precisam chegar ao servidor. */
export async function listar(): Promise<ItemFila[]> {
  const itens = await comDeposito<ItemFila[]>("readonly", (d) => d.getAll());
  return itens.sort((a, b) => a.criadoEm - b.criadoEm);
}

export async function contar(): Promise<number> {
  return comDeposito<number>("readonly", (d) => d.count());
}

export async function remover(id: string): Promise<void> {
  await comDeposito("readwrite", (d) => d.delete(id));
}

export async function registrarFalha(id: string, erro: string): Promise<void> {
  const bd = await abrir();
  try {
    await new Promise<void>((resolve, reject) => {
      const transacao = bd.transaction(DEPOSITO, "readwrite");
      const deposito = transacao.objectStore(DEPOSITO);
      const leitura = deposito.get(id);
      leitura.onsuccess = () => {
        const item = leitura.result as ItemFila | undefined;
        if (!item) return resolve();
        deposito.put({ ...item, tentativas: item.tentativas + 1, ultimoErro: erro });
      };
      transacao.oncomplete = () => resolve();
      transacao.onerror = () => reject(transacao.error);
      transacao.onabort = () => reject(transacao.error);
    });
  } finally {
    bd.close();
  }
}

/**
 * O FormData que a Server Action recebe, montado de volta a partir da fila.
 *
 * `reenvio` avisa a ação de que não há ninguém olhando: ela grava e devolve,
 * sem `redirect`. Sem essa marca, esvaziar a fila em segundo plano arrastava o
 * criador para a tela de destino da escrita — ele podia estar no meio de outra
 * coisa, no galpão, quando o sinal voltou.
 */
export function paraFormData(item: ItemFila): FormData {
  const dados = new FormData();
  for (const [chave, valor] of item.campos) dados.append(chave, valor);
  dados.set("reenvio", "1");
  return dados;
}

/** "Postura · Casal 04 · 5 ovos · 06/09 06:10" — a linha da lista de pendentes. */
export function descreverItem(item: ItemFila): string {
  const d = new Date(item.criadoEm);
  const quando = d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${item.resumo} · ${quando.replace(", ", " ")}`;
}
