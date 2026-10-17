begin;

insert into auth.users (id, email, aud, role) values
  ('c20c20c2-0000-0000-0000-000000000001', 'cro-celia@teste.invalid', 'authenticated', 'authenticated');

insert into public.criatorios (id, owner_id, nome, slug, registro_ibama) values
  ('c20c20c2-1111-1111-1111-111111111111','c20c20c2-0000-0000-0000-000000000001','Criatório Célia','celia-cro','1234567');

insert into public.especies (id, criatorio_id, nome, dias_choco, dias_anilha, dias_separa, dias_ovoscopia, janela_anilha_dias)
values ('c20c20c2-eeee-eeee-eeee-eeeeeeeeeeee','c20c20c2-1111-1111-1111-111111111111','Curió',
        14::smallint, 3::smallint, 40::smallint, 6::smallint, 1::smallint);

insert into public.passaros (id, criatorio_id, nome, sexo, especie_id, dt_nascimento, anilha_sigla, anilha_criador, anilha_ano, anilha_numero) values
  ('c20c20c2-aaaa-aaaa-aaaa-aaaaaaaaaaa1','c20c20c2-1111-1111-1111-111111111111','Avô','macho','c20c20c2-eeee-eeee-eeee-eeeeeeeeeeee', public.hoje() - 900,'COF','8888',2024,101),
  ('c20c20c2-aaaa-aaaa-aaaa-aaaaaaaaaaa2','c20c20c2-1111-1111-1111-111111111111','Avó','femea','c20c20c2-eeee-eeee-eeee-eeeeeeeeeeee', public.hoje() - 900,'COF','8888',2024,102);

insert into public.passaros (id, criatorio_id, nome, sexo, especie_id, dt_nascimento, anilha_sigla, anilha_criador, anilha_ano, anilha_numero, pai_id, mae_id) values
  ('c20c20c2-aaaa-aaaa-aaaa-aaaaaaaaaaa3','c20c20c2-1111-1111-1111-111111111111','Pai','macho','c20c20c2-eeee-eeee-eeee-eeeeeeeeeeee', public.hoje() - 500,'COF','8888',2025,201,
   'c20c20c2-aaaa-aaaa-aaaa-aaaaaaaaaaa1','c20c20c2-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
  ('c20c20c2-aaaa-aaaa-aaaa-aaaaaaaaaaa4','c20c20c2-1111-1111-1111-111111111111','Mãe','femea','c20c20c2-eeee-eeee-eeee-eeeeeeeeeeee', public.hoje() - 500,'COF','8888',2025,202, null, null);

insert into public.passaros (id, criatorio_id, nome, sexo, especie_id, dt_nascimento, anilha_sigla, anilha_criador, anilha_ano, anilha_numero, pai_id, mae_id) values
  ('c20c20c2-aaaa-aaaa-aaaa-aaaaaaaaaaa5','c20c20c2-1111-1111-1111-111111111111','Certificada','macho','c20c20c2-eeee-eeee-eeee-eeeeeeeeeeee', public.hoje() - 100,'COF','8888',2026,301,
   'c20c20c2-aaaa-aaaa-aaaa-aaaaaaaaaaa3','c20c20c2-aaaa-aaaa-aaaa-aaaaaaaaaaa4');

-- Sem anilha: não há o que certificar.
insert into public.passaros (id, criatorio_id, nome, sexo, especie_id) values
  ('c20c20c2-aaaa-aaaa-aaaa-aaaaaaaaaaa6','c20c20c2-1111-1111-1111-111111111111','Sem anilha','indefinido','c20c20c2-eeee-eeee-eeee-eeeeeeeeeeee');

create temp table veredito (cenario text, esperado text, obtido text);
create temp table emitidos (ordem int, id uuid);

-- ---- Emissão -----------------------------------------------------------------
insert into emitidos
select 1, public.emitir_certificado('c20c20c2-aaaa-aaaa-aaaa-aaaaaaaaaaa5');

insert into veredito values
  ('o primeiro CRO do criatório é o número 1', '1',
   (select sequencial::text from public.certificados
     where id = (select id from emitidos where ordem = 1))),

  ('o hash é imprevisível e tem 18 caracteres', '18',
   (select length(hash)::text from public.certificados
     where id = (select id from emitidos where ordem = 1))),

  ('o snapshot guarda a anilha da ave', 'COF 8888 2026 301',
   (select concat_ws(' ',
             snapshot->'ave'->'anilha'->>'sigla',
             snapshot->'ave'->'anilha'->>'criador',
             snapshot->'ave'->'anilha'->>'ano',
             snapshot->'ave'->'anilha'->>'numero')
      from public.certificados where id = (select id from emitidos where ordem = 1))),

  -- Pai e mãe, mais o pai e a mãe DO PAI. A mãe não tem filiação
  -- registrada, então a árvore pára nela: quatro ancestrais, não seis.
  ('e a genealogia que existia na emissão', '4',
   (select jsonb_array_length(snapshot->'genealogia')::text
      from public.certificados where id = (select id from emitidos where ordem = 1))),

  -- A página pública prova a ave, não expõe o vendedor.
  ('nenhum contato do criador entra no snapshot', 'ok',
   (select case when snapshot->'criatorio' ? 'instagram'
                  or snapshot->'criatorio' ? 'whatsapp'
                  or snapshot ? 'owner_id'
             then 'VAZOU' else 'ok' end
      from public.certificados where id = (select id from emitidos where ordem = 1)));

-- ---- O snapshot congela ------------------------------------------------------
-- É o motivo de ele existir: a árvore muda quando o criador corrige a
-- filiação, e o CRO precisa continuar provando o que era verdade na emissão.
update public.passaros set nome = 'Nome trocado depois'
 where id = 'c20c20c2-aaaa-aaaa-aaaa-aaaaaaaaaaa5';

insert into veredito values
  ('renomear a ave não muda o CRO emitido', 'Certificada',
   (select snapshot->'ave'->>'nome' from public.certificados
     where id = (select id from emitidos where ordem = 1)));

update public.passaros set pai_id = null
 where id = 'c20c20c2-aaaa-aaaa-aaaa-aaaaaaaaaaa5';

insert into veredito values
  ('apagar a filiação não muda o CRO emitido', '4',
   (select jsonb_array_length(snapshot->'genealogia')::text
      from public.certificados where id = (select id from emitidos where ordem = 1)));

-- ---- Numeração sequencial ----------------------------------------------------
insert into emitidos
select 2, public.emitir_certificado('c20c20c2-aaaa-aaaa-aaaa-aaaaaaaaaaa3');

insert into veredito values
  ('o segundo CRO é o número 2', '2',
   (select sequencial::text from public.certificados
     where id = (select id from emitidos where ordem = 2))),

  ('a numeração não repete', 'ok',
   (select case when count(*) = count(distinct sequencial) then 'ok' else 'REPETIU' end
      from public.certificados
     where criatorio_id = 'c20c20c2-1111-1111-1111-111111111111'));

-- A mesma ave pode receber outro CRO: a primeira via se perde, a ave é
-- revendida. Cada emissão é um documento próprio, com número próprio.
insert into emitidos
select 3, public.emitir_certificado('c20c20c2-aaaa-aaaa-aaaa-aaaaaaaaaaa5');

insert into veredito values
  ('a mesma ave recebe um segundo CRO, com número novo', '3',
   (select sequencial::text from public.certificados
     where id = (select id from emitidos where ordem = 3)));

-- ---- Ave sem anilha é barrada ------------------------------------------------
do $$
begin
  perform public.emitir_certificado('c20c20c2-aaaa-aaaa-aaaa-aaaaaaaaaaa6');
  insert into veredito values ('ave sem anilha não recebe CRO', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('ave sem anilha não recebe CRO', 'barrado', 'barrado');
end $$;

-- ---- A porta pública ---------------------------------------------------------
insert into veredito values
  ('a validação encontra o CRO pelo hash e pelo número', 'true',
   (select (public.validar_certificado(c.hash, c.sequencial)->>'autentico')
      from public.certificados c where c.id = (select id from emitidos where ordem = 1))),

  ('hash errado não encontra nada', 'ok',
   (select case when public.validar_certificado('naoexiste000000000', c.sequencial) is null
             then 'ok' else 'ACHOU' end
      from public.certificados c where c.id = (select id from emitidos where ordem = 1))),

  -- Sem isto bastaria incrementar o sequencial para varrer os CRO alheios.
  ('número certo com hash de outro CRO não encontra nada', 'ok',
   (select case when public.validar_certificado(
                  (select hash from public.certificados where id = (select id from emitidos where ordem = 2)),
                  (select sequencial from public.certificados where id = (select id from emitidos where ordem = 1))
                ) is null
             then 'ok' else 'ACHOU' end from (select 1) x));

-- ---- Revogação ---------------------------------------------------------------
insert into veredito values
  ('revogar devolve true na primeira vez', 'true',
   (select public.revogar_certificado(
             (select id from emitidos where ordem = 2), 'emitido por engano')::text)),

  ('revogar de novo é silêncio, não erro', 'false',
   (select public.revogar_certificado(
             (select id from emitidos where ordem = 2))::text));

insert into veredito values
  ('o CRO revogado continua existindo e diz por quê', 'ok',
   (select case when (v->>'autentico')::boolean = false
                 and v->>'revogado_motivo' = 'emitido por engano'
                 and v->'dados'->'ave' is not null
             then 'ok' else 'FALTOU' end
      from (select public.validar_certificado(c.hash, c.sequencial) as v
              from public.certificados c
             where c.id = (select id from emitidos where ordem = 2)) t));

select cenario, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from veredito;

rollback;
