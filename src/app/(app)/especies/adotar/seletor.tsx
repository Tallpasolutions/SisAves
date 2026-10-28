"use client";

import { CircleAlert, WifiOff } from "lucide-react";
import { useActionState, useMemo, useState } from "react";
import { Badge, Button, Field, Input } from "@/components/ui";
import { useEnvioOffline } from "@/components/offline/useEnvioOffline";
import type { EspecieDoCatalogo } from "@/lib/dados/especies";
import { useMarcacaoFirme } from "@/lib/formulario";
import { adotarDoCatalogo, type EstadoEspecie } from "../acoes";
import styles from "../especies.module.css";

export function SeletorCatalogo({ catalogo }: { catalogo: EspecieDoCatalogo[] }) {
  const [estado, acao, enviando] = useActionState<EstadoEspecie, FormData>(
    adotarDoCatalogo,
    {},
  );

  const [busca, setBusca] = useState("");
  const [marcadas, setMarcadas] = useState<ReadonlySet<string>>(() => new Set());
  const [chocos, setChocos] = useState<Record<string, string>>({});

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "adocao-especie",
    resumo: () =>
      `Adoção de espécie · ${marcadas.size} ${marcadas.size === 1 ? "espécie" : "espécies"}`,
  });

  /** Busca sem acento: "sabia" encontra "Sabiá-laranjeira". */
  const semAcento = (texto: string) =>
    texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  const porGrupo = useMemo(() => {
    const alvo = semAcento(busca.trim());
    const filtradas = alvo
      ? catalogo.filter(
          (c) =>
            semAcento(c.nomeComum).includes(alvo) ||
            semAcento(c.nomeCientifico ?? "").includes(alvo),
        )
      : catalogo;

    const mapa = new Map<string, { ordem: number; especies: EspecieDoCatalogo[] }>();
    for (const c of filtradas) {
      const atual = mapa.get(c.grupo) ?? { ordem: c.grupoOrdem, especies: [] };
      atual.especies.push(c);
      mapa.set(c.grupo, atual);
    }
    return [...mapa.entries()].sort((a, b) => a[1].ordem - b[1].ordem);
  }, [catalogo, busca]);

  if (salvoNoAparelho) {
    return (
      <p className={styles.nota}>
        <WifiOff size={14} aria-hidden="true" />
        Salvo no aparelho. As espécies entram quando o registro subir.
      </p>
    );
  }

  return (
    <form
      action={acao}
      onSubmit={aoEnviar}
      className={styles.formulario}
      style={{ background: "transparent", border: "none", padding: 0 }}
    >
      {estado.erro ? (
        <p className={styles.alerta} role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          {estado.erro}
        </p>
      ) : null}

      <div className={styles.busca}>
        <Field label="Buscar espécie">
          {({ id, descritoPor }) => (
            <Input
              id={id}
              size="lg"
              autoComplete="off"
              placeholder="Curió, agapornis, gould…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-describedby={descritoPor}
            />
          )}
        </Field>
      </div>

      {porGrupo.map(([grupo, { especies }]) => (
        <section key={grupo} className={styles.grupoCatalogo}>
          <h2 className={styles.blocoTitulo}>{grupo}</h2>
          <ul className={styles.catalogo}>
            {especies.map((c) => (
              <li key={c.id}>
                <LinhaCatalogo
                  especie={c}
                  marcada={marcadas.has(c.id)}
                  choco={chocos[c.id] ?? ""}
                  onMarcar={(v) =>
                    setMarcadas((atual) => {
                      const novo = new Set(atual);
                      if (v) novo.add(c.id);
                      else novo.delete(c.id);
                      return novo;
                    })
                  }
                  onChoco={(v) => setChocos((atual) => ({ ...atual, [c.id]: v }))}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className={styles.acaoFixa}>
        <div className={styles.acaoFixaInterno}>
          <Button type="submit" size="lg" bloco disabled={enviando || marcadas.size === 0}>
            {enviando
              ? "Adotando…"
              : marcadas.size === 0
                ? "Adotar espécie"
                : `Adotar ${marcadas.size} ${marcadas.size === 1 ? "espécie" : "espécies"}`}
          </Button>
          {!online ? (
            <span className={styles.aviso}>
              <WifiOff size={14} aria-hidden="true" />
              Offline. Será salvo no aparelho
            </span>
          ) : null}
        </div>
      </div>
    </form>
  );
}

function LinhaCatalogo({
  especie: c,
  marcada,
  choco,
  onMarcar,
  onChoco,
}: {
  especie: EspecieDoCatalogo;
  marcada: boolean;
  choco: string;
  onMarcar: (v: boolean) => void;
  onChoco: (v: string) => void;
}) {
  // O reset do React 19 desmarca a caixa sem o React reaplicar.
  const ref = useMarcacaoFirme(marcada);

  if (c.adotada) {
    return (
      <div className={`${styles.opcao} ${styles.opcaoAdotada}`}>
        <span className={styles.opcaoTextos}>
          <span className={styles.opcaoNome}>{c.nomeComum}</span>
          {c.nomeCientifico ? (
            <span className={styles.opcaoContexto}>{c.nomeCientifico}</span>
          ) : null}
        </span>
        <Badge tone="neutro" size="sm">
          Já adotada
        </Badge>
      </div>
    );
  }

  return (
    <label className={`${styles.opcao} ${marcada ? styles.opcaoMarcada : ""}`}>
      <input
        ref={ref}
        type="checkbox"
        name="especie"
        value={c.id}
        checked={marcada}
        onChange={(e) => onMarcar(e.target.checked)}
        className={styles.marca}
      />
      <span className={styles.opcaoTextos}>
        <span className={styles.opcaoNome}>{c.nomeComum}</span>
        <span className={styles.opcaoContexto}>
          {[c.nomeCientifico, c.diasChoco ? `${c.diasChoco} dias de choco` : null]
            .filter(Boolean)
            .join(" · ") || "Incubação não catalogada"}
        </span>
      </span>

      {/* 32 das 60 espécies do catálogo ainda não têm `dias_choco`. Sem ele a
          espécie não serve: é o prazo que move o ciclo inteiro. */}
      {marcada && c.diasChoco === null ? (
        <span className={styles.opcaoChoco}>
          <Field label="Dias de choco" required>
            {({ id }) => (
              <Input
                id={id}
                name={`choco_${c.id}`}
                size="md"
                numeric
                inputMode="numeric"
                suffix="dias"
                value={choco}
                onChange={(e) => onChoco(e.target.value)}
                required
              />
            )}
          </Field>
        </span>
      ) : null}
    </label>
  );
}
