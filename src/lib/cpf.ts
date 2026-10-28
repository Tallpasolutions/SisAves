/**
 * CPF e celular: normalizar e conferir.
 *
 * O banco guarda só dígitos, e aceita qualquer sequência de onze. Conferir os
 * dígitos verificadores é trabalho daqui, onde a mensagem de erro pode dizer
 * o que está errado em vez de devolver uma violação de constraint.
 */

/** Tira pontos, traços, parênteses e espaços. */
export function soDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

/**
 * Confere os dois dígitos verificadores do CPF.
 *
 * A conta: cada um dos nove primeiros dígitos é multiplicado por um peso que
 * decresce, somado, e o resto da divisão por 11 define o verificador. Depois
 * repete com dez dígitos para o segundo.
 *
 * Os onze dígitos iguais (00000000000, 11111111111…) passam nessa conta e são
 * inválidos na vida real. Entram como exceção porque 11111111111 é
 * exatamente o que alguém digita para pular o campo.
 */
export function cpfValido(valor: string): boolean {
  const n = soDigitos(valor);
  if (n.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(n)) return false;

  const verificador = (ate: number): number => {
    let soma = 0;
    for (let i = 0; i < ate; i += 1) {
      soma += Number(n[i]) * (ate + 1 - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return verificador(9) === Number(n[9]) && verificador(10) === Number(n[10]);
}

/** `12345678901` → `123.456.789-01`. Devolve o original se não der. */
export function formatarCpf(valor: string | null | undefined): string {
  const n = soDigitos(valor ?? "");
  if (n.length !== 11) return valor ?? "";
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
}

/**
 * Celular brasileiro com DDD: dez ou onze dígitos.
 *
 * Onze é celular com o nove na frente; dez ainda existe em fixo e em alguns
 * celulares antigos. O DDD não pode começar em zero, e não existe DDD abaixo
 * de 11.
 */
export function celularValido(valor: string): boolean {
  const n = soDigitos(valor);
  if (n.length !== 10 && n.length !== 11) return false;
  const ddd = Number(n.slice(0, 2));
  return ddd >= 11 && ddd <= 99;
}

/** `48991793316` → `(48) 99179-3316`. */
export function formatarCelular(valor: string | null | undefined): string {
  const n = soDigitos(valor ?? "");
  if (n.length === 11) {
    return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  }
  if (n.length === 10) {
    return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  }
  return valor ?? "";
}
