import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Toast } from "@/components/ui";
import { obterConfiguracoes } from "@/lib/dados/configuracoes";
import { FormularioCriatorio } from "./formulario";
import styles from "./configuracoes.module.css";

export const metadata: Metadata = { title: "Configurações" };

export default async function Configuracoes({
  searchParams,
}: PageProps<"/configuracoes">) {
  const consulta = await searchParams;
  const dados = await obterConfiguracoes();
  if (!dados) notFound();

  const { criatorio, clubes } = dados;

  return (
    <div className={styles.tela}>
      {consulta.salvo === "1" ? (
        <Toast
          tone="ok"
          title="Configurações salvas"
          description="Os certificados emitidos daqui em diante saem com estes dados."
        />
      ) : null}

      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>Configurações</h1>
        <p className={styles.contexto}>{criatorio.nome}</p>
      </header>

      <FormularioCriatorio criatorio={criatorio} clubes={clubes} />

      {/* O slug é o endereço público do certificado: mudá-lo quebraria o QR de
          toda peça já impressa, que é o oposto do que o snapshot do CRO
          existe para garantir. */}
      <section className={styles.bloco}>
        <h2 className={styles.blocoTitulo}>Endereço público</h2>
        <p className={styles.endereco}>
          sisaves.tallpa.com.br/<strong>{criatorio.slug}</strong>
        </p>
        <p className={styles.blocoNota}>
          É por aqui que o QR dos certificados aponta. Não se altera
          {criatorio.certificados > 0
            ? `: ${criatorio.certificados} ${criatorio.certificados === 1 ? "certificado já emitido depende" : "certificados já emitidos dependem"} dele.`
            : " — mudar quebraria o QR de toda peça já impressa."}
        </p>
      </section>

      <nav className={styles.atalhos} aria-label="Outras configurações">
        <Link href="/configuracoes/membros" className={styles.atalho}>
          <span className={styles.atalhoTextos}>
            <span className={styles.atalhoRotulo}>Membros</span>
            <span className={styles.atalhoResumo}>
              Quem mais acessa este criatório
            </span>
          </span>
          <ChevronRight size={18} aria-hidden="true" className={styles.seta} />
        </Link>

        <Link href="/especies" className={styles.atalho}>
          <span className={styles.atalhoTextos}>
            <span className={styles.atalhoRotulo}>Espécies e prazos</span>
            <span className={styles.atalhoResumo}>
              Os dias que movem o ciclo do ovo
            </span>
          </span>
          <ChevronRight size={18} aria-hidden="true" className={styles.seta} />
        </Link>

        <Link href="/perfil" className={styles.atalho}>
          <span className={styles.atalhoTextos}>
            <span className={styles.atalhoRotulo}>Seu perfil</span>
            <span className={styles.atalhoResumo}>Nome e telefone</span>
          </span>
          <ChevronRight size={18} aria-hidden="true" className={styles.seta} />
        </Link>
      </nav>
    </div>
  );
}
