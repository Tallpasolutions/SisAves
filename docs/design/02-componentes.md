# Contrato dos componentes (artboard A3)

Medidas, cores por estado e cópia exata de cada componente mostrado no A3. As props listadas
são as **verificadas em uso** nos artboards; o design system tem `.d.ts` e `.prompt.md` por
componente para a superfície completa da API.

Regra geral de implementação: **use os aliases semânticos** (`--text-brand`, `--surface-hover`),
nunca o hex cru. Todo estado interativo é comunicado por **cor de superfície + borda**, nunca por
opacidade e nunca só por cor.

---

## 1. Botões

Quatro variantes × quatro estados. Alturas: `sm` 32px, `md` **40px** (padrão),
`lg` 48px (app de campo). Padding horizontal 16px, raio `--radius-sm` 5px,
tipografia Inter 500 / 15px, `letter-spacing: -0,01em`. Rótulo é **verbo** no infinitivo.

| Variante | Normal | Hover | Foco | Desabilitado |
|---|---|---|---|---|
| **Primário** | fundo `--sis-petroleo-700` `#0B5D5E`, texto branco, borda da mesma cor | fundo `#094C4D` (800), borda `#073B3C` (900) | fundo 700 + `outline: 2px solid --border-focus`, `outline-offset: 2px` | fundo `--surface-disabled`, texto `--text-disabled`, borda subtle, `cursor:not-allowed` |
| **Secundário** (contornado) | fundo branco, texto `--text-brand`, borda `--border-default` | fundo `--surface-hover`, borda `--border-brand` | fundo branco, borda default + outline de foco | idem acima |
| **Terciário** (texto) | fundo transparente, texto `--text-brand`, sem borda | fundo `--surface-hover`, borda `--border-brand` | transparente + outline de foco | idem acima |
| **Destrutivo** | fundo `--sis-tijolo-600` `#A8352A`, texto branco | fundo `#8E2A20` (700) | fundo 600 + outline de foco | idem acima |

Existe uma quinta variante no DS, `accent` (âmbar): **no máximo um por tela**, e só quando há
prazo vencendo agora. Fundo `--surface-accent`, texto `--text-on-accent` (azul profundo, 6,65:1).

**Press:** um passo mais escuro que o hover (petróleo 800 → 900). **Sem shrink/scale.**
Ícone nunca substitui o rótulo na ação principal de uma tela.

Cópia usada no A3: "Registrar postura" · "Ver ninhada" · "Cancelar" · "Registrar óbito".

Props verificadas: `variant="primary|secondary|ghost|danger|accent"`, `size="sm|md|lg"`,
`disabled`, filhos = rótulo.

## 2. Campos de formulário

Estrutura fixa e vertical: **rótulo acima → controle → ajuda ou erro abaixo**. Rótulo é
persistente (nunca placeholder como rótulo), `--type-label` Inter 500/13px, `--text-secondary`.
Campo obrigatório ganha marcador junto ao rótulo. Ajuda em `--type-small` 13px
`--text-secondary`. **O erro substitui a ajuda** e cita o dado exato.

Controle: altura 40px, raio 5px, borda `1px --border-default`, fundo branco, texto 15px
`--text-primary`. Estados:

- **Foco:** borda `--border-focus` 2px + `--focus-ring` (halo 3px translúcido), offset 2px.
- **Erro:** borda `--border-danger`, texto de erro `--text-danger` + ícone — nunca só cor.
- **Preenchido:** idêntico ao normal, com valor em `--text-primary`; valor numérico em
  `--font-numeric` tabular.
- **Desabilitado:** fundo `--surface-disabled`, texto `--text-disabled`.

Os quatro campos do A3, com a cópia exata:

| Rótulo | Estado mostrado | Conteúdo |
|---|---|---|
| Anilha da matriz | obrigatório, vazio | placeholder `COBP-25-04781` |
| Peso ao anilhamento | com ajuda + sufixo | ajuda "Gramas, com uma decimal. Não arredondar." · sufixo `g` · numérico |
| Código COBP | erro, preenchido | valor `COBP-25-04781` · erro "O código COBP-25-04781 já existe no plantel." |
| Data da postura | preenchido com ícone | ícone `Calendar` à esquerda · valor `09/03/2026` |

Props verificadas — `Field`: `label`, `required`, `hint`, `error`, filhos = controle.
`Input`: `placeholder`, `defaultValue`, `numeric`, `suffix`, `iconLeft`, `invalid`.

**Validação:** no `blur` e no envio, nunca a cada tecla. Peso e valor financeiro não são
arredondados na exibição.

## 3. Etiqueta de anilha — componente próprio

A anilha oficial de clube é o **identificador primário** de uma ave; por isso é componente e não
texto solto. Formato: **`CLUBE 1234 · ANO · SEQUENCIAL`** — no A3, `SOV 1234 · 2026 · 0087`.

Tipografia: `--font-numeric`, peso **600**, `tabular-nums`, `letter-spacing: +0,04em`
(`--tracking-wide`) — pensada para leitura a meio metro, com a ave na mão. Tamanhos `sm` / `md`
(padrão) / `lg`. Tons: `default` (neutro), `brand` (petróleo), `quiet` (discreto, para uso dentro
de diálogo e listas secundárias). Prop `club` acrescenta o nome do clube ao lado ("Clube SOV").

Nunca reformatar, abreviar ou quebrar o código em duas linhas. Nunca substituir por um id interno
na interface do criador.

Props verificadas: `code`, `size="sm|md|lg"`, `tone="default|brand|quiet"`, `club`.

## 4. Os 6 chips de estado do ovo

O ciclo é **chocando → ovoscopia → nascimento/eclosão → anilhamento → separação**, mais o estado
de exceção **perda**. Chips são pílulas (`--radius-pill`), Inter 500/12px, `padding: 4px 11px`,
com ícone Lucide de 13px opcional à esquerda. **Não são focáveis** — não são interativos.

| # | Chip (cópia exata) | Tom | Frente / fundo | Ícone |
|---|---|---|---|---|
| 1 | `Chocando · dia 6` | info | `#163A45` / `#EFF5F5` | `Thermometer` |
| 2 | `Ovoscopia` | neutro | `#425257` / `#ECF0F0` | `Egg` |
| 3 | `Eclosão · 21/03` | ok | `#094C4D` / `#DCEAEA` | `CircleCheck` |
| 4 | **`Anilhar hoje`** | **âmbar — crítico de ação** | `--text-on-accent` `#163A45` / `--surface-accent` `#F2B544`, borda `#D69B24` | `Feather` |
| 5 | `Separação · 24/04` | neutro | `#425257` / `#ECF0F0` | `Users` |
| 6 | `Perda · 2 ovos` | crítico | `#8E2A20` / `#F7E4E1` | `CircleAlert` |

**Por que só "Anilhar" é âmbar:** anilhamento tem janela biológica curta — passou o dia, a anilha
não entra mais. É o único estado do ciclo que exige ação humana **hoje**, e o âmbar existe
exatamente para isso. Ele também é o único chip em peso 600, com borda própria, e o único que
recebe faixa de gravidade âmbar na linha de tabela. Os outros cinco informam; ele convoca.

Perda usa tijolo (gravidade), não âmbar: é um fato registrado, não uma tarefa.

Props verificadas — `Badge`: `tone="ok|atencao|critico|neutro|info"`, `icon`, `size="sm|md"`,
`dot`.

## 5. Chip de sexo

Retângulo de raio 3px (`--radius-xs`), borda `--border-subtle`, fundo branco, `padding: 4px 10px`.
Dentro: o glifo em `--font-numeric` peso 600 seguido do rótulo em 12px `--text-secondary`.

| Valor | Glifo | Cor do glifo | `aria-label` |
|---|---|---|---|
| Macho | `M` | `--sis-petroleo-700` `#0B5D5E` | `Macho` |
| Fêmea | `F` | `--sis-azul-profundo` `#163A45` | `Fêmea` |
| Indefinido | `—` (travessão) | `--text-muted` | `Sexo indefinido` |

**Sem ícone e sem unicode de gênero.** Lucide não tem glifo de sexo e ♂/♀ como ícone é proibido.
A cor nunca é o único sinal: o rótulo em texto e o `aria-label` sempre acompanham. No avatar do
card de ave, o mesmo glifo aparece em 40px sobre `--surface-brand-soft`.

## 6. Medidor de coeficiente de endogamia

Barra horizontal (pílula) com o valor em `--type-data-lg` tabular ao lado, rótulo do estado e,
opcionalmente, a escala das faixas. Três faixas:

| Faixa | Intervalo | Cor | Rótulo | Valor de exemplo no A3 |
|---|---|---|---|---|
| Seguro | < 6,25% | petróleo | Seguro | **3,13%** |
| Atenção | 6,25% – 12,5% | âmbar / `--text-accent` para o texto | Atenção | **9,38%** |
| Risco | > 12,5% | tijolo | Risco | **14,06%** |

Os limiares são os do domínio: 6,25% ≈ cruzamento de primos-primeiros, 12,5% ≈ meio-irmãos.
O valor **sempre** com duas decimais e `tabular-nums`. A cópia do estado de risco é factual:
"Risco — 14,06%. Endogamia acima de 12,5%." — nunca "Cuidado com esse casal!".
Anima só a largura da barra, em `--duration-base`.

Props verificadas: `value` (number, percentual), `showScale` (boolean).

## 7. Card de ave

Card branco, borda `1px --border-subtle`, raio `--radius-md` 8px, `--shadow-xs`,
padding `md` (16px), `interactive` (ganha `--surface-hover` no hover). **Sem barra colorida à
esquerda** — isso é exclusivo da linha de tabela.

Composição vertical, `gap: 10px`:

1. **Linha de identidade** — avatar de 40px (raio 5px, fundo `--surface-brand-soft`, glifo de sexo
   em 17px peso 600) + nome em `--type-h4` `--text-heading` ("Curió Tibiriçá") + subtítulo em
   12px `--text-secondary` ("Curió · mutação clássica · reprodutor"); à direita, badge de status
   com ponto ("Plantel ativo", tom ok, `size="sm"`).
2. **Etiqueta de anilha** (componente do item 3).
3. **Rodapé de dados** — separado por `1px --border-subtle` + `padding-top: 10px`, três pares
   rótulo-guia/valor com `gap: 20px`: Peso `18,4 g` · Ninhadas `6` · Endogamia `3,13%`
   (esta em `--text-brand`). Valores em `--type-data` tabular.

## 8. Linha de tabela

Grade `3px 1fr 74px 44px 90px` com `gap: 10px` e `padding-right: 12px`.

- **Cabeçalho:** 36px, fundo `--surface-sunken`, rótulos em `--type-overline` caixa alta
  `--text-secondary`. Colunas numéricas alinham à direita.
- **Linha:** 44px (`--row-h-default`, tocável), separador `1px --border-subtle`.
  Nome em Inter 500/13px; data e contagem em `--font-numeric` tabular.
- **Faixa de gravidade** — primeira coluna de **3px** (`--border-width-marker`), altura total:
  transparente (normal), `--sis-ambar` (atenção/ação hoje), `--sis-tijolo-600` (crítico).
  Este é **um dos dois únicos lugares** onde uma barra colorida à esquerda é permitida.
- **Fundo por severidade:** normal branco; atenção `--surface-accent-soft` `#FDF3DF`;
  selecionado `--surface-selected` `#DCEAEA` com nome em peso 600.

As três linhas do A3: `Ninhada 04 · 09/03/2026 · 5 · Chocando` (normal) ·
`Ninhada 05 · 27/02/2026 · 4 · Anilhar` (âmbar) ·
`Ninhada 06 · 14/02/2026 · 2 · Perda` (tijolo, selecionada).

## 9. Tabs

Altura 42px, alinhadas à esquerda. Aba ativa: texto `--text-brand` peso 600 + sublinhado
petróleo de 2px; inativa: `--text-secondary` peso 500, sem sublinhado. Contador opcional ao lado
do rótulo, em `--font-numeric` tabular. Foco: outline 2px `--border-focus`, offset 2px.

Abas do A3: `Plantel (128)` · `Ninhadas (6)` · `Casais (14)` · `Saúde` (sem contador —
proposital: contador só onde a contagem informa).

Props verificadas: `tabs=[{value,label,count?}]`, `value`, `onChange`.

## 10. Toast

Card `--shadow-md`, raio 8px, borda subtle, faixa/ícone do tom à esquerda, título em Inter 500/15
e descrição em 13px `--text-secondary`. Aparece com fade + 6px de subida em `--duration-base`.
Não bloqueia; não pede confirmação.

Cópia do A3 (tom ok): título "Postura registrada · Ninhada 04 · 5 ovos", descrição
"Ovoscopia prevista para 17/03/2026." — o padrão é **fato + consequência com data**, nunca
"Tudo pronto!".

Props verificadas: `tone`, `title`, `description`.

## 11. Modal (diálogo)

Scrim `--overlay-scrim` `rgba(9,29,32,.55)`. Caixa branca de até 340px (no A3; no produto,
até 480px para formulário), raio `--radius-md` 8px, `--shadow-lg`, três zonas separadas por
`1px --border-subtle`:

1. **Cabeçalho** — `padding: 14px 16px`, título em `--type-h4` `--text-heading`
   ("Registrar óbito").
2. **Corpo** — `padding: 14px 16px`, `--type-body`: "A ave sai do plantel ativo e permanece na
   genealogia." + a anilha da ave em tom `quiet`. O corpo diz **a consequência real**, não
   "Tem certeza?".
3. **Rodapé** — `padding: 12px 16px`, ações à **direita**, `gap: 10px`, `size="sm"`:
   terciário "Cancelar" + destrutivo "Registrar óbito". A ação confirmadora repete o verbo do
   título.

Entra com fade + 6px de subida. Prende o foco e devolve ao disparador ao fechar.

## 12. Estado vazio

Alinhado à **esquerda** (nada centralizado), sem ilustração e sem emoji: ícone Lucide do domínio
(aqui `Egg`) em `--text-muted`, título em `--type-h4` e descrição em `--type-body`
`--text-secondary`, mais a ação primária quando existe.

Cópia do A3: "Nenhuma ninhada ativa" / "Registre uma postura para acompanhar o ciclo do ovo até
o anilhamento." — nomeia o que falta e diz o próximo passo concreto.

Props verificadas: `icon`, `title`, `description`, `compact`.

## 13. Indicador offline / sincronizando

Informação de primeira classe: o galpão não tem sinal. Chip com ícone + texto, altura 32px
(26px em `compact`), três estados:

| Estado | Ícone | Cópia | Tom |
|---|---|---|---|
| `offline` | `WifiOff` | "Offline — salvo no aparelho" | neutro/atenção |
| `pendente` | `RefreshCw` | "4 registros pendentes" (contagem tabular) | atenção |
| `online` | `CircleCheck` | "Sincronizado · hoje 07:42" | ok |

Nunca "Sem conexão. Tente novamente mais tarde." — o registro **não** se perde, e a cópia precisa
dizer isso. O ícone `RefreshCw` pode girar durante o envio; fora dele, estático.

Props verificadas: `state="offline|pendente|online"`, `pending`, `lastSync`, `compact`.

## 14. Badge de notificação

Ancorado no canto de um alvo de **44px** (o alvo é o botão, não o badge).

- **Com contagem:** pílula de 20px de altura, `min-width: 20px`, `padding: 0 5px`, fundo
  `--surface-accent` `#F2B544`, texto `--text-on-accent` `#163A45` em `--font-numeric` 600/11px
  tabular, borda de 2px na cor da superfície-mãe (para destacar da borda do botão).
  Posição `top: -6px; right: -6px`.
- **Só ponto:** 10px, `--sis-tijolo-600`, mesma borda de 2px, `top: -5px; right: -5px`.

Contagem em âmbar = há tarefa esperando ação; ponto tijolo = há algo grave para ver.
Acima de 99, exibir `99+`.
