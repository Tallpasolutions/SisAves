# Acessibilidade — contraste medido

Todos os valores abaixo foram **calculados** (WCAG 2.1 relative luminance) a partir dos hex
exatos dos tokens, não estimados. Alvo: **4,5:1** para texto de interface, **3:1** para texto
≥24px (ou ≥19px negrito) e para bordas/ícones que carregam significado.

| Frente | Fundo | Uso | Contraste | Veredito |
|---|---|---|---|---|
| Grafite #1B2528 | Branco #FFFFFF | corpo de interface | 15,65:1 | AAA |
| Grafite #1B2528 | Neve #F4F7F6 | corpo sobre página | 14,52:1 | AAA |
| Azul profundo #163A45 | Branco #FFFFFF | títulos | 12,17:1 | AAA |
| Azul profundo #163A45 | Neve #F4F7F6 | títulos sobre página | 11,29:1 | AAA |
| Petróleo 700 #0B5D5E | Branco #FFFFFF | texto de marca, link, valor destacado | 7,66:1 | AAA |
| Petróleo 700 #0B5D5E | Neve #F4F7F6 | idem sobre página | 7,11:1 | AAA |
| Petróleo 700 #0B5D5E | Petróleo 50 #EFF5F5 | texto em bloco soft de marca | 6,95:1 | AA |
| Neutro 600 #5A6B70 | Branco #FFFFFF | texto secundário | 5,57:1 | AA |
| Neutro 600 #5A6B70 | Neve #F4F7F6 | texto secundário na página | 5,17:1 | AA |
| Neutro 500 #78888D | Branco #FFFFFF | texto muted (rótulo, nota) | 3,68:1 | só ≥24px / ≥19px negrito |
| Neutro 500 #78888D | Neve #F4F7F6 | texto muted na página | 3,41:1 | só ≥24px / ≥19px negrito |
| Branco #FFFFFF | Petróleo 700 #0B5D5E | rótulo de botão primário | 7,66:1 | AAA |
| Branco #FFFFFF | Petróleo 800 #094C4D | botão primário em hover | 9,76:1 | AAA |
| Branco #FFFFFF | Azul profundo #163A45 | texto na sidebar | 12,17:1 | AAA |
| Branco #FFFFFF | Tijolo 600 #A8352A | rótulo de botão destrutivo | 6,55:1 | AA |
| Azul profundo #163A45 | Âmbar #F2B544 | texto sobre chip/botão âmbar (--text-on-accent) | 6,65:1 | AA |
| Grafite #1B2528 | Âmbar #F2B544 | alternativa escura sobre âmbar | 8,55:1 | AAA |
| Âmbar #F2B544 | Branco #FFFFFF | PROIBIDO: âmbar como texto sobre branco | 1,83:1 | reprovado |
| Âmbar 700 #8A5E12 | Branco #FFFFFF | único âmbar aprovado para texto pequeno | 5,69:1 | AA |
| Âmbar 700 #8A5E12 | Âmbar 100 #FDF3DF | chip de atenção do DS | 5,17:1 | AA |
| Tijolo 700 #8E2A20 | Tijolo 100 #F7E4E1 | chip crítico | 6,85:1 | AA |
| Tijolo 600 #A8352A | Branco #FFFFFF | texto de erro em campo | 6,55:1 | AA |
| Petróleo 800 #094C4D | Petróleo 100 #DCEAEA | chip ok do DS | 7,90:1 | AAA |
| Neutro 700 #425257 | Neutro 100 #ECF0F0 | chip neutro do DS | 7,10:1 | AAA |
| Azul profundo #163A45 | Petróleo 50 #EFF5F5 | chip info do DS | 11,04:1 | AAA |
| Sucesso #1E7A5F | Branco #FFFFFF | ícone/valor de sucesso | 5,24:1 | AA |
| Sucesso escuro #14614B | Fundo sucesso #E3F1EB | chip de sucesso proposto | 6,35:1 | AA |
| Atenção #9A5B23 | Branco #FFFFFF | texto de atenção | 5,39:1 | AA |
| Atenção escura #7E4A1C | Fundo atenção #F6EBDD | chip de atenção proposto | 6,19:1 | AA |
| Informação #1F6C86 | Branco #FFFFFF | ícone/valor informativo | 5,92:1 | AA |
| Info escura #17566C | Fundo info #E4EEF2 | chip de informação proposto | 6,89:1 | AA |
| Borda de foco #0E7273 | Branco #FFFFFF | anel de foco (mínimo 3:1) | 5,72:1 | AA |
| Borda default #C2CCCF | Branco #FFFFFF | borda de campo (mínimo 3:1) | 1,64:1 | reprovado |
| Borda subtle #DDE4E5 | Branco #FFFFFF | borda de card (decorativa) | 1,29:1 | reprovado |
| Texto desabilitado #9BA8AC | Superfície desabilitada #ECF0F0 | estado desabilitado (isento de AA) | 2,13:1 | isento (WCAG 1.4.3 exclui componentes inativos) |

## Regras que saem dessas medições

1. **Âmbar #F2B544 nunca é cor de texto sobre branco** (1,83:1 — reprovado).
   Âmbar é **fundo**, com texto em azul profundo (6,65:1) ou grafite (8,55:1).
   Para texto pequeno em âmbar sobre claro use **--text-accent `#8A5E12`** (5,69:1).
2. **Texto muted (`--text-muted` #78888D) não sustenta 4,5:1 sobre branco** (3,68:1).
   Use-o só em rótulos ≥24px ou em texto não essencial; para legenda pequena legível use
   `--text-secondary` #5A6B70 (5,57:1).
3. **Anel de foco** `--border-focus` #0E7273 sobre branco = 5,72:1 — acima de 3:1,
   válido como indicador não textual. Sempre 2px sólido + offset 2px, nunca só sombra.
4. **Borda de campo** `--border-default` #C2CCCF = 1,64:1: abaixo de 3:1.
   Por isso a borda **não** é o único sinal de um campo — rótulo persistente acima é obrigatório,
   e estados de erro somam ícone + texto, nunca só cor.
5. **Estado desabilitado** é isento de AA por WCAG 1.4.3, mas nunca deve ser comunicado só por
   opacidade: fundo `--surface-disabled`, texto `--text-disabled`, `cursor:not-allowed`.

## Alvos de toque e teclado

- Alvo mínimo **44×44px** (`--touch-min`); **48px** (`--control-h-lg`) no app de campo, onde o
  criador opera com uma ave na mão. Linha de tabela tocável = 44px (`--row-h-default`);
  36px (`--row-h-compact`) só em tabela de desktop com ponteiro.
- Badge de notificação (20px) e o ponto de 10px **não são alvos**: o alvo é o botão de 44px que os
  contém.
- Todo controle tem foco visível. Ordem de tabulação segue a ordem visual. Diálogo prende o foco
  e devolve ao disparador ao fechar. Chip de status não é focável (não é interativo).
- Sexo da ave nunca é comunicado só pela letra colorida: `aria-label="Macho"` / `"Fêmea"` /
  `"Sexo indefinido"` acompanha o glifo M/F/—.
- `prefers-reduced-motion` zera todas as durações (já previsto em `tokens/motion.css`).
