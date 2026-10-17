begin;

-- Um criatório com duas ninhadas: uma no meio do choco, outra já com filhotes
-- nascidos. Prazos curtos de propósito, para as duas caberem na mesma semana.
insert into auth.users (id, email, aud, role) values
  ('fdfdfdfd-0000-0000-0000-000000000001', 'marcos-mara@teste.invalid', 'authenticated', 'authenticated');

insert into public.criatorios (id, owner_id, nome, slug) values
  ('fdfdfdfd-1111-1111-1111-111111111111','fdfdfdfd-0000-0000-0000-000000000001','Criatório Mara','mara-marcos');

insert into public.especies (id, criatorio_id, nome, dias_choco, dias_anilha, dias_separa, dias_ovoscopia, janela_anilha_dias)
values ('fdfdfdfd-eeee-eeee-eeee-eeeeeeeeeeee','fdfdfdfd-1111-1111-1111-111111111111','Canário',
        14::smallint, 3::smallint, 40::smallint, 6::smallint, 1::smallint);

insert into public.passaros (id, criatorio_id, nome, sexo, especie_id) values
  ('fdfdfdfd-aaaa-aaaa-aaaa-aaaaaaaaaaa1','fdfdfdfd-1111-1111-1111-111111111111','Pai','macho','fdfdfdfd-eeee-eeee-eeee-eeeeeeeeeeee'),
  ('fdfdfdfd-aaaa-aaaa-aaaa-aaaaaaaaaaa2','fdfdfdfd-1111-1111-1111-111111111111','Mãe','femea','fdfdfdfd-eeee-eeee-eeee-eeeeeeeeeeee');

insert into public.casais (id, criatorio_id, numero, macho_id, femea_id, vigencia_inicio)
values ('fdfdfdfd-cccc-cccc-cccc-cccccccccccc','fdfdfdfd-1111-1111-1111-111111111111',1,
        'fdfdfdfd-aaaa-aaaa-aaaa-aaaaaaaaaaa1','fdfdfdfd-aaaa-aaaa-aaaa-aaaaaaaaaaa2', public.hoje() - 60);

insert into public.ninhadas (id, criatorio_id, casal_id, numero, iniciada_em) values
  ('fdfdfdfd-dddd-dddd-dddd-dddddddddd01','fdfdfdfd-1111-1111-1111-111111111111','fdfdfdfd-cccc-cccc-cccc-cccccccccccc', 1, public.hoje() - 8),
  ('fdfdfdfd-dddd-dddd-dddd-dddddddddd02','fdfdfdfd-1111-1111-1111-111111111111','fdfdfdfd-cccc-cccc-cccc-cccccccccccc', 2, public.hoje() - 18);

-- Ninhada 1: posta há 8 dias. Passou da janela de ovoscopia (6 dias) e ainda
-- está longe da eclosão (14) — exatamente o estado em que o criador abre o
-- ninho com a lanterna.
insert into public.posturas (id, criatorio_id, casal_id, ninhada_id, numero_ovo, data_postura) values
  ('fdfdfdfd-0f0f-0f0f-0f0f-000000000101','fdfdfdfd-1111-1111-1111-111111111111','fdfdfdfd-cccc-cccc-cccc-cccccccccccc','fdfdfdfd-dddd-dddd-dddd-dddddddddd01',1, public.hoje() - 8),
  ('fdfdfdfd-0f0f-0f0f-0f0f-000000000102','fdfdfdfd-1111-1111-1111-111111111111','fdfdfdfd-cccc-cccc-cccc-cccccccccccc','fdfdfdfd-dddd-dddd-dddd-dddddddddd01',2, public.hoje() - 8),
  ('fdfdfdfd-0f0f-0f0f-0f0f-000000000103','fdfdfdfd-1111-1111-1111-111111111111','fdfdfdfd-cccc-cccc-cccc-cccccccccccc','fdfdfdfd-dddd-dddd-dddd-dddddddddd01',3, public.hoje() - 8),
  ('fdfdfdfd-0f0f-0f0f-0f0f-000000000104','fdfdfdfd-1111-1111-1111-111111111111','fdfdfdfd-cccc-cccc-cccc-cccccccccccc','fdfdfdfd-dddd-dddd-dddd-dddddddddd01',4, public.hoje() - 8);

-- Ninhada 2: posta há 18 dias. Três filhotes já eclodidos e um ovo que ainda
-- não nasceu.
insert into public.posturas (id, criatorio_id, casal_id, ninhada_id, numero_ovo, data_postura, data_eclosao) values
  ('fdfdfdfd-0f0f-0f0f-0f0f-000000000201','fdfdfdfd-1111-1111-1111-111111111111','fdfdfdfd-cccc-cccc-cccc-cccccccccccc','fdfdfdfd-dddd-dddd-dddd-dddddddddd02',1, public.hoje() - 18, public.hoje() - 5),
  ('fdfdfdfd-0f0f-0f0f-0f0f-000000000202','fdfdfdfd-1111-1111-1111-111111111111','fdfdfdfd-cccc-cccc-cccc-cccccccccccc','fdfdfdfd-dddd-dddd-dddd-dddddddddd02',2, public.hoje() - 18, public.hoje() - 5),
  ('fdfdfdfd-0f0f-0f0f-0f0f-000000000203','fdfdfdfd-1111-1111-1111-111111111111','fdfdfdfd-cccc-cccc-cccc-cccccccccccc','fdfdfdfd-dddd-dddd-dddd-dddddddddd02',3, public.hoje() - 18, null),
  ('fdfdfdfd-0f0f-0f0f-0f0f-000000000204','fdfdfdfd-1111-1111-1111-111111111111','fdfdfdfd-cccc-cccc-cccc-cccccccccccc','fdfdfdfd-dddd-dddd-dddd-dddddddddd02',4, public.hoje() - 18, public.hoje() - 5);

create temp table veredito (cenario text, esperado text, obtido text);

-- ---- Estado de partida -------------------------------------------------------
insert into veredito values
  ('ovo de 8 dias pede ovoscopia', 'verificar',
   (select situacao::text from public.vw_posturas where id = 'fdfdfdfd-0f0f-0f0f-0f0f-000000000101'));

-- ---- Uma conferência, quatro marcos diferentes -------------------------------
-- É o caso real: o criador abre o ninho uma vez e encontra tudo junto.
insert into veredito values
  ('conferência grava os três marcos', '3',
   (select public.registrar_marcos(public.hoje(), jsonb_build_array(
      jsonb_build_object('postura_id','fdfdfdfd-0f0f-0f0f-0f0f-000000000101','marco','fertil'),
      jsonb_build_object('postura_id','fdfdfdfd-0f0f-0f0f-0f0f-000000000102','marco','infertil'),
      jsonb_build_object('postura_id','fdfdfdfd-0f0f-0f0f-0f0f-000000000103','marco','perdido','motivo','ovo quebrado')
    ))::text));

insert into veredito values
  ('ovo fértil volta a chocar', 'chocando',
   (select situacao::text from public.vw_posturas where id = 'fdfdfdfd-0f0f-0f0f-0f0f-000000000101')),

  ('ovoscopia ficou datada de hoje', 'ok',
   (select case when ovoscopia_em = public.hoje() and fertil then 'ok' else 'FALTOU' end
      from public.posturas where id = 'fdfdfdfd-0f0f-0f0f-0f0f-000000000101')),

  ('ovo claro vira infértil', 'infertil',
   (select situacao::text from public.vw_posturas where id = 'fdfdfdfd-0f0f-0f0f-0f0f-000000000102')),

  ('ovo quebrado vira perda, com data e motivo', 'ok',
   (select case when desfecho = 'perdido' and desfecho_em = public.hoje()
                 and desfecho_motivo = 'ovo quebrado' then 'ok' else 'FALTOU' end
      from public.posturas where id = 'fdfdfdfd-0f0f-0f0f-0f0f-000000000103')),

  ('ovo não marcado segue como estava', 'verificar',
   (select situacao::text from public.vw_posturas where id = 'fdfdfdfd-0f0f-0f0f-0f0f-000000000104'));

-- ---- Repetir a mesma conferência não grava de novo ---------------------------
-- É o reenvio da fila offline: a primeira tentativa chegou, só a resposta se
-- perdeu. O fato já está lá, e aplicar outra vez duplicaria o histórico.
insert into veredito values
  ('reenvio da mesma conferência aplica zero', '0',
   (select public.registrar_marcos(public.hoje(), jsonb_build_array(
      jsonb_build_object('postura_id','fdfdfdfd-0f0f-0f0f-0f0f-000000000101','marco','fertil'),
      jsonb_build_object('postura_id','fdfdfdfd-0f0f-0f0f-0f0f-000000000102','marco','infertil'),
      jsonb_build_object('postura_id','fdfdfdfd-0f0f-0f0f-0f0f-000000000103','marco','perdido')
    ))::text));

-- ---- Eclosão -----------------------------------------------------------------
-- Cada chamada em comando próprio: dentro de um mesmo INSERT, as linhas que
-- leem usam o snapshot do início do comando e não veem a escrita feita por
-- outra linha dele.
insert into veredito values
  ('eclosão registrada', '1',
   (select public.registrar_marcos(public.hoje(), jsonb_build_array(
      jsonb_build_object('postura_id','fdfdfdfd-0f0f-0f0f-0f0f-000000000203','marco','eclodiu')
    ))::text));

insert into veredito values
  ('filhote recém-nascido fica em nascido', 'nascido',
   (select situacao::text from public.vw_posturas where id = 'fdfdfdfd-0f0f-0f0f-0f0f-000000000203')),

  -- Ovo que eclodiu era fértil, mas a ovoscopia não foi feita: inventar a data
  -- da observação seria inventar a observação.
  ('eclosão deduz fértil sem inventar ovoscopia', 'ok',
   (select case when fertil and ovoscopia_em is null then 'ok' else 'FALTOU' end
      from public.posturas where id = 'fdfdfdfd-0f0f-0f0f-0f0f-000000000203'));

-- ---- Separar antes de anilhar é barrado --------------------------------------
-- 'separado' é terminal e vence a janela de anilha: o filhote sairia da fila de
-- tarefas sem nunca ter virado ave no plantel.
do $$
begin
  perform public.registrar_marcos(public.hoje(), jsonb_build_array(
    jsonb_build_object('postura_id','fdfdfdfd-0f0f-0f0f-0f0f-000000000202','marco','separado')));
  insert into veredito values ('separar filhote não anilhado é barrado', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('separar filhote não anilhado é barrado', 'barrado', 'barrado');
end $$;

-- ---- Separação depois do anilhamento -----------------------------------------
select public.anilhar_filhotes(public.hoje(), jsonb_build_array(
  jsonb_build_object('postura_id','fdfdfdfd-0f0f-0f0f-0f0f-000000000201',
    'anilha_sigla','COF','anilha_criador','9999','anilha_ano',2026,'anilha_numero',801,'nome','Primeiro'),
  jsonb_build_object('postura_id','fdfdfdfd-0f0f-0f0f-0f0f-000000000204',
    'anilha_sigla','COF','anilha_criador','9999','anilha_ano',2026,'anilha_numero',804,'nome','Quarto')
));

insert into veredito values
  ('separação registrada', '1',
   (select public.registrar_marcos(public.hoje(), jsonb_build_array(
      jsonb_build_object('postura_id','fdfdfdfd-0f0f-0f0f-0f0f-000000000204','marco','separado')
    ))::text));

insert into veredito values
  ('ciclo encerrado em separado', 'separado',
   (select situacao::text from public.vw_posturas where id = 'fdfdfdfd-0f0f-0f0f-0f0f-000000000204'));

-- ---- Perda de filhote já anilhado mata a ave no plantel ----------------------
-- Marcar só a postura deixaria a ave viva na listagem, contada no plantel ativo
-- e disponível para formar casal.
insert into veredito values
  ('perda de filhote anilhado registrada', '1',
   (select public.registrar_marcos(public.hoje(), jsonb_build_array(
      jsonb_build_object('postura_id','fdfdfdfd-0f0f-0f0f-0f0f-000000000201','marco','perdido','motivo','não vingou')
    ))::text));

insert into veredito values
  ('a ave do filhote perdido consta como morta', 'ok',
   (select case when situacao = 'morto' and dt_obito = public.hoje() then 'ok' else 'FALTOU' end
      from public.passaros where anilha_numero = 801)),

  ('plantel ativo não conta a ave perdida', '1',
   (select count(*)::text from public.passaros
     where criatorio_id = 'fdfdfdfd-1111-1111-1111-111111111111'
       and anilha_numero in (801, 804) and situacao = 'ativo'));

-- ---- Guardas -----------------------------------------------------------------
do $$
begin
  perform public.registrar_marcos(public.hoje() + 1, jsonb_build_array(
    jsonb_build_object('postura_id','fdfdfdfd-0f0f-0f0f-0f0f-000000000104','marco','fertil')));
  insert into veredito values ('conferência no futuro é barrada', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('conferência no futuro é barrada', 'barrado', 'barrado');
end $$;

do $$
begin
  perform public.registrar_marcos(public.hoje() - 30, jsonb_build_array(
    jsonb_build_object('postura_id','fdfdfdfd-0f0f-0f0f-0f0f-000000000104','marco','fertil')));
  insert into veredito values ('conferência antes da postura é barrada', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('conferência antes da postura é barrada', 'barrado', 'barrado');
end $$;

do $$
begin
  perform public.registrar_marcos(public.hoje(), jsonb_build_array(
    jsonb_build_object('postura_id','fdfdfdfd-0f0f-0f0f-0f0f-000000000102','marco','eclodiu')));
  insert into veredito values ('eclodir ovo já declarado claro é barrado', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('eclodir ovo já declarado claro é barrado', 'barrado', 'barrado');
end $$;

-- Marco inválido no FIM do lote não pode deixar o começo gravado: o criador
-- voltaria à tela sem saber o que entrou.
do $$
begin
  perform public.registrar_marcos(public.hoje(), jsonb_build_array(
    jsonb_build_object('postura_id','fdfdfdfd-0f0f-0f0f-0f0f-000000000104','marco','fertil'),
    jsonb_build_object('postura_id','fdfdfdfd-0f0f-0f0f-0f0f-000000000104','marco','chocou')));
exception when others then null;
end $$;

insert into veredito values
  ('lote que falha no fim não grava o começo', 'ok',
   (select case when ovoscopia_em is null then 'ok' else 'FALTOU' end
      from public.posturas where id = 'fdfdfdfd-0f0f-0f0f-0f0f-000000000104'));

-- ---- O histórico do painel ---------------------------------------------------
insert into veredito values
  ('ovoscopia entra nas movimentações', '1',
   (select count(*)::text from public.vw_movimentacoes
     where criatorio_id = 'fdfdfdfd-1111-1111-1111-111111111111'
       and tipo = 'ovoscopia' and data = public.hoje())),

  ('separação entra nas movimentações', '1',
   (select count(*)::text from public.vw_movimentacoes
     where criatorio_id = 'fdfdfdfd-1111-1111-1111-111111111111'
       and tipo = 'separacao' and data = public.hoje())),

  ('perda é datada pelo desfecho, não pelo registro', '2',
   (select coalesce(sum(quantidade),0)::text from public.vw_movimentacoes
     where criatorio_id = 'fdfdfdfd-1111-1111-1111-111111111111'
       and tipo = 'perda' and data = public.hoje()));

select cenario, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from veredito;

rollback;
