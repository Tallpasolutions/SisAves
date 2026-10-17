begin;

insert into auth.users (id, email, aud, role) values
  ('da7ada7a-0000-0000-0000-000000000001', 'data-dalva@teste.invalid', 'authenticated', 'authenticated');

insert into public.criatorios (id, owner_id, nome, slug) values
  ('da7ada7a-1111-1111-1111-111111111111','da7ada7a-0000-0000-0000-000000000001','Criatório Dalva','dalva-data');

insert into public.especies (id, criatorio_id, nome, dias_choco, dias_anilha, dias_separa, dias_ovoscopia, janela_anilha_dias)
values ('da7ada7a-eeee-eeee-eeee-eeeeeeeeeeee','da7ada7a-1111-1111-1111-111111111111','Curió',
        14::smallint, 3::smallint, 40::smallint, 6::smallint, 1::smallint);

insert into public.passaros (id, criatorio_id, nome, sexo, especie_id) values
  ('da7ada7a-aaaa-aaaa-aaaa-aaaaaaaaaaa1','da7ada7a-1111-1111-1111-111111111111','Pai','macho','da7ada7a-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('da7ada7a-aaaa-aaaa-aaaa-aaaaaaaaaaa2','da7ada7a-1111-1111-1111-111111111111','Mãe','femea','da7ada7a-eeee-eeee-eeee-eeeeeeeeeeee');

insert into public.casais (id, criatorio_id, numero, macho_id, femea_id, vigencia_inicio)
values ('da7ada7a-cccc-cccc-cccc-cccccccccccc','da7ada7a-1111-1111-1111-111111111111',1,
        'da7ada7a-aaaa-aaaa-aaaa-aaaaaaaaaaa1','da7ada7a-aaaa-aaaa-aaaa-aaaaaaaaaaa2', public.hoje() - 60);

insert into public.ninhadas (id, criatorio_id, casal_id, numero, iniciada_em)
values ('da7ada7a-dddd-dddd-dddd-dddddddddddd','da7ada7a-1111-1111-1111-111111111111',
        'da7ada7a-cccc-cccc-cccc-cccccccccccc', 1, public.hoje() - 25);

insert into public.posturas (id, criatorio_id, casal_id, ninhada_id, numero_ovo, data_postura) values
  ('da7ada7a-0f0f-0f0f-0f0f-000000000001','da7ada7a-1111-1111-1111-111111111111','da7ada7a-cccc-cccc-cccc-cccccccccccc','da7ada7a-dddd-dddd-dddd-dddddddddddd',1, public.hoje() - 25),
  ('da7ada7a-0f0f-0f0f-0f0f-000000000002','da7ada7a-1111-1111-1111-111111111111','da7ada7a-cccc-cccc-cccc-cccccccccccc','da7ada7a-dddd-dddd-dddd-dddddddddddd',2, public.hoje() - 25),
  ('da7ada7a-0f0f-0f0f-0f0f-000000000003','da7ada7a-1111-1111-1111-111111111111','da7ada7a-cccc-cccc-cccc-cccccccccccc','da7ada7a-dddd-dddd-dddd-dddddddddddd',3, public.hoje() - 25);

create temp table veredito (cenario text, esperado text, obtido text);

-- ---- Eclosão lançada com a data errada ---------------------------------------
-- O caso real: o criador encontra o filhote na segunda e lança como se tivesse
-- nascido naquele dia; depois lembra que nasceu no sábado.
select public.registrar_marcos(public.hoje() - 9, jsonb_build_array(
  jsonb_build_object('postura_id','da7ada7a-0f0f-0f0f-0f0f-000000000001','marco','eclodiu')));

insert into veredito values
  ('a eclosão corrige para dois dias antes', 'true',
   (select public.corrigir_data_marco(
      'da7ada7a-0f0f-0f0f-0f0f-000000000001', 'eclosao', public.hoje() - 11)::text));

insert into veredito values
  ('a data nova é a que ficou', 'ok',
   (select case when data_eclosao = public.hoje() - 11 then 'ok' else 'FALTOU' end
      from public.posturas where id = 'da7ada7a-0f0f-0f0f-0f0f-000000000001')),

  ('e a fertilidade deduzida continua lá', 'true',
   (select fertil::text from public.posturas
     where id = 'da7ada7a-0f0f-0f0f-0f0f-000000000001'));

-- Mesma data: não é erro, e não é escrita.
insert into veredito values
  ('corrigir para a mesma data devolve false', 'false',
   (select public.corrigir_data_marco(
      'da7ada7a-0f0f-0f0f-0f0f-000000000001', 'eclosao', public.hoje() - 11)::text));

-- ---- O desfecho leva o motivo junto ------------------------------------------
select public.registrar_marcos(public.hoje(), jsonb_build_array(
  jsonb_build_object('postura_id','da7ada7a-0f0f-0f0f-0f0f-000000000002','marco','perdido','motivo','ovo quebrado')));

insert into veredito values
  ('a perda corrige a data', 'true',
   (select public.corrigir_data_marco(
      'da7ada7a-0f0f-0f0f-0f0f-000000000002', 'desfecho', public.hoje() - 3)::text));

insert into veredito values
  ('data nova, desfecho e motivo preservados', 'ok',
   (select case when desfecho = 'perdido' and desfecho_em = public.hoje() - 3
                 and desfecho_motivo = 'ovo quebrado'
           then 'ok' else 'FALTOU' end
      from public.posturas where id = 'da7ada7a-0f0f-0f0f-0f0f-000000000002'));

-- ---- A data recusada não derruba a que estava --------------------------------
-- É o ponto da transação: `registrar_marcos` recusa data anterior à postura, e
-- o ovo não pode ficar sem registro nenhum por causa de um erro de digitação.
do $$
begin
  perform public.corrigir_data_marco(
    'da7ada7a-0f0f-0f0f-0f0f-000000000002', 'desfecho', public.hoje() - 300);
exception when others then null;
end $$;

insert into veredito values
  ('data recusada deixa a anterior valendo', 'ok',
   (select case when desfecho = 'perdido' and desfecho_em = public.hoje() - 3
           then 'ok' else 'FALTOU' end
      from public.posturas where id = 'da7ada7a-0f0f-0f0f-0f0f-000000000002'));

do $$
begin
  perform public.corrigir_data_marco(
    'da7ada7a-0f0f-0f0f-0f0f-000000000002', 'desfecho', public.hoje() + 1);
  insert into veredito values ('data no futuro é barrada', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('data no futuro é barrada', 'barrado', 'barrado');
end $$;

-- ---- Marco ausente, e marco desconhecido -------------------------------------
do $$
begin
  perform public.corrigir_data_marco(
    'da7ada7a-0f0f-0f0f-0f0f-000000000003', 'eclosao', public.hoje());
  insert into veredito values ('corrigir marco que não existe é barrado', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('corrigir marco que não existe é barrado', 'barrado', 'barrado');
end $$;

do $$
begin
  perform public.corrigir_data_marco(
    'da7ada7a-0f0f-0f0f-0f0f-000000000001', 'chocadura', public.hoje());
  insert into veredito values ('marco desconhecido é barrado', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('marco desconhecido é barrado', 'barrado', 'barrado');
end $$;

-- ---- As guardas de desfazer continuam valendo --------------------------------
-- Filhote anilhado: a eclosão é o fato que criou a ave, e não se mexe nela por
-- aqui. A guarda vem de `desfazer_marco`, que esta função chama.
select public.anilhar_filhotes(public.hoje() - 7, jsonb_build_array(
  jsonb_build_object('postura_id','da7ada7a-0f0f-0f0f-0f0f-000000000001',
    'anilha_sigla','COF','anilha_criador','4444','anilha_ano',2026,'anilha_numero',801)));

do $$
begin
  perform public.corrigir_data_marco(
    'da7ada7a-0f0f-0f0f-0f0f-000000000001', 'eclosao', public.hoje() - 12);
  insert into veredito values ('eclosão de filhote anilhado não muda de data', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('eclosão de filhote anilhado não muda de data', 'barrado', 'barrado');
end $$;

insert into veredito values
  ('e a eclosão original segue intacta', 'ok',
   (select case when data_eclosao = public.hoje() - 11 then 'ok' else 'FALTOU' end
      from public.posturas where id = 'da7ada7a-0f0f-0f0f-0f0f-000000000001'));

select cenario, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from veredito;

rollback;
