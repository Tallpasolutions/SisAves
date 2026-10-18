# SisAves

Sistema de gestão de criatórios de aves ornamentais: plantel, casais, ciclo do
ovo, genealogia com coeficiente de endogamia, financeiro, saúde do plantel e
emissão de CRO com validação por QR Code.

Em construção. O estado detalhado — fases, o que está verificado, **o
inventário completo do que falta**, pendências e armadilhas — fica em
**[`docs/ESTADO.md`](docs/ESTADO.md)**, que é o primeiro arquivo a ler.

O ciclo do ovo fecha pela interface — postura, ovoscopia, eclosão, anilhamento,
separação e perda — e a ave sai do plantel por venda, doação, empréstimo, óbito
ou fuga. Ave e casal se editam, o casal se encerra, o ovo passa para outro
casal chocar, e o que entrou errado se corrige ou se apaga. Espécies, prazos,
configurações do criatório, membros, relatórios e notificações também já têm
tela, e o CRO se emite com QR real e página pública de validação. O
financeiro lança receita e despesa com saldo por mês, e a saúde registra
tratamentos com carência calculada do fim da aplicação. O próximo passo é a
Fase 10: assinatura com Mercado Pago.

## Começando

```bash
pnpm install
cp .env.example .env.local     # preencher com as chaves do Supabase
pnpm dev
```

Para ter dados com que trabalhar, há uma conta de desenvolvimento e uma semente:

```bash
node scripts/usuario-teste.mjs criar                    # conta já confirmada
                                                       # (senha em SENHA_USUARIO_TESTE)
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
| `/plantel/[id]/editar` | corrigir os dados da ave |
| `/plantel/[id]/pesagens` | registrar e acompanhar o peso |
| `/plantel/[id]/saida` | registrar venda, doação, empréstimo, óbito ou fuga |
| `/plantel/[id]/genealogia` | árvore de três gerações |
| `/casais` · `/casais/[id]` | lista e ficha do casal, com endogamia |
| `/casais/novo` | formar casal |
| `/casais/etiquetas` | catálogo de etiquetas |
| `/casais/[id]/editar` | corrigir o casal e encerrá-lo |
| `/casais/[id]/postura` | registrar postura |
| `/ovos` | ciclo do ovo, por estado |
| `/ovos/[ninhada]` | a ninhada ovo por ovo — conferir o ninho e marcar o que mudou |
| `/ovos/[ninhada]/transferir` | passar ovos para outro casal chocar |
| `/ovos/[ninhada]/corrigir` | mudar a data de um marco, ou desfazê-lo |
| `/ovos/[ninhada]/anilhar` | anilhar filhotes |
| `/especies` | espécies adotadas e os prazos do ciclo |
| `/configuracoes` · `/configuracoes/membros` · `/perfil` | criatório, membros e você |
| `/relatorios` | temporadas e desempenho por casal |
| `/notificacoes` | os avisos do galpão |
| `/certificados` · `/certificados/novo` | CRO emitidos, e o editor com prévia A4 |
| `/cro/[id]` | a folha A4, pronta para imprimir |
| `/v/<codigo>` | validação pública do certificado (anônima) |
| `/mais` | o menu do celular |
| `/painel` | painel do criatório (só no desktop) |
| `/entrar` · `/cadastrar` · `/comecar` | autenticação e onboarding |
| `/ds` | biblioteca de componentes, para conferência visual |

As subrotas `/plantel/[id]/certificado` e `/pesagens` ainda são vazios honestos,
para os atalhos da ficha não darem 404 antes das fases 8 e 9.

Acima de 1024px as mesmas rotas servem a Faixa C: sidebar, top bar, e o plantel
em tabela com filtros laterais e seleção em lote.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · CSS Modules · Supabase
(Postgres + Auth + Storage + RLS) · Vercel · Cloudflare

## Estrutura

```
src/
  app/              rotas
  components/ui/    os 16 componentes da biblioteca
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
scripts/testar.mjs  roda os testes de banco
```

## Banco

Não há Docker nesta máquina, então as migrations vão direto ao projeto remoto.
O runner conecta pelo **pooler**: o host direto `db.<ref>.supabase.co` só
resolve em IPv6 e devolve `ENOTFOUND` em máquina sem rota IPv6.

```bash
node scripts/sql.mjs -f supabase/migrations/0031_previa_do_cro.sql
node scripts/sql.mjs "select 1"                        # consulta avulsa
```

Depois de qualquer migration, rodar os testes:

```bash
node scripts/testar.mjs
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
