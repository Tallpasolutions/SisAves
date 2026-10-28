begin;

-- Esta função APAGA conta de gente, e não tem desfazer. Cada asserção aqui é
-- uma pessoa que não pode sumir: quem confirmou, quem acabou de se cadastrar,
-- quem já tem criatório, quem é membro de um, e quem opera o sistema.
--
-- O arquivo existe para o dia em que alguém mexer na condição achando que
-- simplifica.

insert into auth.users (id, email, aud, role, created_at, email_confirmed_at) values
  -- Abandonada de verdade: velha, sem confirmar, sem nada.
  ('e0e0e0e0-0000-0000-0000-000000000001','abandonada@teste.invalid','authenticated','authenticated', now() - interval '5 days', null),
  -- Confirmou o e-mail. Pode estar inativa, mas é cliente.
  ('e0e0e0e0-0000-0000-0000-000000000002','confirmou@teste.invalid','authenticated','authenticated', now() - interval '5 days', now() - interval '5 days'),
  -- Cadastrou agora. Ainda pode clicar no link.
  ('e0e0e0e0-0000-0000-0000-000000000003','recente@teste.invalid','authenticated','authenticated', now() - interval '2 hours', null),
  -- Não confirmou, mas tem criatório: se há dado, não é abandono.
  ('e0e0e0e0-0000-0000-0000-000000000004','comcriatorio@teste.invalid','authenticated','authenticated', now() - interval '5 days', null),
  -- Não confirmou, mas é membro do criatório de outro.
  ('e0e0e0e0-0000-0000-0000-000000000005','membro@teste.invalid','authenticated','authenticated', now() - interval '5 days', null),
  -- Operador. Improvável cair aqui, e caro demais se cair.
  ('e0e0e0e0-0000-0000-0000-000000000006','operadora@teste.invalid','authenticated','authenticated', now() - interval '5 days', null);

insert into public.perfis (id, nome, is_admin) values
  ('e0e0e0e0-0000-0000-0000-000000000006','Operadora', true)
on conflict (id) do update set is_admin = true;

insert into public.criatorios (id, owner_id, nome, slug, clube_id) values
  ('e0e0e0e0-1111-1111-1111-111111111111','e0e0e0e0-0000-0000-0000-000000000004',
   'Criatório da não confirmada','limp-criatorio',
   (select id from public.clubes where sigla='SOB' limit 1));

insert into public.criatorio_membros (criatorio_id, usuario_id, papel)
values ('e0e0e0e0-1111-1111-1111-111111111111','e0e0e0e0-0000-0000-0000-000000000005','leitor')
on conflict do nothing;

create temp table veredito (cenario text, esperado text, obtido text);

-- ---- A simulação não apaga -------------------------------------------------
create temp table simulado as
  select * from public.limpar_contas_abandonadas(1, true);

insert into veredito values
  ('a simulação lista a conta abandonada', '1',
   (select count(*)::text from simulado where email = 'abandonada@teste.invalid')),

  ('e marca que NÃO apagou', 'false',
   (select apagada::text from simulado where email = 'abandonada@teste.invalid')),

  ('a conta continua lá depois de simular', '1',
   (select count(*)::text from auth.users where id = 'e0e0e0e0-0000-0000-0000-000000000001'));

-- ---- Quem a simulação NÃO toca ---------------------------------------------
insert into veredito values
  ('quem confirmou não entra na lista', '0',
   (select count(*)::text from simulado where email = 'confirmou@teste.invalid')),

  ('quem cadastrou hoje não entra', '0',
   (select count(*)::text from simulado where email = 'recente@teste.invalid')),

  ('quem tem criatório não entra', '0',
   (select count(*)::text from simulado where email = 'comcriatorio@teste.invalid')),

  ('quem é membro de um criatório não entra', '0',
   (select count(*)::text from simulado where email = 'membro@teste.invalid')),

  ('operador não entra', '0',
   (select count(*)::text from simulado where email = 'operadora@teste.invalid'));

-- ---- Apagando de verdade ---------------------------------------------------
create temp table apagou as
  select * from public.limpar_contas_abandonadas(1, false);

insert into veredito values
  ('apagou a abandonada', 'true',
   (select apagada::text from apagou where email = 'abandonada@teste.invalid'));

insert into veredito values
  ('e ela sumiu de auth.users', '0',
   (select count(*)::text from auth.users where id = 'e0e0e0e0-0000-0000-0000-000000000001')),

  ('o perfil dela caiu junto, por cascade', '0',
   (select count(*)::text from public.perfis where id = 'e0e0e0e0-0000-0000-0000-000000000001')),

  ('as outras CINCO continuam lá', '5',
   (select count(*)::text from auth.users
     where id in ('e0e0e0e0-0000-0000-0000-000000000002',
                  'e0e0e0e0-0000-0000-0000-000000000003',
                  'e0e0e0e0-0000-0000-0000-000000000004',
                  'e0e0e0e0-0000-0000-0000-000000000005',
                  'e0e0e0e0-0000-0000-0000-000000000006')));

-- ---- A porta da função -----------------------------------------------------
-- Rotina de servidor. Com execute para anon, o endpoint público do PostgREST
-- viraria um botão de apagar contas.
insert into veredito values
  ('anon NÃO executa', 'false',
   (select has_function_privilege('anon',
      'public.limpar_contas_abandonadas(int,boolean)', 'execute')::text)),

  ('authenticated NÃO executa', 'false',
   (select has_function_privilege('authenticated',
      'public.limpar_contas_abandonadas(int,boolean)', 'execute')::text)),

  ('service_role executa', 'true',
   (select has_function_privilege('service_role',
      'public.limpar_contas_abandonadas(int,boolean)', 'execute')::text));

select cenario, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from veredito;

rollback;
