begin;

-- As views de operador são as únicas do produto com `security_invoker = off`.
-- Elas leem o banco inteiro, e o que impede qualquer pessoa de consultá-las é
-- uma linha: o `where public.sou_admin()`.
--
-- Este arquivo existe para o dia em que alguém olhar esse `where`, achar que é
-- redundante porque "a view já é só do admin", e apagar. Nesse dia, qualquer
-- usuário autenticado passa a ler o criatório de todos os clientes.

insert into auth.users (id, email, aud, role) values
  ('d0d0d0d0-0000-0000-0000-000000000001', 'op@teste.invalid',     'authenticated', 'authenticated'),
  ('d0d0d0d0-0000-0000-0000-000000000002', 'curiosa@teste.invalid','authenticated', 'authenticated'),
  ('d0d0d0d0-0000-0000-0000-000000000003', 'alheia@teste.invalid', 'authenticated', 'authenticated');

-- O trigger de novo usuário cria o perfil; aqui garanto que existe.
insert into public.perfis (id, nome, is_admin) values
  ('d0d0d0d0-0000-0000-0000-000000000001', 'Operadora', true),
  ('d0d0d0d0-0000-0000-0000-000000000002', 'Curiosa',   false),
  ('d0d0d0d0-0000-0000-0000-000000000003', 'Alheia',    false)
on conflict (id) do update set is_admin = excluded.is_admin, nome = excluded.nome;

insert into public.criatorios (id, owner_id, nome, slug, clube_id) values
  ('d0d0d0d0-1111-1111-1111-111111111111','d0d0d0d0-0000-0000-0000-000000000003',
   'Criatório da Alheia','op-alheia',(select id from public.clubes where sigla='SOB' limit 1));

insert into public.especies (id, criatorio_id, catalogo_id, nome, dias_choco, dias_anilha, dias_separa, dias_ovoscopia, janela_anilha_dias)
values ('d0d0d0d0-eeee-eeee-eeee-eeeeeeeeeeee','d0d0d0d0-1111-1111-1111-111111111111',
        (select id from public.especies_catalogo where nome_cientifico='Sporophila angolensis' limit 1),
        'Curió',14::smallint,3::smallint,40::smallint,6::smallint,1::smallint);

insert into public.passaros (id, criatorio_id, nome, sexo, especie_id) values
  ('d0d0d0d0-aaaa-aaaa-aaaa-000000000001','d0d0d0d0-1111-1111-1111-111111111111','Ave da Alheia','macho','d0d0d0d0-eeee-eeee-eeee-eeeeeeeeeeee');

create temp table veredito (cenario text, esperado text, obtido text);
grant all on veredito to authenticated, anon;

-- ---- A operadora enxerga ---------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"d0d0d0d0-0000-0000-0000-000000000001"}';

insert into veredito values
  ('operadora: sou_admin diz sim', 'true', public.sou_admin()::text),

  ('operadora vê o criatório da Alheia', '1',
   (select count(*)::text from public.vw_admin_criatorios
     where id = 'd0d0d0d0-1111-1111-1111-111111111111')),

  ('e vê a CONTAGEM de aves dele', '1',
   (select aves::text from public.vw_admin_criatorios
     where id = 'd0d0d0d0-1111-1111-1111-111111111111')),

  ('operadora vê contas sem criatório', 'true',
   (select (count(*) > 0)::text from public.vw_admin_contas where not tem_criatorio));

-- Mas NÃO vê o conteúdo: a RLS de `passaros` continua valendo para ela, que
-- não é dona nem membro daquele criatório. A view de operador devolve número,
-- e número não é ave.
insert into veredito values
  ('operadora NÃO lê as aves da Alheia', '0',
   (select count(*)::text from public.passaros
     where criatorio_id = 'd0d0d0d0-1111-1111-1111-111111111111'));

-- ---- A curiosa não enxerga nada -------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"d0d0d0d0-0000-0000-0000-000000000002"}';

insert into veredito values
  ('curiosa: sou_admin diz não', 'false', public.sou_admin()::text),

  ('curiosa NÃO vê criatório nenhum na view', '0',
   (select count(*)::text from public.vw_admin_criatorios)),

  ('curiosa NÃO vê conta nenhuma na view', '0',
   (select count(*)::text from public.vw_admin_contas)),

  ('curiosa NÃO vê pagamento nenhum na view', '0',
   (select count(*)::text from public.vw_admin_pagamentos));

-- ---- A dona do criatório também não vira operadora -------------------------
-- Ter criatório não dá acesso ao painel de quem opera o SisAves.
set local role authenticated;
set local request.jwt.claims = '{"sub":"d0d0d0d0-0000-0000-0000-000000000003"}';

insert into veredito values
  ('a dona do criatório NÃO é operadora', 'false', public.sou_admin()::text),

  ('e NÃO vê a view de operador', '0',
   (select count(*)::text from public.vw_admin_criatorios));

-- ---- Anônimo ---------------------------------------------------------------
set local role anon;
set local request.jwt.claims = '';

insert into veredito values
  ('anônimo NÃO vê a view de operador', '0',
   (select count(*)::text from public.vw_admin_criatorios));

reset role;

-- ---- `com_acesso` concorda com a função? ----------------------------------
-- A view calcula a vigência em vez de chamar `criatorio_com_acesso()`, porque
-- a função leria `assinaturas` sob a RLS da sessão e acusaria de vencido todo
-- criatório alheio. Calcular à parte cria o risco de as duas regras
-- divergirem com o tempo; esta asserção é quem avisa.
insert into public.assinaturas (criatorio_id, plano, status, inicio, fim)
values ('d0d0d0d0-1111-1111-1111-111111111111','anual','ativa', public.hoje(), public.hoje() + 30)
on conflict do nothing;

set local role authenticated;
set local request.jwt.claims = '{"sub":"d0d0d0d0-0000-0000-0000-000000000001"}';

insert into veredito values
  ('a view NÃO acusa de vencido um criatório alheio em dia', 'true',
   (select com_acesso::text from public.vw_admin_criatorios
     where id = 'd0d0d0d0-1111-1111-1111-111111111111'));

reset role;

insert into veredito values
  ('e concorda com criatorio_com_acesso()', 'true',
   (select public.criatorio_com_acesso('d0d0d0d0-1111-1111-1111-111111111111')::text));

-- ---- A trava está escrita na view? ----------------------------------------
-- Checagem estrutural, e é a que importa no dia da remoção distraída.
insert into veredito values
  ('vw_admin_criatorios guarda o sou_admin()', 'true',
   (select (pg_get_viewdef('public.vw_admin_criatorios'::regclass) like '%sou_admin()%')::text)),

  ('vw_admin_contas guarda o sou_admin()', 'true',
   (select (pg_get_viewdef('public.vw_admin_contas'::regclass) like '%sou_admin()%')::text)),

  ('vw_admin_pagamentos guarda o sou_admin()', 'true',
   (select (pg_get_viewdef('public.vw_admin_pagamentos'::regclass) like '%sou_admin()%')::text));

select cenario, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from veredito;

rollback;
