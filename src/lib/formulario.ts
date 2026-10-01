"use client";

import { useEffect, useRef, useState } from "react";

/*
 * O React 19 reseta o formulário quando a Server Action termina — inclusive
 * quando ela volta com erro, que é justamente quando o criador precisa dos
 * dados de volta.
 *
 * `<input type="text">` e `<input type="date">` sobrevivem: o React reaplica o
 * valor. `<select>` e `<input type="radio">` não — o `form.reset()` os limpa no
 * DOM e o React não percebe, porque a prop (`value`, `checked`) não mudou entre
 * uma renderização e outra. O campo então aparece vazio enquanto o estado ainda
 * tem a escolha, e o envio seguinte vai sem o dado.
 *
 * Estes dois ganchos reafirmam o valor no DOM depois de cada renderização. Sem
 * lista de dependências de propósito: a comparação é barata e precisa rodar
 * sempre, porque a mudança veio de fora do React.
 */

/** Mantém a escolha de um `<select>` depois do reset automático. */
export function useSelecaoFirme(valor: string | undefined) {
  const ref = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && valor !== undefined && el.value !== valor) el.value = valor;
  });
  return ref;
}

/** Idem para `radio` e `checkbox`, que o reset desmarca. */
export function useMarcacaoFirme(marcado: boolean | undefined) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && marcado !== undefined && el.checked !== marcado) el.checked = marcado;
  });
  return ref;
}

/**
 * Esquece o erro de um campo assim que ele é editado.
 *
 * A mensagem cita o dado exato ("A anilha COF 1234 · 2026 · 0089 já existe no
 * plantel."). Se o criador corrige o número e a frase continua ali, ela passa a
 * acusar um dado que não está mais na tela.
 *
 * `marcar` registra o campo editado; `enviar` zera a lista, porque o próximo
 * erro se refere ao que acabou de ser enviado.
 */
export function useErrosQueEnvelhecem(
  erros: Record<string, string> | undefined,
): {
  erro: (campo: string) => string | undefined;
  marcar: (campo: string) => void;
  enviar: () => void;
} {
  const [editados, setEditados] = useState<ReadonlySet<string>>(() => new Set());

  return {
    erro: (campo) => (editados.has(campo) ? undefined : erros?.[campo]),
    marcar: (campo) =>
      setEditados((atual) =>
        atual.has(campo) ? atual : new Set(atual).add(campo),
      ),
    enviar: () => setEditados(new Set()),
  };
}
