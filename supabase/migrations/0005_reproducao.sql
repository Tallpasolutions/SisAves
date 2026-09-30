-- =============================================================================
-- SisAves · 0005 · Reprodução: casais, ninhadas e posturas
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Etiquetas de casal
-- -----------------------------------------------------------------------------
create table public.casal_tags (
  id           uuid primary key default gen_random_uuid(),
  criatorio_id uuid not null references public.criatorios(id) on delete cascade,
  nome         text not null,
  cor          text not null default '#0B5D5E' check (cor ~ '^#[0-9A-Fa-f]{6}$'),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (criatorio_id, nome)
);

-- -----------------------------------------------------------------------------
-- Casais
-- -----------------------------------------------------------------------------
create table public.casais (
  id             uuid primary key default gen_random_uuid(),
  criatorio_id   uuid not null references public.criatorios(id) on delete cascade,
  numero         integer not null,
  macho_id       uuid references public.passaros(id) on delete set null,
  femea_id       uuid references public.passaros(id) on delete set null,
  gaiola         text,
  vigencia_inicio date not null default current_date,
  vigencia_fim    date,

  -- Fotografia do coeficiente de endogamia no momento da formação do casal.
  -- Guardado, e não só calculado sob demanda, porque a árvore muda com o tempo
  -- e o criador precisa saber o que ele sabia quando decidiu acasalar.
  endogamia_pct  numeric(5,2),
  observacoes    text,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,

  constraint casais_numero_positivo check (numero > 0),
  constraint casais_vigencia_coerente check (vigencia_fim is null or vigencia_fim >= vigencia_inicio),
  constraint casais_par_distinto check (macho_id is null or femea_id is null or macho_id <> femea_id)
);

create unique index casais_numero_unico
  on public.casais (criatorio_id, numero) where deleted_at is null;
create index on public.casais (criatorio_id) where deleted_at is null and vigencia_fim is null;
create index on public.casais (macho_id);
create index on public.casais (femea_id);

-- 'ativo' é derivado da vigência, nunca digitado — no legado era um booleano
-- solto que podia divergir das datas.
create or replace function public.casal_ativo(p_casal public.casais)
returns boolean language sql immutable as $$
  select p_casal.vigencia_fim is null or p_casal.vigencia_fim >= current_date;
$$;

create table public.casal_tag_vinculo (
  casal_id uuid not null references public.casais(id) on delete cascade,
  tag_id   uuid not null references public.casal_tags(id) on delete cascade,
  primary key (casal_id, tag_id)
);

-- -----------------------------------------------------------------------------
-- Ninhadas
-- -----------------------------------------------------------------------------
-- Novidade em relação ao legado: lá "nro_rodada" era um inteiro solto dentro da
-- postura. Promovê-la a entidade permite datar a ninhada, saber quantos ovos ela
-- teve, e calcular fertilidade por ninhada — métrica que o criador realmente usa.
--
-- O nome vem do contrato de vocabulário (CLAUDE.md): o criador diz "ninhada",
-- e todas as telas dizem "Ninhada 04". "Rodada" era herança do sistema antigo.
create table public.ninhadas (
  id           uuid primary key default gen_random_uuid(),
  criatorio_id uuid not null references public.criatorios(id) on delete cascade,
  casal_id     uuid not null references public.casais(id) on delete cascade,
  numero       smallint not null check (numero > 0),
  iniciada_em  date not null default current_date,
  encerrada_em date,
  observacoes  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  unique (casal_id, numero)
);

create index on public.ninhadas (criatorio_id, casal_id) where deleted_at is null;

-- -----------------------------------------------------------------------------
-- Posturas (os ovos)
-- -----------------------------------------------------------------------------
create table public.posturas (
  id            uuid primary key default gen_random_uuid(),
  criatorio_id  uuid not null references public.criatorios(id) on delete cascade,
  casal_id      uuid not null references public.casais(id) on delete cascade,
  ninhada_id     uuid references public.ninhadas(id) on delete set null,

  numero_ovo    smallint check (numero_ovo > 0),   -- posição do ovo no ninho
  data_postura  date not null,

  -- Marcos do ciclo. Cada um preenchido é um fato observado pelo criador;
  -- o estado atual é DERIVADO deles + os prazos da espécie (ver 0006).
  ovoscopia_em    date,
  fertil          boolean,
  data_eclosao    date,
  data_anilhamento date,
  data_separacao  date,

  -- Sobrepõe o cálculo automático quando o ovo/filhote se perde.
  desfecho        desfecho_postura,
  desfecho_motivo text,

  passaro_id    uuid references public.passaros(id) on delete set null,
  observacoes   text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,

  constraint posturas_eclosao_posterior   check (data_eclosao   is null or data_eclosao   >= data_postura),
  constraint posturas_ovoscopia_posterior check (ovoscopia_em   is null or ovoscopia_em   >= data_postura),
  constraint posturas_anilha_posterior    check (data_anilhamento is null or data_eclosao is null or data_anilhamento >= data_eclosao),
  constraint posturas_separacao_posterior check (data_separacao is null or data_eclosao is null or data_separacao >= data_eclosao),
  -- Um ovo declarado infértil não pode ter eclodido.
  constraint posturas_infertil_sem_eclosao check (desfecho is distinct from 'infertil' or data_eclosao is null)
);

create index on public.posturas (criatorio_id, casal_id) where deleted_at is null;
create index on public.posturas (ninhada_id) where deleted_at is null;
create index on public.posturas (criatorio_id, data_postura) where deleted_at is null;
create index on public.posturas (criatorio_id, updated_at);
create unique index posturas_passaro_unico on public.posturas (passaro_id) where passaro_id is not null and deleted_at is null;

comment on table public.posturas is
  'Cada ovo de uma ninhada. A situação atual NÃO é armazenada: é derivada das datas + prazos da espécie (ver função situacao_postura em 0006).';

-- Fecha a dependência circular passaros <-> posturas declarada em 0004.
alter table public.passaros
  add constraint passaros_postura_fk
  foreign key (postura_id) references public.posturas(id) on delete set null;

-- -----------------------------------------------------------------------------
-- Histórico de transferências de postura entre casais
-- -----------------------------------------------------------------------------
-- Prática real do galpão: ovo passado para "babá" chocar. O legado tinha
-- transferir/desfazer sem deixar rastro; aqui fica registrado.
create table public.postura_transferencias (
  id              uuid primary key default gen_random_uuid(),
  criatorio_id    uuid not null references public.criatorios(id) on delete cascade,
  postura_id      uuid not null references public.posturas(id) on delete cascade,
  casal_origem_id uuid not null references public.casais(id),
  casal_destino_id uuid not null references public.casais(id),
  motivo          text,
  transferida_em  timestamptz not null default now(),
  desfeita_em     timestamptz,
  created_at      timestamptz not null default now()
);

create index on public.postura_transferencias (postura_id);

create trigger casal_tags_updated_at before update on public.casal_tags for each row execute function public.tg_set_updated_at();
create trigger casais_updated_at     before update on public.casais     for each row execute function public.tg_set_updated_at();
create trigger ninhadas_updated_at    before update on public.ninhadas    for each row execute function public.tg_set_updated_at();
create trigger posturas_updated_at   before update on public.posturas   for each row execute function public.tg_set_updated_at();
