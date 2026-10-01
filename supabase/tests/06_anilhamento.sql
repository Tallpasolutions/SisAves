begin;

-- Um criatório com um casal de curiós e uma ninhada de três ovos eclodidos,
-- dentro da janela de anilhamento.
insert into auth.users (id, email, aud, role) values
  ('cccccccc-0000-0000-0000-000000000001', 'anilha-caio@teste.invalid', 'authenticated', 'authenticated');

insert into public.criatorios (id, owner_id, nome, slug) values
  ('cccccccc-1111-1111-1111-111111111111','cccccccc-0000-0000-0000-000000000001','Criatório Caio','caio-anilha');

insert into public.especies (id, criatorio_id, nome, dias_choco, dias_anilha, dias_separa, dias_ovoscopia, janela_anilha_dias)
values ('cccccccc-eeee-eeee-eeee-eeeeeeeeeeee','cccccccc-1111-1111-1111-111111111111','Curió',
        14::smallint, 3::smallint, 40::smallint, 6::smallint, 1::smallint);

insert into public.passaros (id, criatorio_id, nome, sexo, especie_id) values
  ('cccccccc-aaaa-aaaa-aaaa-aaaaaaaaaaa1','cccccccc-1111-1111-1111-111111111111','Pai','macho','cccccccc-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('cccccccc-aaaa-aaaa-aaaa-aaaaaaaaaaa2','cccccccc-1111-1111-1111-111111111111','Mãe','femea','cccccccc-eeee-eeee-eeee-eeeeeeeeeeee');

insert into public.casais (id, criatorio_id, numero, macho_id, femea_id)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc','cccccccc-1111-1111-1111-111111111111',1,
        'cccccccc-aaaa-aaaa-aaaa-aaaaaaaaaaa1','cccccccc-aaaa-aaaa-aaaa-aaaaaaaaaaa2');

insert into public.ninhadas (id, criatorio_id, casal_id, numero, iniciada_em)
values ('cccccccc-dddd-dddd-dddd-dddddddddddd','cccccccc-1111-1111-1111-111111111111',
        'cccccccc-cccc-cccc-cccc-cccccccccccc', 1, current_date - 18);

insert into public.posturas (id, criatorio_id, casal_id, ninhada_id, numero_ovo, data_postura, data_eclosao) values
  ('cccccccc-0f0f-0f0f-0f0f-000000000001','cccccccc-1111-1111-1111-111111111111','cccccccc-cccc-cccc-cccc-cccccccccccc','cccccccc-dddd-dddd-dddd-dddddddddddd',1, current_date - 18, current_date - 4),
  ('cccccccc-0f0f-0f0f-0f0f-000000000002','cccccccc-1111-1111-1111-111111111111','cccccccc-cccc-cccc-cccc-cccccccccccc','cccccccc-dddd-dddd-dddd-dddddddddddd',2, current_date - 18, current_date - 4),
  -- Este ainda não eclodiu: não pode ser anilhado.
  ('cccccccc-0f0f-0f0f-0f0f-000000000003','cccccccc-1111-1111-1111-111111111111','cccccccc-cccc-cccc-cccc-cccccccccccc','cccccccc-dddd-dddd-dddd-dddddddddddd',3, current_date - 18, null);

create temp table veredito (cenario text, esperado text, obtido text);

-- ---- Os dois filhotes eclodidos estão em "anilhar" --------------------------
insert into veredito values
  ('ovos na janela de anilhamento', '2',
   (select count(*)::text from public.vw_posturas
     where ninhada_id = 'cccccccc-dddd-dddd-dddd-dddddddddddd' and situacao = 'anilhar'));

-- ---- Anilhamento dos dois de uma vez ----------------------------------------
select public.anilhar_filhotes(current_date, jsonb_build_array(
  jsonb_build_object('postura_id','cccccccc-0f0f-0f0f-0f0f-000000000001',
    'anilha_sigla','COF','anilha_criador','1234','anilha_ano',2026,'anilha_numero',501,
    'nome','Primeiro','peso_gramas','12.5'),
  jsonb_build_object('postura_id','cccccccc-0f0f-0f0f-0f0f-000000000002',
    'anilha_sigla','COF','anilha_criador','1234','anilha_ano',2026,'anilha_numero',502,
    'nome','Segundo','peso_gramas','')
));

insert into veredito values
  ('aves criadas no plantel', '2',
   (select count(*)::text from public.passaros
     where criatorio_id = 'cccccccc-1111-1111-1111-111111111111' and anilha_numero in (501,502))),

  ('filiação veio do casal', 'ok',
   (select case when count(*) = 2 then 'ok' else 'FALTOU' end from public.passaros
     where anilha_numero in (501,502)
       and pai_id = 'cccccccc-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
       and mae_id = 'cccccccc-aaaa-aaaa-aaaa-aaaaaaaaaaa2')),

  ('nascimento veio da eclosão', 'ok',
   (select case when count(*) = 2 then 'ok' else 'FALTOU' end from public.passaros
     where anilha_numero in (501,502) and dt_nascimento = current_date - 4)),

  ('espécie veio do casal', 'ok',
   (select case when count(*) = 2 then 'ok' else 'FALTOU' end from public.passaros
     where anilha_numero in (501,502)
       and especie_id = 'cccccccc-eeee-eeee-eeee-eeeeeeeeeeee')),

  ('postura aponta para a ave', '2',
   (select count(*)::text from public.posturas p
      join public.passaros a on a.id = p.passaro_id
     where p.id in ('cccccccc-0f0f-0f0f-0f0f-000000000001','cccccccc-0f0f-0f0f-0f0f-000000000002')
       and a.postura_id = p.id)),

  ('peso informado virou pesagem', '1',
   (select count(*)::text from public.pesagens
     where criatorio_id = 'cccccccc-1111-1111-1111-111111111111' and contexto = 'anilhamento')),

  ('peso em branco não vira pesagem', '12.50',
   (select peso_gramas::text from public.pesagens
     where criatorio_id = 'cccccccc-1111-1111-1111-111111111111' and contexto = 'anilhamento')),

  ('saiu de "anilhar"', '0',
   (select count(*)::text from public.vw_posturas
     where ninhada_id = 'cccccccc-dddd-dddd-dddd-dddddddddddd' and situacao = 'anilhar'));

-- ---- Guardas ----------------------------------------------------------------
-- Anilhar de novo o mesmo filhote.
do $$
begin
  perform public.anilhar_filhotes(current_date, jsonb_build_array(
    jsonb_build_object('postura_id','cccccccc-0f0f-0f0f-0f0f-000000000001',
      'anilha_sigla','COF','anilha_criador','1234','anilha_ano',2026,'anilha_numero',503)));
  insert into veredito values ('anilhar duas vezes é barrado', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('anilhar duas vezes é barrado', 'barrado', 'barrado');
end $$;

-- Anilhar ovo que ainda não eclodiu.
do $$
begin
  perform public.anilhar_filhotes(current_date, jsonb_build_array(
    jsonb_build_object('postura_id','cccccccc-0f0f-0f0f-0f0f-000000000003',
      'anilha_sigla','COF','anilha_criador','1234','anilha_ano',2026,'anilha_numero',504)));
  insert into veredito values ('anilhar ovo não eclodido é barrado', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('anilhar ovo não eclodido é barrado', 'barrado', 'barrado');
end $$;

-- Anilha repetida no SEGUNDO filhote não pode deixar o primeiro criado.
do $$
begin
  perform public.anilhar_filhotes(current_date, jsonb_build_array(
    jsonb_build_object('postura_id','cccccccc-0f0f-0f0f-0f0f-000000000003',
      'anilha_sigla','COF','anilha_criador','1234','anilha_ano',2026,'anilha_numero',601),
    jsonb_build_object('postura_id','cccccccc-0f0f-0f0f-0f0f-000000000003',
      'anilha_sigla','COF','anilha_criador','1234','anilha_ano',2026,'anilha_numero',501)));
exception when others then null;
end $$;

insert into veredito values
  ('lote que falha não deixa ave solta', '0',
   (select count(*)::text from public.passaros where anilha_numero = 601));

select cenario, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from veredito;

rollback;
