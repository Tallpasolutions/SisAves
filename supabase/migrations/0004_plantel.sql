-- =============================================================================
-- SisAves · 0004 · Plantel: as aves
-- =============================================================================

create table public.passaros (
  id            uuid primary key default gen_random_uuid(),
  criatorio_id  uuid not null references public.criatorios(id) on delete cascade,

  -- ---------------------------------------------------------------------------
  -- Anilha (identificação oficial)
  -- ---------------------------------------------------------------------------
  -- Decisão: a anilha vive em colunas da própria ave, não em tabela separada
  -- como no legado. Ela é 1:1 com a ave, imutável na prática e consultada em
  -- toda listagem — separá-la só custaria um JOIN em cada tela.
  anilha_clube_id  uuid references public.clubes(id),
  anilha_sigla     text,        -- desnormalizado: o clube pode mudar de sigla, o anel não
  anilha_criador   text,
  anilha_ano       smallint check (anilha_ano between 1950 and 2200),
  anilha_numero    integer check (anilha_numero > 0),
  anilha_observacao text,       -- 'anilha aberta', 'remarcada', etc.

  -- Identificador alternativo (ex.: código COBP no formato COBP-25-04781).
  -- O handoff de design usa dois formatos de identificação e o cliente ainda
  -- não confirmou se são o mesmo dado. Enquanto isso, a anilha estruturada
  -- acima é a oficial e esta coluna acomoda o segundo código sem travar nada.
  codigo_alternativo text,

  -- O criador dá nome às aves ("Curió Tibiriçá") e é assim que ele as chama;
  -- o card de ave e o CRO exibem o nome ao lado da anilha.
  nome          text,

  especie_id    uuid references public.especies(id) on delete set null,
  mutacao_id    uuid references public.mutacoes(id) on delete set null,

  sexo          sexo_ave not null default 'indefinido',
  dt_nascimento date,
  dt_obito      date,
  situacao      situacao_ave not null default 'ativo',
  origem        origem_ave not null default 'nascimento_proprio',

  -- Genealogia: auto-relacionamento. É o que forma o banco genético.
  pai_id        uuid references public.passaros(id) on delete set null,
  mae_id        uuid references public.passaros(id) on delete set null,

  -- Quando a ave veio de fora, nem sempre há registro dos pais no sistema —
  -- guarda-se ao menos a descrição, como o legado fazia (descr_pai/descr_mae).
  pai_descricao text,
  mae_descricao text,

  postura_id    uuid,          -- FK adicionada em 0005 (dependência circular)
  portador      text,          -- criador/terceiro que está com a ave
  foto_url      text,
  cor           text,
  observacoes   text,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz,

  -- A ave não pode ser o próprio pai/mãe.
  constraint passaros_sem_autopai check (id <> pai_id and id <> mae_id),
  -- Anilha: ou está completa, ou está ausente (ave ainda não anilhada).
  constraint passaros_anilha_completa check (
    (anilha_ano is null and anilha_numero is null)
    or (anilha_ano is not null and anilha_numero is not null)
  ),
  constraint passaros_obito_posterior check (dt_obito is null or dt_nascimento is null or dt_obito >= dt_nascimento)
);

-- A anilha é única dentro do clube+criador+ano. Esta constraint é a proteção
-- contra o erro mais caro do domínio: duas aves com a mesma identificação oficial.
create unique index passaros_anilha_unica
  on public.passaros (anilha_sigla, anilha_criador, anilha_ano, anilha_numero)
  where deleted_at is null and anilha_numero is not null;

create index on public.passaros (criatorio_id, situacao) where deleted_at is null;
create index on public.passaros (criatorio_id, especie_id) where deleted_at is null;
create index on public.passaros (pai_id) where deleted_at is null;
create index on public.passaros (mae_id) where deleted_at is null;
create index on public.passaros (criatorio_id, updated_at);  -- sincronização offline

-- Busca por anilha e observações, sem acento e por aproximação.
create index passaros_busca_trgm on public.passaros
  using gin ((coalesce(anilha_numero::text,'') || ' ' || coalesce(portador,'') || ' ' || coalesce(observacoes,'')) gin_trgm_ops);

comment on table public.passaros is
  'A ave individual. Núcleo do sistema: genealogia, anilha e situação no plantel.';
comment on column public.passaros.anilha_sigla is
  'Sigla do clube copiada no momento do anilhamento. Desnormalizada de propósito: se o clube mudar de sigla, a anilha física na perna da ave não muda.';

create trigger passaros_updated_at before update on public.passaros for each row execute function public.tg_set_updated_at();

-- -----------------------------------------------------------------------------
-- Guarda de integridade da genealogia
-- -----------------------------------------------------------------------------
-- Impede ciclos (uma ave virar ancestral de si mesma) e incoerência de sexo.
-- Sem isso, as funções recursivas de árvore e endogamia entram em laço infinito.
create or replace function public.tg_valida_genealogia()
returns trigger
language plpgsql
as $$
declare
  v_sexo_pai sexo_ave;
  v_sexo_mae sexo_ave;
  v_ciclo    boolean;
begin
  if new.pai_id is not null then
    select sexo into v_sexo_pai from public.passaros where id = new.pai_id;
    if v_sexo_pai = 'femea' then
      raise exception 'A ave indicada como pai está registrada como fêmea.';
    end if;
  end if;

  if new.mae_id is not null then
    select sexo into v_sexo_mae from public.passaros where id = new.mae_id;
    if v_sexo_mae = 'macho' then
      raise exception 'A ave indicada como mãe está registrada como macho.';
    end if;
  end if;

  -- Detecta ciclo: a própria ave aparece entre os ancestrais dos novos pais.
  if new.pai_id is not null or new.mae_id is not null then
    with recursive ancestrais as (
      select p.id, p.pai_id, p.mae_id, 1 as nivel
        from public.passaros p
       where p.id in (new.pai_id, new.mae_id)
      union all
      select p.id, p.pai_id, p.mae_id, a.nivel + 1
        from public.passaros p
        join ancestrais a on p.id in (a.pai_id, a.mae_id)
       where a.nivel < 25
    )
    select exists (select 1 from ancestrais where id = new.id) into v_ciclo;

    if v_ciclo then
      raise exception 'Genealogia inválida: esta ave já é ancestral da ave indicada como pai ou mãe.';
    end if;
  end if;

  return new;
end;
$$;

create trigger passaros_valida_genealogia
  before insert or update of pai_id, mae_id on public.passaros
  for each row execute function public.tg_valida_genealogia();

-- O código alternativo, quando usado, também identifica unicamente a ave.
create unique index passaros_codigo_alternativo_unico
  on public.passaros (criatorio_id, upper(codigo_alternativo))
  where deleted_at is null and codigo_alternativo is not null;

-- -----------------------------------------------------------------------------
-- Pesagens
-- -----------------------------------------------------------------------------
-- Peso é série histórica, não atributo. O criador pesa o filhote ao anilhamento
-- e acompanha o ganho; a ficha da ave tem um atalho próprio para isso. Guardar
-- só o último peso jogaria fora a curva, que é o dado que informa a decisão.
create table public.pesagens (
  id           uuid primary key default gen_random_uuid(),
  criatorio_id uuid not null references public.criatorios(id) on delete cascade,
  passaro_id   uuid not null references public.passaros(id) on delete cascade,
  data         date not null default current_date,
  peso_gramas  numeric(6,2) not null check (peso_gramas > 0),
  contexto     text,   -- 'anilhamento', 'desmame', 'rotina', 'pré-exposição'
  observacoes  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index on public.pesagens (criatorio_id, passaro_id, data desc) where deleted_at is null;

comment on table public.pesagens is
  'Série histórica de peso da ave. O design nunca arredonda peso na exibição — guardar com uma decimal.';

create trigger pesagens_updated_at before update on public.pesagens for each row execute function public.tg_set_updated_at();
