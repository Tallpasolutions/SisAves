# Handoff: SisAves — Fundamentos (guia de estilo, marca e biblioteca de componentes)

## Visão geral

Este pacote entrega os **fundamentos visuais do SisAves** — SaaS brasileiro de gestão de
criatórios de aves ornamentais — em três artboards de referência mais a documentação exata
necessária para implementá-los em código:

| Artboard | Tamanho | Conteúdo |
|---|---|---|
| **A1 — Guia de estilo** | 1400 × 1000 | 5 tokens oficiais de cor (hex, nome, uso), 4 cores semânticas derivadas, escala tipográfica completa, grade de espaçamento, raios, elevações |
| **A2 — Aplicação do logo** | 1400 × 800 | assinatura horizontal, versão branca, símbolo, app icon, favicon 16/32/64, área livre de 1/4, quadro de usos incorretos |
| **A3 — Biblioteca de componentes** | 1400 × 1200 | botões (4 variantes × 4 estados), campos, etiqueta de anilha, 6 chips do ciclo do ovo, chip de sexo, medidor de endogamia, card de ave, linha de tabela, tabs, toast, modal, estado vazio, offline/sincronizando, badge de notificação |

Idioma da interface: **português do Brasil**. Datas `dd/mm/aaaa`, decimais com vírgula,
moeda `R$ 1.240,00`.

## Sobre os arquivos de design

Os arquivos em `artboards/` são **referências de design feitas em HTML** — protótipos que
mostram a aparência e o comportamento pretendidos, **não código de produção para copiar**.

A tarefa é **recriar estes designs no ambiente do codebase de destino** (React, Vue, Next,
React Native, SwiftUI, o que for) usando os padrões e as bibliotecas já estabelecidos nele.
Se ainda não existe codebase — este é o caso: o sistema será construído a partir de zero com
o Claude Code — escolha o framework adequado e implemente os designs ali, tratando
`01-tokens.md` como a fonte de verdade das variáveis e `02-componentes.md` como o contrato de
cada componente.

O HTML dos artboards usa um runtime próprio do ambiente de design (`support.js`,
`_ds_bundle.js`). **Não porte esse runtime.** Ele existe apenas para o arquivo abrir e ser
inspecionado. O que se porta são os **tokens CSS** (`artboards/_ds/.../tokens/*.css`, arquivos
limpos e reutilizáveis como estão) e os **SVGs da marca** (`artboards/assets/`).

## Fidelidade

**Alta fidelidade (hifi).** Cores, tipografia, espaçamentos, raios, sombras, estados e cópia
são finais e devem ser reproduzidos com precisão. Todo valor citado nesta documentação vem
dos tokens do design system SisAves, não de estimativa visual. Os contrastes em
`04-acessibilidade.md` foram **calculados** a partir dos hex, não aferidos a olho.

Duas ressalvas de origem, herdadas do design system e ainda **pendentes de aprovação formal**:

1. `--sis-tijolo-600` `#A8352A` (vermelho de gravidade) é adição ao pacote de marca original,
   que não tinha cor de erro.
2. As quatro cores semânticas do A1 (sucesso `#1E7A5F`, atenção `#9A5B23`, crítico `#A8352A`,
   informação `#1F6C86`) também são adição — criadas porque o produto precisa comunicar estado
   sem gastar o âmbar, que é reservado a **ação humana agora**. Ver "Decisões que precisam de
   aprovação" no fim deste arquivo.

## Documentos deste pacote

| Arquivo | O que contém |
|---|---|
| `README.md` | este documento: visão geral, artboards, telas, comportamento, arquivos |
| `01-tokens.md` | **todos** os valores de design (cor clara e escura, tipo, espaço, raio, sombra, movimento) prontos para virar variáveis |
| `02-componentes.md` | contrato de cada componente: variantes, estados, medidas, cópia, props verificadas |
| `03-conteudo-e-copy.md` | voz, caixa, vocabulário do domínio, tabela de cópia certa × errada |
| `04-acessibilidade.md` | tabela de contraste calculado por par de cores, regras derivadas, alvos de toque e teclado |
| `05-telas.md` | inventário das 19 telas do produto (Faixas B e C) com decisões de implementação |
| `06-documentos-e-site.md` | CRO impresso A4, página de validação por QR e landing page (Faixa D) |
| `CLAUDE.md` | arquivo de regras para colocar na raiz do repositório novo — o Claude Code lê e obedece |
| `MANIFEST.md` | inventário e verificação de procedência de cada arquivo do pacote |

## Telas / artboards

### A1 — Guia de estilo (1400 × 1000)

**Propósito:** referência única de cor, tipo, espaço e profundidade. É a página que um novo
desenvolvedor abre antes de escrever a primeira linha de CSS.

**Layout:** coluna vertical, `padding: 40px 44px`, `gap: 24px`, fundo `--surface-page`
(`#F4F7F6`), borda `1px solid --border-default`.

1. **Cabeçalho** — linha `space-between` com rótulo-guia "A1 · FUNDAMENTOS" em `--type-overline`
   petróleo + `<h1>` "Guia de estilo" em `--type-h2`, e à direita a dimensão do artboard em
   `--type-small` muted; separador `1px --border-subtle` com `padding-bottom: 14px`.
2. **Grade principal** — `grid-template-columns: 640px 1fr; gap: 32px`.
   - **Coluna esquerda:** paleta oficial em `repeat(5,1fr)` — cada carta é um card branco
     (borda subtle, raio 8px, `--shadow-xs`) com chapa de cor de 64px de altura, nome em Inter
     600/13px, hex em `--font-numeric` 500/12px tabular e frase de uso em 12px. Abaixo, as
     4 semânticas derivadas em `repeat(4,1fr)`: quadrado de 20px (raio 3px), nome, hex + hex de
     fundo, um chip pílula de exemplo e a justificativa com o contraste medido.
   - **Coluna direita:** escala tipográfica em card branco, cada linha
     `grid-template-columns: 1fr 150px` com o especímen à esquerda e o token + a especificação
     ("Montserrat 700 · 48/1,15") à direita; réguas `1px --border-subtle` separam display/H,
     texto e dado numérico.
3. **Faixa inferior** — `grid-template-columns: 1fr 380px 300px; gap: 24px`: escala de
   espaçamento (12 quadrados de 4 a 96px em petróleo-600, os dois maiores em petróleo-200/100
   para não pesar), 5 amostras de raio (56 × 44px, 3/5/8/12/pílula) e 4 amostras de sombra
   (48 × 36px, xs/sm/md/lg).

### A2 — Aplicação do logo (1400 × 800)

**Propósito:** dizer exatamente como a marca pode e não pode aparecer.

**Layout:** duas faixas.

1. **Faixa de assinaturas** — `grid-template-columns: 1fr 1fr 210px 210px; gap: 16px`; cada
   célula é um palco de 130px de altura com rótulo-guia acima e legenda de regra abaixo:
   - assinatura horizontal (altura 40px) sobre Neve `#F4F7F6`;
   - assinatura branca (40px) sobre petróleo `#0B5D5E` — obrigatória sobre petróleo, azul
     profundo e fotografia escura;
   - símbolo isolado (64px) sobre branco;
   - app icon (72px) sobre branco — **único uso permitido abaixo de 32px**.
2. **Faixa de regras** — `grid-template-columns: 270px 300px 1fr; gap: 20px`:
   - **favicon** em 16 / 32 / 64px lado a lado, alinhados pela base (em 16px o olho vazado
     fecha: usar o app icon, nunca a assinatura);
   - **área livre**: símbolo de 96px dentro de uma moldura com `padding: 24px` marcada em
     tracejado petróleo-500 sobre petróleo-50 e cotada "24 px" — a regra é **1/4 da altura do
     símbolo** em todos os lados, e nada entra nessa faixa (nem texto, nem borda, nem foto);
   - **usos incorretos**: 5 palcos de 104px com borda `--border-danger`, cada um com o defeito
     aplicado de verdade e rótulo com ícone `X` em `--text-danger`: **gradiente, sombra,
     contorno, rotação, distorção**. Este bloco é controlável pela prop `mostrarUsosIncorretos`.

### A3 — Biblioteca de componentes (1400 × 1200)

**Propósito:** o inventário dos componentes com todos os estados visíveis ao mesmo tempo, para
implementação e para revisão de QA.

**Layout:** três faixas, cada componente dentro de um card branco com rótulo-guia acima.

1. `grid: 620px 1fr` — matriz de botões (4 variantes × 4 estados) e grade 2 × 2 de campos.
2. `grid: 340px 1fr 300px` — etiqueta de anilha, chips do ciclo do ovo + chip de sexo + badge de
   notificação, medidor de endogamia nas três faixas.
3. `grid: 1fr 420px` — tabs + linha de tabela + card de ave; modal, toast, offline/sincronizando
   e estado vazio.

O contrato completo de cada um desses componentes — medidas, cores por estado, cópia exata —
está em `02-componentes.md`.

## Interações e comportamento

Movimento é curto e funcional. Nada de bounce, mola ou easing exagerado.

- **Durações:** 80ms (instant), 120ms (fast — cor de estado em controles), 180ms (base),
  260ms (slow), 300ms (bottom sheet). Easing padrão `cubic-bezier(.2,0,.2,1)`.
- **O que anima:** fade + 6px de subida no diálogo; slide-up no bottom sheet; largura da barra de
  progresso e do medidor de endogamia; cores de hover/foco/press.
- **O que não anima:** entrada de linhas de tabela, números contando, ícones pulsando, skeleton
  shimmer chamativo.
- **Hover:** escurece a superfície (petróleo 700 → 800) ou aplica `--surface-hover`. Botão
  secundário/terciário troca a borda para petróleo. **Nunca opacidade como hover.**
- **Press:** um passo mais escuro (800 → 900). **Sem shrink/scale.**
- **Foco:** contorno **sólido 2px** `--border-focus` com `offset 2px`; campos somam
  `--focus-ring` (halo 3px translúcido). Foco é sempre visível — o produto é operável no teclado.
- **Selecionado:** `--surface-selected` + borda petróleo + peso 600.
- **Desabilitado:** `--surface-disabled`, `--text-disabled`, borda subtle, `cursor: not-allowed`.
- `prefers-reduced-motion: reduce` zera todas as durações.

**Validação de formulário:** valida no `blur` e no envio, nunca a cada tecla. A mensagem de erro
substitui o texto de ajuda, cita o dado exato ("O código COBP-25-04781 já existe no plantel.") e
vem acompanhada de borda tijolo + ícone — nunca só cor. Peso e valor financeiro **não são
arredondados na exibição**; coeficiente de endogamia sempre com duas decimais.

**Comportamento offline (requisito de primeira classe):** o galpão não tem sinal. Toda gravação
é local primeiro; a sincronização é **explícita e visível** (`SyncStatus`: offline → pendente com
contagem → online com horário do último envio). Nunca perder um registro por falta de rede e
nunca fingir que salvou no servidor.

**Responsivo:** dois contextos, o mesmo vocabulário. Celular no galpão (uma ação principal por
tela, alvos de 48px, leitura a meio metro) e desktop sentado (tabelas densas, genealogia lado a
lado). Chrome fixo: sidebar 248px / recolhida 60px, top bar 56px, tab bar 60px, conteúdo máximo
1280px, medida de leitura 64ch.

## Estado

Os artboards são referência estática, com duas exceções que valem como especificação:

- `tab` (`"plantel" | "ninhadas" | "casais" | "saude"`) — tabs com contador; o contador é
  `number | undefined` (a aba "Saúde" propositalmente não tem).
- `mostrarUsosIncorretos` (`boolean`, default `true`) — mostra/oculta o quadro de proibições do A2.

No produto real, o estado que estes componentes exigem: sessão/criatório ativo, plantel
paginado com filtro por espécie/sexo/status, ninhada com etapa do ciclo e datas derivadas da
postura, fila de sincronização pendente, tema (`data-theme="light" | "dark"`, obrigatório —
o criador acompanha eclosões de madrugada).

## Tokens de design

Lista completa e exata em **`01-tokens.md`**, incluindo tema escuro. Resumo do essencial:

- **Paleta oficial fechada:** petróleo `#0B5D5E`, azul profundo `#163A45`, âmbar `#F2B544`,
  neve `#F4F7F6`, grafite `#1B2528`. **Não inventar cores fora desta lista** — tons derivados
  só variam luminosidade dentro do matiz da cor-mãe.
- **Tipografia:** Montserrat 600/700 (marca e títulos), Inter 400/500/600 (interface).
  Escala 11 · 12 · 13 · **15 (corpo)** · 17 · 20 · 24 · 30 · 38 · 48 · 60px.
  **Todo dado numérico usa `tabular-nums`**, sem exceção.
- **Espaço:** grade de 4px — 4/8/12/16/20/24/32/40/48/64/80/96.
- **Raios:** 3px (chip), 5px (controle), 8px (card), 12px (bottom sheet), pílula **só** em badge,
  chip de status e barra de progresso.
- **Sombras:** curtas e frias (`rgba(11,45,48,…)`). Nunca colorida, nunca brilho. A hierarquia
  vem de borda + fundo.

**Regras duras de aparência** (violá-las descaracteriza a marca): sem gradiente em nenhuma
superfície; sem textura, padrão ou ilustração decorativa; sem mascote; sem emoji em nenhum lugar;
barra colorida à esquerda **só** em linha de tabela (faixa de gravidade de 3px) e no
`PedigreeNode` — **nunca em card**; no máximo **um** bloco de petróleo cheio por tela;
no máximo **um** elemento âmbar de ação por tela; vazios e cabeçalhos alinham à esquerda,
nada centralizado.

## Assets

Em `artboards/assets/` — SVGs originais do pacote de identidade SisAves, copiados sem alteração:

| Arquivo | Uso |
|---|---|
| `sisaves-logo-horizontal.svg` | assinatura padrão sobre Neve/branco ("Sis" azul profundo, "Aves" petróleo) |
| `sisaves-logo-horizontal-white.svg` | assinatura sobre petróleo, azul profundo ou foto escura |
| `sisaves-symbol-primary.svg` | símbolo isolado (ave em voo cujo corpo desenha o "S", bico em âmbar, olho vazado) |
| `sisaves-app-icon.svg` | app icon e favicon — único uso permitido abaixo de 32px |

**Ícones:** Lucide 0.474.0 (traço 2px), substituto sinalizado — o pacote de marca não inclui set
próprio. Traço 2px sempre (2,25px só no item ativo da tab bar); tamanhos 16 (linha densa),
18–20 (padrão), 24 (cabeçalho). Léxico do domínio a usar consistentemente: `Bird` plantel ·
`Egg` ninhada/ovo · `Dna` genealogia · `Users` casais · `Syringe` saúde · `Wallet` financeiro ·
`Award` CRO · `QrCode` validação · `Feather` anilhamento · `Thermometer` incubação · `Scale` peso ·
`Sun` painel do dia · `Moon` tema escuro · `WifiOff` offline · `RefreshCw` sincronização ·
`TriangleAlert` atenção · `CircleAlert` crítico · `CircleCheck` confirmado.
**Emoji nunca. Unicode como ícone (▲ ✓ × ♂ ♀) nunca** — use o glifo Lucide.
**Sexo da ave não usa ícone:** letra "M"/"F"/"—" em `--font-numeric` peso 600, petróleo para
macho e azul profundo para fêmea, com `aria-label` completo.

**Fotografia:** quando uma tela precisa de imagem, é **foto real do plantel enviada pelo
criador** (a ave na ficha, a ovoscopia), em cor natural e neutra — não estilizada, não filtrada,
sem grão. A ausência de imagem se resolve com tipografia e vazio honesto, nunca com ornamento.

## Arquivos

```
design_handoff_sisaves_fundamentos/
├── README.md                      ← este arquivo
├── 01-tokens.md
├── 02-componentes.md
├── 03-conteudo-e-copy.md
├── 04-acessibilidade.md
├── CLAUDE.md                      ← copiar para a raiz do repositório novo
├── MANIFEST.md
└── artboards/
    ├── SisAves - Fundamentos.dc.html   ← A1 + A2 + A3; abre direto no navegador
    ├── support.js                      ← runtime do ambiente de design (NÃO portar)
    ├── _ds/sisaves-design-system-.../
    │   ├── tokens/{fonts,colors,typography,spacing,elevation,motion,base}.css  ← PORTAR
    │   ├── styles.css
    │   └── _ds_bundle.js               ← componentes do DS compilados (NÃO portar)
    └── assets/*.svg                    ← PORTAR
```

Para ver os artboards: abra `artboards/SisAves - Fundamentos.dc.html` em um navegador. As três
pranchas ficam empilhadas verticalmente na ordem A1, A2, A3.

## Decisões que precisam de aprovação

1. **Cores semânticas derivadas** (A1) — sucesso `#1E7A5F`, atenção `#9A5B23`, crítico `#A8352A`,
   informação `#1F6C86`, com os fundos claros correspondentes. A paleta oficial é fechada e não
   tinha cores de estado; estas foram harmonizadas no matiz frio do petróleo/azul profundo e
   mantidas **distintas do âmbar**, que fica reservado a ação. Todas passam AA em texto pequeno
   (5,24 a 6,89:1 — ver `04-acessibilidade.md`). Se forem aprovadas, devem entrar em
   `tokens/colors.css` como `--status-*` e ganhar equivalentes de tema escuro.
2. **`--sis-tijolo-600` `#A8352A`** — herdado do design system, ainda pendente.
3. **Lucide como set de ícones** — substituto sinalizado. Se a SisAves tiver ou vier a ter um set
   próprio, ele entra sem mudar a API do componente `Icon`.
4. **Fontes** — nenhum binário foi fornecido; Montserrat e Inter vêm do Google Fonts. Se houver
   licença própria, trocar por `@font-face` local.

## Telas do produto

Além dos três artboards de fundamentos, o pacote traz **19 telas** desenhadas — inventário e
decisões em `05-telas.md`:

- `artboards/SisAves - Telas Mobile.dc.html` — 16 telas de 390 × 844: Hoje, Ovos (pipeline),
  Ficha da ave, Login, Plantel, Árvore genealógica, Casais, Ficha do casal + endogamia,
  Registrar postura, Financeiro, Mais; Hoje e Ovos também em tema escuro; e os estados vazio,
  carregando e sem conexão.
- `artboards/SisAves - Telas Desktop.dc.html` — 3 telas de 1440 × 1024: Painel, Plantel em
  tabela e Editor de certificado/CRO.
- `artboards/SisAves - Certificado CRO.dc.html` — o CRO impresso em A4 retrato, sobre
  `<doc-page>`: abre no navegador e **exporta para PDF direto**, sem trabalho de impressão
  adicional.
- `artboards/SisAves - Validacao e Site.dc.html` — a página pública de validação por QR
  (390 × 844) e a landing page `sisaves.tallpa.com.br` (1440 × 3000).

## O que este pacote ainda não cobre

Não há aqui: Saúde do plantel, Espécies e prazos, Relatórios, lista de Certificados,
Configurações, Perfil, onboarding de criatório novo, o tema escuro das telas B3–B11 e C1–C3,
nem modelagem de dados. O design system tem dois templates de partida (`painel-criatorio`,
`app-campo`) e dois kits de UI clicáveis que podem ser trazidos para cá quando esses fluxos
entrarem em pauta.
