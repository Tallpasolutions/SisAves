/*
 * Service worker do SisAves — escrito à mão, de propósito.
 *
 * O plugin do Serwist é de webpack e o Next 16 usa Turbopack por padrão; não
 * há suporte ainda (serwist/serwist#54). Tirar o build inteiro do Turbopack
 * por um plugin custaria mais do que estas 120 linhas, e o que este app precisa
 * não é precache de shell estático: toda rota é dinâmica e exige sessão. O que
 * ele precisa é REABRIR o que já foi visto e não perder o que foi digitado.
 *
 * O que este arquivo faz:
 *   - guarda a última resposta de cada página visitada e a devolve sem rede;
 *   - faz o mesmo com a carga RSC da navegação interna;
 *   - nunca serve escrita do cache — uma Server Action respondida do cache
 *     diria "salvo" sem ter salvo nada, que é o que o contrato proíbe.
 *
 * A fila de escrita offline NÃO está aqui: ela é da aplicação, em
 * src/lib/offline/, porque precisa mostrar ao criador o que está pendente.
 */

const VERSAO = "v1";
const PAGINAS = `sisaves-paginas-${VERSAO}`;
const ESTATICOS = `sisaves-estaticos-${VERSAO}`;
const RECURSO_OFFLINE = "/offline";

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    (async () => {
      // A tela de recurso tem de existir antes da primeira falha de rede.
      const cache = await caches.open(PAGINAS);
      await cache.add(new Request(RECURSO_OFFLINE, { cache: "reload" }));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    (async () => {
      // Cache de versão anterior só ocupa espaço no aparelho do criador.
      const nomes = await caches.keys();
      await Promise.all(
        nomes
          .filter((n) => n.startsWith("sisaves-") && !n.endsWith(VERSAO))
          .map((n) => caches.delete(n)),
      );
      await self.clients.claim();
    })(),
  );
});

/** Rede primeiro, cache como rede de segurança. */
async function redePrimeiro(requisicao, nomeDoCache) {
  const cache = await caches.open(nomeDoCache);
  try {
    const resposta = await fetch(requisicao);
    // Só guarda o que veio inteiro: resposta parcial ou de erro no cache
    // reapareceria depois como se fosse o estado real do plantel.
    if (resposta && resposta.ok && resposta.type === "basic") {
      cache.put(requisicao, resposta.clone());
    }
    return resposta;
  } catch (erro) {
    const guardada = await cache.match(requisicao);
    if (guardada) return guardada;
    throw erro;
  }
}

/** Imutável por natureza: uma vez no cache, não muda mais. */
async function cachePrimeiro(requisicao, nomeDoCache) {
  const cache = await caches.open(nomeDoCache);
  const guardada = await cache.match(requisicao);
  if (guardada) return guardada;

  const resposta = await fetch(requisicao);
  if (resposta && resposta.ok) cache.put(requisicao, resposta.clone());
  return resposta;
}

self.addEventListener("fetch", (evento) => {
  const { request: requisicao } = evento;
  const url = new URL(requisicao.url);

  // Escrita não passa por aqui. Sem rede ela falha, e o formulário põe o
  // registro na fila do aparelho — com o criador vendo que ficou pendente.
  if (requisicao.method !== "GET") return;

  // Só o próprio site. Supabase, fontes e qualquer terceiro seguem direto.
  if (url.origin !== self.location.origin) return;

  // O próprio service worker nunca vem do cache, senão uma correção nele
  // nunca chega ao aparelho.
  if (url.pathname === "/sw.js") return;

  // Build do Next: o nome do arquivo já carrega o hash do conteúdo.
  if (url.pathname.startsWith("/_next/static/")) {
    evento.respondWith(cachePrimeiro(requisicao, ESTATICOS));
    return;
  }

  // Carga RSC da navegação dentro do app.
  if (url.searchParams.has("_rsc")) {
    evento.respondWith(redePrimeiro(requisicao, PAGINAS));
    return;
  }

  if (requisicao.mode === "navigate") {
    evento.respondWith(
      redePrimeiro(requisicao, PAGINAS).catch(async () => {
        // Nunca visitada neste aparelho: não há o que mostrar, e a tela de
        // recurso diz isso em vez de culpar a rede.
        const cache = await caches.open(PAGINAS);
        return (
          (await cache.match(RECURSO_OFFLINE)) ??
          new Response("Sem conexão.", {
            status: 503,
            headers: { "content-type": "text/plain; charset=utf-8" },
          })
        );
      }),
    );
    return;
  }

  // Imagens, favicon, manifest.
  evento.respondWith(redePrimeiro(requisicao, ESTATICOS));
});
