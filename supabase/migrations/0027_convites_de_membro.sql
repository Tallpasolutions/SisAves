-- =============================================================================
-- SisAves · 0027 · Convidar alguém para o criatório
--
-- `criatorio_membros` e toda a RLS já suportam mais de uma pessoa por criatório
-- desde 0002 — faltava o caminho de entrada. Convidar por e-mail não era
-- possível com o que havia: o e-mail vive em `auth.users`, que o cliente não
-- lê, e não existia lugar para guardar um convite pendente.
--
-- O convite fica aqui até a pessoa entrar. `aceitar_convites` roda no login e
-- transforma em membro o que estiver endereçado ao e-mail dela.
-- =============================================================================

create table public.criatorio_convites (
  id            uuid primary key default gen_random_uuid(),
  criatorio_id  uuid not null references public.criatorios(id) on delete cascade,
  email         citext not null,
  papel         text not null default 'operador' check (papel in ('operador','leitor')),
  convidado_por uuid not null references auth.users(id) on delete cascade,
  criado_em     timestamptz not null default now(),
  aceito_em     timestamptz,
  recusado_em   timestamptz
);

-- Um convite aberto por e-mail e criatório. Dois convites pendentes para a
-- mesma pessoa é só ruído: ela aceita uma vez.
create unique index criatorio_convites_pendente_unico
  on public.criatorio_convites (criatorio_id, email)
  where aceito_em is null and recusado_em is null;

create index on public.criatorio_convites (email) where aceito_em is null;

comment on table public.criatorio_convites is
  'Convite pendente para entrar num criatório. Vira linha em criatorio_membros quando a pessoa convidada entra — ver aceitar_convites().';

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
-- Quem é do criatório enxerga e administra os convites dele. Quem foi
-- convidado enxerga o próprio, pelo e-mail do token — é como ele descobre que
-- existe.
alter table public.criatorio_convites enable row level security;

create policy "convite_leitura" on public.criatorio_convites
  for select to authenticated
  using (
    criatorio_id in (select public.meus_criatorios())
    or email = (select auth.jwt() ->> 'email')::citext
  );

create policy "convite_escrita" on public.criatorio_convites
  for insert to authenticated
  with check (criatorio_id in (select public.meus_criatorios()));

create policy "convite_atualiza" on public.criatorio_convites
  for update to authenticated
  using (
    criatorio_id in (select public.meus_criatorios())
    or email = (select auth.jwt() ->> 'email')::citext
  )
  with check (
    criatorio_id in (select public.meus_criatorios())
    or email = (select auth.jwt() ->> 'email')::citext
  );

create policy "convite_apaga" on public.criatorio_convites
  for delete to authenticated
  using (criatorio_id in (select public.meus_criatorios()));

-- -----------------------------------------------------------------------------
-- aceitar_convites
-- -----------------------------------------------------------------------------
-- Roda no login. `security definer` porque precisa escrever em
-- `criatorio_membros` de um criatório que o usuário AINDA não é membro — pela
-- RLS normal ele não enxergaria a linha que está prestes a criar.
--
-- Devolve quantos convites viraram acesso, para a tela poder dizer.
create or replace function public.aceitar_convites()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email    citext;
  v_usuario  uuid;
  v_aceitos  integer := 0;
  v_convite  public.criatorio_convites%rowtype;
begin
  v_usuario := auth.uid();
  if v_usuario is null then
    return 0;
  end if;

  select email into v_email from auth.users where id = v_usuario;
  if v_email is null then
    return 0;
  end if;

  for v_convite in
    select * from public.criatorio_convites
     where email = v_email
       and aceito_em is null
       and recusado_em is null
     for update
  loop
    insert into public.criatorio_membros (criatorio_id, usuario_id, papel)
    values (v_convite.criatorio_id, v_usuario, v_convite.papel)
    on conflict (criatorio_id, usuario_id) do nothing;

    update public.criatorio_convites
       set aceito_em = now()
     where id = v_convite.id;

    v_aceitos := v_aceitos + 1;
  end loop;

  return v_aceitos;
end;
$$;

comment on function public.aceitar_convites is
  'Transforma em acesso os convites endereçados ao e-mail de quem acabou de entrar. security definer: o usuário ainda não é membro do criatório que está prestes a acessar.';

grant execute on function public.aceitar_convites() to authenticated;

-- -----------------------------------------------------------------------------
-- Quem são os membros
-- -----------------------------------------------------------------------------
-- `criatorio_membros` guarda só o id; o nome vive em `perfis`, que cada um só
-- lê de si mesmo (0009). Sem esta view, a tela de membros mostraria uma lista
-- de UUIDs.
--
-- `security definer` numa view é perigoso por natureza, então ela devolve o
-- MÍNIMO: nome, papel e desde quando. Nada de telefone, nada de e-mail.
create or replace view public.vw_membros
with (security_invoker = off)
as
select
  m.criatorio_id,
  m.usuario_id,
  coalesce(p.nome, 'Sem nome') as nome,
  m.papel,
  m.created_at as desde,
  c.owner_id = m.usuario_id as e_dono
from public.criatorio_membros m
join public.criatorios c on c.id = m.criatorio_id
left join public.perfis p on p.id = m.usuario_id
where m.criatorio_id in (select public.meus_criatorios());

comment on view public.vw_membros is
  'Membros do criatório com o nome do perfil. security_invoker off de propósito: perfis só é legível pelo próprio dono, e a tela precisa dos nomes dos outros. Devolve o mínimo — nome, papel e data.';

grant select on public.vw_membros to authenticated;
