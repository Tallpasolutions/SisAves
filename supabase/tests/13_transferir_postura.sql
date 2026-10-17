begin;

insert into auth.users (id, email, aud, role) values
  ('facafaca-0000-0000-0000-000000000001', 'babá-bia@teste.invalid', 'authenticated', 'authenticated');

insert into public.criatorios (id, owner_id, nome, slug) values
  ('facafaca-1111-1111-1111-111111111111','facafaca-0000-0000-0000-000000000001','Criatório Bia','bia-baba');

insert into public.especies (id, criatorio_id, nome, dias_choco, dias_anilha, dias_separa, dias_ovoscopia, janela_anilha_dias)
values ('facafaca-eeee-eeee-eeee-eeeeeeeeeeee','facafaca-1111-1111-1111-111111111111','Canário',
        14::smallint, 5::smallint, 40::smallint, 6::smallint, 2::smallint);

-- Dois casais: o que pôs e a babá.
insert into public.passaros (id, criatorio_id, nome, sexo, especie_id, dt_nascimento) values
  ('facafaca-aaaa-aaaa-aaaa-aaaaaaaaaaa1','facafaca-1111-1111-1111-111111111111','Pai legítimo','macho','facafaca-eeee-eeee-eeee-eeeeeeeeeeee', public.hoje() - 500),
  ('facafaca-aaaa-aaaa-aaaa-aaaaaaaaaaa2','facafaca-1111-1111-1111-111111111111','Mãe legítima','femea','facafaca-eeee-eeee-eeee-eeeeeeeeeeee', public.hoje() - 500),
  ('facafaca-aaaa-aaaa-aaaa-aaaaaaaaaaa3','facafaca-1111-1111-1111-111111111111','Pai babá','macho','facafaca-eeee-eeee-eeee-eeeeeeeeeeee', public.hoje() - 500),
  ('facafaca-aaaa-aaaa-aaaa-aaaaaaaaaaa4','facafaca-1111-1111-1111-111111111111','Mãe babá','femea','facafaca-eeee-eeee-eeee-eeeeeeeeeeee', public.hoje() - 500);

insert into public.casais (id, criatorio_id, numero, macho_id, femea_id, vigencia_inicio) values
  ('facafaca-cccc-cccc-cccc-cccccccccc01','facafaca-1111-1111-1111-111111111111',1,
   'facafaca-aaaa-aaaa-aaaa-aaaaaaaaaaa1','facafaca-aaaa-aaaa-aaaa-aaaaaaaaaaa2', public.hoje() - 100),
  ('facafaca-cccc-cccc-cccc-cccccccccc02','facafaca-1111-1111-1111-111111111111',2,
   'facafaca-aaaa-aaaa-aaaa-aaaaaaaaaaa3','facafaca-aaaa-aaaa-aaaa-aaaaaaaaaaa4', public.hoje() - 100),
  -- Encerrado: não recebe ovo para chocar.
  ('facafaca-cccc-cccc-cccc-cccccccccc03','facafaca-1111-1111-1111-111111111111',3,
   null, null, public.hoje() - 100);

update public.casais set vigencia_fim = public.hoje() - 1
 where id = 'facafaca-cccc-cccc-cccc-cccccccccc03';

insert into public.ninhadas (id, criatorio_id, casal_id, numero, iniciada_em)
values ('facafaca-dddd-dddd-dddd-dddddddddddd','facafaca-1111-1111-1111-111111111111',
        'facafaca-cccc-cccc-cccc-cccccccccc01', 1, public.hoje() - 20);

insert into public.posturas (id, criatorio_id, casal_id, ninhada_id, numero_ovo, data_postura, data_eclosao) values
  ('facafaca-0f0f-0f0f-0f0f-000000000001','facafaca-1111-1111-1111-111111111111','facafaca-cccc-cccc-cccc-cccccccccc01','facafaca-dddd-dddd-dddd-dddddddddddd',1, public.hoje() - 20, public.hoje() - 6),
  ('facafaca-0f0f-0f0f-0f0f-000000000002','facafaca-1111-1111-1111-111111111111','facafaca-cccc-cccc-cccc-cccccccccc01','facafaca-dddd-dddd-dddd-dddddddddddd',2, public.hoje() - 20, null),
  ('facafaca-0f0f-0f0f-0f0f-000000000003','facafaca-1111-1111-1111-111111111111','facafaca-cccc-cccc-cccc-cccccccccc01','facafaca-dddd-dddd-dddd-dddddddddddd',3, public.hoje() - 20, null);

create temp table veredito (cenario text, esperado text, obtido text);

-- ---- Transferir dois ovos para a babá ---------------------------------------
insert into veredito values
  ('dois ovos transferidos', '2',
   (select public.transferir_posturas(
      'facafaca-cccc-cccc-cccc-cccccccccc02',
      array['facafaca-0f0f-0f0f-0f0f-000000000001','facafaca-0f0f-0f0f-0f0f-000000000002']::uuid[],
      'fêmea abandonou o ninho')::text));

insert into veredito values
  ('quem choca mudou', '2',
   (select count(*)::text from public.posturas
     where casal_chocador_id = 'facafaca-cccc-cccc-cccc-cccccccccc02')),

  -- É o ponto todo: a filiação não se move com o ovo.
  ('de quem é o ovo NÃO mudou', '3',
   (select count(*)::text from public.posturas
     where casal_id = 'facafaca-cccc-cccc-cccc-cccccccccc01'
       and ninhada_id = 'facafaca-dddd-dddd-dddd-dddddddddddd')),

  ('a passagem ficou no histórico, com motivo', 'ok',
   (select case when count(*) = 2 then 'ok' else 'FALTOU' end
      from public.postura_transferencias
     where casal_destino_id = 'facafaca-cccc-cccc-cccc-cccccccccc02'
       and casal_origem_id = 'facafaca-cccc-cccc-cccc-cccccccccc01'
       and motivo = 'fêmea abandonou o ninho'
       and desfeita_em is null)),

  ('a view mostra onde o ovo está', '2',
   (select distinct casal_chocador_numero::text from public.vw_posturas
     where id = 'facafaca-0f0f-0f0f-0f0f-000000000002')),

  -- Os prazos são do embrião, não do ninho: continuam vindo do casal que pôs.
  ('a espécie e os prazos seguem os do casal de origem', 'Canário',
   (select especie_nome from public.vw_posturas
     where id = 'facafaca-0f0f-0f0f-0f0f-000000000002'));

-- ---- O filhote anilhado na babá continua filho de quem o pôs ----------------
select public.anilhar_filhotes(public.hoje(), jsonb_build_array(
  jsonb_build_object('postura_id','facafaca-0f0f-0f0f-0f0f-000000000001',
    'anilha_sigla','COF','anilha_criador','5555','anilha_ano',2026,'anilha_numero',601,'nome','Criado pela babá')));

insert into veredito values
  ('filhote criado pela babá mantém a filiação de origem', 'ok',
   (select case when pai_id = 'facafaca-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
                 and mae_id = 'facafaca-aaaa-aaaa-aaaa-aaaaaaaaaaa2'
           then 'ok' else 'FALTOU' end
      from public.passaros where anilha_numero = 601));

-- ---- Repetir a transferência não duplica o histórico ------------------------
insert into veredito values
  ('reenvio da mesma transferência move zero', '0',
   (select public.transferir_posturas(
      'facafaca-cccc-cccc-cccc-cccccccccc02',
      array['facafaca-0f0f-0f0f-0f0f-000000000002']::uuid[])::text));

insert into veredito values
  ('e não gera linha nova no histórico', '2',
   (select count(*)::text from public.postura_transferencias
     where postura_id in ('facafaca-0f0f-0f0f-0f0f-000000000001','facafaca-0f0f-0f0f-0f0f-000000000002')));

-- ---- Devolver ----------------------------------------------------------------
insert into veredito values
  ('devolver o ovo ao ninho de origem', 'true',
   (select public.devolver_postura('facafaca-0f0f-0f0f-0f0f-000000000002')::text));

insert into veredito values
  ('a postura volta sem chocador', 'ok',
   (select case when casal_chocador_id is null then 'ok' else 'FALTOU' end
      from public.posturas where id = 'facafaca-0f0f-0f0f-0f0f-000000000002')),

  ('a transferência fica no histórico, datada de fim', 'ok',
   (select case when desfeita_em is not null then 'ok' else 'FALTOU' end
      from public.postura_transferencias
     where postura_id = 'facafaca-0f0f-0f0f-0f0f-000000000002')),

  ('devolver de novo não é erro', 'false',
   (select public.devolver_postura('facafaca-0f0f-0f0f-0f0f-000000000002')::text));

-- ---- Guardas -----------------------------------------------------------------
do $$
begin
  perform public.transferir_posturas('facafaca-cccc-cccc-cccc-cccccccccc03',
    array['facafaca-0f0f-0f0f-0f0f-000000000003']::uuid[]);
  insert into veredito values ('casal encerrado não recebe ovo', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('casal encerrado não recebe ovo', 'barrado', 'barrado');
end $$;

do $$
begin
  perform public.transferir_posturas('facafaca-cccc-cccc-cccc-cccccccccc01',
    array['facafaca-0f0f-0f0f-0f0f-000000000003']::uuid[]);
  insert into veredito values ('transferir para o próprio casal é barrado', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('transferir para o próprio casal é barrado', 'barrado', 'barrado');
end $$;

update public.posturas set desfecho = 'perdido', desfecho_em = public.hoje()
 where id = 'facafaca-0f0f-0f0f-0f0f-000000000003';

do $$
begin
  perform public.transferir_posturas('facafaca-cccc-cccc-cccc-cccccccccc02',
    array['facafaca-0f0f-0f0f-0f0f-000000000003']::uuid[]);
  insert into veredito values ('ovo fora do ciclo não se transfere', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('ovo fora do ciclo não se transfere', 'barrado', 'barrado');
end $$;

-- A constraint é a garantia final.
do $$
begin
  update public.posturas set casal_chocador_id = casal_id
   where id = 'facafaca-0f0f-0f0f-0f0f-000000000002';
  insert into veredito values ('chocador igual ao dono é barrado pela constraint', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('chocador igual ao dono é barrado pela constraint', 'barrado', 'barrado');
end $$;

select cenario, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from veredito;

rollback;
