begin;

-- Dois criadores independentes, cada um com o seu criatório e as suas aves.
insert into auth.users (id, email, aud, role) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'ana@sisaves.local',  'authenticated', 'authenticated'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'bruno@sisaves.local','authenticated', 'authenticated');

insert into public.criatorios (id, owner_id, nome, slug) values
  ('aaaaaaaa-1111-1111-1111-111111111111','aaaaaaaa-0000-0000-0000-000000000001','Criatório Ana','ana'),
  ('bbbbbbbb-2222-2222-2222-222222222222','bbbbbbbb-0000-0000-0000-000000000002','Criatório Bruno','bruno');

insert into public.passaros (criatorio_id, nome, sexo) values
  ('aaaaaaaa-1111-1111-1111-111111111111','Curió da Ana','macho'),
  ('aaaaaaaa-1111-1111-1111-111111111111','Canária da Ana','femea'),
  ('bbbbbbbb-2222-2222-2222-222222222222','Agapornis do Bruno','macho');

insert into public.financeiro_lancamentos (criatorio_id, tipo, valor, descricao) values
  ('aaaaaaaa-1111-1111-1111-111111111111','receita', 850.00, 'Venda casal — Ana'),
  ('bbbbbbbb-2222-2222-2222-222222222222','receita', 990.00, 'Venda casal — Bruno');

create temp table veredito (cenario text, esperado bigint, obtido bigint);
grant all on veredito to authenticated, anon;

-- ---- Sessão da Ana ----------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001"}';

insert into veredito values
  ('Ana vê as próprias aves',            2, (select count(*) from public.passaros)),
  ('Ana vê os próprios lançamentos',     1, (select count(*) from public.financeiro_lancamentos)),
  ('Ana vê o próprio criatório',         1, (select count(*) from public.criatorios)),
  ('Ana vê aves do Bruno (deve ser 0)',  0, (select count(*) from public.passaros
                                              where criatorio_id = 'bbbbbbbb-2222-2222-2222-222222222222'));
reset role;

-- ---- Sessão do Bruno --------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-0000-0000-000000000002"}';

insert into veredito values
  ('Bruno vê as próprias aves',           1, (select count(*) from public.passaros)),
  ('Bruno vê aves da Ana (deve ser 0)',   0, (select count(*) from public.passaros
                                               where criatorio_id = 'aaaaaaaa-1111-1111-1111-111111111111')),
  ('Bruno vê criatório da Ana (deve 0)',  0, (select count(*) from public.criatorios
                                               where id = 'aaaaaaaa-1111-1111-1111-111111111111'));
reset role;

-- ---- Sessão anônima (sem login) ---------------------------------------------
set local role anon;
set local request.jwt.claims = '';
insert into veredito values
  ('Anônimo vê alguma ave (deve ser 0)', 0, (select count(*) from public.passaros));
reset role;

select cenario, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from veredito;

rollback;
