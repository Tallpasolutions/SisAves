import type { Metadata } from "next";
import { Users } from "lucide-react";
import Link from "next/link";
import { Anilha, Badge, EmptyState, SexChip } from "@/components/ui";
import { faixaEndogamia } from "@/components/ui";
import { listarCasais, type CasalListado, type ParceiroCasal } from "@/lib/dados/casais";
import { ROTULO_ESTADO, TOM_ESTADO } from "@/lib/dados/ovos";
import { formatarPercentual } from "@/lib/formato";
import styles from "./casais.module.css";

export const metadata: Metadata = { title: "Casais" };

export default async function Casais() {
  const casais = await listarCasais();
  const ativos = casais.filter((c) => c.ativo);

  return (
    <div className={styles.tela}>
      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Casais</h1>
        <span className={styles.contagem}>
          {ativos.length} {ativos.length === 1 ? "ativo" : "ativos"}
        </span>
      </header>

      {casais.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="Nenhum casal formado"
          description="Forme um casal para registrar posturas e acompanhar o ciclo do ovo."
          compact
        />
      ) : (
        <ul className={styles.lista}>
          {casais.map((c) => (
            <li key={c.id}>
              <CartaoCasal casal={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CartaoCasal({ casal: c }: { casal: CasalListado }) {
  const urgente = c.estadoMaisUrgente === "anilhar";
  const perda = c.estadoMaisUrgente === "perdido" || c.estadoMaisUrgente === "infertil";
  const faixa = c.endogamiaPct !== null ? faixaEndogamia(c.endogamiaPct) : null;

  return (
    <Link
      href={`/casais/${c.id}`}
      className={`${styles.casal} ${urgente ? styles.urgente : ""} ${perda ? styles.perda : ""}`}
    >
      <div className={styles.topo}>
        <div>
          <div className={styles.numero}>Casal {String(c.numero).padStart(2, "0")}</div>
          <div className={styles.contexto}>
            {[
              c.macho?.especie ?? c.femea?.especie,
              c.gaiola ? `gaiola ${c.gaiola}` : null,
              c.ativo ? null : "encerrado",
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        </div>

        {c.estadoMaisUrgente ? (
          <Badge tone={TOM_ESTADO[c.estadoMaisUrgente]} size="sm">
            {ROTULO_ESTADO[c.estadoMaisUrgente]}
          </Badge>
        ) : null}
      </div>

      <div className={styles.par}>
        <Parceiro parceiro={c.macho} papel="macho" />
        <Parceiro parceiro={c.femea} papel="fêmea" />
      </div>

      <div className={styles.rodape}>
        <Dado rotulo="Ninhada" valor={c.ninhadaAtual !== null ? String(c.ninhadaAtual).padStart(2, "0") : "—"} />
        <Dado rotulo="Ovos ativos" valor={String(c.ovosAtivos)} />
        <Dado
          rotulo="Endogamia"
          valor={c.endogamiaPct !== null ? formatarPercentual(c.endogamiaPct) : "—"}
          classe={
            faixa === "seguro"
              ? styles.endogamiaSeguro
              : faixa === "atencao"
                ? styles.endogamiaAtencao
                : faixa === "risco"
                  ? styles.endogamiaRisco
                  : undefined
          }
        />
      </div>
    </Link>
  );
}

function Parceiro({
  parceiro,
  papel,
}: {
  parceiro: ParceiroCasal | null;
  papel: string;
}) {
  if (!parceiro) {
    return (
      <div className={styles.parceiro}>
        <span className={styles.parceiroVazio}>Sem {papel} definido</span>
      </div>
    );
  }

  return (
    <div className={styles.parceiro}>
      <SexChip sexo={parceiro.sexo} compacta />
      <span className={styles.parceiroNome}>{parceiro.nome ?? "Sem nome"}</span>
      <Anilha dados={parceiro.anilha} size="sm" tone="quiet" />
    </div>
  );
}

function Dado({
  rotulo,
  valor,
  classe,
}: {
  rotulo: string;
  valor: string;
  classe?: string;
}) {
  return (
    <div className={styles.dado}>
      <span className={styles.dadoRotulo}>{rotulo}</span>
      <span className={`${styles.dadoValor} ${classe ?? ""}`}>{valor}</span>
    </div>
  );
}
