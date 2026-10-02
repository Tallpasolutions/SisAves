"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { cadastrarAve } from "@/app/(app)/plantel/nova/acoes";
import { formarCasal } from "@/app/(app)/casais/novo/acoes";
import { registrarPostura } from "@/app/(app)/casais/[id]/postura/acoes";
import { anilharFilhotes } from "@/app/(app)/ovos/[ninhada]/anilhar/acoes";
import {
  contar,
  descreverItem,
  enfileirar,
  filaDisponivel,
  listar,
  type ItemFila,
  type TipoEscrita,
} from "@/lib/offline/fila";
import { sincronizar, type Executor } from "@/lib/offline/sincronizar";

/**
 * As Server Actions recebem `(estadoAnterior, FormData)`; a fila só guarda o
 * FormData. O estado anterior não importa no reenvio: ele existe para a tela
 * mostrar o erro da tentativa anterior, e aqui não há tela.
 */
const EXECUTORES: Record<TipoEscrita, Executor> = {
  postura: (d) => registrarPostura({}, d),
  anilhamento: (d) => anilharFilhotes({}, d),
  ave: (d) => cadastrarAve({}, d),
  casal: (d) => formarCasal({}, d),
};

export interface EstadoSincronizacao {
  /** O navegador acha que há rede. Não garante que o servidor responde. */
  online: boolean;
  pendentes: ItemFila[];
  enviando: boolean;
  /** "07:42" — hora do último envio bem-sucedido nesta sessão. */
  ultimoEnvio: string | null;
  enfileirarEscrita: (
    item: Omit<ItemFila, "criadoEm" | "tentativas">,
  ) => Promise<void>;
  sincronizarAgora: () => Promise<void>;
}

const Contexto = createContext<EstadoSincronizacao | null>(null);

export function useSincronizacao(): EstadoSincronizacao {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error("useSincronizacao exige <ProvedorSincronizacao> acima.");
  }
  return contexto;
}

export function ProvedorSincronizacao({ children }: { children: ReactNode }) {
  const router = useRouter();
  // `true` na primeira renderização de propósito: no servidor não há navigator,
  // e começar como offline faria toda tela piscar "sem conexão" ao carregar.
  const [online, setOnline] = useState(true);
  const [pendentes, setPendentes] = useState<ItemFila[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [ultimoEnvio, setUltimoEnvio] = useState<string | null>(null);
  const rodando = useRef(false);

  const atualizarPendentes = useCallback(async () => {
    if (!filaDisponivel()) return;
    try {
      setPendentes(await listar());
    } catch {
      // Janela privada ou armazenamento bloqueado: sem fila, o app segue
      // funcionando online. Não é motivo para quebrar a tela.
    }
  }, []);

  const sincronizarAgora = useCallback(async () => {
    if (!filaDisponivel() || rodando.current) return;
    if ((await contar()) === 0) return;

    rodando.current = true;
    setEnviando(true);
    try {
      const resultado = await sincronizar(EXECUTORES);
      if (resultado.enviados > 0) {
        setUltimoEnvio(
          new Date().toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
        // O que subiu precisa aparecer nas telas, que são renderizadas no
        // servidor: sem isto o plantel seguiria mostrando o estado de antes.
        router.refresh();
      }
      await atualizarPendentes();
    } finally {
      rodando.current = false;
      setEnviando(false);
    }
  }, [atualizarPendentes, router]);

  const enfileirarEscrita = useCallback(
    async (item: Omit<ItemFila, "criadoEm" | "tentativas">) => {
      await enfileirar(item);
      await atualizarPendentes();
    },
    [atualizarPendentes],
  );

  // Registro do service worker. Sem ele o app não abre offline, e aí não
  // adianta ter fila nenhuma.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Em desenvolvimento o SW serviria HTML velho por cima do hot reload.
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker
      // `updateViaCache: "none"` garante que o próprio service worker nunca
      // venha do cache HTTP — sem isso, uma correção nele pode demorar a
      // chegar ao aparelho, e não dá para depender só do cabeçalho.
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((erro) => {
        // Falhar o registro não derruba o app: ele só perde o offline. Mas
        // engolir o motivo em silêncio torna a falha invisível, e aí ninguém
        // descobre que o galpão ficou sem offline. Alguns navegadores
        // embutidos simplesmente não permitem service worker.
        console.warn("SisAves: service worker não registrou —", erro);
      });
  }, []);

  useEffect(() => {
    const aoVoltar = () => {
      setOnline(true);
      void sincronizarAgora();
    };
    const aoCair = () => setOnline(false);

    window.addEventListener("online", aoVoltar);
    window.addEventListener("offline", aoCair);

    /*
     * O arranque fica fora do corpo do efeito, depois da primeira pintura.
     *
     * Não é para contornar o linter: ler o estado da rede, abrir o IndexedDB e
     * disparar envio são trabalho de fundo, e nenhum deles precisa acontecer
     * antes de o criador ver a tela. A tentativa ao abrir existe porque o
     * aparelho pode ter recuperado o sinal com o app fechado — aí o evento
     * `online` nunca chegou.
     */
    const inicio = setTimeout(() => {
      setOnline(navigator.onLine);
      void atualizarPendentes();
      if (navigator.onLine) void sincronizarAgora();
    }, 0);

    return () => {
      clearTimeout(inicio);
      window.removeEventListener("online", aoVoltar);
      window.removeEventListener("offline", aoCair);
    };
  }, [atualizarPendentes, sincronizarAgora]);

  return (
    <Contexto.Provider
      value={{
        online,
        pendentes,
        enviando,
        ultimoEnvio,
        enfileirarEscrita,
        sincronizarAgora,
      }}
    >
      {children}
    </Contexto.Provider>
  );
}

export { descreverItem };
