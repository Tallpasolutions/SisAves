import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Toast } from "@/components/ui";
import { listarMembros, PAPEIS } from "@/lib/dados/configuracoes";
import { formatarData } from "@/lib/formato";
import {
  BotaoCancelarConvite,
  BotaoRemover,
  FormularioConvite,
} from "./formulario";
import styles from "../configuracoes.module.css";

export const metadata: Metadata = { title: "Membros" };

export default async function Membros({
  searchParams,
}: PageProps<"/configuracoes/membros">) {
  const consulta = await searchParams;
  const dados = await listarMembros();
  if (!dados) notFound();

  const { membros, convites } = dados;
  const convidado = typeof consulta.convidado === "string" ? consulta.convidado : null;

  return (
    <div className={styles.tela}>
      <Link href="/configuracoes" className={styles.voltar}>
        <ChevronLeft size={18} aria-hidden="true" />
        Configurações
      </Link>

      {convidado ? (
        <Toast
          tone="ok"
          title={`Convite enviado · ${convidado}`}
          description="O acesso aparece sozinho na primeira vez que essa pessoa entrar com este e-mail."
        />
      ) : null}
      {consulta.cancelado === "1" ? (
        <Toast tone="ok" title="Convite cancelado" description="Ele não vale mais." />
      ) : null}
      {consulta.removido === "1" ? (
        <Toast
          tone="ok"
          title="Membro removido"
          description="A pessoa perde o acesso. O que ela registrou continua no criatório."
        />
      ) : null}

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Membros</h1>
        <p className={styles.contexto}>
          {membros.length} {membros.length === 1 ? "pessoa" : "pessoas"}
          {convites.length > 0
            ? ` · ${convites.length} ${convites.length === 1 ? "convite aberto" : "convites abertos"}`
            : ""}
        </p>
      </header>

      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>Quem acessa</h2>
        <ul className={styles.lista}>
          {membros.map((m) => (
            <li key={m.usuarioId} className={styles.membro}>
              <span className={styles.membroTextos}>
                <span className={styles.membroNome}>
                  {m.nome}
                  {m.souEu ? " (você)" : ""}
                </span>
                <span className={styles.membroContexto}>
                  {PAPEIS[m.papel]?.resumo ?? m.papel} · desde{" "}
                  {formatarData(m.desde)}
                </span>
              </span>

              <span className={styles.membroAcoes}>
                <Badge tone={m.eDono ? "ok" : "neutro"} size="sm">
                  {PAPEIS[m.papel]?.rotulo ?? m.papel}
                </Badge>
                {/* O dono não sai: `criatorios.owner_id` aponta para ele, com
                    `on delete restrict`. Criatório sem dono é criatório sem
                    ninguém que responda por ele. */}
                {!m.eDono && !m.souEu ? <BotaoRemover membro={m} /> : null}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {convites.length > 0 ? (
        <section className={styles.bloco}>
          <h2 className={styles.blocoTitulo}>Convites abertos</h2>
          <p className={styles.blocoNota}>
            Viram acesso sozinhos quando a pessoa entrar com esse e-mail.
          </p>
          <ul className={styles.lista}>
            {convites.map((c) => (
              <li key={c.id} className={styles.membro}>
                <span className={styles.membroTextos}>
                  <span className={styles.membroNome}>{c.email}</span>
                  <span className={styles.membroContexto}>
                    {PAPEIS[c.papel]?.rotulo ?? c.papel} · convidado em{" "}
                    {formatarData(c.criadoEm)}
                  </span>
                </span>
                <span className={styles.membroAcoes}>
                  <BotaoCancelarConvite convite={c} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>Convidar alguém</h2>
        <p className={styles.blocoNota}>
          O convite fica guardado até a pessoa entrar — ela não precisa ter
          conta ainda.
        </p>
        <FormularioConvite />
      </section>
    </div>
  );
}
