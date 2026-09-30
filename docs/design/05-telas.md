# Telas do produto — Faixas B (mobile) e C (desktop)

Inventário das telas desenhadas, com o id de canvas de cada uma e as decisões que o código
precisa respeitar. Mobile **390 × 844**, desktop **1440 × 1024**.

Arquivos: `artboards/SisAves - Telas Mobile.dc.html` e `artboards/SisAves - Telas Desktop.dc.html`.

## Faixa B — mobile (16 telas)

| id | Tela | Observações de implementação |
|---|---|---|
| `2a` | **B1 Hoje** | Tela mais importante. Saudação → bloco petróleo com contagem de tarefas → fila de tarefas por urgência → 4 indicadores → resumo da temporada. Tab bar de 5 destinos. |
| `2b` | **B2 Ovos (pipeline)** | Filtro de estado por pílulas com contagem no topo; ninhadas agrupadas por estado; cartões de "Anilhar" com faixa âmbar de 3px. |
| `2c` | **B3 Ficha da ave** | Foto no topo (espaço arrastável), anilha em destaque `tone="brand"`, grade 2 × 2 de dados, pai e mãe clicáveis com anilha, três atalhos (genealogia, CRO, pesagens). |
| `2d` | **B1 tema escuro** | Cabeçalho **não** é petróleo cheio: superfície escura + borda. Bloco de destaque vira `--surface-brand-soft` com `--border-brand`. |
| `2e` | **B2 tema escuro** | Inclui seção "Nascimento agora" e aviso de offline em âmbar-soft ao pé da lista. |
| `2f` | Estado vazio | Primeiro acesso, sem aves. Alinhado à esquerda, sem ilustração; duas ações (cadastrar, importar) + bloco "Antes de começar". |
| `2g` | Carregando | Blocos `--surface-sunken` estáticos. **Sem shimmer** — o design system proíbe skeleton chamativo. |
| `2h` | Erro / sem conexão | Alerta tijolo + lista dos 4 registros pendentes com horário + duas ações. Cópia diz que nada se perde. |
| `3a` | **B4 Login** | Fundo petróleo, símbolo em marca-d'água a 7% de opacidade, cartão branco com `--shadow-lg`. Campos `size="lg"` (48px). |
| `3b` | **B5 Plantel** | Busca + 4 filtros em pílula; 7 aves distintas (curió, canário, agapornis, Gould, a anilhar). Linha de 68px com miniatura, anilha, espécie + mutação, sexo e idade. |
| `3c` | **B6 Árvore genealógica** | Três gerações em rolagem horizontal, conectores de 1px, `PedigreeNode` com faixa de sexo. Ancestral repetido com contorno âmbar + aviso fixo no topo + legenda no rodapé. Um avô materno é "Desconhecido". |
| `3d` | **B7 Casais** | 4 casais; macho × fêmea com anilhas, `Tag` de espécie/mutação/gaiola, rodada, ovos ativos e endogamia. Faixa de gravidade âmbar (anilhar) e tijolo (perda). |
| `3e` | **B8 Ficha do casal + endogamia** | `InbreedingMeter` em 9,38% (faixa atenção) + explicação de uma frase ("Avós paternos em comum") + `Timeline` de 4 rodadas. Botão de nova postura fixo na base. |
| `3f` | **B9 Registrar postura** | Campos `lg`, teclado numérico de 52px, seletor de data. **Sugestão de anilha é um botão** ("Usar sugestão · 0105"), não preenchimento silencioso. Salvar fixo na base + "Salvo no aparelho". |
| `3g` | **B10 Financeiro** | Receita/despesa/saldo em `StatCard`; 6 barras de saldo (petróleo-200, mês corrente em petróleo cheio, mês negativo em tijolo vazado); 4 lançamentos reais. |
| `3h` | **B11 Mais** | Cabeçalho da conta, status da assinatura, 7 itens de menu com contadores, `SyncStatus` e versão. |

## Faixa C — desktop (3 telas)

| id | Tela | Observações de implementação |
|---|---|---|
| `4a` | **C1 Painel** | `Sidebar` de 248px em três grupos + top bar de 56px. 4 `StatCard` → gráfico de nascimentos por mês (12 colunas, meses futuros em cinza) + painel de tarefas pendentes → tabela de últimas movimentações com faixa de gravidade. |
| `4b` | **C2 Plantel em tabela** | Filtros laterais de 240px (espécie com contagem, sexo segmentado, situação, ano). Barra de seleção múltipla com 4 ações em lote. Tabela de 10 colunas, linhas de 44px, ordenação na coluna Anilha, paginação. Todos os números `tabular-nums`. |
| `4c` | **C3 Editor de CRO** | Painel esquerdo de 340px: 3 modelos, cor de destaque (4 swatches da paleta), 5 campos em `Switch`, logotipo arrastável, redes sociais. Direita: prévia A4 paisagem (`aspect-ratio: 297/210`) com genealogia de 3 gerações, endogamia, QR Code e linha de assinatura. |

## Decisões transversais

1. **Tab bar de 5 destinos** em toda tela mobile de nível raiz: Hoje · Plantel · Casais · Ovos ·
   Mais. Telas de detalhe e formulário substituem a tab bar por ação fixa na base.
2. **Cabeçalho petróleo cheio** só no tema claro. No escuro é superfície + borda.
3. **Faixa de gravidade de 3px** aparece nos cartões de ninhada/casal e nas linhas de tabela —
   nunca no card de ave.
4. **A anilha nunca é reformatada.** Aparece sempre pelo componente `Anilha`, inclusive dentro
   de linhas de tabela e do certificado.
5. **Nenhum gráfico usa cor semântica sem motivo:** barras em petróleo-200, destaque do período
   corrente em petróleo-700, valor negativo em tijolo vazado. Nada de escala multicolorida.
6. **Foto é sempre material do criador.** As telas usam espaços arrastáveis (`<image-slot>`),
   não fotos de banco. Em produção, upload do criador.

## O que ainda não foi desenhado

Saúde do plantel, Espécies e prazos, Relatórios, lista de Certificados, Configurações, Perfil,
onboarding de criatório novo, e o tema escuro das telas B3–B11 e C1–C3 (os tokens existem; as
pranchas não foram produzidas).
