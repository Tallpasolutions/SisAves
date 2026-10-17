"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Field, Select } from "@/components/ui";
import type { OpcaoProgenitor } from "@/lib/dados/cadastro";
import { descreverAve } from "@/lib/formato";
import styles from "./genealogia.module.css";

/**
 * A escolha do par vive na URL, não no estado do componente.
 *
 * É a mesma decisão da C3: o cálculo é do servidor — `coeficiente_endogamia`
 * é recursivo sobre a árvore e não se refaz no navegador —, então o par
 * precisa chegar lá. De quebra, um cruzamento simulado pode ser
 * compartilhado, recarregado e aberto no histórico do navegador.
 */
export function SeletorDoPar({
  machos,
  femeas,
  machoId,
  femeaId,
}: {
  machos: OpcaoProgenitor[];
  femeas: OpcaoProgenitor[];
  machoId: string;
  femeaId: string;
}) {
  const router = useRouter();
  const parametros = useSearchParams();

  const escolher = (campo: "macho" | "femea", valor: string) => {
    const novos = new URLSearchParams(parametros.toString());
    if (valor) novos.set(campo, valor);
    else novos.delete(campo);
    router.replace(`/genealogia?${novos.toString()}`, { scroll: false });
  };

  return (
    <div className={styles.par}>
      <Field label="Macho">
        {({ id, descritoPor }) => (
          <Select
            id={id}
            size="lg"
            value={machoId}
            onChange={(e) => escolher("macho", e.target.value)}
            aria-describedby={descritoPor}
          >
            <option value="">Escolha o macho</option>
            {machos.map((m) => (
              <option key={m.id} value={m.id}>
                {descreverAve(m)}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label="Fêmea">
        {({ id, descritoPor }) => (
          <Select
            id={id}
            size="lg"
            value={femeaId}
            onChange={(e) => escolher("femea", e.target.value)}
            aria-describedby={descritoPor}
          >
            <option value="">Escolha a fêmea</option>
            {femeas.map((f) => (
              <option key={f.id} value={f.id}>
                {descreverAve(f)}
              </option>
            ))}
          </Select>
        )}
      </Field>
    </div>
  );
}
