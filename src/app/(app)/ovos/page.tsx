import type { Metadata } from "next";
import {
  CircleAlert,
  CircleCheck,
  Egg,
  Feather,
  Thermometer,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge, EmptyState } from "@/components/ui";
import {
  contarPorEstado,
  ESTADOS_ATIVOS,
  listarNinhadas,
  ROTULO_ESTADO,
  TOM_ESTADO,
  type EstadoOvo,
  type Ninhada,
} from "@/lib/dados/ovos";
import { formatarData, formatarDataCurta } from "@/lib/formato";
import styles from "./ovos.module.css";

export const metadata: Metadata = { title: "Ovos" };

const ICONE: Record<EstadoOvo, ReactNode> = {
  chocando: <Thermometer size={12} />,
  verificar: <Egg size={12} />,
  nascendo: <CircleCheck size={12} />,
  nascido: <CircleCheck size={12} />,
  anilhar: <Feather size={12} />,
  separar: <Users size={12} />,
  separado: <Users size={12} />,
  infertil: <CircleAlert size={12} />,
  perdido: <CircleAlert size={12} />,
};

export default async function Ovos({ searchParams }: PageProps<"/ovos">) {
  const params = await searchParams;
  const filtro = ESTADOS_ATIVOS.includes(params.estado as EstadoOvo)
    ? (params.estado as EstadoOvo)
    : undefined;

  // Conta sobre a lista inteira para as pílulas não mudarem ao filtrar —
  // uma contagem que some quando você clica nela não serve para navegar.
  const todas = await listarNinhadas();
  const contagem = contarPorEstado(todas);
  const ninhadas = filtro ? await listarNinhadas(filtro) : todas;

  return (
    <div className={styles.tela}>
      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Ovos</h1>
        <span className={styles.contagem}>
          {ninhadas.length} {ninhadas.length === 1 ? "ninhada" : "ninhadas"}
        </span>
      </header>

      <nav className={styles.filtros} aria-label="Filtrar por estado">
        <Pilula href="/ovos" rotulo="Todas" contagem={contagem.todas} ativo={!filtro} />
        {ESTADOS_ATIVOS.map((estado) => (
          <Pilula
            key={estado}
            href={`/ovos?estado=${estado}`}
            rotulo={ROTULO_ESTADO[estado]}
            contagem={contagem[estado] ?? 0}
            ativo={filtro === estado}
          />
        ))}
      </nav>

      {ninhadas.length === 0 ? (
        <EmptyState
          icon={<Egg size={28} />}
          title={filtro ? "Nenhuma ninhada neste estado" : "Nenhuma ninhada ativa"}
          description={
            filtro
              ? "Nenhuma ninhada precisa dessa ação agora."
              : "Registre uma postura para acompanhar o ciclo do ovo até o anilhamento."
          }
          compact
        />
      ) : (
        <ul className={styles.lista}>
          {ninhadas.map((n) => (
            <li key={n.chave}>
              <CartaoNinhada ninhada={n} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Pilula({
  href,
  rotulo,
  contagem,
  ativo,
}: {
  href: string;
  rotulo: string;
  contagem: number;
  ativo: boolean;
}) {
  return (
    <Link
      href={href}
      className={`${styles.filtro} ${ativo ? styles.filtroAtivo : ""}`}
      aria-current={ativo ? "true" : undefined}
    >
      {rotulo}
      <span className={styles.filtroContagem}>{contagem}</span>
    </Link>
  );
}

function CartaoNinhada({ ninhada: n }: { ninhada: Ninhada }) {
  const urgente = n.estado === "anilhar";
  const perdida = n.estado === "perdido" || n.estado === "infertil";

  return (
    <article
      className={`${styles.ninhada} ${urgente ? styles.urgente : ""} ${perdida ? styles.perdida : ""}`}
    >
      <div className={styles.ninhadaTopo}>
        <div className={styles.ninhadaIdentidade}>
          <span className={styles.ninhadaNome}>
            Ninhada {String(n.ninhadaNumero ?? 0).padStart(2, "0")}
          </span>
          <span className={styles.ninhadaContexto}>
            {[
              `Casal ${String(n.casalNumero).padStart(2, "0")}`,
              n.especie,
              `postura ${formatarData(n.dataPostura)}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>

        <Badge tone={TOM_ESTADO[n.estado]} size="sm" icon={ICONE[n.estado]}>
          {rotuloDoEstado(n)}
        </Badge>
      </div>

      {/* Um chip por estado presente na ninhada: o criador vê de relance que
          três ovos chocam enquanto um já precisa de anilha. */}
      <div className={styles.ovos}>
        {Object.entries(n.porEstado).map(([estado, quantidade]) => (
          <Badge
            key={estado}
            tone={TOM_ESTADO[estado as EstadoOvo]}
            size="sm"
            icon={ICONE[estado as EstadoOvo]}
          >
            {quantidade} {quantidade === 1 ? "ovo" : "ovos"} ·{" "}
            {ROTULO_ESTADO[estado as EstadoOvo]}
          </Badge>
        ))}
      </div>

      <div className={styles.rodape}>
        <Prazo rotulo="Ovos" valor={String(n.total)} />
        {/* O rótulo acompanha o fato: depois que o ovo eclode, "prevista"
            passaria a mentir. */}
        {n.dataEclosao ? (
          <Prazo rotulo="Eclodiu em" valor={formatarDataCurta(n.dataEclosao)} />
        ) : n.previsaoEclosao ? (
          <Prazo rotulo="Eclosão prevista" valor={formatarDataCurta(n.previsaoEclosao)} />
        ) : null}
        {urgente && n.limiteAnilhamento ? (
          <Prazo
            rotulo="Anilhar até"
            valor={formatarDataCurta(n.limiteAnilhamento)}
            atencao
          />
        ) : null}
      </div>
    </article>
  );
}

function Prazo({
  rotulo,
  valor,
  atencao = false,
}: {
  rotulo: string;
  valor: string;
  atencao?: boolean;
}) {
  return (
    <div className={styles.prazo}>
      <span className={styles.prazoRotulo}>{rotulo}</span>
      <span className={`${styles.prazoValor} ${atencao ? styles.prazoAtencao : ""}`}>
        {valor}
      </span>
    </div>
  );
}

/** "Chocando · dia 6", "Anilhar hoje" — o rótulo carrega o prazo. */
function rotuloDoEstado(n: Ninhada): string {
  if (n.estado === "chocando") return `Chocando · dia ${n.diaDoChoco}`;
  if (n.estado === "anilhar") {
    if (n.anilhamentoVencido) return "Anilhar · atrasado";
    return n.diasRestantesAnilha !== null && n.diasRestantesAnilha <= 0
      ? "Anilhar · último dia"
      : "Anilhar hoje";
  }
  if (n.estado === "nascendo" && n.previsaoEclosao) {
    return `Eclosão · ${formatarDataCurta(n.previsaoEclosao)}`;
  }
  if (n.estado === "separar" && n.dataEclosao) {
    return "Separar";
  }
  return ROTULO_ESTADO[n.estado];
}
