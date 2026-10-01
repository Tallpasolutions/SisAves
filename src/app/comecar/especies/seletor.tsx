"use client";

import { CircleAlert } from "lucide-react";
import { useActionState, useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { adotarEspecies, type EstadoEspecies } from "./acoes";
import styles from "../comecar.module.css";

export interface EspecieCatalogo {
  id: string;
  nome_comum: string;
  nome_cientifico: string | null;
  dias_choco: number | null;
  dias_choco_max: number | null;
  grupo_nome: string;
  grupo_ordem: number;
}

export function SeletorEspecies({ especies }: { especies: EspecieCatalogo[] }) {
  const [estado, acao, enviando] = useActionState<EstadoEspecies, FormData>(
    adotarEspecies,
    {},
  );
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());

  function alternar(id: string, marcada: boolean) {
    setMarcadas((anterior) => {
      const proxima = new Set(anterior);
      if (marcada) proxima.add(id);
      else proxima.delete(id);
      return proxima;
    });
  }

  const grupos = agruparPorGrupo(especies);

  // 32 das 60 espécies do catálogo ainda não têm incubação confirmada pelo
  // cliente. Em vez de bloquear a adoção, o campo aparece para quem marcar —
  // o criador conhece o prazo da espécie que cria.
  const faltandoPrazo = especies.filter((e) => marcadas.has(e.id) && e.dias_choco === null);

  return (
    <form action={acao} className={styles.formulario}>
      {estado.erro ? (
        <p className={styles.alerta} role="alert">
          <span className={styles.alertaIcone}>
            <CircleAlert size={16} aria-hidden="true" />
          </span>
          {estado.erro}
        </p>
      ) : null}

      {grupos.map(([nome, lista]) => (
        <section key={nome} className={styles.grupo}>
          <h2 className={styles.grupoNome}>{nome}</h2>
          <div className={styles.especies}>
            {lista.map((e) => (
              <label key={e.id} className={styles.especie}>
                <input
                  type="checkbox"
                  name="especie"
                  value={e.id}
                  className={styles.caixa}
                  checked={marcadas.has(e.id)}
                  onChange={(ev) => alternar(e.id, ev.target.checked)}
                />
                <span className={styles.especieTextos}>
                  <span className={styles.especieNome}>{e.nome_comum}</span>
                  {e.nome_cientifico ? (
                    <span className={styles.especieCientifico}>{e.nome_cientifico}</span>
                  ) : null}
                  <span
                    className={`${styles.especiePrazo} ${e.dias_choco === null ? styles.semPrazo : ""}`}
                  >
                    {descreverChoco(e)}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>
      ))}

      {faltandoPrazo.length > 0 ? (
        <section className={styles.cartao}>
          <h2 className={styles.grupoNome}>Dias de choco que faltam</h2>
          <p className={styles.resumo}>
            Não temos a incubação dessas espécies no catálogo. Informe quantos
            dias o ovo fica em choco — é esse prazo que agenda a eclosão.
          </p>
          {faltandoPrazo.map((e) => (
            <Field key={e.id} label={`${e.nome_comum} — dias de choco`} required>
              {({ id, invalido }) => (
                <Input
                  id={id}
                  name={`choco_${e.id}`}
                  numeric
                  size="lg"
                  suffix="dias"
                  min={1}
                  max={120}
                  invalid={invalido}
                  required
                />
              )}
            </Field>
          ))}
        </section>
      ) : null}

      <div className={styles.contagem}>
        <span className={styles.contagemTexto}>
          <span className={styles.contagemNumero}>{marcadas.size}</span>{" "}
          {marcadas.size === 1 ? "espécie selecionada" : "espécies selecionadas"}
        </span>
        <Button type="submit" size="lg" disabled={enviando || marcadas.size === 0}>
          {enviando ? "Salvando…" : "Concluir"}
        </Button>
      </div>
    </form>
  );
}

function descreverChoco(e: EspecieCatalogo): string {
  if (e.dias_choco === null) return "Incubação a informar";
  if (e.dias_choco_max && e.dias_choco_max !== e.dias_choco) {
    return `Choco ${e.dias_choco} a ${e.dias_choco_max} dias`;
  }
  return `Choco ${e.dias_choco} dias`;
}

function agruparPorGrupo(especies: EspecieCatalogo[]): Array<[string, EspecieCatalogo[]]> {
  const mapa = new Map<string, { ordem: number; lista: EspecieCatalogo[] }>();
  for (const e of especies) {
    const atual = mapa.get(e.grupo_nome) ?? { ordem: e.grupo_ordem, lista: [] };
    atual.lista.push(e);
    mapa.set(e.grupo_nome, atual);
  }
  return [...mapa.entries()]
    .sort((a, b) => a[1].ordem - b[1].ordem)
    .map(([nome, { lista }]) => [nome, lista]);
}
