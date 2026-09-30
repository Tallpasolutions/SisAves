# Tokens de design — valores exatos

Fonte: `artboards/_ds/sisaves-design-system-a74bdb92-04ed-46d9-a36f-cfcf55dd3b47/tokens/*.css`.
Os arquivos CSS são limpos e podem ser **portados como estão** para o repositório novo; esta
página existe para quem for traduzi-los em outra tecnologia (Tailwind config, tema de design
system, tokens de plataforma).

## 1. Cor

### 1.1 Paleta oficial — fechada

| Token | Hex | Nome | Uso |
|---|---|---|---|
| `--sis-petroleo` | `#0B5D5E` | Petróleo | cor principal: texto de marca, ícone, cabeçalho, borda de foco e **um** bloco cheio por tela |
| `--sis-azul-profundo` | `#163A45` | Azul profundo | títulos, sidebar, contraste máximo |
| `--sis-ambar` | `#F2B544` | Âmbar | destaque pontual — **só para o que exige ação humana agora** |
| `--sis-neve` | `#F4F7F6` | Neve | fundo de página |
| `--sis-grafite` | `#1B2528` | Grafite | texto de interface |

**Não inventar cores fora desta lista.** Tons derivados só variam luminosidade dentro do matiz
da cor-mãe.

### 1.2 Tons derivados

```
--sis-petroleo-950 #052A2B   --sis-petroleo-900 #073B3C   --sis-petroleo-800 #094C4D
--sis-petroleo-700 #0B5D5E   --sis-petroleo-600 #0E7273   --sis-petroleo-500 #128A8B
--sis-petroleo-200 #B9D5D5   --sis-petroleo-100 #DCEAEA   --sis-petroleo-50  #EFF5F5

--sis-ambar-700 #8A5E12   ← único âmbar aprovado para texto pequeno sobre branco
--sis-ambar-600 #B07A1C   --sis-ambar-500 #F2B544
--sis-ambar-200 #FAE3B0   --sis-ambar-100 #FDF3DF

--sis-neutro-900 #1B2528  --sis-neutro-800 #2C383C  --sis-neutro-700 #425257
--sis-neutro-600 #5A6B70  --sis-neutro-500 #78888D  --sis-neutro-400 #9BA8AC
--sis-neutro-300 #C2CCCF  --sis-neutro-200 #DDE4E5  --sis-neutro-100 #ECF0F0
--sis-neutro-50  #F4F7F6  --sis-branco     #FFFFFF

--sis-tijolo-700 #8E2A20  --sis-tijolo-600 #A8352A  --sis-tijolo-100 #F7E4E1
```

`--sis-tijolo-*` é **adição intencional** ao pacote de marca original (vermelho terroso de
gravidade: perda de ninhada, óbito, erro de validação). Pendente de aprovação formal.

### 1.3 Aliases semânticos — tema claro

Use **sempre os aliases** no código de produto, nunca o hex cru nem o token de paleta.

**Superfícies**

| Alias | Valor |
|---|---|
| `--surface-page` | `--sis-neve` `#F4F7F6` |
| `--surface-card` | `#FFFFFF` |
| `--surface-sunken` | `--sis-neutro-100` `#ECF0F0` |
| `--surface-raised` | `#FFFFFF` |
| `--surface-inverse` | `--sis-petroleo-700` |
| `--surface-inverse-deep` | `--sis-azul-profundo` |
| `--surface-brand-soft` | `--sis-petroleo-50` `#EFF5F5` |
| `--surface-accent` | `--sis-ambar` `#F2B544` |
| `--surface-accent-soft` | `--sis-ambar-100` `#FDF3DF` |
| `--surface-danger-soft` | `--sis-tijolo-100` `#F7E4E1` |
| `--surface-hover` | `--sis-petroleo-50` |
| `--surface-selected` | `--sis-petroleo-100` `#DCEAEA` |
| `--surface-disabled` | `--sis-neutro-100` |

**Texto**

| Alias | Valor | Uso |
|---|---|---|
| `--text-primary` | `#1B2528` | corpo de interface |
| `--text-secondary` | `#5A6B70` | legenda, texto de apoio legível |
| `--text-muted` | `#78888D` | rótulo-guia, nota — **3,68:1 sobre branco: só ≥24px ou texto não essencial** |
| `--text-brand` | `#0B5D5E` | marca, link, valor destacado |
| `--text-heading` | `#163A45` | títulos |
| `--text-inverse` | `#FFFFFF` | sobre petróleo/azul profundo |
| `--text-on-accent` | `#163A45` | **obrigatório** sobre âmbar |
| `--text-accent` | `#8A5E12` | texto pequeno em âmbar sobre claro |
| `--text-danger` | `#A8352A` | erro, óbito, perda |
| `--text-disabled` | `#9BA8AC` | desabilitado |
| `--text-link` | `#0B5D5E` | link |
| `--text-link-hover` | `#073B3C` | link em hover |

**Bordas**

`--border-subtle` `#DDE4E5` (card) · `--border-default` `#C2CCCF` (campo) ·
`--border-strong` `#78888D` · `--border-brand` `#0B5D5E` · `--border-accent` `#F2B544` ·
`--border-danger` `#A8352A` · `--border-focus` `#0E7273`

**Status do plantel / ciclo do ovo**

| Status | Frente | Fundo |
|---|---|---|
| ok | `--sis-petroleo-800` `#094C4D` | `--sis-petroleo-100` `#DCEAEA` |
| atenção | `--sis-ambar-700` `#8A5E12` | `--sis-ambar-100` `#FDF3DF` |
| crítico | `--sis-tijolo-700` `#8E2A20` | `--sis-tijolo-100` `#F7E4E1` |
| neutro | `--sis-neutro-700` `#425257` | `--sis-neutro-100` `#ECF0F0` |
| info | `--sis-azul-profundo` `#163A45` | `--sis-petroleo-50` `#EFF5F5` |

### 1.4 Semânticas propostas no artboard A1 — pendentes de aprovação

Criadas porque o produto precisa comunicar **estado** sem gastar o âmbar, que comunica **ação**.

| Papel | Frente | Fundo | Frente sobre o fundo | Contraste medido |
|---|---|---|---|---|
| Sucesso (eclosão confirmada) | `#1E7A5F` | `#E3F1EB` | `#14614B` | 5,24:1 sobre branco · 6,35:1 no chip |
| Atenção (prazo aproximando) | `#9A5B23` | `#F6EBDD` | `#7E4A1C` | 5,39:1 sobre branco · 6,19:1 no chip |
| Crítico (perda, óbito, erro) | `#A8352A` | `#F7E4E1` | `#8E2A20` | 6,55:1 sobre branco · 6,85:1 no chip |
| Informação (etapa em curso) | `#1F6C86` | `#E4EEF2` | `#17566C` | 5,92:1 sobre branco · 6,89:1 no chip |

Se aprovadas, entram em `tokens/colors.css` como `--status-*` e ganham equivalentes de tema
escuro no mesmo padrão dos existentes.

### 1.5 Tema escuro — obrigatório

Ativado por `[data-theme="dark"]`. Não é opcional: o criador acompanha eclosões de madrugada no
galpão. Fundos em azul-esverdeado escuro, **nunca preto puro**; petróleo clareia para manter
contraste; âmbar permanece `#F2B544` e continua parcimonioso.

```
--surface-page #0D1C21   --surface-card #12272D   --surface-sunken #0A171B
--surface-raised #173238 --surface-brand-soft #123A3B --surface-accent-soft #3A2C10
--surface-accent #F2B544 --surface-danger-soft #3B1A16
--surface-hover #1A3439  --surface-selected #1D4143 --surface-disabled #1A2A2F
--surface-inverse #F4F7F6 --surface-inverse-deep #FFFFFF

--text-primary #E8EFEE   --text-secondary #A8BCBD  --text-muted #7E9496
--text-brand #5FB8B6     --text-heading #E8EFEE    --text-inverse #1B2528
--text-on-accent #163A45 --text-accent #F2B544     --text-danger #E98A7C
--text-disabled #5C7074  --text-link #5FB8B6       --text-link-hover #8AD2D0

--border-subtle #1F3A40  --border-default #2A4A50  --border-strong #456A70
--border-brand #3E9B99   --border-accent #F2B544   --border-danger #C4584B
--border-focus #5FB8B6

status ok      #7FCFCB / #123A3B     status atenção #F5C868 / #3A2C10
status crítico #EE9A8D / #3B1A16     status neutro  #A8BCBD / #1A2A2F
status info    #A8CFD0 / #12272D
```

Sombras no escuro trocam para preto puro em alpha maior: xs `0 1px 1px rgba(0,0,0,.4)`,
sm `0 1px 2px rgba(0,0,0,.45)`, md `0 2px 8px rgba(0,0,0,.5)`, lg `0 10px 28px rgba(0,0,0,.6)`,
inset `inset 0 1px 0 rgba(255,255,255,.05)`, scrim `rgba(3,12,14,.7)`.

## 2. Tipografia

```
--font-display  "Montserrat","Inter",Arial,sans-serif   ← marca e títulos
--font-ui       "Inter",Arial,sans-serif                ← interface e texto corrido
--font-numeric  "Inter",Arial,sans-serif                ← dado numérico (sempre tabular-nums)

--weight-regular 400  --weight-medium 500  --weight-semibold 600  --weight-bold 700
```

**Escala** (passo ~1,2, ancorada em 15px de corpo):

| Token | px | Token | px |
|---|---|---|---|
| `--text-2xs` | 11 | `--text-lg` | 20 |
| `--text-xs` | 12 | `--text-xl` | 24 |
| `--text-sm` | 13 | `--text-2xl` | 30 |
| `--text-base` | **15** | `--text-3xl` | 38 |
| `--text-md` | 17 | `--text-4xl` | 48 |
| | | `--text-5xl` | 60 |

**Entrelinha:** `--leading-tight` 1,15 · `--leading-snug` 1,3 · `--leading-normal` 1,5 ·
`--leading-relaxed` 1,65
**Tracking:** `--tracking-tight` −0,02em · `--tracking-snug` −0,01em · `--tracking-normal` 0 ·
`--tracking-wide` +0,04em (anilha) · `--tracking-caps` +0,08em (rótulo-guia caixa alta)

**Papéis prontos** (a forma como o A1 apresenta a escala):

| Token | Composição | Especímen no A1 |
|---|---|---|
| `--type-display` | Montserrat 700 · 48 / 1,15 | "Plantel ativo" |
| `--type-h1` | Montserrat 700 · 38 / 1,15 | "Ninhadas do galpão" |
| `--type-h2` | Montserrat 600 · 30 / 1,3 | "Coeficiente de endogamia" |
| `--type-h3` | Montserrat 600 · 24 / 1,3 | "Ciclo do ovo" |
| `--type-h4` | Montserrat 600 · 17 / 1,3 | "Ovoscopia pendente" |
| `--type-body` | Inter 400 · 15 / 1,5 | corpo |
| `--type-body-strong` | Inter 500 · 15 / 1,5 | corpo enfatizado |
| `--type-small` | Inter 400 · 13 / 1,5 | legenda e texto de ajuda |
| `--type-label` | Inter 500 · 13 / 1,3 | rótulo de campo |
| `--type-overline` | Inter 600 · 11 / 1,3 + `+0,08em` + caixa alta | rótulo-guia ("AVES ATIVAS") |
| `--type-data-lg` | Inter 600 · 30 / 1,15 tabular | "3,13%" · "R$ 1.240,00" |
| `--type-data` | Inter 500 · 15 / 1,3 tabular | "18,4 g" |

Títulos levam tracking negativo leve (display/H1 `--tracking-tight`, H2/H3 `--tracking-snug`).

**Regra sem exceção:** todo dado numérico — anilha, percentual, peso, valor, contagem, data em
coluna — usa `font-variant-numeric: tabular-nums`. Colunas de tabela precisam alinhar dígito a
dígito.

**Utilitários do DS:** `.sis-numeric` (tabular) · `.sis-overline` (rótulo-guia completo) ·
`.sis-anilha` (tabular + `+0,04em` + peso 600).

## 3. Espaçamento, raios e alvos

**Grade base 4px.**
`--space-1` 4 · `-2` 8 · `-3` 12 · `-4` 16 · `-5` 20 · `-6` 24 · `-7` 32 · `-8` 40 · `-9` 48 ·
`-10` 64 · `-11` 80 · `-12` 96

**Raios:** `--radius-xs` 3px (chip, checkbox) · `--radius-sm` 5px (controle, botão) ·
`--radius-md` 8px (card) · `--radius-lg` 12px (bottom sheet) · `--radius-pill` 999px
(**só** badge, chip de status e barra de progresso). Nada de cantos muito arredondados em
contêineres.

**Traços:** `--border-width` 1px · `--border-width-strong` 2px · `--border-width-marker` 3px
(faixa de gravidade em linha de tabela — **nunca em card**).

**Alvos e alturas:** `--touch-min` 44px · `--touch-comfort` 52px · `--control-h-sm` 32px ·
`--control-h-md` 40px · `--control-h-lg` 48px (app de campo).

**Chrome e medida:** `--sidebar-w` 248px · `--sidebar-w-collapsed` 60px · `--topbar-h` 56px ·
`--tabbar-h` 60px · `--container-max` 1280px · `--measure-prose` 64ch.

**Densidade de tabela:** `--row-h-compact` 36px · `--row-h-default` 44px (tocável) ·
`--row-h-comfort` 56px. Densidade é escolha explícita, não acidente.

## 4. Elevação

```
--shadow-none   none
--shadow-xs     0 1px 1px rgba(11,45,48,.06)                                  ← card padrão
--shadow-sm     0 1px 2px rgba(11,45,48,.08), 0 1px 1px rgba(11,45,48,.04)
--shadow-md     0 2px 6px rgba(11,45,48,.10), 0 1px 2px rgba(11,45,48,.06)    ← popover, dropdown
--shadow-lg     0 8px 24px rgba(11,45,48,.14)                                 ← diálogo
--shadow-inset  inset 0 1px 0 rgba(255,255,255,.5)
--shadow-sticky 0 1px 0 var(--border-subtle)                                  ← cabeçalho fixo
--focus-ring    0 0 0 3px color-mix(in oklch, var(--border-focus) 34%, transparent)
--focus-ring-offset 2px
--overlay-scrim rgba(9,29,32,.55)
--blur-overlay  blur(2px)   ← reservado a overlay; nunca vidro fosco decorativo
```

Sombras são curtas e frias (azuladas). **Nunca colorida, nunca brilho.** A hierarquia vem de
borda + fundo, não de sombra difusa.

## 5. Movimento

```
--duration-instant 80ms   --duration-fast 120ms   --duration-base 180ms
--duration-slow    260ms  --duration-sheet 300ms

--ease-standard cubic-bezier(.2,0,.2,1)   --ease-out cubic-bezier(0,0,.2,1)
--ease-in       cubic-bezier(.4,0,1,1)

--transition-control  background-color/border-color/color/box-shadow
                      var(--duration-fast) var(--ease-standard)
```

`@media (prefers-reduced-motion: reduce)` zera todas as durações. Nenhum bounce, nenhuma mola,
nenhum easing exagerado.

## 6. Transparência

Quase nada. Só: scrim de diálogo (`--overlay-scrim`), hover sobre sidebar escura
(`rgba(255,255,255,.07)` / `.14`) e texto secundário sobre petróleo (`rgba(255,255,255,.7)`).
Blur de 2px existe como token mas é reservado a overlay.
