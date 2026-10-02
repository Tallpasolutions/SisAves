# SisAves

Sistema de gestão de criatórios de aves ornamentais: plantel, casais, ciclo do
ovo, genealogia com coeficiente de endogamia, financeiro, saúde do plantel e
emissão de CRO com validação por QR Code.

Em construção. O estado detalhado — fases, o que está verificado, pendências e
armadilhas — fica em **[`docs/ESTADO.md`](docs/ESTADO.md)**, que é o primeiro
arquivo a ler.

## Começando

```bash
pnpm install
cp .env.example .env.local     # preencher com as chaves do Supabase
pnpm dev
```

Para ter dados com que trabalhar, há uma conta de desenvolvimento e uma semente:

```bash
node scripts/usuario-teste.mjs criar                    # conta já confirmada
# fazer o onboarding do criatório na interface, então:
node scripts/sql.mjs -f supabase/seeds/desenvolvimento.sql
```

A semente cria 11 aves com genealogia, 3 casais e ninhadas em cada estado do
ciclo do ovo, com datas relativas a hoje — então sempre há o que ver na tela
"Hoje". É idempotente: apaga o que semeou antes e recria.

## Rotas

| Rota | O que é |
|---|---|
| `/` | Hoje — as tarefas do galpão, agrupadas por ninhada |
| `/plantel` · `/plantel/[id]` | lista e ficha da ave |
| `/plantel/nova` | cadastrar ave |
| `/plantel/[id]/genealogia` | árvore de três gerações |
| `/casais` · `/casais/[id]` | lista e ficha do casal, com endogamia |
| `/casais/novo` | formar casal |
| `/casais/[id]/postura` | registrar postura |
| `/ovos` | ciclo do ovo, por estado |
| `/ovos/[ninhada]/anilhar` | anilhar filhotes |
| `/entrar` · `/cadastrar` · `/comecar` | autenticação e onboarding |
| `/ds` | biblioteca de componentes, para conferência visual |

As subrotas `/plantel/[id]/certificado` e `/pesagens` ainda são vazios honestos,
para os atalhos da ficha não darem 404 antes das fases 8 e 9.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · CSS Modules · Supabase
(Postgres + Auth + Storage + RLS) · Vercel · Cloudflare

## Estrutura

```
src/
  app/              rotas
  components/ui/    os 15 componentes da biblioteca
  lib/dados/        camada de leitura, por área do domínio
  lib/              formatação pt-BR e utilitários
  styles/tokens/    tokens de design, portados sem edição do handoff
supabase/
  migrations/       schema, funções e RLS
  seeds/            semente de desenvolvimento
  tests/            testes SQL contra o banco real
docs/
  ESTADO.md         estado do projeto
  design/           handoff de design e pranchas
scripts/sql.mjs     runner de SQL
```

## Banco

Não há Docker nesta máquina, então as migrations vão direto ao projeto remoto.
O runner conecta pelo **pooler**: o host direto `db.<ref>.supabase.co` só
resolve em IPv6 e devolve `ENOTFOUND` em máquina sem rota IPv6.

```bash
node scripts/sql.mjs -f supabase/migrations/0015_arvore_com_caminho.sql
node scripts/sql.mjs "select 1"                        # consulta avulsa
```

Depois de qualquer migration, rodar os sete testes — toda linha deve sair com
`resultado = ok`:

```bash
for t in supabase/tests/0*.sql; do node scripts/sql.mjs -f "$t"; done
```

Cada teste abre uma transação e termina em `rollback`, então rodar contra o
banco de desenvolvimento não deixa resíduo.

## Design

[`CLAUDE.md`](CLAUDE.md) na raiz é o contrato visual e de voz: paleta fechada,
tipografia, regras de acessibilidade e vocabulário do domínio. Vale para todo
código de interface e não é sugestão.

Os tokens em `src/styles/tokens/` são cópia intacta do handoff — para ajustar um
valor, redefina o alias em `src/app/globals.css` e registre o motivo.

`data-theme="dark"` é obrigatório, não opcional: eclosões acontecem de
madrugada. Conferir toda tela nos dois temas antes de dar por pronta.
