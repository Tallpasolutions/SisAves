# Estado do projeto

> **Leia este arquivo primeiro ao retomar o trabalho.** Ele diz o que já existe,
> o que está verificado, o que falta e o que depende de terceiros.
> Atualizado em **30/09/2026**.

## O produto em uma frase

SisAves é um SaaS de gestão de criatórios de aves ornamentais — plantel, casais,
ciclo do ovo, genealogia com coeficiente de endogamia, financeiro, saúde e
emissão de CRO com validação por QR. Reconstrução do zero de um sistema legado,
com marca nova, em `sisaves.tallpa.com.br`.

## Contratos que governam o trabalho

| Arquivo | O que manda |
|---|---|
| `CLAUDE.md` (raiz) | Contrato visual e de voz. Vem do handoff de design e vale para todo código de interface. Não é sugestão. |
| `docs/design/01-tokens.md` | Fonte de verdade das variáveis CSS. |
| `docs/design/02-componentes.md` | Contrato de cada componente: medidas, estados, cópia exata. |
| `docs/design/05-telas.md` | As 19 telas com as decisões de implementação. |
| `docs/design/artboards/*.dc.html` | As pranchas. Referência visual, não código de produção. |

**Regra que já foi violada uma vez:** nunca use valor cru da paleta
(`--sis-petroleo-100`) num componente — só alias semântico (`--text-brand`).
Valor cru não acompanha a troca de tema e o escuro quebra silenciosamente.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · **CSS Modules** · Supabase
(Postgres + Auth + Storage + RLS) · Vercel · Cloudflare · GitHub.

Ícones: **Lucide** (`lucide-react`), léxico fixo definido no `CLAUDE.md`.

## Fases

| Fase | Situação |
|---|---|
| 0 · Fundação do repositório | **concluída** |
| 1 · Banco de dados | **concluída** |
| 2 · Auth e onboarding | não iniciada |
| 3 · Biblioteca de componentes | **em andamento** |
| 4 · Núcleo mobile (Faixa B) | não iniciada |
| 5 · Genealogia (B6) | não iniciada |
| 6 · Offline (fila + cache) | não iniciada |
| 7 · Desktop (Faixa C) | não iniciada |
| 8 · CRO, QR e validação pública | banco pronto; interface não iniciada |
| 9 · Financeiro e saúde | banco pronto; interface não iniciada |
| 10 · Assinatura (Mercado Pago) | banco pronto; integração não iniciada |
| 11 · Landing e lançamento | não iniciada |

## Banco — o que existe e está verificado

**21 tabelas**, aplicadas no projeto Supabase `lisvevesopyrkviixwha`.

Migrations em `supabase/migrations/`:

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

### Testes de banco

Rodam contra o Postgres real (não há Docker na máquina). Cada um abre transação
e termina em `rollback`.

```bash
node scripts/sql.mjs -f supabase/tests/01_ciclo_do_ovo.sql      # 11/11
node scripts/sql.mjs -f supabase/tests/02_endogamia.sql          #  5/5
node scripts/sql.mjs -f supabase/tests/03_isolamento_rls.sql     #  8/8
node scripts/sql.mjs -f supabase/tests/04_certificado.sql        #  9/9
```

Toda linha deve sair com `resultado = ok`.

### Aplicar migrations

```bash
set -a; . ./.env.local; set +a
supabase db push --db-url "postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres"
```

### Conceitos do banco que não são óbvios

- **A situação da postura nunca é armazenada.** É derivada das datas observadas
  e dos prazos da espécie por `situacao_postura()`, que é `immutable` para o
  mesmo cálculo rodar no cliente offline. No legado era coluna gravada, e um ovo
  continuava "chocando" meses depois porque ninguém abriu a tela.
- **O tenant é o criatório**, não o usuário — permite mais de um criatório por
  pessoa e mais de uma pessoa operando o mesmo criatório.
- **RLS é a fronteira de segurança.** Toda política passa por
  `public.meus_criatorios()`, que é `security definer` para não recursar.
- **O certificado guarda `snapshot jsonb`.** A árvore muda quando o criador
  corrige uma filiação, mas um CRO emitido em 2026 tem de provar o que era
  verdade em 2026.
- **A validação pública do CRO é função, não tabela exposta.**
  `validar_certificado(hash, sequencial)` é lista branca explícita do que sai —
  com RLS na tabela, uma coluna nova vazaria por descuido.
- **`coeficiente_endogamia()` assume `F_A = 0`.** Decisão documentada na própria
  migration; irrelevante nas 3–4 gerações que um criatório registra.

## Pendências do cliente

**Resolvidas em 30/09/2026** (migration `0012_prazos_e_siglas`):
as siglas dos 4 clubes (CAC, SOB, ASSB, COSB) e os prazos
`dias_anilha = 3` com `janela_anilha_dias = 1` ("anilhar com 3 dias até 4") e
`dias_separa = 40`, aplicados às 60 espécies.

**Em aberto:**

1. **`dias_choco` de 32 das 60 espécies.** O cliente enviou a incubação de 28.
   Sem ela a espécie não pode ser adotada no criatório, porque é o prazo que
   move todo o ciclo do ovo.
2. **Prazo de anilhamento por porte.** O valor 3 dias veio único para as 60
   espécies. Um coleiro e uma graúna não anilham no mesmo dia — os maiores
   (sabiás, icterídeos) costumam anilhar mais tarde. Revisar espécie a espécie.
3. **Formato da anilha.** O handoff usa dois: `SOV 1234 · 2026 · 0087` no
   componente e `COBP-25-04781` nos formulários. Modelado de forma flexível
   (anilha estruturada + `codigo_alternativo`), sem travar a decisão.

Ponto a alinhar: as 60 espécies são **passeriformes silvestres brasileiros**
(SISPASS/IBAMA), os clubes são majoritariamente de **canaricultura**, e as telas
do design usam "Agapornis Roseicollis", psitacídeo exótico. Três regimes legais
diferentes — muda conteúdo de tela e talvez validação de anilha.

## O que o handoff de design não cobre

Saúde do plantel, Espécies e prazos, Relatórios, lista de Certificados,
Configurações, Perfil, onboarding de criatório, e o tema escuro das telas B3–B11
e C1–C3. Os tokens escuros existem; as pranchas não. Construir na linguagem das
telas existentes.

## Armadilhas já encontradas

- `sed` do macOS não suporta `\b`. Um rename passou pela metade sem avisar. Usar
  `perl -pi -e`.
- Postgres admite **uma só referência recursiva por CTE**. Pai e mãe precisam
  sair de um `lateral`, não de dois ramos `union all`.
- `ThemeScript` grava `data-theme` antes da hidratação, então `<html>` precisa de
  `suppressHydrationWarning`.
- O buffer de console do navegador não é limpo pelo parâmetro `clear` — erro
  antigo reaparece e parece atual. Conferir o conteúdo antes de concluir.
