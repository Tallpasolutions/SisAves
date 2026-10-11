import Link from "next/link";
import type { Faceta } from "@/lib/dados/plantel";
import styles from "./tabela.module.css";

export interface EstadoFiltros {
  busca?: string;
  especies: string[];
  situacoes: string[];
  sexo: string;
  anoAnilha?: number;
  ordem?: string;
  direcao?: string;
}

/** Monta a URL da tela com um filtro trocado, preservando os demais. */
function comFiltro(
  atual: EstadoFiltros,
  mudanca: Partial<Record<string, string | string[] | undefined>>,
): string {
  const p = new URLSearchParams();
  const base: Record<string, string | string[] | undefined> = {
    busca: atual.busca,
    especie: atual.especies,
    situacao: atual.situacoes,
    sexo: atual.sexo !== "todos" ? atual.sexo : undefined,
    ano: atual.anoAnilha ? String(atual.anoAnilha) : undefined,
    ordem: atual.ordem,
    direcao: atual.direcao,
    ...mudanca,
  };

  for (const [chave, valor] of Object.entries(base)) {
    if (valor === undefined || valor === "") continue;
    for (const v of Array.isArray(valor) ? valor : [valor]) p.append(chave, v);
  }
  // Trocar um filtro sempre volta à primeira página: a terceira página do
  // filtro anterior quase nunca existe no novo.
  return p.size ? `/plantel?${p}` : "/plantel";
}

function alternar(lista: string[], valor: string): string[] {
  return lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor];
}

const SEXOS = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "macho", rotulo: "M" },
  { valor: "femea", rotulo: "F" },
  { valor: "indefinido", rotulo: "—" },
];

/**
 * Filtros laterais do desktop — prancha `4b`.
 *
 * São links, não controles de formulário: sem JavaScript o filtro funciona, o
 * estado fica na URL e um filtro montado pode ser compartilhado por link.
 */
export function FiltrosPlantel({
  filtros,
  especies,
  situacoes,
  anos,
}: {
  filtros: EstadoFiltros;
  especies: Faceta[];
  situacoes: Faceta[];
  anos: number[];
}) {
  const temFiltro =
    filtros.especies.length > 0 ||
    filtros.situacoes.length > 0 ||
    filtros.sexo !== "todos" ||
    Boolean(filtros.anoAnilha);

  return (
    <aside className={styles.filtros} aria-label="Filtros do plantel">
      <div className={styles.filtrosTopo}>
        <span className={styles.filtrosTitulo}>Filtros</span>
        {temFiltro ? (
          <Link href={comFiltro(filtros, {
            especie: undefined,
            situacao: undefined,
            sexo: undefined,
            ano: undefined,
          })} className={styles.limpar}>
            Limpar
          </Link>
        ) : null}
      </div>

      <GrupoCaixas
        titulo="Espécie"
        facetas={especies}
        marcados={filtros.especies}
        href={(valor) => comFiltro(filtros, { especie: alternar(filtros.especies, valor) })}
      />

      <div className={styles.grupoFiltro}>
        <span className={styles.grupoTitulo}>Sexo</span>
        <div className={styles.segmentado}>
          {SEXOS.map((s) => {
            const ativo = filtros.sexo === s.valor;
            return (
              <Link
                key={s.valor}
                href={comFiltro(filtros, { sexo: s.valor === "todos" ? undefined : s.valor })}
                className={`${styles.segmento} ${ativo ? styles.segmentoAtivo : ""}`}
                aria-current={ativo ? "true" : undefined}
              >
                {s.rotulo}
              </Link>
            );
          })}
        </div>
      </div>

      <GrupoCaixas
        titulo="Situação"
        facetas={situacoes}
        marcados={filtros.situacoes}
        href={(valor) => comFiltro(filtros, { situacao: alternar(filtros.situacoes, valor) })}
      />

      {anos.length > 0 ? (
        <div className={styles.grupoFiltro}>
          <span className={styles.grupoTitulo}>Ano da anilha</span>
          <div className={styles.anos}>
            <Link
              href={comFiltro(filtros, { ano: undefined })}
              className={`${styles.ano} ${!filtros.anoAnilha ? styles.anoAtivo : ""}`}
            >
              Todos
            </Link>
            {anos.map((ano) => (
              <Link
                key={ano}
                href={comFiltro(filtros, { ano: String(ano) })}
                className={`${styles.ano} ${filtros.anoAnilha === ano ? styles.anoAtivo : ""}`}
              >
                {ano}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function GrupoCaixas({
  titulo,
  facetas,
  marcados,
  href,
}: {
  titulo: string;
  facetas: Faceta[];
  marcados: string[];
  href: (valor: string) => string;
}) {
  if (facetas.length === 0) return null;

  return (
    <div className={styles.grupoFiltro}>
      <span className={styles.grupoTitulo}>{titulo}</span>
      {facetas.map((f) => {
        const marcado = marcados.includes(f.valor);
        return (
          <Link
            key={f.valor}
            href={href(f.valor)}
            className={styles.opcao}
            aria-pressed={marcado}
          >
            <span className={`${styles.caixa} ${marcado ? styles.caixaMarcada : ""}`}>
              {/* O "✓" é glifo de texto dentro da caixa, não ícone solto: o
                  contrato proíbe unicode COMO ícone, e aqui o sinal real é o
                  aria-pressed. */}
              {marcado ? <Marca /> : null}
            </span>
            <span className={styles.opcaoRotulo}>{f.rotulo}</span>
            <span className={styles.opcaoContagem}>{f.contagem}</span>
          </Link>
        );
      })}
    </div>
  );
}

/** Check da Lucide, inline, no tamanho da caixa de 16px. */
function Marca() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
