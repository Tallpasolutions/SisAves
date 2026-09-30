-- =============================================================================
-- SisAves · 0007 · Saúde do plantel e financeiro
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Saúde: sintomas, doenças e medicamentos
-- -----------------------------------------------------------------------------
create table public.sintomas (
  id           uuid primary key default gen_random_uuid(),
  criatorio_id uuid references public.criatorios(id) on delete cascade,
  nome         text not null,
  descricao    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create table public.doencas (
  id           uuid primary key default gen_random_uuid(),
  criatorio_id uuid references public.criatorios(id) on delete cascade,
  nome         text not null,
  descricao    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create table public.medicamentos (
  id               uuid primary key default gen_random_uuid(),
  criatorio_id     uuid references public.criatorios(id) on delete cascade,
  nome             text not null,
  principio_ativo  text,
  dosagem          text,
  carencia_dias    smallint check (carencia_dias >= 0),
  observacoes      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

-- criatorio_id nulo = item de catálogo, compartilhado (mesma convenção de mutacoes).
create unique index sintomas_nome_unico on public.sintomas
  (coalesce(criatorio_id,'00000000-0000-0000-0000-000000000000'::uuid), lower(nome))
  where deleted_at is null;
create unique index doencas_nome_unico on public.doencas
  (coalesce(criatorio_id,'00000000-0000-0000-0000-000000000000'::uuid), lower(nome))
  where deleted_at is null;
create unique index medicamentos_nome_unico on public.medicamentos
  (coalesce(criatorio_id,'00000000-0000-0000-0000-000000000000'::uuid), lower(nome))
  where deleted_at is null;

create table public.doenca_sintomas (
  doenca_id  uuid not null references public.doencas(id) on delete cascade,
  sintoma_id uuid not null references public.sintomas(id) on delete cascade,
  primary key (doenca_id, sintoma_id)
);

create table public.medicamento_doencas (
  medicamento_id uuid not null references public.medicamentos(id) on delete cascade,
  doenca_id      uuid not null references public.doencas(id) on delete cascade,
  primary key (medicamento_id, doenca_id)
);

-- -----------------------------------------------------------------------------
-- Tratamentos aplicados
-- -----------------------------------------------------------------------------
-- Ausente no legado, que só catalogava medicamentos sem registrar aplicação.
-- Sem isto não há histórico sanitário da ave nem controle de carência.
create table public.tratamentos (
  id             uuid primary key default gen_random_uuid(),
  criatorio_id   uuid not null references public.criatorios(id) on delete cascade,
  passaro_id     uuid references public.passaros(id) on delete cascade,
  casal_id       uuid references public.casais(id) on delete cascade,
  medicamento_id uuid references public.medicamentos(id) on delete set null,
  doenca_id      uuid references public.doencas(id) on delete set null,
  inicio         date not null default current_date,
  fim            date,
  dosagem        text,
  observacoes    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,

  constraint tratamentos_alvo check (passaro_id is not null or casal_id is not null),
  constraint tratamentos_periodo check (fim is null or fim >= inicio)
);

create index on public.tratamentos (criatorio_id, passaro_id) where deleted_at is null;

-- -----------------------------------------------------------------------------
-- Financeiro
-- -----------------------------------------------------------------------------
create table public.financeiro_categorias (
  id           uuid primary key default gen_random_uuid(),
  criatorio_id uuid references public.criatorios(id) on delete cascade,
  chave        text,                    -- preenchida só nas categorias de sistema
  nome         text not null,
  tipo         tipo_lancamento not null,
  icone        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,

  -- Categoria de sistema não tem dono; a customizada tem.
  constraint financeiro_categorias_escopo check (
    (criatorio_id is null and chave is not null) or
    (criatorio_id is not null and chave is null)
  )
);

create unique index financeiro_categorias_chave_unica
  on public.financeiro_categorias (chave) where chave is not null;
create unique index financeiro_categorias_nome_unico
  on public.financeiro_categorias (criatorio_id, lower(nome))
  where criatorio_id is not null and deleted_at is null;

create table public.financeiro_lancamentos (
  id           uuid primary key default gen_random_uuid(),
  criatorio_id uuid not null references public.criatorios(id) on delete cascade,
  tipo         tipo_lancamento not null,
  categoria_id uuid references public.financeiro_categorias(id) on delete set null,
  -- numeric, nunca float: dinheiro não admite erro de arredondamento binário,
  -- e o design proíbe arredondar valor financeiro na exibição.
  valor        numeric(12,2) not null check (valor > 0),
  data         date not null default current_date,
  descricao    text,
  passaro_id   uuid references public.passaros(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index on public.financeiro_lancamentos (criatorio_id, data desc) where deleted_at is null;
create index on public.financeiro_lancamentos (criatorio_id, tipo, data desc) where deleted_at is null;
create index on public.financeiro_lancamentos (passaro_id) where deleted_at is null;

comment on column public.financeiro_lancamentos.valor is
  'Sempre positivo. O sinal vem de tipo (receita/despesa) — evita lançamento negativo ambíguo.';

create trigger sintomas_updated_at     before update on public.sintomas     for each row execute function public.tg_set_updated_at();
create trigger doencas_updated_at      before update on public.doencas      for each row execute function public.tg_set_updated_at();
create trigger medicamentos_updated_at before update on public.medicamentos for each row execute function public.tg_set_updated_at();
create trigger tratamentos_updated_at  before update on public.tratamentos  for each row execute function public.tg_set_updated_at();
create trigger financeiro_categorias_updated_at  before update on public.financeiro_categorias  for each row execute function public.tg_set_updated_at();
create trigger financeiro_lancamentos_updated_at before update on public.financeiro_lancamentos for each row execute function public.tg_set_updated_at();

-- Categorias de sistema (as do legado, mantidas para a migração de dados).
insert into public.financeiro_categorias (chave, nome, tipo, icone) values
  ('venda_passaro',  'Venda de ave',    'receita', 'Bird'),
  ('receita_avulsa', 'Receita avulsa',  'receita', 'Wallet'),
  ('compra_passaro', 'Compra de ave',   'despesa', 'Bird'),
  ('despesa_geral',  'Despesa geral',   'despesa', 'Wallet');
