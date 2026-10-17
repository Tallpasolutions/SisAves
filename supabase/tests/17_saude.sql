begin;

insert into auth.users (id, email, aud, role) values
  ('5a0d5a0d-0000-0000-0000-000000000001', 'saude-sandra@teste.invalid', 'authenticated', 'authenticated'),
  ('5a0d5a0d-0000-0000-0000-000000000002', 'saude-sergio@teste.invalid', 'authenticated', 'authenticated');

insert into public.criatorios (id, owner_id, nome, slug) values
  ('5a0d5a0d-1111-1111-1111-111111111111','5a0d5a0d-0000-0000-0000-000000000001','Criatório Sandra','sandra-saude'),
  ('5a0d5a0d-2222-2222-2222-222222222222','5a0d5a0d-0000-0000-0000-000000000002','Criatório Sérgio','sergio-saude');

insert into public.passaros (id, criatorio_id, nome, sexo) values
  ('5a0d5a0d-aaaa-aaaa-aaaa-000000000001','5a0d5a0d-1111-1111-1111-111111111111','Peitica','femea');

-- Um medicamento com carência e outro sem: a carência é o que distingue o
-- registro sanitário de uma anotação solta.
insert into public.medicamentos (id, criatorio_id, nome, carencia_dias) values
  ('5a0d5a0d-dddd-dddd-dddd-000000000001','5a0d5a0d-1111-1111-1111-111111111111','Vermífugo', 7),
  ('5a0d5a0d-dddd-dddd-dddd-000000000002','5a0d5a0d-1111-1111-1111-111111111111','Vitamina',  null);

insert into public.doencas (id, criatorio_id, nome) values
  ('5a0d5a0d-eeee-eeee-eeee-000000000001','5a0d5a0d-1111-1111-1111-111111111111','Verminose do galpão');

insert into public.sintomas (id, criatorio_id, nome) values
  ('5a0d5a0d-5555-5555-5555-000000000001','5a0d5a0d-1111-1111-1111-111111111111','Apatia observada'),
  ('5a0d5a0d-5555-5555-5555-000000000002','5a0d5a0d-1111-1111-1111-111111111111','Penas eriçadas aqui'),
  ('5a0d5a0d-5555-5555-5555-000000000003','5a0d5a0d-1111-1111-1111-111111111111','Perda de peso aqui');

create temp table veredito (cenario text, esperado text, obtido text);
grant all on veredito to authenticated, anon;

-- ---- A carência -------------------------------------------------------------
-- Encerrado há três dias, carência de sete: faltam quatro.
insert into public.tratamentos (id, criatorio_id, passaro_id, medicamento_id, doenca_id, inicio, fim)
values ('5a0d5a0d-7777-7777-7777-000000000001','5a0d5a0d-1111-1111-1111-111111111111',
        '5a0d5a0d-aaaa-aaaa-aaaa-000000000001','5a0d5a0d-dddd-dddd-dddd-000000000001',
        '5a0d5a0d-eeee-eeee-eeee-000000000001', public.hoje() - 8, public.hoje() - 3);

insert into veredito values
  ('a carência conta do FIM, não do início', 'ok',
   (select case when carencia_ate = public.hoje() + 4 then 'ok'
                else 'FALTOU: ' || coalesce(carencia_ate::text,'nula') end
      from public.vw_tratamentos where id = '5a0d5a0d-7777-7777-7777-000000000001')),

  ('e ela está correndo', 'true',
   (select carencia_ativa::text from public.vw_tratamentos
     where id = '5a0d5a0d-7777-7777-7777-000000000001')),

  ('tratamento encerrado não está em curso', 'false',
   (select em_curso::text from public.vw_tratamentos
     where id = '5a0d5a0d-7777-7777-7777-000000000001'));

-- Carência vencida: a ave volta a estar livre.
insert into public.tratamentos (id, criatorio_id, passaro_id, medicamento_id, inicio, fim)
values ('5a0d5a0d-7777-7777-7777-000000000002','5a0d5a0d-1111-1111-1111-111111111111',
        '5a0d5a0d-aaaa-aaaa-aaaa-000000000001','5a0d5a0d-dddd-dddd-dddd-000000000001',
        public.hoje() - 40, public.hoje() - 30);

insert into veredito values
  ('carência vencida não está ativa', 'false',
   (select carencia_ativa::text from public.vw_tratamentos
     where id = '5a0d5a0d-7777-7777-7777-000000000002'));

-- Em curso: a carência EXISTE no medicamento, mas a data ainda não existe —
-- ela conta do fim, e enquanto ele não chega a data seria um alvo móvel.
insert into public.tratamentos (id, criatorio_id, passaro_id, medicamento_id, inicio)
values ('5a0d5a0d-7777-7777-7777-000000000003','5a0d5a0d-1111-1111-1111-111111111111',
        '5a0d5a0d-aaaa-aaaa-aaaa-000000000001','5a0d5a0d-dddd-dddd-dddd-000000000001',
        public.hoje() - 2);

insert into veredito values
  ('sem fim, o tratamento está em curso', 'true',
   (select em_curso::text from public.vw_tratamentos
     where id = '5a0d5a0d-7777-7777-7777-000000000003')),

  ('em curso não tem data de carência', 'ok',
   (select case when carencia_ate is null then 'ok' else 'FALTOU: ' || carencia_ate::text end
      from public.vw_tratamentos where id = '5a0d5a0d-7777-7777-7777-000000000003')),

  ('mas os dias do medicamento aparecem', '7',
   (select carencia_dias::text from public.vw_tratamentos
     where id = '5a0d5a0d-7777-7777-7777-000000000003'));

-- Fim no futuro é "termina sexta": segue em curso.
insert into public.tratamentos (id, criatorio_id, passaro_id, medicamento_id, inicio, fim)
values ('5a0d5a0d-7777-7777-7777-000000000004','5a0d5a0d-1111-1111-1111-111111111111',
        '5a0d5a0d-aaaa-aaaa-aaaa-000000000001','5a0d5a0d-dddd-dddd-dddd-000000000002',
        public.hoje() - 1, public.hoje() + 3);

insert into veredito values
  ('fim no futuro ainda é em curso', 'true',
   (select em_curso::text from public.vw_tratamentos
     where id = '5a0d5a0d-7777-7777-7777-000000000004')),

  ('medicamento sem carência não inventa data', 'ok',
   (select case when carencia_ate is null and carencia_ativa = false then 'ok'
                else 'FALTOU' end
      from public.vw_tratamentos where id = '5a0d5a0d-7777-7777-7777-000000000004'));

-- ---- As guardas da tabela ---------------------------------------------------
do $$
begin
  insert into public.tratamentos (criatorio_id, inicio)
  values ('5a0d5a0d-1111-1111-1111-111111111111', public.hoje());
  insert into veredito values ('tratamento sem alvo é recusado', 'recusa', 'ACEITOU');
exception when check_violation then
  insert into veredito values ('tratamento sem alvo é recusado', 'recusa', 'recusa');
end $$;

do $$
begin
  insert into public.tratamentos (criatorio_id, passaro_id, inicio, fim)
  values ('5a0d5a0d-1111-1111-1111-111111111111','5a0d5a0d-aaaa-aaaa-aaaa-000000000001',
          public.hoje(), public.hoje() - 5);
  insert into veredito values ('fim antes do início é recusado', 'recusa', 'ACEITOU');
exception when check_violation then
  insert into veredito values ('fim antes do início é recusado', 'recusa', 'recusa');
end $$;

-- ---- Os vínculos N:N, gravados inteiros -------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"5a0d5a0d-0000-0000-0000-000000000001"}';

insert into veredito values
  ('três sintomas entram de uma vez', '3',
   (select public.definir_sintomas_da_doenca(
      '5a0d5a0d-eeee-eeee-eeee-000000000001',
      array['5a0d5a0d-5555-5555-5555-000000000001',
            '5a0d5a0d-5555-5555-5555-000000000002',
            '5a0d5a0d-5555-5555-5555-000000000003']::uuid[])::text));

-- Reaplicar o MESMO conjunto não duplica: é o que permite a escrita entrar na
-- fila offline sem chave própria.
insert into veredito values
  ('o mesmo conjunto de novo continua três', '3',
   (select public.definir_sintomas_da_doenca(
      '5a0d5a0d-eeee-eeee-eeee-000000000001',
      array['5a0d5a0d-5555-5555-5555-000000000001',
            '5a0d5a0d-5555-5555-5555-000000000002',
            '5a0d5a0d-5555-5555-5555-000000000003']::uuid[])::text));

-- Conjunto menor: o que saiu da lista sai do vínculo. É o ponto de gravar o
-- conjunto inteiro, e não vínculos avulsos.
insert into veredito values
  ('tirar um da lista tira o vínculo', '2',
   (select public.definir_sintomas_da_doenca(
      '5a0d5a0d-eeee-eeee-eeee-000000000001',
      array['5a0d5a0d-5555-5555-5555-000000000001',
            '5a0d5a0d-5555-5555-5555-000000000003']::uuid[])::text));

insert into veredito values
  ('o sintoma retirado não ficou', '0',
   (select count(*)::text from public.doenca_sintomas
     where doenca_id = '5a0d5a0d-eeee-eeee-eeee-000000000001'
       and sintoma_id = '5a0d5a0d-5555-5555-5555-000000000002'));

insert into veredito values
  ('lista vazia limpa os vínculos', '0',
   (select public.definir_sintomas_da_doenca(
      '5a0d5a0d-eeee-eeee-eeee-000000000001', array[]::uuid[])::text));

insert into veredito values
  ('o medicamento guarda as doenças que trata', '1',
   (select public.definir_doencas_do_medicamento(
      '5a0d5a0d-dddd-dddd-dddd-000000000001',
      array['5a0d5a0d-eeee-eeee-eeee-000000000001']::uuid[])::text));

-- ---- Isolamento -------------------------------------------------------------
insert into veredito values
  ('Sandra vê os quatro tratamentos dela', '4',
   (select count(*)::text from public.vw_tratamentos));
reset role;

set local role authenticated;
set local request.jwt.claims = '{"sub":"5a0d5a0d-0000-0000-0000-000000000002"}';
insert into veredito values
  ('Sérgio vê tratamento da Sandra (deve ser 0)', '0',
   (select count(*)::text from public.vw_tratamentos)),

  ('e o medicamento dela também não', '0',
   (select count(*)::text from public.medicamentos
     where criatorio_id = '5a0d5a0d-1111-1111-1111-111111111111'));
reset role;

-- ---- O catálogo compartilhado é de todos ------------------------------------
-- Ele é legível por qualquer autenticado (0009) e não recebe vínculo de
-- ninguém: os sintomas de uma doença são os que AQUELE criatório observou.
set local role authenticated;
set local request.jwt.claims = '{"sub":"5a0d5a0d-0000-0000-0000-000000000002"}';
insert into veredito values
  ('a doença do catálogo é visível para outro criatório', 'true',
   (select (count(*) > 0)::text from public.doencas where criatorio_id is null));
reset role;

-- ---- O fuso no padrão de início ---------------------------------------------
insert into public.tratamentos (criatorio_id, passaro_id, dosagem)
values ('5a0d5a0d-1111-1111-1111-111111111111','5a0d5a0d-aaaa-aaaa-aaaa-000000000001','sem data');

insert into veredito values
  ('tratamento sem data começa no hoje do criatório', 'ok',
   (select case when inicio = public.hoje() then 'ok' else 'FALTOU: ' || inicio::text end
      from public.tratamentos where dosagem = 'sem data'));

select cenario, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from veredito;

rollback;
