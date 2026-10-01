import type { Metadata } from "next";
import { Bird, Search } from "lucide-react";
import Link from "next/link";
import { Anilha, EmptyState, SexChip } from "@/components/ui";
import {
  descreverEspecie,
  listarPlantel,
  type FiltroPlantel,
} from "@/lib/dados/plantel";
import { formatarIdade } from "@/lib/formato";
import styles from "./plantel.module.css";

export const metadata: Metadata = { title: "Plantel" };

const FILTROS: Array<{ valor: FiltroPlantel; rotulo: string }> = [
  { valor: "todas", rotulo: "Todas" },
  { valor: "machos", rotulo: "Machos" },
  { valor: "femeas", rotulo: "Fêmeas" },
  { valor: "sem-anilha", rotulo: "Sem anilha" },
];

export default async function Plantel({ searchParams }: PageProps<"/plantel">) {
  const params = await searchParams;
  const busca = typeof params.busca === "string" ? params.busca : "";
  const filtro = (
    FILTROS.some((f) => f.valor === params.filtro) ? params.filtro : "todas"
  ) as FiltroPlantel;

  const aves = await listarPlantel({ busca, filtro });

  return (
    <div className={styles.tela}>
      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Plantel</h1>
        <span className={styles.contagem}>
          {aves.length} {aves.length === 1 ? "ave" : "aves"}
        </span>
      </header>

      {/* Busca sem JavaScript: GET recarrega a lista. Funciona com a conexão
          ruim do galpão, onde hidratar o cliente pode demorar. */}
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
        {filtro !== "todas" ? <input type="hidden" name="filtro" value={filtro} /> : null}
      </form>

      <nav className={styles.filtros} aria-label="Filtrar plantel">
        {FILTROS.map((f) => {
          const ativo = f.valor === filtro;
          const parametros = new URLSearchParams();
          if (busca) parametros.set("busca", busca);
          if (f.valor !== "todas") parametros.set("filtro", f.valor);
          const href = parametros.size ? `/plantel?${parametros}` : "/plantel";

          return (
            <Link
              key={f.valor}
              href={href}
              className={`${styles.filtro} ${ativo ? styles.filtroAtivo : ""}`}
              aria-current={ativo ? "true" : undefined}
            >
              {f.rotulo}
            </Link>
          );
        })}
      </nav>

      {aves.length === 0 ? (
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
        <ul className={styles.lista}>
          {aves.map((ave) => (
            <li key={ave.id}>
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
