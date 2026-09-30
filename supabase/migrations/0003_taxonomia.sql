-- =============================================================================
-- SisAves · 0003 · Taxonomia: grupos, espécies e mutações
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Grupos taxonômicos (catálogo de sistema)
-- -----------------------------------------------------------------------------
create table public.grupos (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null unique,   -- ex.: 'Psitacídeos', 'Canários', 'Passeriformes'
  ordem      integer not null default 0,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Catálogo de espécies do sistema (semente compartilhada)
-- -----------------------------------------------------------------------------
-- Melhoria sobre o legado: lá cada usuário digitava a espécie do zero, gerando
-- "Agapornis roseicolis", "agapornis roseicollis", "Agaporni Roseicollis" como
-- registros distintos — o que inviabiliza qualquer estatística entre criatórios.
-- Aqui há um catálogo curado, e o criador apenas o adota (ou cria a sua).
create table public.especies_catalogo (
  id             uuid primary key default gen_random_uuid(),
  grupo_id       uuid not null references public.grupos(id),
  nome_comum     text not null,
  nome_cientifico text,
  dias_choco     smallint not null,
  dias_anilha    smallint not null,
  dias_separa    smallint not null,
  anilha_mm      numeric(3,1),          -- diâmetro oficial da anilha
  created_at     timestamptz not null default now(),
  unique (grupo_id, nome_comum)
);

comment on table public.especies_catalogo is
  'Catálogo curado de espécies com prazos de referência. O criador adota e pode ajustar os prazos no seu criatório.';

-- -----------------------------------------------------------------------------
-- Espécies do criatório
-- -----------------------------------------------------------------------------
create table public.especies (
  id             uuid primary key default gen_random_uuid(),
  criatorio_id   uuid not null references public.criatorios(id) on delete cascade,
  catalogo_id    uuid references public.especies_catalogo(id),
  grupo_id       uuid references public.grupos(id),
  nome           text not null,

  -- Os três prazos que dirigem toda a máquina de estados do ovo.
  dias_choco     smallint not null check (dias_choco between 1 and 120),
  dias_anilha    smallint not null check (dias_anilha between 1 and 120),
  dias_separa    smallint not null check (dias_separa between 1 and 365),

  -- Novo: a ovoscopia era implícita no legado (estado "Verificar" sem prazo próprio).
  dias_ovoscopia smallint not null default 6 check (dias_ovoscopia between 1 and 60),

  -- Janela de anilhamento: quantos dias após o prazo a anilha ainda entra.
  -- É a informação que impede a perda comercial do filhote.
  janela_anilha_dias smallint not null default 3 check (janela_anilha_dias between 1 and 30),

  anilha_mm      numeric(3,1),
  ativa          boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,

  constraint especies_prazos_coerentes check (dias_ovoscopia < dias_choco),
  unique (criatorio_id, nome)
);

create index on public.especies (criatorio_id) where deleted_at is null;

comment on column public.especies.janela_anilha_dias is
  'Quantos dias após dias_anilha a anilha ainda entra na perna. Define o fim do estado crítico "anilhar".';

-- -----------------------------------------------------------------------------
-- Mutações (variações genéticas / fenótipos)
-- -----------------------------------------------------------------------------
create table public.mutacoes (
  id           uuid primary key default gen_random_uuid(),
  criatorio_id uuid references public.criatorios(id) on delete cascade,
  especie_id   uuid references public.especies(id) on delete cascade,
  grupo_id     uuid references public.grupos(id),
  nome         text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,

  -- criatorio_id nulo = mutação de catálogo, visível a todos.
  constraint mutacoes_escopo check (
    (criatorio_id is null and grupo_id is not null) or criatorio_id is not null
  )
);

create index on public.mutacoes (criatorio_id, especie_id) where deleted_at is null;
create unique index mutacoes_nome_unico
  on public.mutacoes (coalesce(criatorio_id, '00000000-0000-0000-0000-000000000000'::uuid),
                      coalesce(especie_id,   '00000000-0000-0000-0000-000000000000'::uuid),
                      lower(nome))
  where deleted_at is null;

create trigger especies_updated_at before update on public.especies for each row execute function public.tg_set_updated_at();
create trigger mutacoes_updated_at before update on public.mutacoes for each row execute function public.tg_set_updated_at();
