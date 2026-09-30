-- =============================================================================
-- SisAves · 0010 · Certificados/CRO, notificações, push e assinatura
-- =============================================================================

create type status_assinatura as enum ('teste', 'ativa', 'pendente', 'vencida', 'cancelada');

-- -----------------------------------------------------------------------------
-- Certificados / CRO
-- -----------------------------------------------------------------------------
-- O snapshot é a razão de ser desta tabela. A árvore genealógica muda quando o
-- criador corrige uma filiação, mas um CRO emitido em 2026 precisa provar o que
-- era verdade em 2026 — inclusive anos depois, na mão de um comprador. Por isso
-- o documento carrega os dados congelados, e a página de validação lê o
-- snapshot, nunca a árvore viva.
create table public.certificados (
  id             uuid primary key default gen_random_uuid(),
  criatorio_id   uuid not null references public.criatorios(id) on delete cascade,
  passaro_id     uuid not null references public.passaros(id) on delete restrict,

  sequencial     bigint not null,
  -- Parte imprevisível da URL. Sem ela, bastaria incrementar o sequencial para
  -- varrer os certificados de todos os criatórios.
  hash           text not null default encode(gen_random_bytes(9), 'hex'),

  emitido_em     timestamptz not null default now(),
  emitido_por    uuid references auth.users(id) on delete set null,
  snapshot       jsonb not null,

  revogado_em    timestamptz,
  revogado_motivo text,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index certificados_hash_unico on public.certificados (hash);
create unique index certificados_sequencial_unico on public.certificados (criatorio_id, sequencial);
create index on public.certificados (criatorio_id, emitido_em desc);
create index on public.certificados (passaro_id);

comment on column public.certificados.snapshot is
  'Ave, criatório, genealogia e endogamia congelados na emissão. A validação pública lê daqui, nunca da árvore viva.';

-- Numeração sequencial por criatório, resolvida no banco para não haver corrida
-- entre duas emissões simultâneas.
create or replace function public.tg_certificado_sequencial()
returns trigger
language plpgsql
as $$
begin
  if new.sequencial is null then
    select coalesce(max(sequencial), 0) + 1 into new.sequencial
      from public.certificados
     where criatorio_id = new.criatorio_id;
  end if;
  return new;
end;
$$;

create trigger certificados_sequencial
  before insert on public.certificados
  for each row execute function public.tg_certificado_sequencial();

alter table public.certificados alter column sequencial drop not null;

-- -----------------------------------------------------------------------------
-- Montagem do snapshot
-- -----------------------------------------------------------------------------
create or replace function public.montar_snapshot_certificado(p_passaro_id uuid)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'versao', 1,
    'emitido_em', now(),
    'ave', jsonb_build_object(
      'nome', p.nome,
      'anilha', jsonb_build_object(
        'sigla', p.anilha_sigla, 'criador', p.anilha_criador,
        'ano', p.anilha_ano, 'numero', p.anilha_numero
      ),
      'codigo_alternativo', p.codigo_alternativo,
      'sexo', p.sexo,
      'dt_nascimento', p.dt_nascimento,
      'especie', e.nome,
      'mutacao', m.nome,
      'foto_url', p.foto_url
    ),
    'criatorio', jsonb_build_object(
      -- Só o que identifica a origem da ave. Telefone, e-mail e redes do criador
      -- ficam de fora: a página pública prova a ave, não expõe o vendedor.
      'nome', c.nome,
      'slug', c.slug,
      'registro_ibama', c.registro_ibama,
      'clube', cl.sigla,
      'nro_criador', c.nro_criador,
      'cidade', c.cidade,
      'uf', c.uf,
      'logo_url', c.logo_url
    ),
    'endogamia_pct', public.coeficiente_endogamia(p.pai_id, p.mae_id),
    'genealogia', coalesce((
      select jsonb_agg(jsonb_build_object(
               'geracao', a.geracao, 'papel', a.papel, 'nome', a.nome,
               'sexo', a.sexo, 'especie', a.especie_nome, 'mutacao', a.mutacao_nome,
               'anilha', jsonb_build_object(
                 'sigla', a.anilha_sigla, 'criador', a.anilha_criador,
                 'ano', a.anilha_ano, 'numero', a.anilha_numero)
             ) order by a.geracao)
        from public.arvore_genealogica(p_passaro_id, 3) a
       where a.geracao > 0
    ), '[]'::jsonb)
  )
  from public.passaros p
  left join public.especies e on e.id = p.especie_id
  left join public.mutacoes m on m.id = p.mutacao_id
  join public.criatorios c on c.id = p.criatorio_id
  left join public.clubes cl on cl.id = c.clube_id
  where p.id = p_passaro_id;
$$;

-- -----------------------------------------------------------------------------
-- Validação pública (anônima)
-- -----------------------------------------------------------------------------
-- A tabela NÃO é exposta ao papel anon. Quem escaneia o QR chega por esta
-- função, que é a lista branca explícita do que pode sair do sistema — mais
-- seguro que uma política de RLS, porque uma coluna nova não vaza por descuido.
create or replace function public.validar_certificado(
  p_hash text,
  p_sequencial bigint
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'autentico', c.revogado_em is null,
    'revogado_em', c.revogado_em,
    'numero', c.sequencial,
    'emitido_em', c.emitido_em,
    'consultado_em', now(),
    'dados', c.snapshot
  )
  from public.certificados c
  where c.hash = p_hash and c.sequencial = p_sequencial;
$$;

revoke all on function public.validar_certificado(text, bigint) from public;
grant execute on function public.validar_certificado(text, bigint) to anon, authenticated;

comment on function public.validar_certificado is
  'Única porta pública para o CRO. Retorna apenas o snapshot — nenhum contato do criador, nenhum id interno.';

-- -----------------------------------------------------------------------------
-- Notificações
-- -----------------------------------------------------------------------------
create table public.notificacoes (
  id           uuid primary key default gen_random_uuid(),
  criatorio_id uuid not null references public.criatorios(id) on delete cascade,
  usuario_id   uuid not null references auth.users(id) on delete cascade,
  tipo         text not null,     -- 'anilhar', 'ovoscopia', 'separar', 'sistema'
  titulo       text not null,
  corpo        text,
  link         text,
  lida_em      timestamptz,
  created_at   timestamptz not null default now()
);

create index on public.notificacoes (usuario_id, created_at desc);
create index on public.notificacoes (usuario_id) where lida_em is null;

-- -----------------------------------------------------------------------------
-- Web Push (VAPID)
-- -----------------------------------------------------------------------------
create table public.push_subscriptions (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid not null references auth.users(id) on delete cascade,
  endpoint       text not null unique,
  p256dh         text not null,
  auth           text not null,
  user_agent     text,
  created_at     timestamptz not null default now(),
  ultima_usada_em timestamptz
);

create index on public.push_subscriptions (usuario_id);

-- -----------------------------------------------------------------------------
-- Assinatura
-- -----------------------------------------------------------------------------
create table public.assinaturas (
  id            uuid primary key default gen_random_uuid(),
  criatorio_id  uuid not null references public.criatorios(id) on delete cascade,
  plano         text not null default 'anual',
  status        status_assinatura not null default 'teste',
  inicio        date not null default current_date,
  fim           date,
  valor         numeric(10,2),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index on public.assinaturas (criatorio_id, status);

-- Pagamentos vindos do Mercado Pago. O id do provedor é único para o webhook
-- poder chegar duas vezes sem creditar duas — retentativa é o normal, não a
-- exceção.
create table public.assinatura_pagamentos (
  id              uuid primary key default gen_random_uuid(),
  assinatura_id   uuid not null references public.assinaturas(id) on delete cascade,
  provedor        text not null default 'mercadopago',
  provedor_id     text not null,
  status          text not null,
  valor           numeric(10,2),
  meio            text,             -- 'pix', 'credit_card'
  payload         jsonb,
  created_at      timestamptz not null default now()
);

create unique index assinatura_pagamentos_provedor_unico
  on public.assinatura_pagamentos (provedor, provedor_id);

-- Vigência da assinatura, usada no bloqueio suave: expirada bloqueia escrita,
-- nunca leitura — os dados do criador continuam acessíveis a ele.
create or replace function public.criatorio_com_acesso(p_criatorio_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.assinaturas a
     where a.criatorio_id = p_criatorio_id
       and a.status in ('ativa', 'teste')
       and (a.fim is null or a.fim >= current_date)
  );
$$;

create trigger certificados_updated_at before update on public.certificados for each row execute function public.tg_set_updated_at();
create trigger assinaturas_updated_at  before update on public.assinaturas  for each row execute function public.tg_set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.certificados           enable row level security;
alter table public.notificacoes           enable row level security;
alter table public.push_subscriptions     enable row level security;
alter table public.assinaturas            enable row level security;
alter table public.assinatura_pagamentos  enable row level security;

create policy "tenant_total" on public.certificados
  for all to authenticated
  using (criatorio_id in (select public.meus_criatorios()))
  with check (criatorio_id in (select public.meus_criatorios()));

create policy "proprias" on public.notificacoes
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

create policy "proprias" on public.push_subscriptions
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- Assinatura é leitura para o criatório; quem escreve é o webhook, que roda
-- com service_role e passa por cima da RLS.
create policy "tenant_le" on public.assinaturas
  for select to authenticated
  using (criatorio_id in (select public.meus_criatorios()));

create policy "tenant_le" on public.assinatura_pagamentos
  for select to authenticated
  using (assinatura_id in (
    select id from public.assinaturas
     where criatorio_id in (select public.meus_criatorios())
  ));
