import type { Metadata } from "next";
import { ChevronRight, Feather } from "lucide-react";
import Link from "next/link";
import { Badge, Button, EmptyState, Toast } from "@/components/ui";
import { listarEspecies, type EspecieDoCriatorio } from "@/lib/dados/especies";
import styles from "./especies.module.css";

export const metadata: Metadata = { title: "Espécies e prazos" };

export default async function Especies({ searchParams }: PageProps<"/especies">) {
  const consulta = await searchParams;
  const especies = await listarEspecies();

  const ativas = especies.filter((e) => e.ativa);
  const inativas = especies.filter((e) => !e.ativa);
  const adotadas = Number(consulta.adotadas);

  return (
    <div className={styles.tela}>
      {consulta.salva === "1" ? (
        <Toast
          tone="ok"
          title="Prazos salvos"
          description="O estado de cada ovo desta espécie passa a ser calculado com os prazos novos."
        />
      ) : null}
      {consulta.desativada === "1" ? (
        <Toast
          tone="ok"
          title="Espécie desativada"
          description="Ela sai das listas de cadastro. As aves e as ninhadas que já existem seguem com os prazos dela."
        />
      ) : null}
      {consulta.reativada === "1" ? (
        <Toast tone="ok" title="Espécie reativada" description="Volta a aparecer no cadastro de ave." />
      ) : null}
      {consulta.excluida === "1" ? (
        <Toast tone="ok" title="Espécie excluída" description="Nenhuma ave usava esta espécie." />
      ) : null}
      {Number.isFinite(adotadas) && adotadas > 0 ? (
        <Toast
          tone="ok"
          title={`${adotadas} ${adotadas === 1 ? "espécie adotada" : "espécies adotadas"}`}
          description="Já dá para cadastrar ave e formar casal com elas."
        />
      ) : null}

      <header className={styles.cabecalho}>
        <div className={styles.cabecalhoTextos}>
          <h1 className={styles.titulo}>Espécies e prazos</h1>
          <p className={styles.contexto}>
            {especies.length === 0
              ? "Nenhuma espécie adotada."
              : `${ativas.length} ${ativas.length === 1 ? "ativa" : "ativas"}${
                  inativas.length ? ` · ${inativas.length} fora de uso` : ""
                }`}
          </p>
        </div>
        <Button href="/especies/adotar" size="lg">
          Adotar espécie
        </Button>
      </header>

      <p className={styles.explicacao}>
        Os prazos de cada espécie movem o ciclo do ovo: é por eles que o sistema
        sabe o dia da ovoscopia, da eclosão, do anilhamento e da separação. A
        situação do ovo é calculada a partir deles toda vez que a tela abre, e
        não guardada — mudar um prazo aqui reclassifica as ninhadas dessa
        espécie na mesma hora.
      </p>

      {especies.length === 0 ? (
        <EmptyState
          icon={<Feather size={28} />}
          title="Nenhuma espécie no criatório"
          description="Sem espécie não há prazo, e sem prazo não há ciclo do ovo. Adote ao menos uma do catálogo."
          acao={<Button href="/especies/adotar">Adotar espécie</Button>}
          compact
        />
      ) : (
        <>
          <ul className={styles.lista}>
            {ativas.map((e) => (
              <li key={e.id}>
                <LinhaEspecie especie={e} />
              </li>
            ))}
          </ul>

          {inativas.length > 0 ? (
            <section className={styles.bloco}>
              <h2 className={styles.blocoTitulo}>Fora de uso</h2>
              <p className={styles.blocoNota}>
                Não aparecem no cadastro de ave. O que já foi registrado com
                elas continua valendo.
              </p>
              <ul className={styles.lista}>
                {inativas.map((e) => (
                  <li key={e.id}>
                    <LinhaEspecie especie={e} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function LinhaEspecie({ especie: e }: { especie: EspecieDoCriatorio }) {
  return (
    <Link href={`/especies/${e.id}`} className={styles.especie}>
      <span className={styles.especieTextos}>
        <span className={styles.especieTopo}>
          <span className={styles.especieNome}>{e.nome}</span>
          {!e.ativa ? (
            <Badge tone="neutro" size="sm">
              Fora de uso
            </Badge>
          ) : null}
        </span>
        {/* Os quatro prazos em linha: é o que o criador vem conferir. */}
        <span className={styles.prazos}>
          <Prazo rotulo="ovoscopia" valor={e.diasOvoscopia} />
          <Prazo rotulo="choco" valor={e.diasChoco} />
          <Prazo rotulo="anilha" valor={e.diasAnilha} janela={e.janelaAnilhaDias} />
          <Prazo rotulo="separação" valor={e.diasSepara} />
        </span>
        <span className={styles.especieUso}>
          {e.aves === 0
            ? "Nenhuma ave desta espécie"
            : `${e.aves} ${e.aves === 1 ? "ave" : "aves"} no plantel`}
          {e.anilhaMm !== null ? ` · anilha ${String(e.anilhaMm).replace(".", ",")} mm` : ""}
        </span>
      </span>
      <ChevronRight size={18} aria-hidden="true" className={styles.seta} />
    </Link>
  );
}

function Prazo({
  rotulo,
  valor,
  janela,
}: {
  rotulo: string;
  valor: number;
  janela?: number;
}) {
  return (
    <span className={styles.prazo}>
      <span className={styles.prazoValor}>
        {valor}
        {janela !== undefined ? `+${janela}` : ""}
      </span>
      <span className={styles.prazoRotulo}>{rotulo}</span>
    </span>
  );
}
