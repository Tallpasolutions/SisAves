# Estado do projeto

> **Leia este arquivo primeiro ao retomar o trabalho.** Ele diz o que existe, o
> que está verificado, o que falta e o que depende de terceiros.
> Atualizado em **30/09/2026**, após a Fase 3.

## O produto em uma frase

SisAves é um SaaS de gestão de criatórios de aves ornamentais — plantel, casais,
ciclo do ovo, genealogia com coeficiente de endogamia, financeiro, saúde e
emissão de CRO com validação por QR. Reconstrução do zero de um sistema legado
(Gestão Plantel / Meu Plantel, da Fênix Sites), com marca nova, em
`sisaves.tallpa.com.br`.

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
set -a; . ./.env.local; set +a
supabase db push --db-url "postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres"
node scripts/sql.mjs "select 1"                            # consulta avulsa
node scripts/sql.mjs -f supabase/tests/01_ciclo_do_ovo.sql  # teste
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

A rota `/ds` reproduz o artboard A3 com os 14 componentes e a cópia exata do
handoff — é a conferência visual rápida. Abrir **nos dois temas**. Sai do app
antes do lançamento.

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
| 4 · Núcleo mobile (Faixa B) | **em andamento** — B1 Hoje, B5 Plantel e B3 Ficha prontos |
| 5 · Genealogia (B6) | não iniciada |
| 6 · Offline (fila + cache) | não iniciada |
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

### Funções do domínio

`situacao_postura` · `ancestrais` · `ancestrais_comuns` · `arvore_genealogica` ·
`coeficiente_endogamia` · `faixa_endogamia` · `montar_snapshot_certificado` ·
`validar_certificado` · `meus_criatorios` · `criatorio_com_acesso` ·
`casal_ativo`

### Testes de banco — 40 asserções, todas passando

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

E-mails de fixture usam o TLD reservado `.invalid` com prefixo por arquivo —
os testes já quebraram por colidir com a conta de desenvolvimento.

Cada um abre transação e termina em `rollback`. Toda linha deve sair com
`resultado = ok`. **Rodar os quatro depois de qualquer migration.**

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

---

## Interface — 14 componentes em `src/components/ui/`

| Componente | Observação de contrato |
|---|---|
| `Button` | 5 variantes × 4 estados. `accent` (âmbar) é no máximo um por tela, só com prazo vencendo. |
| `Anilha` | Identificador primário. Nunca reformatar. Diz "Sem anilha" em vez de sumir. |
| `Badge` | 6 chips do ciclo. `acao` (âmbar cheio) é separado de `atencao`: um convoca, o outro informa. |
| `SexChip` | `M`/`F`/`—` com `aria-label`. Sem unicode de gênero. Cor nunca é o único sinal. |
| `Field` + `Input` | Rótulo persistente; erro substitui a ajuda e cita o dado. Validar no blur e no envio. |
| `InbreedingMeter` | Faixas 6,25% / 12,5%. Mesma regra de `faixa_endogamia` no banco — mudar os dois juntos. |
| `BirdCard` | Vira `<button>` com `onClick`. **Sem** barra colorida à esquerda. |
| `Table` + `TableRow` | Faixa de gravidade de 3px: um dos dois únicos lugares com barra à esquerda. |
| `Tabs` | Contador só onde a contagem informa. |
| `Toast` | Fato + consequência com data. |
| `Modal` | `<dialog>` nativo: foco preso, Esc, devolução ao disparador. Corpo diz a consequência real. |
| `EmptyState` | Alinhado à esquerda, sem ilustração, sem emoji. |
| `SyncStatus` | Nunca sugere perda: "Offline — salvo no aparelho". |
| `NotificationBadge` | `pointer-events: none` — o alvo é o botão de 44px embaixo. |

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

---

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

## Semente de desenvolvimento

```bash
node scripts/usuario-teste.mjs criar                      # conta confirmada
# fazer o onboarding na interface, então:
node scripts/sql.mjs -f supabase/seeds/desenvolvimento.sql
```

Cria 11 aves com genealogia, 3 casais e ninhadas em **cada** estado do ciclo.
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
