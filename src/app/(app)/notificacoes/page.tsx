import type { Metadata } from "next";
import { Bell } from "lucide-react";
import Link from "next/link";
import { Badge, Button, EmptyState } from "@/components/ui";
import {
  listarNotificacoes,
  pushConfigurado,
  TOM_NOTIFICACAO,
  type Notificacao,
} from "@/lib/dados/notificacoes";
import { formatarData } from "@/lib/formato";
import { marcarTodasLidas } from "./acoes";
import { BotaoLida } from "./formulario";
import styles from "./notificacoes.module.css";

export const metadata: Metadata = { title: "Notificações" };

export default async function Notificacoes() {
  const { notificacoes, naoLidas } = await listarNotificacoes();
  const push = pushConfigurado();

  return (
    <div className={styles.tela}>
      <header className={styles.cabecalho}>
        <div className={styles.cabecalhoTextos}>
          <h1 className={styles.titulo}>Notificações</h1>
          <p className={styles.contexto}>
            {naoLidas === 0
              ? "Nada por ler."
              : `${naoLidas} ${naoLidas === 1 ? "aviso por ler" : "avisos por ler"}`}
          </p>
        </div>
        {naoLidas > 0 ? (
          <form action={marcarTodasLidas}>
            <Button type="submit" variant="secondary" size="md">
              Marcar tudo como lido
            </Button>
          </form>
        ) : null}
      </header>

      {/* O que a tela faz hoje, e o que ela ainda não faz. Botão "Ativar
          avisos" que não ativa aviso nenhum é pior que a ausência dele. */}
      <p className={styles.explicacao}>
        Os avisos se montam a partir dos prazos de cada ninhada quando você abre
        o aplicativo.{" "}
        {push
          ? "O envio por push está configurado."
          : "O envio por push ainda não está configurado — falta a chave VAPID e um agendador no servidor. Até lá, o aviso espera você aqui."}
      </p>

      {notificacoes.length === 0 ? (
        <EmptyState
          icon={<Bell size={28} />}
          title="Nenhum aviso"
          description="Quando uma ninhada chegar à ovoscopia, ao anilhamento ou à separação, o aviso aparece aqui."
          acao={<Button href="/ovos">Ver as ninhadas</Button>}
          compact
        />
      ) : (
        <ul className={styles.lista}>
          {notificacoes.map((n) => (
            <li key={n.id}>
              <Aviso notificacao={n} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Aviso({ notificacao: n }: { notificacao: Notificacao }) {
  const lida = n.lidaEm !== null;

  return (
    <article className={`${styles.aviso} ${lida ? styles.avisoLido : ""}`}>
      <div className={styles.avisoTopo}>
        <span className={styles.avisoTitulo}>{n.titulo}</span>
        <Badge tone={TOM_NOTIFICACAO[n.tipo] ?? "neutro"} size="sm">
          {n.dia ? formatarData(n.dia) : formatarData(n.criadaEm)}
        </Badge>
      </div>

      {n.corpo ? <p className={styles.avisoCorpo}>{n.corpo}</p> : null}

      <div className={styles.avisoAcoes}>
        {n.link ? (
          <Link href={n.link} className={styles.elo}>
            Abrir
          </Link>
        ) : null}
        {!lida ? <BotaoLida id={n.id} /> : <span className={styles.lido}>Lido</span>}
      </div>
    </article>
  );
}
