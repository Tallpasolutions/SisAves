-- SisAves · 0043 · Apagar conta que nunca foi confirmada
-- =============================================================================
-- Quem cria conta e não confirma o e-mail em um dia deixa uma linha que só
-- atrapalha: entra na contagem de inscritos, aparece no painel como cliente
-- perdido, e impede a mesma pessoa de tentar de novo com o mesmo endereço.
--
-- Mas isto APAGA conta de gente, e não tem desfazer. Então são quatro travas,
-- e nenhuma é decorativa:
--
--   1. só e-mail NÃO confirmado — quem confirmou é cliente, mesmo inativo;
--   2. só mais velha que o prazo — ninguém some enquanto ainda pode clicar;
--   3. só sem criatório e sem vínculo de membro — se há dado, não é abandono;
--   4. nunca operador — por mais improvável que seja, o custo é alto demais.
--
-- E a função **simula por padrão**: sem `p_simular => false` ela só devolve a
-- lista. Quem for ligar isso num agendador vê antes o que seria apagado.
create or replace function public.limpar_contas_abandonadas(
  p_dias    int     default 1,
  p_simular boolean default true
)
returns table (email text, criada_em timestamptz, apagada boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_email text;
  v_criada timestamptz;
begin
  for v_id, v_email, v_criada in
    select u.id, u.email::text, u.created_at
      from auth.users u
     where u.email_confirmed_at is null
       and u.created_at < now() - make_interval(days => p_dias)
       and not exists (
         select 1 from public.criatorios c where c.owner_id = u.id
       )
       and not exists (
         select 1 from public.criatorio_membros m where m.usuario_id = u.id
       )
       and not exists (
         select 1 from public.perfis p where p.id = u.id and p.is_admin
       )
     order by u.created_at
  loop
    if not p_simular then
      -- `perfis` cai por CASCADE; o schema auth limpa identidades e sessões.
      delete from auth.users where id = v_id;
    end if;

    email := v_email;
    criada_em := v_criada;
    apagada := not p_simular;
    return next;
  end loop;
end;
$$;

comment on function public.limpar_contas_abandonadas is
  'Apaga contas que nunca confirmaram o e-mail. Simula por padrão: passe p_simular => false para apagar de verdade. Nunca toca em quem confirmou, em quem tem criatório ou vínculo, nem em operador.';

-- A rotina roda pelo servidor, com service_role, e não pelo navegador de
-- ninguém. Sem execute para anon nem authenticated.
revoke execute on function public.limpar_contas_abandonadas(int, boolean)
  from public, anon, authenticated;
grant execute on function public.limpar_contas_abandonadas(int, boolean)
  to service_role;
