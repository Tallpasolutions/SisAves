# Estado do projeto

> **Leia este arquivo primeiro ao retomar o trabalho.** Ele diz o que existe, o
> que está verificado, o que falta e o que depende de terceiros.
> Atualizado em **05/10/2026**, com a Fase 6 verificada em navegador real.

## O produto em uma frase

SisAves é um SaaS de gestão de criatórios de aves ornamentais — plantel, casais,
ciclo do ovo, genealogia com coeficiente de endogamia, financeiro, saúde e
emissão de CRO com validação por QR. Reconstrução do zero de um sistema legado
(Gestão Plantel / Meu Plantel, da Fênix Sites), com marca nova, em
`sisaves.tallpa.com.br`.

## Próximo passo

**Fase 7 — desktop (Faixa C).** Painel (`4a`), plantel em tabela (`4b`) e
editor de CRO (`4c`).

Até aqui o produto é inteiro mobile. A Faixa C é o outro contexto de uso do
contrato: *sentado no computador*, onde densidade de dados é requisito, não
descuido. Sidebar de 248px, top bar de 56px.

Três pontos de atenção registrados no handoff:

- **Gráficos são SVG à mão, não biblioteca.** O design proíbe escala
  multicolorida e usa só petróleo-200, petróleo-700 e tijolo vazado. Meses
  futuros em cinza.
- A grade do `4b` vem corrigida no handoff: fixos 703px + 9 gaps de 10px +
  20px de padding. Linhas de 44px, seleção múltipla com 4 ações em lote.
- O `4c` é painel de 340px + prévia A4 paisagem em tempo real — ele encosta na
  Fase 8 (CRO), mas a prévia pode vir antes da emissão.

## Onde está tudo

| | |
|---|---|
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
| 4 · Núcleo mobile (Faixa B) | **concluída**, incluídas as três telas de escrita (`7d4f435`, `f885075`, `f514dc5`) |
| 5 · Genealogia (B6) | **concluída** (`10c0800`) |
| 6 · Offline (fila + cache) | **concluída e verificada em navegador real** (`ec2288f`, `32eef1f`, `971774c`) |
| 7 · Desktop (Faixa C) | não iniciada |
| 8 · CRO, QR e validação pública | banco pronto; interface não iniciada |
| 9 · Financeiro e saúde | banco pronto; interface não iniciada |
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

### Funções do domínio

`situacao_postura` · `ancestrais` · `ancestrais_comuns` · `arvore_genealogica` ·
`coeficiente_endogamia` · `faixa_endogamia` · `montar_snapshot_certificado` ·
`validar_certificado` · `meus_criatorios` · `criatorio_com_acesso` ·
`casal_ativo` · `anilhar_filhotes`

### Testes de banco — 63 asserções, todas passando

```bash
for t in supabase/tests/0*.sql; do node scripts/sql.mjs -f "$t"; done
```

| Arquivo | Asserções |
|---|---|
| `01_ciclo_do_ovo` | 11 |
| `02_endogamia` | 5 |
| `03_isolamento_rls` | 8 |
| `04_certificado` | 9 |
| `05_perfil_automatico` | 7 |
| `06_anilhamento` | 12 |
| `07_arvore_genealogica` | 11 |

E-mails de fixture usam o TLD reservado `.invalid` com prefixo por arquivo —
os testes já quebraram por colidir com a conta de desenvolvimento.

Cada um abre transação e termina em `rollback`. Toda linha deve sair com
`resultado = ok`. **Rodar os sete depois de qualquer migration.**

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

## Interface — 15 componentes em `src/components/ui/`

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
| `/ovos` | B2 Ovos | pipeline com pílulas de estado; ninhada herda o estado mais urgente dos seus ovos |
| `/plantel` | B5 Plantel | busca por anilha ou nome (GET, sem JavaScript) e 4 filtros |
| `/plantel/[id]` | B3 Ficha da ave | anilha em destaque, filiação clicável, 3 atalhos |
| `/casais` | B7 Casais | par com anilhas, ninhada atual, ovos ativos e endogamia por faixa |
| `/casais/[id]` | B8 Ficha do casal | `InbreedingMeter` com explicação vinda de `ancestrais_comuns`, histórico de ninhadas |
| `/casais/[id]/postura` | B9 Registrar postura | **primeira tela de escrita**: Server Action + Zod, previsões ao vivo, tab bar escondida |
| `/plantel/nova` | Cadastrar ave | não desenhada; sugestão de anilha como botão, filiação só quando a ave nasceu no criatório |
| `/casais/novo` | Formar casal | não desenhada; endogamia consultada ao completar o par, **antes** de confirmar |
| `/ovos/[ninhada]/anilhar` | Anilhar filhote | não desenhada; um bloco por filhote, numeração em sequência por botão, anilhamento parcial permitido |
| `/plantel/[id]/genealogia` | B6 Árvore genealógica | três gerações em rolagem horizontal; aviso de ancestral repetido no topo; cabeçalho petróleo de borda a borda e legenda fixa no rodapé |
| `/entrar`, `/cadastrar`, `/recuperar-senha`, `/nova-senha` | B4 e derivadas | cartão sempre claro sobre o petróleo |
| `/comecar`, `/comecar/especies` | onboarding | não desenhado; feito na linguagem das demais |
| `/ds` | biblioteca | referência do artboard A3; sai antes do lançamento |

As subrotas `/plantel/[id]/certificado` e `/pesagens` ainda existem como vazio
honesto, para os atalhos da ficha não darem 404 antes das fases 8 e 9.

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

Saúde do plantel, Espécies e prazos, Relatórios, lista de Certificados,
Configurações, Perfil, onboarding de criatório, e o tema escuro das telas B3–B11
e C1–C3. Os tokens escuros existem; as pranchas não. Construir na linguagem das
telas existentes.

**O tema escuro não ficou de fora por falta de prancha.** Toda tela construída
até aqui foi conferida nos dois temas, com varredura de contraste sobre o CSS
computado. O que falta são os desenhos, não a implementação.

## Semente de desenvolvimento

```bash
node scripts/usuario-teste.mjs criar                      # conta confirmada
# fazer o onboarding na interface, então:
node scripts/sql.mjs -f supabase/seeds/desenvolvimento.sql
```

Cria 11 aves com genealogia, 3 casais e ninhadas em **cada** estado do ciclo.

O banco de desenvolvimento tem também o que foi criado à mão ao verificar as
telas de escrita: a ninhada 06 do Casal 03 (B9), a ave Carijó `0090`, o Casal 13
(Tibiriçá × Iracema) e os filhotes anilhados `0091` Guaratuba e `0092`. Rodar a
semente de novo limpa e recria tudo.

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
  `teste@sisaves.local` já confirmada (senha no próprio script). `limpar` remove.
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
