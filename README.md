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

| Rota | O que é |
|---|---|
| `/` | provisória, sai na Fase 2 |
| `/ds` | biblioteca de componentes, para conferência visual |

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · CSS Modules · Supabase
(Postgres + Auth + Storage + RLS) · Vercel · Cloudflare

## Estrutura

```
src/
  app/              rotas
  components/ui/    os 14 componentes da biblioteca
  lib/              formatação pt-BR e utilitários
  styles/tokens/    tokens de design, portados sem edição do handoff
supabase/
  migrations/       schema, funções e RLS
  tests/            testes SQL contra o banco real
docs/
  ESTADO.md         estado do projeto
  design/           handoff de design e pranchas
scripts/sql.mjs     runner de SQL
```

## Banco

Não há Docker nesta máquina, então as migrations vão direto ao projeto remoto:

```bash
set -a; . ./.env.local; set +a
supabase db push --db-url "postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres"
```

Depois de qualquer migration, rodar os quatro testes — toda linha deve sair com
`resultado = ok`:

```bash
for t in supabase/tests/0*.sql; do node scripts/sql.mjs -f "$t"; done
```

## Design

[`CLAUDE.md`](CLAUDE.md) na raiz é o contrato visual e de voz: paleta fechada,
tipografia, regras de acessibilidade e vocabulário do domínio. Vale para todo
código de interface e não é sugestão.

Os tokens em `src/styles/tokens/` são cópia intacta do handoff — para ajustar um
valor, redefina o alias em `src/app/globals.css` e registre o motivo.
