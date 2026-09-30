# SisAves — regras de projeto

Este arquivo é o contrato visual e de conteúdo do SisAves. Copie-o para a raiz do repositório.
Ele vale para todo código de interface. A documentação completa está em
`design_handoff_sisaves_fundamentos/` (tokens, componentes, cópia, acessibilidade).

## Produto

SisAves — SaaS brasileiro de gestão de criatórios de aves ornamentais (canários, agapornis,
diamantes de Gould, curiós, calopsitas). Interface em **português do Brasil**: datas
`dd/mm/aaaa`, decimais com vírgula, moeda `R$ 1.240,00`.

Dois contextos de uso, o mesmo vocabulário visual:

1. **Em pé no galpão, no celular, com uma ave na mão e sem internet** — alvos de 48px, uma ação
   principal por tela, leitura a meio metro, gravação local com sincronização explícita.
2. **Sentado no computador** — relatórios, CRO, análise genética, financeiro; densidade de dados
   é requisito, não descuido.

Ciclo coberto: espécies e prazos · aves identificadas por **anilha oficial de clube** · casais ·
ciclo do ovo (chocando → ovoscopia → nascimento → anilhamento → separação) · genealogia com
**coeficiente de endogamia** · financeiro · saúde · certificados/CRO com validação por QR Code.

## Tokens: use, não recrie

Porte `design_handoff_sisaves_fundamentos/artboards/_ds/.../tokens/*.css` para o projeto e
consuma via `var(--*)`. **Sempre os aliases semânticos** (`--text-brand`, `--surface-hover`,
`--border-focus`), nunca hex cru no componente.

**Paleta oficial — fechada. Não inventar cores fora desta lista:**

| Cor | Hex | Papel |
|---|---|---|
| Petróleo | `#0B5D5E` | principal: texto de marca, ícone, cabeçalho, foco, **um** bloco cheio por tela |
| Azul profundo | `#163A45` | títulos, sidebar, contraste máximo |
| Âmbar | `#F2B544` | **só o que exige ação humana agora** |
| Neve | `#F4F7F6` | fundo de página |
| Grafite | `#1B2528` | texto de interface |

Adições pendentes de aprovação: `--sis-tijolo-600` `#A8352A` (gravidade) e as quatro semânticas
do artboard A1 (sucesso `#1E7A5F`, atenção `#9A5B23`, crítico `#A8352A`, info `#1F6C86`).

**Tipografia:** Montserrat 600/700 (marca, títulos) + Inter 400/500/600 (interface).
Escala 11 · 12 · 13 · **15 (corpo)** · 17 · 20 · 24 · 30 · 38 · 48 · 60px.
**Todo dado numérico usa `tabular-nums` — sem exceção.**

**Espaço** grade 4px · **Raios** 3 (chip) / 5 (controle) / 8 (card) / 12 (sheet) / pílula só em
badge, chip de status e barra de progresso · **Sombras** curtas e frias `rgba(11,45,48,…)`.

## Regras duras — violá-las descaracteriza o produto

- **Sem gradiente em nenhuma superfície.** Nem herói, nem botão, nem card.
- Sem textura, padrão repetido, ilustração decorativa ou mascote 3D.
- **Sem emoji em nenhum lugar.** Sem unicode como ícone (▲ ✓ × ♂ ♀) — use o glifo Lucide.
- **Barra colorida à esquerda só em dois lugares**, ambos de 3px e funcionais: faixa de gravidade
  na linha de tabela e faixa de sexo no `PedigreeNode`. **Nunca em card.**
- **No máximo um bloco de petróleo cheio por tela.** O resto respira sobre Neve/branco.
- **No máximo um elemento âmbar de ação por tela**, e só com prazo vencendo.
- **Âmbar nunca é cor de texto sobre branco** (1,83:1). É fundo, com texto em azul profundo
  (`--text-on-accent`). Para texto pequeno em âmbar sobre claro: `--text-accent` `#8A5E12`.
- Vazios e cabeçalhos **alinham à esquerda**. Nada centralizado.
- Cantos contidos. Card = 8px, e ponto.
- Sombra nunca colorida, nunca brilho. Hierarquia vem de borda + fundo.
- Estado nunca é comunicado só por opacidade nem só por cor.

## Estados interativos

- **Hover:** escurece a superfície (petróleo 700 → 800) ou aplica `--surface-hover`; botão
  secundário/terciário troca a borda para petróleo. **Nunca opacidade.**
- **Press:** um passo mais escuro (800 → 900). **Sem shrink/scale.**
- **Foco:** `outline: 2px solid var(--border-focus)` com `offset: 2px`; campos somam
  `--focus-ring`. Foco sempre visível — o produto é operável no teclado.
- **Selecionado:** `--surface-selected` + borda petróleo + peso 600.
- **Desabilitado:** `--surface-disabled`, `--text-disabled`, borda subtle, `cursor: not-allowed`.

## Movimento

80 / 120 / 180 / 260ms, easing `cubic-bezier(.2,0,.2,1)`. Sem bounce, sem mola.
Anima: fade + 6px de subida no diálogo, slide-up no sheet (300ms), largura de barra, cor de
estado. **Não anima:** entrada de linhas de tabela, números contando, ícone pulsando, shimmer.
`prefers-reduced-motion` zera tudo.

## Acessibilidade — não negociável

- Contraste **AA 4,5:1** em texto de interface; 3:1 em texto ≥24px e em bordas/ícones com
  significado. Números medidos em `04-acessibilidade.md`.
- `--text-muted` `#78888D` é 3,68:1 sobre branco: só em rótulo ≥24px ou texto não essencial.
  Para legenda pequena legível use `--text-secondary` `#5A6B70` (5,57:1).
- Alvos de toque **≥44px**, 48px no app de campo. Badge e ponto de notificação não são alvos.
- Sexo da ave: letra `M`/`F`/`—` em `--font-numeric` 600, petróleo/azul profundo/muted, sempre
  com `aria-label` ("Macho", "Fêmea", "Sexo indefinido"). Nunca só cor.
- Erro sempre com texto + ícone, citando o dado exato.
- `data-theme="dark"` é **obrigatório**, não opcional — eclosões acontecem de madrugada.

## Ícones

Lucide (traço 2px; 2,25px só no item ativo da tab bar). Tamanhos 16 (linha densa), 18–20
(padrão), 24 (cabeçalho). Ícone **nunca substitui rótulo** na ação principal de uma tela.

Léxico fixo: `Bird` plantel · `Egg` ninhada/ovo · `Dna` genealogia · `Users` casais ·
`Syringe` saúde · `Wallet` financeiro · `Award` CRO · `QrCode` validação · `Feather` anilhamento ·
`Thermometer` incubação · `Scale` peso · `Sun` painel do dia · `Moon` tema escuro ·
`WifiOff` offline · `RefreshCw` sincronização · `TriangleAlert` atenção · `CircleAlert` crítico ·
`CircleCheck` confirmado.

## Marca

Assinatura horizontal ("Sis" azul profundo, "Aves" petróleo) sobre Neve/branco; versão **branca**
sobre petróleo, azul profundo ou foto escura. Área livre mínima = **1/4 da altura do símbolo**.
Abaixo de 32px, **só o app icon** — nunca a assinatura.
**Proibido:** gradiente, sombra, contorno, rotação, distorção.

## Imagens

Quando uma tela precisa de imagem, é **foto real do plantel enviada pelo criador**, em cor natural
e neutra — não estilizada, não filtrada, sem grão. Ausência de imagem se resolve com tipografia e
vazio honesto, nunca com ornamento.

## Voz

Um caderno de campo bem organizado: **informa, não celebra**. Fala **com** o criador
("Registre a postura"), nunca em primeira pessoa do sistema. Rótulos são substantivos, botões são
verbos. Frase capitalizada; caixa alta só em rótulo-guia e sigla.

Use o vocabulário do domínio exatamente: anilha, plantel, criatório, galpão, ninhada, postura,
ovoscopia, eclosão, anilhamento, separação, matriz/reprodutor, mutação, plantel ativo, CRO.
**Não simplificar** para "pássaro", "ovo bom", "bebê".

Perda e óbito são eventos normais: registre sem dramatizar e sem consolar.
✅ "Perda registrada · 2 ovos · 09/03" ❌ "Que pena! Sentimos muito 😢"

Confirmação = **fato + consequência com data**: "Postura registrada · Ninhada 04 · 5 ovos" /
"Ovoscopia prevista para 17/03/2026." Erro cita o dado: "O código COBP-25-04781 já existe no
plantel."

## Offline é requisito de primeira classe

O galpão não tem sinal. Grave local primeiro; a sincronização é **explícita e visível**
(offline → pendente com contagem → sincronizado com horário). Nunca perca um registro por falta
de rede e nunca finja que salvou no servidor. "Offline — salvo no aparelho", nunca
"Sem conexão. Tente novamente mais tarde."
