-- =============================================================================
-- SisAves · 0002 · Identidade e multi-tenancy
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Perfil do usuário (1:1 com auth.users do Supabase)
-- -----------------------------------------------------------------------------
create table public.perfis (
  id                uuid primary key references auth.users(id) on delete cascade,
  nome              text not null,
  telefone          text,
  avatar_url        text,
  is_admin          boolean not null default false,
  aceite_termos_em  timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.perfis is
  'Dados do usuário. A autenticação (e-mail, senha, OAuth) fica em auth.users, gerenciada pelo Supabase.';

-- -----------------------------------------------------------------------------
-- Clubes / federações (tabela de sistema, compartilhada)
-- -----------------------------------------------------------------------------
create table public.clubes (
  id         uuid primary key default gen_random_uuid(),
  sigla      text not null unique,   -- ex.: 'SOV', 'FOB', 'CBOA'
  nome       text not null,
  uf         text,
  ativo      boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.clubes is
  'Clubes e federações emissores de anilha. Compartilhado entre todos os criatórios (leitura pública).';

-- -----------------------------------------------------------------------------
-- Criatório — a unidade de isolamento (tenant)
-- -----------------------------------------------------------------------------
-- Decisão: o tenant é o CRIATÓRIO, não o usuário. O legado amarrava tudo a
-- usuario_id, o que impede dois cenários reais: um criador com mais de um
-- criatório, e um criatório com mais de uma pessoa operando (pai e filho).
create table public.criatorios (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references auth.users(id) on delete restrict,
  nome           text not null,
  slug           citext not null unique,        -- usado na URL pública do certificado
  clube_id       uuid references public.clubes(id),
  nro_criador    text,                          -- matrícula do criador no clube
  cidade         text,
  uf             text,
  logo_url       text,
  cor_documento  text,                          -- personalização de certificados
  instagram      text,
  whatsapp       text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz,

  constraint criatorios_slug_formato check (slug ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$')
);

create index on public.criatorios (owner_id) where deleted_at is null;

comment on table public.criatorios is
  'Tenant do sistema. Toda tabela de dados carrega criatorio_id e é isolada por RLS.';
comment on column public.criatorios.slug is
  'Identificador público estável, usado na URL de validação de certificados. Nunca reciclar.';

-- -----------------------------------------------------------------------------
-- Membros do criatório (acesso compartilhado)
-- -----------------------------------------------------------------------------
create table public.criatorio_membros (
  criatorio_id uuid not null references public.criatorios(id) on delete cascade,
  usuario_id   uuid not null references auth.users(id) on delete cascade,
  papel        text not null default 'operador' check (papel in ('proprietario','operador','leitor')),
  created_at   timestamptz not null default now(),
  primary key (criatorio_id, usuario_id)
);

comment on table public.criatorio_membros is
  'Permite mais de uma pessoa operando o mesmo criatório, com papéis distintos.';

-- -----------------------------------------------------------------------------
-- Função de tenancy usada por TODAS as políticas de RLS
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER de propósito: precisa ler criatorio_membros ignorando RLS,
-- senão a política que consulta esta função entraria em recursão infinita.
create or replace function public.meus_criatorios()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select criatorio_id
    from public.criatorio_membros
   where usuario_id = auth.uid()
$$;

comment on function public.meus_criatorios is
  'Retorna os criatórios que o usuário autenticado pode acessar. Base de todas as políticas de RLS.';

-- Ao criar um criatório, o dono vira membro proprietário automaticamente.
create or replace function public.tg_criatorio_membro_inicial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.criatorio_membros (criatorio_id, usuario_id, papel)
  values (new.id, new.owner_id, 'proprietario')
  on conflict do nothing;
  return new;
end;
$$;

create trigger criatorios_membro_inicial
  after insert on public.criatorios
  for each row execute function public.tg_criatorio_membro_inicial();

create trigger perfis_updated_at     before update on public.perfis     for each row execute function public.tg_set_updated_at();
create trigger criatorios_updated_at before update on public.criatorios for each row execute function public.tg_set_updated_at();
