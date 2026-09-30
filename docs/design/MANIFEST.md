# Manifesto e verificação de procedência

Pacote: **SisAves — fundamentos, telas, documentos e site** · gerado em 07/09/2026 ·
29 arquivos · 3 pranchas de fundamentos + 19 telas de produto + 3 peças de
documento/site.

## Verificações executadas — 25 de 25 aprovadas

- ✅ Todos os 29 arquivos declarados existem e abriram para leitura.
- ✅ Faixa A: 3 pranchas de fundamentos.
- ✅ Faixa B: 16 molduras em 390×844.
- ✅ Faixa C: 3 molduras em 1440×1024.
- ✅ D1: uma página A4 sobre <doc-page> — exporta para PDF sem CSS de impressão próprio.
- ✅ D1 não escreve regra @page nem page-break própria — a geometria é do componente.
- ✅ D1: menor corpo de texto 7.5pt (mínimo de impressão respeitado).
- ✅ D2 em 390×844 e D3 em 1440×3000, nas medidas pedidas.
- ✅ 22 telas/documentos rotulados (16 mobile + 3 desktop + D1 + D2 + D3).
- ✅ C2: cabeçalho e linhas usam a mesma grade corrigida (2/2); fixos 703px + 9 gaps de 10px + 20px de padding = 813px, com Espécie em 1fr dentro dos 951px disponíveis.
- ✅ C2: grade antiga de 1117px removida — coluna Situação e Casal de origem voltam a caber.
- ✅ Logo: nenhuma altura passada como string — todas viraram hole numérico height="{{ n }}".
- ✅ 15 montagens do Logo com altura numérica (13 no A2, 1 em B4, 1 em C3).
- ✅ Âmbar nunca como cor de texto — só fundo, faixa de 3px ou --text-accent.
- ✅ Um único gradiente em todo o pacote: o exemplo de "uso incorreto" do logo no A2.
- ✅ Nenhum emoji.
- ✅ Nenhum unicode usado como ícone.
- ✅ 24 indicadores de sexo com aria-label — cor nunca é o único sinal.
- ✅ 178 usos de tabular-nums.
- ✅ Única dependência externa: Lucide 0.474.0. Todo o resto viaja no zip.
- ✅ As 15 referências relativas resolvem dentro do pacote — as pranchas abrem offline.
- ✅ Os 4 SVGs da marca são válidos e sem edição.
- ✅ Os 5 tokens oficiais intactos em tokens/colors.css.
- ✅ tokens/colors.css inclui o tema escuro completo.
- ✅ 319 montagens de componentes reais do design system.

## Inventário

| Arquivo | Tamanho | Origem | Portar para o repositório? |
|---|---|---|---|
| `README.md` | 16,3 KB | escrito neste handoff | — |
| `01-tokens.md` | 11,5 KB | escrito neste handoff | — |
| `02-componentes.md` | 12,9 KB | escrito neste handoff | — |
| `03-conteudo-e-copy.md` | 3,9 KB | escrito neste handoff | — |
| `04-acessibilidade.md` | 5,1 KB | escrito neste handoff | — |
| `05-telas.md` | 5,1 KB | escrito neste handoff | — |
| `06-documentos-e-site.md` | 6,0 KB | escrito neste handoff | — |
| `CLAUDE.md` | 7,3 KB | escrito neste handoff | — |
| `artboards/SisAves - Fundamentos.dc.html` | 65,6 KB | prancha produzida nesta sessão | referência (não portar) |
| `artboards/SisAves - Telas Mobile.dc.html` | 138,7 KB | prancha produzida nesta sessão | referência (não portar) |
| `artboards/SisAves - Telas Desktop.dc.html` | 56,9 KB | prancha produzida nesta sessão | referência (não portar) |
| `artboards/SisAves - Certificado CRO.dc.html` | 17,7 KB | prancha produzida nesta sessão | referência (não portar) |
| `artboards/SisAves - Validacao e Site.dc.html` | 48,9 KB | prancha produzida nesta sessão | referência (não portar) |
| `artboards/support.js` | 67,5 KB | runtime do ambiente de design | NÃO portar |
| `artboards/image-slot.js` | 63,3 KB | runtime do ambiente de design | NÃO portar |
| `artboards/doc-page.js` | 37,6 KB | runtime do ambiente de design | NÃO portar |
| `artboards/_ds/sisaves-design-system-a74bdb92-04ed-46d9-a36f-cfcf55dd3b47/_ds_bundle.js` | 153,0 KB | design system SisAves (cópia intacta) | NÃO portar |
| `artboards/_ds/sisaves-design-system-a74bdb92-04ed-46d9-a36f-cfcf55dd3b47/styles.css` | 0,2 KB | design system SisAves (cópia intacta) | NÃO portar |
| `artboards/_ds/sisaves-design-system-a74bdb92-04ed-46d9-a36f-cfcf55dd3b47/tokens/base.css` | 1,1 KB | design system SisAves (cópia intacta) | PORTAR |
| `artboards/_ds/sisaves-design-system-a74bdb92-04ed-46d9-a36f-cfcf55dd3b47/tokens/colors.css` | 4,8 KB | design system SisAves (cópia intacta) | PORTAR |
| `artboards/_ds/sisaves-design-system-a74bdb92-04ed-46d9-a36f-cfcf55dd3b47/tokens/elevation.css` | 1,0 KB | design system SisAves (cópia intacta) | PORTAR |
| `artboards/_ds/sisaves-design-system-a74bdb92-04ed-46d9-a36f-cfcf55dd3b47/tokens/fonts.css` | 0,4 KB | design system SisAves (cópia intacta) | PORTAR |
| `artboards/_ds/sisaves-design-system-a74bdb92-04ed-46d9-a36f-cfcf55dd3b47/tokens/motion.css` | 1,0 KB | design system SisAves (cópia intacta) | PORTAR |
| `artboards/_ds/sisaves-design-system-a74bdb92-04ed-46d9-a36f-cfcf55dd3b47/tokens/spacing.css` | 1,2 KB | design system SisAves (cópia intacta) | PORTAR |
| `artboards/_ds/sisaves-design-system-a74bdb92-04ed-46d9-a36f-cfcf55dd3b47/tokens/typography.css` | 2,4 KB | design system SisAves (cópia intacta) | PORTAR |
| `artboards/assets/sisaves-logo-horizontal.svg` | 116,2 KB | pacote de identidade SisAves (cópia intacta) | PORTAR |
| `artboards/assets/sisaves-logo-horizontal-white.svg` | 116,1 KB | pacote de identidade SisAves (cópia intacta) | PORTAR |
| `artboards/assets/sisaves-symbol-primary.svg` | 115,9 KB | pacote de identidade SisAves (cópia intacta) | PORTAR |
| `artboards/assets/sisaves-app-icon.svg` | 116,0 KB | pacote de identidade SisAves (cópia intacta) | PORTAR |

## Como ler a coluna "portar"

- **PORTAR** — arquivo de produção: os 7 CSS de token e os 4 SVGs da marca entram no
  repositório novo como estão.
- **NÃO portar** — `support.js`, `image-slot.js`, `doc-page.js` e `_ds_bundle.js` são o runtime
  do ambiente de design e os componentes do design system já compilados para ele. Existem aqui
  só para as pranchas abrirem e serem inspecionadas. Os componentes devem ser
  **reimplementados** no framework escolhido, seguindo `02-componentes.md`.
- **referência** — os cinco `.dc.html` são as pranchas: fonte de verdade visual, não código de
  produção.

## Conteúdo por faixa

| Faixa | Arquivo | Peças |
|---|---|---|
| A · Fundamentos | `SisAves - Fundamentos.dc.html` | guia de estilo, aplicação do logo, biblioteca de componentes |
| B · Mobile | `SisAves - Telas Mobile.dc.html` | 16 telas de 390×844, incluindo tema escuro e os 3 estados |
| C · Desktop | `SisAves - Telas Desktop.dc.html` | painel, plantel em tabela, editor de CRO (1440×1024) |
| D · Documentos e site | `SisAves - Certificado CRO.dc.html`, `SisAves - Validacao e Site.dc.html` | CRO impresso A4, validação por QR, landing page |

## Procedência das três camadas

1. **Pacote de identidade SisAves** (cliente) → os 4 SVGs e os 5 hex oficiais, copiados sem
   alteração.
2. **Design system SisAves** → tokens CSS, componentes e as regras de marca/voz reproduzidas nos
   documentos. `--sis-tijolo-*` já era adição declarada do design system, pendente de aprovação.
3. **Esta sessão** → as pranchas e os oito documentos. A única invenção de cor são as quatro
   semânticas derivadas do A1, marcadas como pendentes em `README.md` e `01-tokens.md`.

## O que não está aqui

Saúde do plantel, Espécies e prazos, Relatórios, lista de Certificados, Configurações, Perfil,
onboarding de criatório novo, tema escuro das telas B3–B11/C1–C3/Faixa D, modelagem de dados,
QR Code real (as peças usam placeholder gráfico) e binários de fonte (Montserrat e Inter vêm do
Google Fonts — não houve entrega de licença própria).
