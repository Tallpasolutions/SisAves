-- =============================================================================
-- SisAves · 0013 · Perfil criado junto com a conta
--
-- Sem isto, todo caminho de cadastro (e-mail, Google, convite, painel do
-- Supabase) teria de lembrar de inserir em public.perfis — e o primeiro que
-- esquecesse deixaria uma conta órfã, sem nome, que não consegue criar
-- criatório. O banco garante o par.
-- =============================================================================

create or replace function public.tg_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, avatar_url)
  values (
    new.id,
    -- Google manda 'full_name' ou 'name'; o cadastro por e-mail manda 'nome'.
    -- Sem nenhum deles, usa o trecho antes do @ — nome é NOT NULL e a conta
    -- não pode nascer quebrada. O criador corrige no perfil depois.
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'nome'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger novo_usuario_cria_perfil
  after insert on auth.users
  for each row execute function public.tg_novo_usuario();

comment on function public.tg_novo_usuario is
  'Cria public.perfis junto com auth.users. Vale para qualquer caminho de cadastro.';
