import type { Metadata } from "next";
import { Bird, Plus, Search } from "lucide-react";
import Link from "next/link";
import { Anilha, Button, EmptyState, SexChip } from "@/components/ui";
import {
  descreverEspecie,
  listarPlantelEmTabela,
  POR_PAGINA,
  type AveNaTabela,
  type FiltrosTabela,
} from "@/lib/dados/plantel";
import { formatarIdade } from "@/lib/formato";
import { FiltrosPlantel, type EstadoFiltros } from "./tabela/FiltrosPlantel";
import { TabelaPlantel } from "./tabela/TabelaPlantel";
import styles from "./plantel.module.css";

export const metadata: Metadata = { title: "Plantel" };

/** Pílulas da B5. No desktop o mesmo recorte vem dos filtros laterais. */
const PILULAS = [
  { valor: "todas", rotulo: "Todas" },
  { valor: "machos", rotulo: "Machos" },
  { valor: "femeas", rotulo: "Fêmeas" },
  { valor: "sem-anilha", rotulo: "Sem anilha" },
] as const;

function comoLista(valor: string | string[] | undefined): string[] {
  if (valor === undefined) return [];
  return Array.isArray(valor) ? valor : [valor];
}

export default async function Plantel({ searchParams }: PageProps<"/plantel">) {
  const params = await searchParams;

  const busca = typeof params.busca === "string" ? params.busca : "";
  const pilula = PILULAS.some((p) => p.valor === params.filtro)
    ? (params.filtro as string)
    : "todas";
  const sexoDaUrl = typeof params.sexo === "string" ? params.sexo : undefined;

  // A pílula do mobile e o segmentado do desktop recortam a mesma coisa: o
  // valor explícito manda, e a pílula entra quando ele não existe.
  const sexo =
    sexoDaUrl ??
    (pilula === "machos" ? "macho" : pilula === "femeas" ? "femea" : "todos");

  const filtros: FiltrosTabela = {
    busca,
    especies: comoLista(params.especie),
    situacoes: comoLista(params.situacao),
    sexo: sexo as FiltrosTabela["sexo"],
    anoAnilha: params.ano ? Number(params.ano) : undefined,
    semAnilha: pilula === "sem-anilha",
    ordem: (typeof params.ordem === "string" ? params.ordem : "anilha") as FiltrosTabela["ordem"],
    direcao: (typeof params.direcao === "string" ? params.direcao : "desc") as "asc" | "desc",
    pagina: params.pagina ? Number(params.pagina) : 1,
  };

  const { aves, total, pagina, paginas, facetas } = await listarPlantelEmTabela(filtros);

  const estado: EstadoFiltros = {
    busca,
    especies: filtros.especies ?? [],
    situacoes: filtros.situacoes ?? [],
    sexo: filtros.sexo ?? "todos",
    anoAnilha: filtros.anoAnilha,
    ordem: filtros.ordem,
    direcao: filtros.direcao,
  };

  /** Mesma URL com a ordenação trocada — clicar na coluna ativa inverte. */
  const hrefOrdenar = (coluna: string) => {
    const p = new URLSearchParams();
    if (busca) p.set("busca", busca);
    for (const e of estado.especies) p.append("especie", e);
    for (const s of estado.situacoes) p.append("situacao", s);
    if (estado.sexo !== "todos") p.set("sexo", estado.sexo);
    if (estado.anoAnilha) p.set("ano", String(estado.anoAnilha));
    p.set("ordem", coluna);
    p.set(
      "direcao",
      estado.ordem === coluna && estado.direcao === "desc" ? "asc" : "desc",
    );
    return `/plantel?${p}`;
  };

  const hrefPagina = (destino: number) => {
    const p = new URLSearchParams();
    if (busca) p.set("busca", busca);
    if (pilula !== "todas") p.set("filtro", pilula);
    for (const e of estado.especies) p.append("especie", e);
    for (const s of estado.situacoes) p.append("situacao", s);
    if (estado.sexo !== "todos") p.set("sexo", estado.sexo);
    if (estado.anoAnilha) p.set("ano", String(estado.anoAnilha));
    if (estado.ordem) p.set("ordem", estado.ordem);
    if (estado.direcao) p.set("direcao", estado.direcao);
    if (destino > 1) p.set("pagina", String(destino));
    return p.size ? `/plantel?${p}` : "/plantel";
  };

  const vazio = aves.length === 0;

  /** Há algum filtro ligado — a contagem passa a ser do recorte, não do total. */
  const temRecorte =
    Boolean(busca) ||
    estado.especies.length > 0 ||
    estado.situacoes.length > 0 ||
    estado.sexo !== "todos" ||
    Boolean(estado.anoAnilha);

  return (
    <div className={styles.tela}>
      {/* --- Cabeçalho: um no mobile, outro no desktop --------------------- */}
      <header className={styles.cabecalho}>
        <div className={styles.cabecalhoTextos}>
          <h1 className={styles.titulo}>Plantel</h1>
          <span className={styles.contagem}>
            {total} {total === 1 ? "ave" : "aves"}
          </span>
        </div>
        <Button href="/plantel/nova" size="lg" className={styles.acaoMobile}>
          Cadastrar ave
        </Button>
      </header>

      <div className={styles.barraDesktop}>
        <form className={styles.buscaDesktop} role="search">
          <span className={styles.buscaIcone} aria-hidden="true">
            <Search size={18} />
          </span>
          <input
            className={styles.buscaEntrada}
            type="search"
            name="busca"
            defaultValue={busca}
            placeholder="Buscar anilha, nome ou mutação"
            aria-label="Buscar no plantel"
          />
        </form>
        {/* A contagem do recorte atual. No celular ela vive no cabeçalho da
            tela; aqui o cabeçalho é a top bar, que não sabe de filtro. Sem
            isto, filtrar não diz quantas aves sobraram. */}
        <span className={styles.contagemDesktop}>
          {total} {total === 1 ? "ave" : "aves"}
          {temRecorte ? " no recorte" : ""}
        </span>

        <span className={styles.espacador} />

        <Button href="/plantel/nova" iconeEsquerda={<Plus size={18} />}>
          Nova ave
        </Button>
      </div>

      {/* --- Busca e pílulas do mobile ------------------------------------- */}
      <form className={styles.busca} role="search">
        <span className={styles.buscaIcone} aria-hidden="true">
          <Search size={18} />
        </span>
        <input
          className={styles.buscaEntrada}
          type="search"
          name="busca"
          defaultValue={busca}
          placeholder="Anilha ou nome da ave"
          aria-label="Buscar no plantel"
        />
        {pilula !== "todas" ? <input type="hidden" name="filtro" value={pilula} /> : null}
      </form>

      <nav className={styles.filtrosPilula} aria-label="Filtrar plantel">
        {PILULAS.map((p) => {
          const ativo = p.valor === pilula;
          const parametros = new URLSearchParams();
          if (busca) parametros.set("busca", busca);
          if (p.valor !== "todas") parametros.set("filtro", p.valor);
          return (
            <Link
              key={p.valor}
              href={parametros.size ? `/plantel?${parametros}` : "/plantel"}
              className={`${styles.filtro} ${ativo ? styles.filtroAtivo : ""}`}
              aria-current={ativo ? "true" : undefined}
            >
              {p.rotulo}
            </Link>
          );
        })}
      </nav>

      {/* --- O corpo: lista no mobile, tabela com filtros no desktop ------- */}
      <div className={styles.corpo}>
        <div className={styles.lateralFiltros}>
          <FiltrosPlantel
            filtros={estado}
            especies={facetas.especies}
            situacoes={facetas.situacoes}
            anos={facetas.anos}
          />
        </div>

        <div className={styles.resultado}>
          {vazio ? (
            <EmptyState
              icon={<Bird size={28} />}
              title={busca ? "Nenhuma ave encontrada" : "Nenhuma ave no plantel"}
              description={
                busca
                  ? `Nada corresponde a "${busca}". Confira o número da anilha.`
                  : "Cadastre a primeira ave para começar a formar casais."
              }
              compact
            />
          ) : (
            <>
              <ul className={styles.lista}>
                {aves.map((ave) => (
                  <li key={ave.id}>
                    <LinhaMobile ave={ave} />
                  </li>
                ))}
              </ul>

              <div className={styles.tabelaDesktop}>
                <TabelaPlantel
                  aves={aves}
                  ordem={estado.ordem ?? "anilha"}
                  direcao={estado.direcao ?? "desc"}
                  hrefsOrdenacao={{
                    anilha: hrefOrdenar("anilha"),
                    nascimento: hrefOrdenar("nascimento"),
                  }}
                />
              </div>
            </>
          )}

          {/* Só aparece quando há mais de uma página: com 14 aves, nunca. */}
          {paginas > 1 ? (
            <nav className={styles.paginacao} aria-label="Páginas do plantel">
              <Button
                href={pagina > 1 ? hrefPagina(pagina - 1) : undefined}
                variant="secondary"
                size="sm"
                disabled={pagina === 1}
              >
                Anterior
              </Button>
              <span className={styles.paginaAtual}>
                {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, total)} de{" "}
                {total}
              </span>
              <Button
                href={pagina < paginas ? hrefPagina(pagina + 1) : undefined}
                variant="secondary"
                size="sm"
                disabled={pagina === paginas}
              >
                Próxima
              </Button>
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LinhaMobile({ ave }: { ave: AveNaTabela }) {
  return (
    <Link href={`/plantel/${ave.id}`} className={styles.linha}>
      <span className={styles.miniatura}>
        {ave.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.miniaturaFoto} src={ave.fotoUrl} alt="" />
        ) : (
          <span className={styles.miniaturaVazia} aria-hidden="true">
            <Bird size={20} />
          </span>
        )}
      </span>

      <span className={styles.textos}>
        <span className={styles.nome}>{ave.nome ?? "Sem nome"}</span>
        <Anilha dados={ave.anilha} size="sm" tone="quiet" />
        <span className={styles.especie}>
          {descreverEspecie(ave.especie, ave.mutacao)}
        </span>
      </span>

      <span className={styles.lateral}>
        <SexChip sexo={ave.sexo} compacta />
        <span className={styles.idade}>{formatarIdade(ave.dtNascimento)}</span>
      </span>
    </Link>
  );
}
