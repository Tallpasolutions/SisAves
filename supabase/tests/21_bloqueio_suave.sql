begin;

-- O bloqueio suave. Duas direções, e a segunda é a que importa:
-- vencido NÃO escreve, mas LÊ tudo. Barrar a leitura seria reter os dados do
-- criador por ele não ter pago — o contrário do que o produto promete.

insert into auth.users (id, email, aud, role) values
  ('c1c1c1c1-0000-0000-0000-000000000001', 'bloq-ana@teste.invalid',   'authenticated', 'authenticated'),
  ('c1c1c1c1-0000-0000-0000-000000000002', 'bloq-bruno@teste.invalid', 'authenticated', 'authenticated');

-- Dois criatórios. O gatilho da 0038 dá cinco dias de teste a cada um.
insert into public.criatorios (id, owner_id, nome, slug, clube_id) values
  ('c1c1c1c1-1111-1111-1111-111111111111','c1c1c1c1-0000-0000-0000-000000000001',
   'Criatório em dia','bloq-ana', (select id from public.clubes where sigla='SOB' limit 1)),
  ('c1c1c1c1-2222-2222-2222-222222222222','c1c1c1c1-0000-0000-0000-000000000002',
   'Criatório vencido','bloq-bruno', (select id from public.clubes where sigla='SOB' limit 1));

insert into public.especies (id, criatorio_id, catalogo_id, nome, dias_choco, dias_anilha, dias_separa, dias_ovoscopia, janela_anilha_dias)
values
  ('c1c1c1c1-eeee-eeee-eeee-000000000001','c1c1c1c1-1111-1111-1111-111111111111',
   (select id from public.especies_catalogo where nome_cientifico='Sporophila angolensis' limit 1),
   'Curió', 14::smallint, 3::smallint, 40::smallint, 6::smallint, 1::smallint),
  ('c1c1c1c1-eeee-eeee-eeee-000000000002','c1c1c1c1-2222-2222-2222-222222222222',
   (select id from public.especies_catalogo where nome_cientifico='Sporophila angolensis' limit 1),
   'Curió', 14::smallint, 3::smallint, 40::smallint, 6::smallint, 1::smallint);

-- Uma ave em cada, gravada antes de qualquer vencimento: é o que o vencido
-- precisa continuar enxergando.
insert into public.passaros (id, criatorio_id, nome, sexo, especie_id) values
  ('c1c1c1c1-aaaa-aaaa-aaaa-000000000001','c1c1c1c1-1111-1111-1111-111111111111','Ave da Ana','macho','c1c1c1c1-eeee-eeee-eeee-000000000001'),
  ('c1c1c1c1-aaaa-aaaa-aaaa-000000000002','c1c1c1c1-2222-2222-2222-222222222222','Ave do Bruno','macho','c1c1c1c1-eeee-eeee-eeee-000000000002');

create temp table veredito (cenario text, esperado text, obtido text);
-- As sessões abaixo rodam como `authenticated`, e o papel não enxerga tabela
-- temporária sem grant explícito.
grant all on veredito to authenticated;

-- ---- O gatilho dos cinco dias --------------------------------------------------
insert into veredito values
  ('criatório novo nasce com teste de 5 dias', (public.hoje() + 5)::text,
   (select fim::text from public.assinaturas
     where criatorio_id = 'c1c1c1c1-1111-1111-1111-111111111111')),

  ('e nasce com status teste', 'teste',
   (select status::text from public.assinaturas
     where criatorio_id = 'c1c1c1c1-1111-1111-1111-111111111111'));

-- O Bruno vence: a data vai para ontem.
update public.assinaturas set fim = public.hoje() - 1
 where criatorio_id = 'c1c1c1c1-2222-2222-2222-222222222222';

insert into veredito values
  ('a Ana tem acesso',  'true',  public.criatorio_com_acesso('c1c1c1c1-1111-1111-1111-111111111111')::text),
  ('o Bruno não tem',   'false', public.criatorio_com_acesso('c1c1c1c1-2222-2222-2222-222222222222')::text);

-- ---- Sessão da Ana · em dia ----------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"c1c1c1c1-0000-0000-0000-000000000001"}';

create temp table ana_escreve as
with nova as (
  insert into public.passaros (criatorio_id, nome, sexo, especie_id)
  values ('c1c1c1c1-1111-1111-1111-111111111111','Nova da Ana','femea','c1c1c1c1-eeee-eeee-eeee-000000000001')
  returning 1
)
select count(*)::text as n from nova;

grant all on ana_escreve to authenticated;

insert into veredito values
  ('em dia, cadastrar ave funciona', '1', (select n from ana_escreve));

-- ---- Sessão do Bruno · vencido -------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"c1c1c1c1-0000-0000-0000-000000000002"}';

-- LÊ tudo. Esta é a metade que não pode quebrar.
insert into veredito values
  ('vencido continua vendo as próprias aves', '1',
   (select count(*)::text from public.passaros)),

  ('vencido continua vendo o próprio criatório', '1',
   (select count(*)::text from public.criatorios)),

  ('vencido continua vendo as próprias espécies', '1',
   (select count(*)::text from public.especies));

-- E NÃO escreve. Cada tentativa é capturada: a política devolve
-- "new row violates row-level security policy".
create temp table bruno_ave as select 'PASSOU'::text as r;

do $$
begin
  insert into public.passaros (criatorio_id, nome, sexo, especie_id)
  values ('c1c1c1c1-2222-2222-2222-222222222222','Não deve entrar','femea','c1c1c1c1-eeee-eeee-eeee-000000000002');
  update bruno_ave set r = 'PASSOU';
exception when insufficient_privilege then
  update bruno_ave set r = 'barrado';
end $$;

create temp table bruno_lanc as select 'PASSOU'::text as r;
do $$
begin
  insert into public.financeiro_lancamentos (criatorio_id, tipo, valor, data, descricao)
  values ('c1c1c1c1-2222-2222-2222-222222222222','despesa',10.00, public.hoje(),'Não deve entrar');
  update bruno_lanc set r = 'PASSOU';
exception when insufficient_privilege then
  update bruno_lanc set r = 'barrado';
end $$;

create temp table bruno_edita as select 'PASSOU'::text as r;
do $$
begin
  update public.passaros set nome = 'Renomeada por vencido'
   where id = 'c1c1c1c1-aaaa-aaaa-aaaa-000000000002';
  update bruno_edita set r = 'PASSOU';
exception when insufficient_privilege then
  update bruno_edita set r = 'barrado';
end $$;

insert into veredito values
  ('vencido NÃO cadastra ave',        'barrado', (select r from bruno_ave)),
  ('vencido NÃO lança no financeiro', 'barrado', (select r from bruno_lanc)),
  ('vencido NÃO edita ave existente', 'barrado', (select r from bruno_edita));

-- A porta de saída tem de ficar aberta: sem poder gravar a intenção, o vencido
-- não consegue nem começar a pagar o que o destrancaria.
create temp table bruno_paga as select 'BARRADO'::text as r;
do $$
begin
  insert into public.assinatura_intencoes (criatorio_id, oferta, valor, meses)
  values ('c1c1c1c1-2222-2222-2222-222222222222','anual-cartao',290.00,12);
  update bruno_paga set r = 'pode pagar';
exception when insufficient_privilege then
  update bruno_paga set r = 'BARRADO';
end $$;

insert into veredito values
  ('vencido AINDA consegue iniciar o pagamento', 'pode pagar', (select r from bruno_paga));

reset role;

select cenario, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from veredito;

rollback;
