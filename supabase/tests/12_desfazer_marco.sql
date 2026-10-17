begin;

insert into auth.users (id, email, aud, role) values
  ('dfdfdfdf-0000-0000-0000-000000000001', 'desfazer-dora@teste.invalid', 'authenticated', 'authenticated');

insert into public.criatorios (id, owner_id, nome, slug) values
  ('dfdfdfdf-1111-1111-1111-111111111111','dfdfdfdf-0000-0000-0000-000000000001','Criatório Dora','dora-desfazer');

insert into public.especies (id, criatorio_id, nome, dias_choco, dias_anilha, dias_separa, dias_ovoscopia, janela_anilha_dias)
values ('dfdfdfdf-eeee-eeee-eeee-eeeeeeeeeeee','dfdfdfdf-1111-1111-1111-111111111111','Calopsita',
        19::smallint, 6::smallint, 45::smallint, 7::smallint, 2::smallint);

insert into public.passaros (id, criatorio_id, nome, sexo, especie_id) values
  ('dfdfdfdf-aaaa-aaaa-aaaa-aaaaaaaaaaa1','dfdfdfdf-1111-1111-1111-111111111111','Pai','macho','dfdfdfdf-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('dfdfdfdf-aaaa-aaaa-aaaa-aaaaaaaaaaa2','dfdfdfdf-1111-1111-1111-111111111111','Mãe','femea','dfdfdfdf-eeee-eeee-eeee-eeeeeeeeeeee');

insert into public.casais (id, criatorio_id, numero, macho_id, femea_id, vigencia_inicio)
values ('dfdfdfdf-cccc-cccc-cccc-cccccccccccc','dfdfdfdf-1111-1111-1111-111111111111',1,
        'dfdfdfdf-aaaa-aaaa-aaaa-aaaaaaaaaaa1','dfdfdfdf-aaaa-aaaa-aaaa-aaaaaaaaaaa2', public.hoje() - 60);

insert into public.ninhadas (id, criatorio_id, casal_id, numero, iniciada_em)
values ('dfdfdfdf-dddd-dddd-dddd-dddddddddddd','dfdfdfdf-1111-1111-1111-111111111111',
        'dfdfdfdf-cccc-cccc-cccc-cccccccccccc', 1, public.hoje() - 30);

insert into public.posturas (id, criatorio_id, casal_id, ninhada_id, numero_ovo, data_postura, data_eclosao) values
  -- 1: ovo claro declarado por engano
  ('dfdfdfdf-0f0f-0f0f-0f0f-000000000001','dfdfdfdf-1111-1111-1111-111111111111','dfdfdfdf-cccc-cccc-cccc-cccccccccccc','dfdfdfdf-dddd-dddd-dddd-dddddddddddd',1, public.hoje() - 30, null),
  -- 2: ovoscopia positiva a desfazer
  ('dfdfdfdf-0f0f-0f0f-0f0f-000000000002','dfdfdfdf-1111-1111-1111-111111111111','dfdfdfdf-cccc-cccc-cccc-cccccccccccc','dfdfdfdf-dddd-dddd-dddd-dddddddddddd',2, public.hoje() - 30, null),
  -- 3: eclodiu, não anilhado
  ('dfdfdfdf-0f0f-0f0f-0f0f-000000000003','dfdfdfdf-1111-1111-1111-111111111111','dfdfdfdf-cccc-cccc-cccc-cccccccccccc','dfdfdfdf-dddd-dddd-dddd-dddddddddddd',3, public.hoje() - 30, public.hoje() - 11),
  -- 4: eclodiu e será anilhado
  ('dfdfdfdf-0f0f-0f0f-0f0f-000000000004','dfdfdfdf-1111-1111-1111-111111111111','dfdfdfdf-cccc-cccc-cccc-cccccccccccc','dfdfdfdf-dddd-dddd-dddd-dddddddddddd',4, public.hoje() - 30, public.hoje() - 11);

create temp table veredito (cenario text, esperado text, obtido text);

-- ---- Ovo claro declarado por engano -----------------------------------------
select public.registrar_marcos(public.hoje(), jsonb_build_array(
  jsonb_build_object('postura_id','dfdfdfdf-0f0f-0f0f-0f0f-000000000001','marco','infertil','motivo','engano')));

insert into veredito values
  ('o ovo entrou como infértil', 'infertil',
   (select situacao::text from public.vw_posturas where id = 'dfdfdfdf-0f0f-0f0f-0f0f-000000000001'));

select public.desfazer_marco('dfdfdfdf-0f0f-0f0f-0f0f-000000000001', 'desfecho');

insert into veredito values
  ('desfazer o desfecho devolve o ovo ao ciclo', 'ok',
   (select case when desfecho is null and desfecho_em is null and desfecho_motivo is null
                 -- 'infertil' gravou a ovoscopia junto: as duas voltam.
                 and fertil is null and ovoscopia_em is null
           then 'ok' else 'FALTOU' end
      from public.posturas where id = 'dfdfdfdf-0f0f-0f0f-0f0f-000000000001')),

  ('e o estado volta a ser derivado dos prazos', 'nascendo',
   (select situacao::text from public.vw_posturas where id = 'dfdfdfdf-0f0f-0f0f-0f0f-000000000001'));

-- ---- Desfazer o que não existe é silêncio -----------------------------------
insert into veredito values
  ('desfazer marco ausente devolve false, sem erro', 'false',
   (select public.desfazer_marco('dfdfdfdf-0f0f-0f0f-0f0f-000000000001', 'desfecho')::text));

-- ---- Ovoscopia ---------------------------------------------------------------
select public.registrar_marcos(public.hoje(), jsonb_build_array(
  jsonb_build_object('postura_id','dfdfdfdf-0f0f-0f0f-0f0f-000000000002','marco','fertil')));

select public.desfazer_marco('dfdfdfdf-0f0f-0f0f-0f0f-000000000002', 'ovoscopia');

insert into veredito values
  ('desfazer a ovoscopia limpa data e resultado', 'ok',
   (select case when ovoscopia_em is null and fertil is null then 'ok' else 'FALTOU' end
      from public.posturas where id = 'dfdfdfdf-0f0f-0f0f-0f0f-000000000002'));

-- ---- Eclosão de filhote não anilhado ----------------------------------------
select public.desfazer_marco('dfdfdfdf-0f0f-0f0f-0f0f-000000000003', 'eclosao');

insert into veredito values
  ('desfazer a eclosão limpa a data e a fertilidade deduzida', 'ok',
   (select case when data_eclosao is null and fertil is null then 'ok' else 'FALTOU' end
      from public.posturas where id = 'dfdfdfdf-0f0f-0f0f-0f0f-000000000003'));

-- ---- Eclosão de filhote anilhado é barrada ----------------------------------
select public.anilhar_filhotes(public.hoje() - 5, jsonb_build_array(
  jsonb_build_object('postura_id','dfdfdfdf-0f0f-0f0f-0f0f-000000000004',
    'anilha_sigla','COF','anilha_criador','3333','anilha_ano',2026,'anilha_numero',401,'nome','Anilhado')));

do $$
begin
  perform public.desfazer_marco('dfdfdfdf-0f0f-0f0f-0f0f-000000000004', 'eclosao');
  insert into veredito values ('desfazer eclosão de filhote anilhado é barrado', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('desfazer eclosão de filhote anilhado é barrado', 'barrado', 'barrado');
end $$;

-- ---- Perda de filhote anilhado desfaz também o óbito ------------------------
select public.registrar_marcos(public.hoje(), jsonb_build_array(
  jsonb_build_object('postura_id','dfdfdfdf-0f0f-0f0f-0f0f-000000000004','marco','perdido','motivo','engano')));

insert into veredito values
  ('a perda matou a ave junto', 'morto',
   (select situacao::text from public.passaros where anilha_numero = 401));

select public.desfazer_marco('dfdfdfdf-0f0f-0f0f-0f0f-000000000004', 'desfecho');

insert into veredito values
  ('desfazer a perda devolve a ave ao plantel', 'ok',
   (select case when situacao = 'ativo' and dt_obito is null then 'ok' else 'FALTOU' end
      from public.passaros where anilha_numero = 401)),

  ('e a postura volta ao ciclo', 'ok',
   (select case when desfecho is null and desfecho_em is null then 'ok' else 'FALTOU' end
      from public.posturas where id = 'dfdfdfdf-0f0f-0f0f-0f0f-000000000004'));

-- ---- Óbito de outra data não se apaga por aqui ------------------------------
-- A ave morreu por outro motivo, em outro dia: isso tem história própria.
update public.passaros set situacao = 'morto', dt_obito = public.hoje() - 2
 where anilha_numero = 401;
update public.posturas set desfecho = 'perdido', desfecho_em = public.hoje()
 where id = 'dfdfdfdf-0f0f-0f0f-0f0f-000000000004';

do $$
begin
  perform public.desfazer_marco('dfdfdfdf-0f0f-0f0f-0f0f-000000000004', 'desfecho');
  insert into veredito values ('óbito de outra data não é apagado por aqui', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('óbito de outra data não é apagado por aqui', 'barrado', 'barrado');
end $$;

-- ---- Marco inválido ----------------------------------------------------------
do $$
begin
  perform public.desfazer_marco('dfdfdfdf-0f0f-0f0f-0f0f-000000000002', 'chocadura');
  insert into veredito values ('marco desconhecido é barrado', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('marco desconhecido é barrado', 'barrado', 'barrado');
end $$;

select cenario, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from veredito;

rollback;
