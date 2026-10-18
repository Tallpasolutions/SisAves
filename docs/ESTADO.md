# Estado do projeto

> **Leia este arquivo primeiro ao retomar o trabalho.** Ele diz o que existe, o
> que está verificado, o que falta e o que depende de terceiros.
> Atualizado em **18/10/2026**, o dia em que o produto foi ao ar em
> `https://sisaves.tallpa.com.br`.

## O produto em uma frase

SisAves é um SaaS de gestão de criatórios de aves ornamentais — plantel, casais,
ciclo do ovo, genealogia com coeficiente de endogamia, financeiro, saúde e
emissão de CRO com validação por QR. Reconstrução do zero de um sistema legado
(Gestão Plantel / Meu Plantel, da Fênix Sites), com marca nova, em
`sisaves.tallpa.com.br`.

## Próximo passo

**O produto está no ar desde 18/10/2026**, em `https://sisaves.tallpa.com.br`
— ver a seção "No ar". Antes de qualquer pessoa de fora usá-lo valem duas
coisas da lista de pendências: **rotacionar as chaves do Supabase** (as duas
ainda são as de 30/09, e a `service_role` ignora RLS) e **SMTP próprio**, sem
o qual quem se cadastrar não recebe o e-mail de confirmação.

**Fase 10 — assinatura (Mercado Pago).** A Fase 9 fechou em 17/10/2026:
financeiro (B10, lançamento, correção, exclusão e catálogo de categorias) e
saúde (tratamentos com carência, medicamentos, doenças e sintomas). O banco da
assinatura está pronto desde a Fase 1 (`assinaturas`,
`assinatura_pagamentos`); faltam as credenciais do Mercado Pago, o checkout, o
webhook e o bloqueio suave ao expirar.

Depois dela, a Fase 11 (landing D3, SEO, domínio, migração do legado).

**Acabou a lista de telas que o handoff declarou não ter desenhado.** A última
era a genealogia do plantel inteiro, que entrou em 17/10/2026 com o simulador
de cruzamento — nenhum destino da navegação está mais desabilitado.

Depois dela: Fase 10 (Mercado Pago) e Fase 11 (landing, SEO, migração do
legado).

**O que mais pesa fora das fases** está no item 5 de "O que falta": nenhum
teste de interface, nunca publicado, as chaves do Supabase sem rotação, e o
push das notificações, que depende de deploy.

> **Correção de registro, mantida.** Entre as fases 4 e 7 este arquivo e a
> memória afirmavam que o ciclo do ovo já fechava pela interface. Não fechava:
> fechava no banco de desenvolvimento porque a semente grava `data_eclosao`
> direto. A semente escondeu a falta por três fases. Está resolvido desde
> 13/10/2026, e a lição fica.

## Onde está tudo

| | |
|---|---|
| **No ar** | https://sisaves.tallpa.com.br (Vercel + DNS na Cloudflare) |
| Repositório | https://github.com/Tallpasolutions/SisAves (**público**, por escolha do cliente) |
| Supabase | projeto `lisvevesopyrkviixwha`; credenciais em `.env.local` (fora do git, modo 600) |
| Legado, para referência | `gestaoplantel.com.br` · `app2.meuplantel.com` · `api.meuplantel.com/api/v1` (expõe OpenAPI em `/docs`) |
| Handoff de design | `docs/design/` e as pranchas em `docs/design/artboards/*.dc.html` |

**Sem Docker nesta máquina.** O banco local não roda: migrations e testes vão
direto no projeto remoto.

```bash
node scripts/sql.mjs -f supabase/migrations/0014_anilhamento.sql  # aplicar migration
node scripts/sql.mjs "select 1"                                   # consulta avulsa
for t in supabase/tests/0*.sql; do node scripts/sql.mjs -f "$t"; done
```

O runner conecta pelo **pooler**, não pelo host direto: `db.<ref>.supabase.co`
passou a resolver só em IPv6 e devolve `ENOTFOUND` em máquina sem rota IPv6.
Para usar o CLI do Supabase, a URL é a do pooler, com a senha percent-encoded:

```bash
supabase db push --db-url "postgresql://postgres.<ref>:<senha>@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
```

## Contratos que governam o trabalho

| Arquivo | O que manda |
|---|---|
| `CLAUDE.md` (raiz) | Contrato visual e de voz. Vem do handoff e vale para todo código de interface. Não é sugestão. |
| `docs/design/01-tokens.md` | Fonte de verdade das variáveis CSS. |
| `docs/design/02-componentes.md` | Contrato de cada componente: medidas, estados, cópia exata. |
| `docs/design/03-conteudo-e-copy.md` | Voz, vocabulário do domínio e tabela de cópia. |
| `docs/design/04-acessibilidade.md` | Contrastes medidos. |
| `docs/design/05-telas.md` | As 19 telas com decisões de implementação. |
| `docs/design/06-documentos-e-site.md` | CRO A4, validação por QR e landing. |

A rota `/ds` reproduz o artboard A3 com os 14 componentes dele e a cópia exata
do handoff — é a conferência visual rápida. Abrir **nos dois temas**. Sai do
app antes do lançamento. O `PedigreeNode` não aparece lá porque não está no A3;
confere-se na própria B6.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · **CSS Modules** · Supabase
(Postgres + Auth + Storage + RLS) · Vercel · Cloudflare · GitHub ·
`lucide-react` para ícones.

**CSS Modules e não Tailwind** porque o contrato exige consumir aliases
semânticos via `var(--*)`; traduzir uma paleta fechada para escala utilitária
abriria brecha para cor fora da paleta.

## Fases

| Fase | Situação |
|---|---|
| 0 · Fundação do repositório | **concluída** (`e7441db`) |
| 1 · Banco de dados | **concluída** (`fcfe6ae`, `bb462e2`, `0a074f3`, `3c06a4d`) |
| 2 · Auth e onboarding | **concluída** |
| 3 · Biblioteca de componentes | **concluída** (`e19354d`, `c932765`) |
| 4 · Núcleo mobile (Faixa B) | **concluída**; o ciclo do ovo passou a fechar pela interface em `0017` |
| 5 · Genealogia (B6) | **concluída** (`10c0800`) |
| 6 · Offline (fila + cache) | **concluída e verificada em navegador real** (`ec2288f`, `32eef1f`, `971774c`) |
| 7 · Desktop (Faixa C) | **concluída**; C3 entrou com a Fase 8 |
| 8 · CRO, QR e validação pública | **concluída** — emissão, folha A4, QR real, página pública e C3 |
| 9 · Financeiro e saúde | **concluída** — B10, catálogo de categorias, tratamentos com carência |
| 10 · Assinatura (Mercado Pago) | banco pronto; integração não iniciada |
| 11 · Landing e lançamento | não iniciada |

---

## Banco — 29 tabelas, aplicadas e testadas

Migrations em `supabase/migrations/`, todas aplicadas no projeto remoto:

| Arquivo | Conteúdo |
|---|---|
| `0001_fundacao` | extensões, enums do domínio, trigger de `updated_at` |
| `0002_identidade` | perfis, clubes, criatórios, membros, `meus_criatorios()` |
| `0003_taxonomia` | grupos, catálogo de espécies, espécies do criatório, mutações |
| `0004_plantel` | pássaros (anilha, genealogia, guarda contra ciclo), pesagens |
| `0005_reproducao` | casais, tags, ninhadas, posturas, transferências |
| `0006_ciclo_ovo` | `situacao_postura()`, `vw_posturas`, `vw_tarefas_hoje` |
| `0007_saude_financeiro` | sintomas, doenças, medicamentos, tratamentos, financeiro |
| `0008_genealogia` | ancestrais, ancestrais comuns, árvore, endogamia de Wright |
| `0009_rls` | políticas de RLS em todas as tabelas |
| `0010_documentos` | certificados/CRO, notificações, push, assinatura |
| `0011_semente_catalogo` | 8 grupos, 33 clubes de SC, 60 espécies |
| `0012_prazos_e_siglas` | siglas faltantes; `dias_anilha` 3 + janela 1; `dias_separa` 40 |
| `0013_perfil_automatico` | trigger que cria `perfis` junto com `auth.users` |
| `0014_anilhamento` | `anilhar_filhotes()`; `ninhada_id` em `vw_tarefas_hoje` |
| `0015_arvore_com_caminho` | `caminho` em `arvore_genealogica()` e no snapshot do CRO |
| `0016_movimentacoes` | `vw_movimentacoes`: o histórico derivado dos fatos |
| `0017_marcos_do_ciclo` | `registrar_marcos()`; `posturas.desfecho_em`; ovoscopia e separação no histórico |
| `0018_saida_do_plantel` | `registrar_saida()`, `reativar_ave()`; `passaros.saida_em` e `saida_motivo` |
| `0019_saida_no_historico` | a saída da ave entra em `vw_movimentacoes` |
| `0020_coerencia_ao_editar` | `tg_sexo_coerente()`: corrigir o sexo não quebra filiação nem casal |
| `0021_casal_ativo_alinhado` | `casal_ativo()` passa a ser "ainda não encerrado" |
| `0022_hoje_do_criatorio` | `public.hoje()` no fuso de São Paulo; `current_date` era UTC |
| `0023_desfazer_marco` | `desfazer_marco()`: apaga um marco do ciclo e devolve o ovo |
| `0024_transferir_postura` | `posturas.casal_chocador_id`, `transferir_posturas()`, `devolver_postura()` |
| `0025_chocador_nas_telas` | quem está chocando entra em `vw_posturas` e `vw_tarefas_hoje` |
| `0026_corrigir_data_marco` | `corrigir_data_marco()`: troca a data sem tirar o marco |
| `0027_convites_de_membro` | `criatorio_convites`, `aceitar_convites()`, `vw_membros` |
| `0028_gerar_notificacoes` | `gerar_notificacoes()`; `notificacoes.referencia_id` e `referencia_dia` |
| `0029_notificacao_por_ninhada` | um aviso por ninhada, com a contagem na frase |
| `0030_emitir_certificado` | `emitir_certificado()`, `revogar_certificado()`; motivo na validação |
| `0031_previa_do_cro` | grant de `montar_snapshot_certificado` para a prévia da C3 |
| `0032_financeiro_na_tela` | `vw_financeiro_mensal`; `public.hoje()` nos DEFAULT de data que a 0022 não alcançou |
| `0033_saude_na_tela` | `vw_tratamentos` (em curso e carência), `definir_sintomas_da_doenca`, `definir_doencas_do_medicamento`, catálogo de sintomas e doenças |
| `0034_genealogia_do_plantel` | `descendentes()` e `vw_linhagens`: os fundadores com o tamanho e a profundidade da linhagem |

### Funções do domínio

`situacao_postura` · `ancestrais` · `ancestrais_comuns` · `arvore_genealogica` ·
`coeficiente_endogamia` · `faixa_endogamia` · `montar_snapshot_certificado` ·
`validar_certificado` · `meus_criatorios` · `criatorio_com_acesso` ·
`casal_ativo` · `anilhar_filhotes` · `registrar_marcos` · `registrar_saida` ·
`reativar_ave` · `tg_sexo_coerente` · `hoje` · `desfazer_marco` ·
`transferir_posturas` · `devolver_postura` · `corrigir_data_marco` ·
`aceitar_convites` · `gerar_notificacoes` · `emitir_certificado` ·
`revogar_certificado` · `definir_sintomas_da_doenca` ·
`definir_doencas_do_medicamento` · `descendentes`

### Testes de banco — 231 asserções, todas passando

```bash
node scripts/testar.mjs
```

**Não usar `grep -c FALHOU`.** Ele devolve zero tanto quando tudo passa quanto
quando o script morre antes do veredito — dois arquivos ficaram quebrados por
essa troca sem aparecer. O runner trata erro de SQL e arquivo sem asserção como
falha, e sai com código 1.

| Arquivo | Asserções |
|---|---|
| `01_ciclo_do_ovo` | 11 |
| `02_endogamia` | 5 |
| `03_isolamento_rls` | 8 |
| `04_certificado` | 9 |
| `05_perfil_automatico` | 7 |
| `06_anilhamento` | 12 |
| `07_arvore_genealogica` | 11 |
| `08_marcos_do_ciclo` | 24 |
| `09_saida_do_plantel` | 23 |
| `10_coerencia_ao_editar` | 9 |
| `11_hoje_do_criatorio` | 4 |
| `12_desfazer_marco` | 12 |
| `13_transferir_postura` | 17 |
| `14_corrigir_data_marco` | 12 |
| `15_certificado_emissao` | 17 |
| `16_financeiro` | 11 |
| `17_saude` | 22 |
| `18_linhagens` | 17 |

E-mails de fixture usam o TLD reservado `.invalid` com prefixo por arquivo —
os testes já quebraram por colidir com a conta de desenvolvimento.

Cada um abre transação e termina em `rollback`. Toda linha deve sair com
`resultado = ok`. **Rodar `node scripts/testar.mjs` depois de qualquer migration.**

Armadilha que já custou meia hora: num mesmo `INSERT ... VALUES (a), (b)`,
todas as linhas enxergam o snapshot do início do comando. Se `(a)` chama a
função que escreve e `(b)` lê o resultado, `(b)` lê o estado anterior e o teste
acusa falha onde não há. Chamada que escreve vai em comando próprio.

### Conceitos do banco que não são óbvios

- **A situação da postura nunca é armazenada.** É derivada das datas observadas
  e dos prazos da espécie por `situacao_postura()`, que é `immutable` para o
  mesmo cálculo rodar no cliente offline. No legado era coluna gravada, e um ovo
  seguia "chocando" meses depois porque ninguém abriu a tela.
- **O tenant é o criatório**, não o usuário — permite mais de um criatório por
  pessoa e mais de uma pessoa operando o mesmo criatório.
- **RLS é a fronteira de segurança.** Toda política passa por
  `meus_criatorios()`, que é `security definer` para não recursar.
- **O certificado guarda `snapshot jsonb`.** A árvore muda quando o criador
  corrige uma filiação, mas um CRO emitido em 2026 tem de provar o que era
  verdade em 2026.
- **A validação pública do CRO é função, não tabela exposta.**
  `validar_certificado(hash, sequencial)` é lista branca explícita do que sai —
  com RLS na tabela, uma coluna nova vazaria por descuido.
- **`coeficiente_endogamia()` assume `F_A = 0`.** Documentado na própria
  migration; irrelevante nas 3–4 gerações que um criatório registra.
- **A janela de anilhamento tem dois dias** (`dias_anilha` 3, `janela` 1). É por
  isso que "anilhar" é o único estado em âmbar no design.
- **`arvore_genealogica()` devolve `caminho`, não só `papel`.** `papel` é
  relativo ao nó anterior, e na geração dos avós há dois 'pai' e dois 'mae' —
  não dava para saber qual é paterno. `caminho` concatena da raiz: `pp` é avô
  paterno, `mm` é avó materna. O mesmo `passaro_id` em dois caminhos é
  ancestral repetido, que é de onde a endogamia vem.
- **`anilhar_filhotes()` existe porque anilhar são três escritas por filhote**
  (ave, postura, pesagem) que precisam valer juntas. Soltas na aplicação, uma
  anilha repetida no terceiro filhote deixaria os dois primeiros criados e a
  ninhada pela metade. É `security invoker`: a RLS continua sendo a fronteira.

---

## Interface — 16 componentes em `src/components/ui/`

| Componente | Observação de contrato |
|---|---|
| `Button` | 5 variantes × 4 estados. `accent` (âmbar) é no máximo um por tela, só com prazo vencendo. |
| `Anilha` | Identificador primário. Nunca reformatar. Diz "Sem anilha" em vez de sumir. |
| `Badge` | 6 chips do ciclo. `acao` (âmbar cheio) é separado de `atencao`: um convoca, o outro informa. |
| `SexChip` | `M`/`F`/`—` com `aria-label`. Sem unicode de gênero. Cor nunca é o único sinal. |
| `Field` + `Input` + `Select` | Rótulo persistente; erro substitui a ajuda e cita o dado. O `Select` não vem do handoff: herda o envelope do `Input` e usa `<select>` nativo, que no celular abre a roda do sistema e funciona antes da hidratação. |
| `InbreedingMeter` | Faixas 6,25% / 12,5%. Mesma regra de `faixa_endogamia` no banco — mudar os dois juntos. |
| `BirdCard` | Vira `<button>` com `onClick`. **Sem** barra colorida à esquerda. |
| `Table` + `TableRow` | Faixa de gravidade de 3px: um dos dois únicos lugares com barra à esquerda. |
| `Tabs` | Contador só onde a contagem informa. |
| `Toast` | Fato + consequência com data. |
| `Modal` | `<dialog>` nativo: foco preso, Esc, devolução ao disparador. Corpo diz a consequência real. |
| `EmptyState` | Alinhado à esquerda, sem ilustração, sem emoji. |
| `SyncStatus` | Nunca sugere perda: "Offline — salvo no aparelho". |
| `NotificationBadge` | `pointer-events: none` — o alvo é o botão de 44px embaixo. |
| `StatCard` | Indicador do painel desktop, 104px. A tendência nunca é só a seta: o rótulo nomeia o período ("+2 vs. setembro"). Variante `brand` é bloco de petróleo cheio — no máximo um por tela. Vem da prancha `4a`, não de `02-componentes.md`. |
| `PedigreeNode` | Nó da árvore. Faixa de sexo de 3px à esquerda: o **segundo** dos dois únicos lugares com barra colorida à esquerda. `desconhecido` nomeia a posição vazia; `repetido` ganha contorno âmbar. Não está em `02-componentes.md`, só na prancha `3c`. |

Utilitários de formatação pt-BR em `src/lib/formato.ts`: `formatarData`,
`formatarMoeda`, `formatarPercentual`, `formatarPeso`, `formatarIdade`,
`formatarAnilha`, `encadear` (separador `·`).

### Regras de código que já falharam na prática

- **Valor cru da paleta (`--sis-petroleo-100`) só em fundo sólido, nunca em cor
  de texto.** Quebrou duas vezes: o bloco da home na Fase 0 e o glifo de sexo na
  Fase 3, onde o "F" sumia no tema escuro. Use alias semântico
  (`--text-brand`, `--text-heading`).
- **Card ou linha clicável é `<button>`**, não `<div>` com `onClick`.
- **`data-theme="dark"` é obrigatório desde o primeiro componente.**
  `colors.css` só aplica o escuro sob esse atributo — não há media query.
- **Em formulário com Server Action, todo campo é controlado.** O React 19
  reseta o formulário quando a ação termina, inclusive quando ela volta com
  erro. Campo solto perde o conteúdo justamente quando o criador precisa dele
  de volta.
- **`<select>` e `radio` precisam de mais que `value`/`checked`.** O reset os
  limpa no DOM e o React não reaplica, porque a prop não mudou entre
  renderizações: o estado fica certo e a tela mente. Use `useSelecaoFirme` /
  `useMarcacaoFirme` de `src/lib/formulario.ts`.
- **Erro tem de envelhecer junto com o dado.** A mensagem cita o dado exato, e
  por isso precisa sumir quando o campo muda — senão passa a acusar algo que já
  não está na tela. `useErrosQueEnvelhecem`, mesmo arquivo.
- **Toda mensagem de erro do Zod precisa de texto no tipo base.** A mensagem
  da regra (`.regex`, `.uuid`, `.min`) só aparece se o valor chegou do tipo
  certo; vazio falha antes e vaza o texto cru em inglês.
- **`redirect()` em Server Action chamada fora de formulário navega o
  usuário.** No reenvio da fila offline isso arrastava o criador para outra
  tela. A ação recebe `reenvio` e devolve sem navegar.
- **Quem ocupa espaço fixo reserva o próprio espaço.** O espaçador da tab bar
  mora na `TabBar`, que sabe quando se esconde; no layout, ele deixava 60px de
  rodapé vazio em toda tela sem barra.
- **O mockup não vence o contrato de acessibilidade.** A prancha `3c` usa
  `--text-muted` na legenda da árvore (3,68:1); `04-acessibilidade.md` reserva
  o muted a rótulo ≥24px ou texto não essencial. Vale o documento escrito.
- **Rótulo de módulo puro não pode morar ao lado do cliente do Supabase.**
  `ROTULO_ESTADO` e `TOM_ESTADO` saíram de `dados/ovos.ts` para
  `dados/estados-do-ovo.ts` quando o formulário da ninhada — componente de
  cliente — precisou deles: importá-los do módulo de leitura arrastaria
  `next/headers` para o pacote do navegador. É o terceiro módulo puro criado
  pelo mesmo motivo (`situacao.ts`, `marcos.ts`, `estados-do-ovo.ts`).
- **Aviso derivado de linha vira aviso repetido.** `vw_tarefas_hoje` devolve
  uma linha por OVO, e a primeira versão de `gerar_notificacoes` criou uma
  notificação para cada: a ninhada com dois filhotes na janela produzia dois
  avisos idênticos. A unidade do aviso é a ninhada, e a quantidade entra na
  frase — como a tela "Hoje" já fazia.
- **Taxa sem denominador engana.** "100%" ao lado de "5 ovos" era literalmente
  correto (1 ovo decidido, 1 nascido) e ilegível como informação. Toda taxa do
  relatório mostra agora sobre quantos ovos ela foi feita, e quantos seguem em
  curso.
- **`current_date` e `toISOString()` são UTC, e o criatório é brasileiro.**
  Das 21h à meia-noite o dia já virou — a janela em que o criador trabalha,
  porque eclosão acontece de madrugada. A tela oferecia amanhã como data
  padrão, a guarda de "não pode ser no futuro" aceitava, e a janela de
  anilhamento (dois dias) abria e vencia cedo. Ver `public.hoje()` e
  `src/lib/data.ts`.
- **`new Date(ano, mes, 1).toISOString()` devolve o mês anterior.** Meia-noite
  local vira 21h do dia anterior em UTC, e todo limite de mês do produto saía
  um dia atrás. `paraISO` formata os campos locais sem passar por UTC.
- **Contar linhas de erro não é verificar.** `grep -c FALHOU` devolve zero
  tanto quando tudo passa quanto quando o script morre antes do veredito. Dois
  arquivos de teste ficaram quebrados sem aparecer. `scripts/testar.mjs` trata
  erro de SQL e arquivo sem asserção como falha.
- **Erro que o código engole some da tela, não do produto.** `listarEtiquetas`
  devolvia `[]` ao falhar, então a seção de etiquetas aparecia vazia e parecia
  certa; quem acusou foi o console do navegador. Toda leitura que devolve lista
  vazia em caso de erro precisa de uma passada no console antes de "funciona".
  **E a segunda vez foi pior:** o `/plantel` passou a dizer "Nenhuma ave no
  plantel · Cadastre a primeira ave" para um criatório com catorze aves, do
  dia da 0024 (que criou o segundo caminho de `posturas` para `casais` e
  tornou o embed ambíguo) até 17/10/2026 — em celular e em computador, porque
  a mesma consulta alimenta as duas marcações. `listarPlantelEmTabela` agora
  devolve `falhou`, e a tela diz "Não foi possível carregar o plantel · As
  aves continuam registradas". **Vazio e falha nunca são a mesma frase**:
  mandar cadastrar o que já existe é pior que não dizer nada. Outras vinte e
  quatro leituras ainda caem em `[]` silencioso — cada uma é um candidato ao
  mesmo defeito.
- **FK nova torna ambíguo todo embed antigo para aquela tabela.** A 0024
  acrescentou `posturas.casal_chocador_id` e, a partir dali, qualquer
  `posturas(...casais(...))` sem dica virou "more than one relationship was
  found". Migration que cria um segundo caminho entre duas tabelas precisa de
  uma varredura nos embeds existentes — o PostgREST só reclama em tempo de
  execução.
- **Lista de escolha na edição precisa conter o que já está gravado** — e o
  erro repetiu. Depois de corrigi-lo nos progenitores, a correção de pesagem
  nasceu com o mesmo buraco: o contexto `anilhamento` é escrito pelo sistema e
  não aparece no formulário, então o `<select>` caía vazio e salvar trocaria o
  contexto em silêncio. Todo `<select>` filtrado numa tela de edição tem isto. As
  opções de pai e mãe só trazem ave no plantel ativo; na edição, um pai vendido
  sumiria do `<select>`, o campo cairia para "Desconhecido" e salvar outro dado
  apagaria a filiação sem avisar. Toda tela de edição com `<select>` filtrado
  tem esse buraco.
- **Uma definição derivada mora num lugar só.** "Casal ativo" existia em três:
  `casal_ativo()` no banco, a lista e o painel — duas usando
  `vigencia_fim >= hoje` e uma usando `is null`. Enquanto nenhum casal era
  encerrado pela interface, as três concordavam. No primeiro encerramento a
  tela passou a dizer "não aceita mais postura" e a oferecer "Registrar
  postura" logo abaixo.
- **Efeito em outra entidade se avisa antes, não só depois.** `registrar_saida`
  encerra o casal vigente da ave. A tela diz qual casal e em que dia enquanto o
  criador ainda pode desistir; dizer só na confirmação seria contar o que já
  foi feito.
- **Frase de confirmação se escreve inteira, não se compõe.** "{rótulo}
  registrada" dava "Empréstimo registrada" e "Óbito registrada" em dois dos
  cinco motivos de saída. Cada um carrega a própria frase.
- **A regra de domínio mora num lugar só.** Quais marcos cada ovo aceita é
  decidido em `obterNinhada` e consumido pela tela; a função do banco verifica
  as mesmas condições. Reimplementar a regra em TSX é como as duas versões
  divergem sem ninguém perceber.
- **Corrigir o fuso nas funções não corrige os DEFAULT das colunas.** A 0022
  trocou `current_date` por `public.hoje()` em funções e views e deixou seis
  colunas `date` com o padrão em UTC. Nenhum registro errado existiu porque
  toda escrita manda a data junto — mas o padrão é exatamente o que a próxima
  escrita vai usar quando alguém esquecer. Corrigido na 0032.
- **Item de grade não encolhe abaixo do conteúdo.** `grid-template-columns:
  1fr 1fr` com `min-width: auto` (o padrão) empurrou o segundo StatCard para
  fora da tela assim que o valor virou "R$ 1.850,00". Precisa de
  `min-width: 0` — e o número do cartão precisou de um tamanho menor, que
  virou a variante `size="md"` do `StatCard`.
- **Arquivo de convenção vence metadado declarado.** O ícone da aba era o
  padrão do Next porque `src/app/favicon.ico` existia: o App Router o emite
  antes do `/favicon.ico` que `icons` declara, e o navegador fica com o
  primeiro. Quem herda um projeto criado por `create-next-app` herda esse
  arquivo sem perceber.
- **Robô de pré-visualização não tem cookie.** O `og:image` ficava atrás do
  middleware de sessão e respondia 307 para o login, então o WhatsApp montava
  resumo sem imagem. Toda rota que existe para ser buscada por terceiro —
  imagem de compartilhamento, `sitemap`, `robots.txt`, manifest — precisa estar
  fora da exigência de sessão.
- **`--text-inverse` não serve para texto sobre preenchimento fixo.** No tema
  escuro ele vira grafite ("inverso" lá quer dizer escuro sobre claro), e o
  rótulo do botão primário saía 2,06:1 sobre petróleo. Use `--text-on-brand` e
  `--text-on-danger`, brancos nos dois temas.

---

## Telas construídas

| Rota | Tela | Observação |
|---|---|---|
| `/` | B1 Hoje | tarefas agrupadas por ninhada, sobre `vw_tarefas_hoje`; traz o estado `2h` (sem conexão) e a lista de pendentes |
| `/offline` | recurso do service worker | estática e pública: a tela pedida nunca foi visitada neste aparelho |
| `/painel` | C1 Painel do criatório | **só desktop**; 4 indicadores, nascimentos por mês, tarefas e movimentações |
| `/plantel` (≥1024px) | C2 Plantel em tabela | mesma rota da B5; filtros laterais, 10 colunas, ordenação, seleção em lote |
| `/ovos` | B2 Ovos | pipeline com pílulas de estado; ninhada herda o estado mais urgente dos seus ovos |
| `/plantel` | B5 Plantel | busca por anilha ou nome (GET, sem JavaScript) e 4 filtros |
| `/plantel/[id]` | B3 Ficha da ave | anilha em destaque, filiação clicável, 3 atalhos |
| `/casais` | B7 Casais | par com anilhas, ninhada atual, ovos ativos e endogamia por faixa |
| `/casais/[id]` | B8 Ficha do casal | `InbreedingMeter` com explicação vinda de `ancestrais_comuns`, histórico de ninhadas |
| `/casais/[id]/postura` | B9 Registrar postura | **primeira tela de escrita**: Server Action + Zod, previsões ao vivo, tab bar escondida |
| `/plantel/nova` | Cadastrar ave | não desenhada; sugestão de anilha como botão, filiação só quando a ave nasceu no criatório |
| `/especies` · `/especies/[id]` · `/especies/adotar` | Espécies e prazos | não desenhada; os prazos movem a máquina de estados inteira, e a tela diz isso |
| `/configuracoes` | Configurações | não desenhada; nome, clube, matrícula e IBAMA — o cabeçalho do CRO |
| `/configuracoes/membros` | Membros | não desenhada; convite por e-mail que vira acesso no login |
| `/perfil` | Perfil | não desenhada; nome e telefone. O e-mail é credencial, não perfil |
| `/relatorios` | Relatórios | não desenhada; temporada e casal, com o denominador ao lado de cada taxa |
| `/notificacoes` | Notificações | não desenhada; avisos derivados dos prazos, materializados na abertura |
| `/mais` | Mais | a quinta aba do celular; era um placeholder |
| `/financeiro` | B10 Financeiro | mês navegável, três indicadores, saldo de 6 meses e os lançamentos do mês |
| `/financeiro/novo` · `/financeiro/[id]/editar` | Lançamento | o mesmo formulário em dois modos; exclusão lógica em dois toques |
| `/financeiro/categorias` | Categorias | não desenhada; as de sistema ficam à parte e não se editam |
| `/saude` | Saúde | não desenhada; tratamentos em curso, em carência e encerrados. `?ave=` a transforma no histórico sanitário de uma ave |
| `/saude/novo` · `/saude/[id]/editar` | Tratamento | alvo é ave OU casal; terminar é preencher o fim, e é dele que a carência conta |
| `/saude/medicamentos` · `/saude/doencas` · `/saude/sintomas` | Catálogos da saúde | não desenhados; os itens compartilhados ficam à parte e não se editam |
| `/genealogia` | Genealogia do plantel | não desenhada; linhagens, cobertura e o **simulador de cruzamento** — a ÁRVORE de uma ave continua entrando pela ficha |
| `/casais/etiquetas` | Etiquetas | não desenhada; renomear, recolorir e excluir — as etiquetas NASCEM na edição do casal |
| `/casais/novo` | Formar casal | não desenhada; endogamia consultada ao completar o par, **antes** de confirmar |
| `/ovos/[ninhada]` | Ninhada | não desenhada; **fecha o ciclo**: uma data e um marco por ovo (fértil, ovo claro, nasceu, separado, perdido) numa conferência só |
| `/ovos/[ninhada]/corrigir` | Corrigir registros | não desenhada; desfaz um marco do ciclo registrado por engano |
| `/ovos/[ninhada]/transferir` | Transferir ovos | não desenhada; passa ovos para outro casal chocar, e traz de volta |
| `/ovos/[ninhada]/anilhar` | Anilhar filhote | não desenhada; um bloco por filhote, numeração em sequência por botão, anilhamento parcial permitido |
| `/plantel/[id]/editar` | Editar ave | não desenhada; **o mesmo componente do cadastro**, em modo de edição |
| `/casais/[id]/editar` | Editar casal | não desenhada; gaiola, observações, vigência — e é aqui que o casal se encerra |
| `/plantel/[id]/saida` | Registrar saída | não desenhada; venda, doação, empréstimo, óbito e fuga — os campos mudam com o motivo e o casal vigente é encerrado junto |
| `/certificados` · `/certificados/novo` | Certificados e **C3** | a C3 é a única tela exclusiva do desktop: a folha tem 210 mm e não há redução dela legível no telefone |
| `/cro/[id]` · `/cro/publico/[codigo]` | **D1** · a folha A4 | fora do grupo `(app)`: sem sidebar, sem tab bar, nada que saia no papel |
| `/v/[codigo]` | **D2** · validação pública | anônima; o que abre ao escanear o QR |
| `/plantel/[id]/certificado` | Emitir CRO da ave | não desenhada; D1 é a FOLHA, não esta tela |
| `/plantel/[id]/pesagens` | Pesagens | não desenhada; registro e histórico com a variação escrita por extenso |
| `/plantel/[id]/genealogia` | B6 Árvore genealógica | três gerações em rolagem horizontal; aviso de ancestral repetido no topo; cabeçalho petróleo de borda a borda e legenda fixa no rodapé |
| `/entrar`, `/cadastrar`, `/recuperar-senha`, `/nova-senha` | B4 e derivadas | cartão sempre claro sobre o petróleo |
| `/comecar`, `/comecar/especies` | onboarding | não desenhado; feito na linguagem das demais |
| `/ds` | biblioteca | referência do artboard A3; sai antes do lançamento |

Não há mais vazio honesto no produto: todas as rotas que existem fazem alguma
coisa.

**O padrão de escrita**, estabelecido na B9 e repetido nas três telas novas:
Server Action com esquema Zod espelhando as constraints, erro por campo citando
o dado exato, e `redirect` com parâmetros que a tela de destino transforma em
confirmação ("fato + consequência com data"). Quando a escrita toca mais de uma
tabela por item — o anilhamento toca três —, ela vira função no banco, para
falhar inteira em vez de pela metade.

Validação que o banco não faz, mas o domínio exige, fica na Server Action, com
mensagem que nomeia a ave: progenitor mais novo que o filho, par já vigente,
vigência anterior ao nascimento, anilha repetida dentro do mesmo envio.

Telas de formulário escondem a tab bar (`ROTAS_SEM_BARRA` em `TabBar.tsx`):
o spec manda substituir, não empilhar — senão o botão de salvar fica atrás da
navegação.

**São dezenove telas de escrita.** A quinta, a conferência da ninhada, fecha o
ciclo do ovo. O formato dela vem do galpão e não do plano: o criador abre o
ninho UMA vez e encontra tudo junto — dois filhotes nascidos, um ovo claro, um
quebrado, um ainda chocando. Quatro telas, uma por marco, o obrigariam a quatro
passagens pela mesma ninhada. Daí uma data no topo ("Conferido em") e um marco
por ovo, tudo numa transação.

A sexta é a saída da ave. Ela mostra o que mais vai acontecer **antes** de
confirmar, não só na confirmação: `registrar_saida` encerra o casal vigente, e
efeito que o criador não viu chegar é efeito escondido. A venda com valor lança
a receita na categoria de sistema `venda_passaro` — é o primeiro dado que o
financeiro da Fase 9 vai encontrar pronto.

As duas de edição vieram por último e mudaram o resto. **Cadastro e edição de
ave são o MESMO componente** (`src/components/plantel/FormularioAve.tsx`), em
dois modos: são quinze campos com as mesmas regras, e duas cópias garantiriam
que uma validação nova entrasse só numa. O que a edição acrescenta é olhar o
que já existe em volta da ave — filhotes, casais, a postura que a originou —,
porque nenhum desses vínculos existia no momento do cadastro.

## O que falta — inventário completo

Organizado por quanto bloqueia o uso real, não pela ordem do plano.

### 1 · O ciclo do ovo — resolvido em 13/10/2026

Era o item que bloqueava tudo. A tela `/ovos/[ninhada]` e a função
`registrar_marcos` cobrem as quatro escritas que faltavam. Fica registrado o que
a solução recusa de propósito:

- **Separar filhote não anilhado é barrado.** `separado` é terminal e vence a
  janela de anilha em `situacao_postura`: o filhote sairia da fila de tarefas
  sem nunca ter virado ave no plantel. Não é beco sem saída — a tela de
  anilhamento aceita filhote com a janela vencida, avisando do atraso.
- **Corrigir marco já gravado não é conferência, é edição**, e edição é outra
  tela (item 2). O marco repetido é ignorado em silêncio; o marco que conflita
  com um desfecho já declarado é recusado com o dado exato.
- **Ovo que eclodiu ganha `fertil = true` e `ovoscopia_em` continua nulo.** A
  dedução é segura; a data da observação seria inventada.
- **Perda de filhote já anilhado também mata a ave no plantel**
  (`situacao = 'morto'`, `dt_obito`). Marcar só a postura deixaria a ave viva na
  listagem, contada no plantel ativo e disponível para formar casal.

### 2 · Escritas fora do ciclo — resolvidas em 15/10/2026

Saída da ave, edição de ave e edição de casal (com o encerramento). O que essas
telas decidem, de propósito:

- **Venda e doação não voltam por reativação.** A ave recomprada entra como
  aquisição nova, com origem e anilha próprias. Só empréstimo e fuga voltam.
- **O casal encerrado não reabre junto com a ave**, e só reabre pela edição
  enquanto as duas aves estão no plantel.
- **O par de um casal não se edita.** Trocar uma das aves deixaria as ninhadas
  já registradas penduradas num par que nunca as gerou — e os filhotes
  anilhados guardam a filiação copiada no anilhamento, então a árvore diria uma
  coisa e o casal outra. Par diferente é casal novo.
- **Nascimento e origem de ave vinda de postura não se editam.** A data é a da
  eclosão registrada; mudá-la aqui faria a ficha divergir do ovo que a originou.
- **Não há tabela de histórico de saídas.** A ave emprestada que volta perde o
  registro de quando saiu — a reativação limpa a data, porque ave ativa não
  guarda saída em aberto. É a escolha consistente com o resto do sistema (não
  há tabela de eventos; o estado é um só), e o custo está anotado aqui.

**A armadilha que quase passou:** as listas de pai e mãe só trazem ave no
plantel ativo. Se o pai foi vendido, ele sumiria do `<select>`, o campo cairia
para "Desconhecido" e salvar qualquer outro dado **apagaria a filiação**.
`opcoesEditarAve` devolve os progenitores atuais à lista mesmo fora do plantel,
e exclui a própria ave.

Em 16/10/2026 entrou o que ainda restava: **pesagem avulsa**, **desfazer um
marco do ciclo**, **transferir postura entre casais** e **etiquetar casal**.

Decisões dessas quatro que vale conhecer:

- **Transferir muda quem choca, nunca de quem é o ovo.** `posturas.casal_id` é
  de onde `anilhar_filhotes` tira a filiação e de onde a view tira a espécie e
  todos os prazos. Mover o ovo de casal daria ao filhote os pais errados, em
  silêncio e para sempre. Daí `casal_chocador_id`, separado.
- **Desfazer a perda de um filhote anilhado desfaz também o óbito da ave** —
  mas só quando foi aquele marco que o gravou, conferido pela data. Ave morta
  por outro motivo tem história própria.
- **Contexto de pesagem e cor de etiqueta são listas fechadas.** Texto livre
  viraria três séries do mesmo evento; seletor de cor livre viraria um criatório
  com etiquetas em rosa e verde-limão, contra a paleta fechada do contrato.
- **A etiqueta criada por engano fica no catálogo.** Dá para tirá-la de todos
  os casais, não para apagá-la — gerir o catálogo (renomear, excluir) é a
  pendência que sobrou desse item.

Nada falta mais nesta frente. As três correções que tinham ficado para trás
entraram em 16/10/2026:

- **Catálogo de etiquetas** (`/casais/etiquetas`) — renomear, recolorir e
  excluir. As etiquetas **nascem** na edição do casal, onde o criador está
  quando pensa nelas; duas portas de entrada para a mesma coisa é como se criam
  duas etiquetas com o mesmo nome e grafias diferentes.
- **Data de um marco em um passo** — `corrigir_data_marco` desfaz e registra na
  mesma transação, chamando `desfazer_marco` e `registrar_marcos` em vez de
  repetir as guardas delas. Data nova recusada deixa a anterior valendo, que é
  o ponto de ser uma transação só.
- **Editar e excluir pesagem** — no mesmo formulário do lançamento, em dois
  modos. A exclusão é lógica: peso é série histórica, e o ponto apagado pode já
  ter alimentado um relatório.

Excluir pede **dois toques na própria linha**, não um diálogo modal: a
consequência cabe no lugar onde ela acontece, e o modal custaria um foco preso
e a lista coberta para confirmar o que já está escrito ali.

### 3 · Fases do plano ainda não iniciadas

| Fase | O que entrega | Banco |
|---|---|---|
| ~~9 · Financeiro e saúde~~ | concluída em 17/10/2026 | — |
| 10 · Assinatura (Mercado Pago) | checkout PIX/cartão, webhook, bloqueio suave | **pronto** (`assinaturas`, `assinatura_pagamentos`); credenciais vazias no `.env` |
| 11 · Landing e lançamento | D3, SEO, domínio, migração do legado | — |

### 4 · Telas que o handoff não desenhou

O `MANIFEST.md` do handoff declara essas ausências — falta o DESENHO, não a
função. Construídas na linguagem das telas existentes, em 17/10/2026:

- **Espécies e prazos** (`/especies`) — adotar do catálogo, corrigir prazos,
  tirar de uso, excluir. Era o maior buraco: só dava para adotar espécie no
  onboarding, e sem espécie não há prazo, sem prazo não há ciclo.
- **Configurações** (`/configuracoes`) — nome, cidade, clube, matrícula e
  registro IBAMA, que saem impressos no cabeçalho do CRO. O **slug não se
  edita**: é o endereço público do certificado, e mudá-lo quebraria o QR de
  toda peça já impressa.
- **Perfil** (`/perfil`) — nome e telefone. O e-mail é credencial, não perfil.
- **Membros** (`/configuracoes/membros`) — convite por e-mail. Precisou de
  `criatorio_convites` (0027): o e-mail vive em `auth.users`, que o cliente não
  lê, então não havia como virar membro na hora. `aceitar_convites()` faz a
  virada no login.
- **Relatórios** (`/relatorios`) — temporada e casal.
- **Notificações** (`/notificacoes`) — ver o item 5 sobre o que ainda falta.
- **Mais** (`/mais`) — a quinta aba do celular era um placeholder, e sem ela o
  celular não tinha porta nenhuma para nada disso.

O que **continua** faltando desta lista:

- **Tema escuro das pranchas B3–B11 e C1–C3** — os tokens existem e todas as
  telas construídas já foram conferidas nos dois temas; o que falta são os
  desenhos, não a implementação.

### 5 · Qualidade e lançamento

- **Não há nenhum teste de interface.** O banco tem 231 asserções; o front,
  zero. O plano previa Vitest e Playwright na Fase 0 e eles nunca entraram. O
  fluxo que mais merece um teste de ponta a ponta é o do ciclo do ovo.
- **O push das notificações não existe.** Os avisos se materializam quando o
  criador abre o aplicativo (`gerar_notificacoes`), o que é o oposto do ponto:
  o prazo de anilhamento dura dois dias e deveria chegar sem ele abrir nada.
  Faltam duas coisas, e as duas dependem de deploy: a chave **VAPID** e um
  **agendador** (cron da Vercel) que rode a geração e dispare o envio. A tela
  diz isso em vez de oferecer um botão que não ativa nada.
- ~~Nunca foi publicado.~~ **No ar desde 18/10/2026** — ver "No ar".
- **As chaves do Supabase passaram pelo chat e SEGUEM sem rotação.** Conferido
  em 18/10/2026: o `iat` das duas é 30/09. A `service_role` ignora RLS, e o
  site agora é público — a pendência deixou de ser preventiva. Rotacionar em
  Settings → API Keys e atualizar `.env.local` **e** as variáveis da Vercel.
- **Sem SMTP próprio.** Confirmação de conta e recuperação de senha saem pelo
  remetente padrão do Supabase, com limite baixo por hora e alta chance de cair
  em spam. Serve para teste entre conhecidos; não serve para cliente.
- **`/ds` sai antes do lançamento** — é a referência visual do artboard A3, e
  hoje responde para qualquer pessoa no domínio público.
- **Node 20 na máquina**; em produção a Vercel roda 22, que é o que
  `@supabase/supabase-js` exige.
- **Migração do legado** — mapear as 18 entidades do dossiê, preservando a
  validade dos certificados e QR já emitidos.

### 6 · Pendências que dependem do cliente

Repetidas aqui porque bloqueiam coisas concretas; detalhe em "Pendências do
cliente".

1. **`dias_choco` de 32 das 60 espécies** — sem isso a espécie não pode ser
   adotada, porque é o prazo que move o ciclo inteiro.
2. **Prazo de anilhamento por porte** — os 3 dias vieram como valor único.
3. **Formato da anilha** — dois formatos no handoff; modelado de forma
   flexível, sem travar a decisão.
4. **O regime legal das espécies** — 60 passeriformes silvestres
   (SISPASS/IBAMA), clubes de canaricultura e telas desenhadas com Agapornis.
   Três regimes diferentes; muda conteúdo de tela e talvez validação de anilha.

---

## O CRO

Três peças, e cada uma responde a uma pergunta diferente.

**A emissão** (`emitir_certificado`) não é um insert. O **sequencial** é por
criatório, calculado sob trava da linha do criatório — é o número impresso no
papel, e dois CRO com o mesmo número é o pior defeito possível. O **snapshot**
congela a genealogia do dia: a árvore muda quando o criador corrige uma
filiação, e um CRO de 2026 precisa continuar provando o que era verdade em
2026. O **hash** torna a URL imprevisível; sem ele bastaria incrementar o
sequencial para varrer os certificados de todos os criatórios.

**A folha** (`/cro/[id]`, componente `CertificadoA4`) segue D1: medidas em mm e
pt, nunca px, porque é um documento físico. As cores saem **literais** e a
folha é clara nos dois temas — papel não tem tema escuro, e `var(--surface-card)`
seguiria o tema do navegador na hora de imprimir. O PDF nasce da impressão do
navegador: a peça já foi desenhada para sair pronta, e gerar PDF no servidor
exigiria Chrome headless em função serverless para ganhar nada.

**A validação** (`/v/[codigo]`) passa por `validar_certificado`, que é
`security definer` e devolve só o snapshot. Nenhum id interno, nenhum contato
do criador: a página prova a ave, não apresenta o vendedor. Verificada sem
cookie nenhum — responde 200, sem redirecionar para o login.

Decisões que valem registro:

- **Ave sem anilha não recebe CRO.** O documento afirma a anilha oficial.
- **Revogar nunca apaga.** O papel foi impresso e entregue; sumir do banco
  faria o QR dizer "não encontrado", que é ambíguo. Revogado, a página pública
  diz o que aconteceu, com data e motivo.
- **A mesma ave pode receber várias vias**, cada uma com número próprio. A
  primeira se perde, a ave é revendida.
- **A prévia da C3 usa a MESMA função** que a emissão congela. Montar o retrato
  em TypeScript para a prévia faria a tela divergir do papel na primeira
  mudança de uma das duas.
- **Os rótulos dos bisavós precisam de mais que o lado.** `ppp` e `pmp` são
  ambos "paternos"; cada bisavô é nomeado pelo avô de quem é — "Pai do avô
  paterno".

## O dinheiro e a saúde

As duas frentes da Fase 9 compartilham a forma — lista do criatório, catálogo
próprio ao lado de um catálogo compartilhado, escrita em dois modos no mesmo
formulário — e cada uma tem um número que o sistema calcula e o criador não
calcularia de cabeça.

**O financeiro.** O saldo por mês sai de `vw_financeiro_mensal` porque o
PostgREST não agrupa, e mês sem lançamento não tem linha: a lacuna é
preenchida pela tela, que sabe quais seis meses está mostrando. O valor é
sempre positivo e o sinal vem do tipo (0007); o saldo é o único número que
pode sair negativo. A **categoria tem tipo próprio e ele precisa bater com o
do lançamento** — "Ração" com uma receita dentro somaria no lado errado —, e a
guarda é na Server Action porque uma constraint cruzada entre duas tabelas
exigiria trigger. As categorias de sistema não se editam: `registrar_saida`
procura `venda_passaro` pela chave.

Duas diferenças deliberadas da prancha `3g`: o cabeçalho **não** é bloco de
petróleo (a prancha tem dois blocos cheios na mesma tela, e o contrato permite
um — fica com o saldo), e as barras do gráfico **não trazem número escrito**
(a prancha arredonda valor financeiro, que o contrato proíbe em exibição, e
"R$ 1.240,00" não cabe em um sexto de 390px). Cada barra é link para o seu mês
e o rótulo acessível carrega o valor inteiro.

**A saúde.** O número é a **carência**, e ela conta do FIM da aplicação. Por
isso `vw_tratamentos` só devolve `carencia_ate` quando o tratamento já
terminou: num tratamento em curso a data seria um alvo móvel — "libera amanhã"
todo dia —, então a tela mostra os dias do medicamento e diz a partir de
quando eles contam. É o único âmbar da tela, e com prazo de verdade: enquanto
a carência corre, a ave não deveria ser vendida nem exposta.

- **Os vínculos N:N são gravados inteiros**, por função do banco
  (`definir_sintomas_da_doenca`, `definir_doencas_do_medicamento`). Soltos na
  aplicação seriam delete + insert sem transação, e a falha no meio deixaria a
  doença sem sintoma nenhum. Gravar o conjunto inteiro é também o que torna a
  escrita idempotente — por isso ela entra na fila offline sem chave própria.
- **Sintomas e doenças vêm semeados; medicamentos, não.** Nome comercial, dose
  e carência saem da bula e da prescrição, variam por marca e por país, e uma
  lista pronta no produto seria lida como recomendação. O catálogo de
  medicamentos é o que está na prateleira do criador.
- **Item do catálogo compartilhado não recebe vínculo.** A RLS recusa, e está
  certo: os sintomas de uma doença são os que AQUELE criatório observou.
  Prendê-los a uma linha de todos seria afirmar pelos outros.
- **O alvo é ave OU casal.** Trata-se o casal inteiro quando a aplicação vai na
  água ou na ração do viveiro, que é como vermífugo e antibiótico costumam ir.
- **`/saude?ave=` é o histórico sanitário de uma ave**, e é o quarto atalho da
  ficha. Rota própria seria uma segunda lista de tratamentos para manter, com
  as mesmas regras de carência.

## A genealogia tem duas perguntas

A **árvore** (B6, prancha `3c`) responde *de onde vem esta ave* e entra pela
ficha dela: três gerações para cima, a partir de uma raiz escolhida. É a tela
que o handoff desenhou.

`/genealogia` responde a pergunta inversa — *de onde vem este plantel* — e foi
o último destino "em breve" da sidebar. Ela precisa do caminho contrário na
mesma recursão, e a diferença entre os dois não é de sinal:

- **`ancestrais()` conta CAMINHOS, `descendentes()` conta AVES.** Lá a
  repetição é o dado que produz endogamia — o mesmo avô pelos dois lados tem
  de aparecer duas vezes. Aqui ela seria contagem dobrada: a ave que descende
  do fundador pelo pai e pela mãe continua sendo uma ave no plantel, e
  contá-la duas vezes inflaria a linhagem justamente nos criatórios mais
  fechados.
- **Linhagem é fundador COM descendência.** Fundador é a ave sem pai nem mãe
  no sistema — quase sempre a comprada, cujo pedigree está no papel do
  vendedor. Sem o filtro de descendência a lista viraria uma segunda cópia do
  plantel.
- **O simulador existe para terminar numa decisão.** O par escolhido vai junto
  para `/casais/novo`, que passou a aceitá-lo por parâmetro. Acima de 12,5% a
  tela diz que é desaconselhado e **não impede** — a decisão é do criador, e o
  botão só troca para a variante secundária.
- **O par vive na URL, não no estado.** `coeficiente_endogamia` é recursivo
  sobre a árvore e roda no banco, então o par precisa chegar ao servidor. De
  quebra, um cruzamento simulado se compartilha e se recarrega.
- **A cobertura mede o que falta, sem acusar o que não falta.** Ave comprada
  sem progenitor é origem de linhagem; ave **nascida aqui** sem filiação é
  registro faltando. Só a segunda é apontada — e a semente de desenvolvimento
  precisou marcar as fundadoras como `compra`, porque o default da coluna é
  `nascimento_proprio` e a tela passava a acusar seis buracos inexistentes.

## No ar

Publicado em **18/10/2026**, em `https://sisaves.tallpa.com.br`.

| Peça | Onde | Observação |
|---|---|---|
| Aplicação | Vercel, projeto importado do GitHub | Node 22; todo push no `main` redeploya |
| DNS | Cloudflare, zona `tallpa.com.br` | `CNAME sisaves → …vercel-dns-017.com`, **proxy desligado** |
| Verificação de domínio | Cloudflare | `TXT _vercel` com o `vc-domain-verify` que a Vercel pediu |
| Banco e Auth | o MESMO projeto Supabase do desenvolvimento | produção e `localhost` leem os mesmos dados |

**A nuvem da Cloudflare fica cinza.** Com o proxy ligado ela termina o TLS
antes da Vercel e impede a emissão do certificado; e com o modo SSL em
"Flexible" o site entra em laço de redirecionamento. Se um dia o proxy for
desejado, o caminho é emitir o certificado com DNS only, pôr SSL/TLS em
**Full (strict)** e só então ligar a nuvem laranja.

**Produção e desenvolvimento compartilham o banco.** É a escolha certa
enquanto não há cliente — o que se vê no `localhost` é o que se vê no ar —, e
é a primeira coisa a mudar quando houver: um projeto Supabase separado para
produção, com as variáveis da Vercel apontando para ele.

### Variáveis na Vercel

Só três, em Production e Preview:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL      → https://sisaves.tallpa.com.br
```

**`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF`
e `SENHA_USUARIO_TESTE` não vão para a Vercel.** Nenhuma tela as usa: são
migrations, testes e scripts, que rodam da máquina do desenvolvedor. Levá-las
para o servidor seria ampliar a superfície sem ganho nenhum.

`NEXT_PUBLIC_SITE_URL` é só a **reserva** para montar o retorno do login
quando a requisição não traz `origin`. No `.env.local` ela continua
`http://localhost:3000` — apontá-la para produção na máquina de desenvolvimento
jogaria uma volta de login local no site publicado. **O QR do CRO não sai
dela**: ele usa o `host` da requisição, então o certificado carrega o domínio
pelo qual foi aberto.

### Entrar com Google

Funciona, e o circuito foi conferido ponta a ponta até a porta do Google.

- **Google Cloud** (projeto `sisaves`): cliente OAuth do tipo Aplicativo da
  Web. O **URI de redirecionamento autorizado é o do SUPABASE**
  (`https://<ref>.supabase.co/auth/v1/callback`), não o do app — o caminho é
  navegador → Google → Supabase → app. "Origens JavaScript" fica vazio: o
  fluxo é de servidor, e navegação de página não tem origem para validar.
- **Supabase** → Authentication → Providers → Google, com o par Client ID e
  Secret. **Esse par não mora em arquivo nenhum do projeto.**
- **Supabase** → URL Configuration: Site URL do domínio, e Redirect URLs com
  `https://sisaves.tallpa.com.br/auth/callback` e
  `http://localhost:3000/auth/callback`.

Conferido em 18/10: o endpoint `authorize` do Supabase devolve 302 para o
Google carregando o `redirect_to` de produção — ou seja, a lista de retorno
aceita o domínio.

**Entrar com Google cria um usuário NOVO**, sem criatório, que cai no
onboarding. Para ver os dados de teste com uma conta Google, convide-a em
`/configuracoes/membros` estando logado na conta de desenvolvimento.

### O que o deploy destravou

- **O service worker registra de verdade.** Em desenvolvimento ele é desligado
  de propósito (serviria HTML velho por cima do hot reload), então o offline só
  pôde ser exercitado como produto a partir daqui.
- **O QR do CRO sai com o domínio definitivo.** Ele vem do `host`, então toda
  folha impressa a partir de agora aponta para `sisaves.tallpa.com.br`.
- **Push e webhook do Mercado Pago passam a ter endereço estável**, que é o que
  faltava para a Fase 10 e para o agendador das notificações.

### A marca na aba e no compartilhamento

Dois defeitos corrigidos em 18/10:

- O ícone da aba era o **padrão do Next** — `src/app/favicon.ico` nunca tinha
  sido substituído, e a convenção de arquivo do App Router vence o
  `public/favicon.ico` declarado em `icons`. Apagar o arquivo resolveu.
- Não havia **nenhuma** meta de Open Graph, então colar o endereço no WhatsApp
  não montava resumo. Entraram `metadataBase` (sem ele o `og:image` sai
  relativo e nenhum mensageiro resolve), o bloco `openGraph` e o
  `twitter:card`. O cartão é gerado por `next/og` em `opengraph-image.tsx`,
  1200×630, estático no build — e a assinatura vem do **SVG da marca**, não de
  texto, porque remontá-la com fonte de sistema daria um "SisAves" parecido.
- **`/opengraph-image` precisou entrar nas rotas públicas do middleware.** Quem
  busca essa imagem é um robô sem cookie: com sessão exigida ele recebia 307
  para o login e o resumo saía sem imagem.

## As duas faixas, uma rota só

O contrato descreve dois contextos: *em pé no galpão, no celular* e *sentado no
computador*. Eles são a **mesma rota**, trocada por media query em **1024px** —
o ponto onde a sidebar de 248px cabe sem comer o conteúdo.

Rotas separadas duplicariam cada tela e deixariam as duas versões divergirem
com o tempo; e quem gira o celular não deveria ver outro produto.

| | Abaixo de 1024px | A partir de 1024px |
|---|---|---|
| Navegação | tab bar de 5 destinos | sidebar de 248px, 3 grupos |
| Cabeçalho | título dentro da tela | top bar de 56px, com busca e sync |
| Largura | 560px | toda a janela |

**A conta mora no pé da sidebar** — quem está logado, "Ver perfil" e "Sair da
conta". Faltava: Perfil e Sair só existiam em `/mais`, que é a quinta aba do
CELULAR e não tem equivalente no desktop, então acima de 1024px não havia como
sair sem digitar a rota. O avatar da top bar, que era um `span` com
`aria-hidden`, virou link para o perfil. A lista de destinos rola; a conta fica
fixa, porque sair não pode depender de rolar a navegação numa tela de 900px.

A `TabBar` e a `Sidebar` se escondem sozinhas por media query; o título da top
bar é derivado da rota (`TITULOS` em `TopBar.tsx`), para que nenhuma tela nova
possa esquecer de pôr o seu.

Na sidebar, destino ainda não construído aparecia desabilitado com "em breve" —
escondê-lo faria a navegação mentir sobre o tamanho do produto, e mandar para
404 seria pior. **Desde 17/10/2026 não há nenhum:** o último era a genealogia
do plantel, e ela existe.

**O painel (C1) só existe no desktop.** O equivalente no celular é a tela Hoje,
e a diferença não é de tamanho: Hoje responde *o que eu faço agora*, o painel
responde *como está o criatório*. `/painel` não está na tab bar, mas degrada em
tela estreita porque um link compartilhado chega lá.

### Quando a mesma rota tem duas marcações

`/plantel` é o caso: lista no celular, tabela no computador. **Cada marcação
precisa do seu próprio módulo CSS.** Nomes genéricos — `.linha`, `.miniatura`,
`.faixa`, `.cabecalho` — existem nas duas, e num módulo só a regra que vem
depois no arquivo vence. Foi assim que a lista do celular quebrou, com nome
truncado e miniatura por cima da anilha.

## Offline

Requisito de primeira classe: o galpão não tem sinal. Três peças.

| Peça | Onde | O que faz |
|---|---|---|
| Service worker | `public/sw.js` | guarda a última resposta de cada página visitada e a devolve sem rede |
| Fila de escrita | `src/lib/offline/fila.ts` | IndexedDB; guarda o que foi digitado sem sinal |
| Reenvio | `src/lib/offline/sincronizar.ts` | esvazia a fila ao voltar a rede, em ordem de registro |

A interface vive em `src/components/offline/`: `ProvedorSincronizacao` (no
layout, para sobreviver à troca de aba), `IndicadorSync` (o chip do cabeçalho
da Hoje), `PainelPendentes` (o estado `2h`) e `useEnvioOffline` (o gancho que
cada formulário usa).

Vinte e quatro tipos de escrita entram na fila (`TipoEscrita` em `fila.ts`),
das posturas às configurações do criatório. Três escritas ficam **de fora** de
propósito: convidar membro, cancelar convite e remover membro — dependem de o
servidor conhecer o e-mail, e guardá-las no aparelho só adiaria a descoberta de
que ele está errado. São também as únicas que não acontecem no galpão.
As de edição e as de desfazer não precisam de chave própria: gravar os mesmos
valores duas vezes dá o mesmo resultado, e as funções do banco ignoram em
silêncio o que já está aplicado. **Cada tipo novo precisa de três
coisas**: entrar no union, ganhar executor em `EXECUTORES` (`Sincronizacao.tsx`)
e provar a própria idempotência — ou por chave gerada no cliente, ou porque a
função do banco reconhece o que já está gravado.

### Decisões que não são óbvias

- **Service worker escrito à mão, sem Serwist.** O plugin do Serwist é de
  webpack e o Next 16 usa Turbopack por padrão (serwist/serwist#54). Tirar o
  build inteiro do Turbopack por um plugin custaria mais que 120 linhas de SW —
  e o que este app precisa não é precache de shell estático (toda rota é
  dinâmica e exige sessão), é reabrir o que já foi visto.
- **Escrita nunca passa por cache.** Uma Server Action respondida do cache
  diria "salvo" sem ter salvo nada.
- **A fila guarda intenção, não requisição.** Ela tem os campos do formulário,
  não o payload HTTP da Server Action — que carrega um identificador que muda a
  cada build e faria o reenvio falhar depois de um deploy. O reenvio chama a
  ação diretamente. `$ACTION_*` é filtrado na hora de enfileirar.
- **Idempotência por chave gerada no cliente.** Cada formulário gera o UUID que
  vira a chave primária da linha. No reenvio a ação bate na chave e reconhece a
  escrita como já aplicada. O anilhamento é a exceção: `anilhar_filhotes` já
  recusa filhote anilhado, e o reenvio lê a recusa como sucesso.
- **`reenvio=1` suprime o `redirect`.** Sem isso, esvaziar a fila em segundo
  plano arrastava o criador para a tela de destino da escrita — ele podia estar
  no meio de outra coisa quando o sinal voltou.
- **Ordem de registro é ordem de envio**, e erro de rede interrompe a rodada:
  anilhar um filhote antes de cadastrar o casal que o gerou falharia. Erro de
  **dado** não interrompe — é de outro registro e não melhora com o tempo, então
  fica parado com o motivo à vista.
- **`/sw.js` e `/offline` ficam fora do middleware de sessão.** Um service
  worker que recebe redirect de login nunca registra, e a tela de recurso
  aparece justamente quando não há servidor alcançável.

### Verificado no Chrome, com o servidor derrubado

1. o service worker registra, ativa e assume a página;
2. telas já visitadas abrem inteiras do cache — inclusive as que o Next
   prefetchou sozinho, como os destinos da tab bar;
3. rota nunca visitada cai em `/offline`.

A fila foi verificada à parte: postura registrada sem sinal ficou guardada sem
tocar o banco, subiu sozinha quando o sinal voltou, e reenviar o mesmo item não
criou duplicata.

### A tela `/offline` não usa tokens, e é de propósito

É a única do produto com estilo embutido e ícone SVG inline. Ela aparece quando
a rota pedida nunca foi visitada **e** não há rede — e nesse momento a folha de
estilo do build, um arquivo com hash que talvez nunca tenha sido baixado,
também não carrega. Com CSS Module ela chegava sem estilo nenhum.

Os cinco valores são cópia literal de `tokens/colors.css`. **Se a paleta mudar
lá, mude aqui.**

### `VERSAO` no service worker

Subir ao mudar `/offline` ou a estratégia de cache: o navegador só reinstala o
SW quando o arquivo muda em bytes, e `/offline` é guardado no `install`. Deploy
que não toca em nenhum dos dois não precisa — as páginas normais são
rede-primeiro e se renovam sozinhas.

## Pendências do cliente

**Resolvidas em 30/09/2026** (`0012`): siglas dos 4 clubes (CAC, SOB, ASSB,
COSB) e os prazos `dias_anilha = 3` com `janela_anilha_dias = 1` ("anilhar com
3 dias até 4") e `dias_separa = 40`, nas 60 espécies.

**Em aberto:**

1. **`dias_choco` de 32 das 60 espécies.** O cliente enviou a incubação de 28.
   Sem ela a espécie não pode ser adotada no criatório, porque é o prazo que
   move todo o ciclo do ovo.
2. **Prazo de anilhamento por porte.** Os 3 dias vieram como valor único. Um
   coleiro e uma graúna não anilham no mesmo dia; os maiores (sabiás,
   icterídeos) anilham mais tarde. Revisar espécie a espécie.
3. **Formato da anilha.** O handoff usa dois: `SOV 1234 · 2026 · 0087` no
   componente e `COBP-25-04781` nos formulários. Modelado de forma flexível
   (anilha estruturada + `codigo_alternativo`), sem travar a decisão.

**Ponto a alinhar:** as 60 espécies são passeriformes silvestres brasileiros
(SISPASS/IBAMA), os clubes são majoritariamente de canaricultura, e as telas do
design usam "Agapornis Roseicollis", psitacídeo exótico. Três regimes legais
diferentes — muda conteúdo de tela e talvez validação de anilha.

**Segurança:** as chaves do Supabase passaram pelo chat; recomendado rotacionar
em Settings → API. O repositório é público por decisão do cliente, avisado do
risco.

---

## O que o handoff de design não cobre

O `MANIFEST.md` do handoff declara as ausências; a lista está em
**"O que falta", item 4**. Construir na linguagem das telas existentes.

Duas que já foram feitas assim e servem de referência: o onboarding de
criatório (`/comecar`) e as quatro telas de escrita.

## Semente de desenvolvimento

```bash
node scripts/usuario-teste.mjs criar                      # conta confirmada
# fazer o onboarding na interface, então:
node scripts/sql.mjs -f supabase/seeds/desenvolvimento.sql
```

Cria 11 aves com genealogia, 3 casais e ninhadas em **cada** estado do ciclo.

A semente grava `data_eclosao` direto, e é por isso que a tela de anilhamento
sempre teve o que anilhar no desenvolvimento. **Foi essa conveniência que
escondeu, por três fases, o fato de nenhuma tela escrever a data** — ver a
correção de registro em "Próximo passo". Hoje a conferência da ninhada escreve,
e a semente apenas poupa a digitação.

O banco de desenvolvimento tem também o que foi criado à mão ao verificar as
telas de escrita: a ninhada 06 do Casal 03 (B9), a ave Carijó `0090`, o Casal 13
(Tibiriçá × Iracema) e os filhotes anilhados `0091` Guaratuba e `0092`. A
ninhada 06 também traz a primeira conferência registrada pela interface: dois
ovos nascidos, um claro e um perdido com motivo. Rodar a semente de novo limpa e
recria tudo. A ave Aratu `0012` está **vendida**, com o casal 07 encerrado e a
receita lançada — é o exemplo da tela de saída.

**Guaratuba `0091` é o melhor caso para conferir a B6:** Jacundá aparece como
avô paterno e avô materno (ancestral repetido, 12,50%) e a avó materna é
desconhecida — o cenário exato da prancha `3c`. Jacundá `0001` serve para o
caso oposto, de ave sem nenhum ancestral.

As datas são relativas a `current_date`, calculadas dos prazos da própria
espécie — então a semente continua válida amanhã, e sempre há o que ver na
tela "Hoje". É idempotente: apaga o que semeou antes e recria.

## Autenticação e onboarding

- Sessão renovada no `middleware`, que chama `getUser()` — ele revalida o token
  no servidor do Supabase. Ler a sessão do cookie sem validar aceitaria cookie
  forjado.
- `service_role` **nunca** no cliente nem em Server Component: só migrations,
  testes e `scripts/`. Os clientes de app usam a chave anônima, com RLS valendo.
- O criatório é pré-requisito de tudo: `/` manda para `/comecar` enquanto não
  existir um.
- Conta de desenvolvimento: `node scripts/usuario-teste.mjs criar` cria
  `teste@sisaves.local` já confirmada. **A senha vem de `SENHA_USUARIO_TESTE`,
  no `.env.local`** — esteve escrita no script até 17/10/2026, num repositório
  público, e quem achasse o repositório entrava numa conta do projeto Supabase
  de verdade. O histórico do git guarda a senha antiga para sempre, então a
  conta foi rotacionada junto: `criar` numa conta existente agora **troca a
  senha** em vez de recriar.
- **`criar` não recria mais a conta, e isso evitou um estrago.**
  `criatorios.owner_id` é `ON DELETE RESTRICT`: a remoção era recusada pelo
  banco, o script ignorava a resposta e falhava depois com "email already
  registered". Se a restrição não existisse, recriar teria levado junto o
  criatório de desenvolvimento inteiro.
- **Node 22 é necessário.** `@supabase/supabase-js` exige WebSocket nativo, que
  o Node 20 não tem; `scripts/usuario-teste.mjs` usa `fetch` direto na API
  administrativa para contornar. Subir a versão resolve.

## Armadilhas já encontradas

- `sed` do macOS não suporta `\b`. Um rename passou pela metade sem avisar. Usar
  `perl -pi -e`.
- Postgres admite **uma só referência recursiva por CTE**. Pai e mãe precisam
  sair de um `lateral`, não de dois ramos `union all`.
- `ThemeScript` grava `data-theme` antes da hidratação, então `<html>` precisa de
  `suppressHydrationWarning`.
- O buffer de console do navegador não é limpo pelo parâmetro `clear` — erro
  antigo reaparece e parece atual. Conferir o conteúdo antes de concluir.
- A moldura do screenshot muda de tamanho entre chamadas; clique por referência
  de elemento, não por coordenada guardada.
- Em página de demonstração há **vários** elementos com o mesmo texto. Ao testar
  por seletor de texto, filtrar pelo contexto certo.
- **PostgREST não resolve relação auto-referente.** Com dica de constraint dá
  `PGRST200`; com dica de coluna inverte a direção e devolve os filhos em vez do
  pai. Pai e mãe vêm de consulta própria por id — ver `obterAve`.
- `base.css` sublinha todo `<a>`. Link que embrulha uma linha inteira precisa de
  `text-decoration: none`, senão nome, anilha e idade saem todos riscados.
- Engolir o `error` do Supabase (`if (error || !data) return null`) transforma
  falha de consulta em "não encontrado". Registrar o erro antes de desistir.
- Fixture de teste não pode usar e-mail que exista de verdade no banco: a conta
  de desenvolvimento derrubou o teste de endogamia. Usar `.invalid`.
- Texto fora do cartão branco, sobre o fundo petróleo, precisa de cor clara. O
  rodapé do login saiu com 1,38:1 por usar o cinza do cartão.
- **`db.<ref>.supabase.co` só resolve em IPv6.** Sem rota IPv6 na máquina, o
  Node devolve `ENOTFOUND` e parece que o banco caiu. `scripts/sql.mjs` conecta
  pelo pooler (`aws-0-us-east-2.pooler.supabase.com`, usuário
  `postgres.<ref>`), que tem IPv4 e, em modo sessão na 5432, aceita DDL e
  transação. A região não se deduz do ref — descobre-se tentando.
- `fieldset` nasce com `min-inline-size: min-content` e ignora a largura do pai:
  grade de duas colunas dentro dele vaza para fora da tela. Zerar.
- `legend` fica fora do fluxo flex, então o `gap` do grupo não vale para ele.
  Precisa de `margin-bottom` próprio.
- Esconder controle com `opacity: 0` + `pointer-events: none` tira ele da
  árvore de acessibilidade. Use `clip-path: inset(50%)` (está em
  `.visually-hidden`, no `globals.css`).
- Screenshot tirado logo depois de trocar o tema pega a transição no meio e
  parece defeito de cor. Esperar, ou conferir o valor computado.
- Peso e qualquer decimal chegam com vírgula do teclado pt-BR. `z.coerce.number()`
  lê `NaN` — normalizar antes de validar.
- **Dois componentes no mesmo módulo CSS colidem em nomes genéricos**
  (`.linha`, `.cabecalho`, `.miniatura`), e a regra posterior vence — inclusive
  anulando um `display: none` de media query. Um módulo por componente.
- **Função não atravessa a fronteira Server → Client Component.** Passe o
  resultado, não o cálculo: os links de ordenação da tabela vão como dados.
- **Nome de constraint não segue sempre a convenção do PostgREST.** O FK de
  `passaros.postura_id` chama-se `passaros_postura_fk`, não `_id_fkey`; errar a
  dica dá `PGRST200`. Conferir em `pg_constraint` antes de escrever o embed.
- `npx prettier` sem configuração no projeto reformata o arquivo inteiro com os
  padrões dele (80 colunas) e enterra a mudança real no ruído. **Não há
  `.prettierrc` aqui** — editar à mão e deixar o `eslint` julgar.
- **Campo obrigatório vazio falha no tipo base do Zod, antes da regra
  específica.** `z.string().regex(..., "mensagem")` com valor nulo devolve
  "Invalid input: expected string, received null", em inglês, na cara do
  criador. A mensagem tem de estar no tipo base: `z.string({ error: "..." })`.
- **O navegador embutido deste ambiente bloqueia service worker.**
  `register()` falha com "unknown error when fetching the script" mesmo com o
  arquivo servindo 200 e a página conseguindo buscá-lo. Não é defeito do código
  — mas também não serve como verificação.
- O middleware de sessão pega tudo o que não for estático, inclusive `/sw.js`.
  Arquivo que o navegador busca sem contexto de sessão precisa ficar de fora do
  `matcher`, senão recebe redirect de login.
- `fieldset` e `legend` já apareceram aqui; na árvore o problema equivalente é o
  `grid` com altura fixa. `space-around` só põe os centros em 12,5/37,5/62,5/87,5%
  se os itens tiverem a mesma altura — rótulo dentro do nó quebra a geometria dos
  conectores. A posição foi para dentro do nó vazio, onde ela também informa mais.
