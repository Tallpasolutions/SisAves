begin;

-- Um pedigree com ancestral repetido dos dois lados e um avô desconhecido —
-- o caso que a tela B6 precisa destacar e o CRO precisa provar.
--
--            Fundador (avô paterno E avô materno)
--             /                          \
--          Pai                          Mãe          (meios-irmãos)
--             \                          /
--                      Filhote (raiz)
--
-- A avó materna não está registrada: "Desconhecido" é estado de primeira classe.

insert into auth.users (id, email, aud, role) values
  ('dddddddd-0000-0000-0000-000000000001', 'arvore-dora@teste.invalid', 'authenticated', 'authenticated');

insert into public.criatorios (id, owner_id, nome, slug) values
  ('dddddddd-1111-1111-1111-111111111111','dddddddd-0000-0000-0000-000000000001','Criatório Dora','dora-arvore');

insert into public.passaros (id, criatorio_id, nome, sexo) values
  ('dddddddd-aaaa-0000-0000-00000000f001','dddddddd-1111-1111-1111-111111111111','Fundador','macho'),
  ('dddddddd-aaaa-0000-0000-00000000a001','dddddddd-1111-1111-1111-111111111111','Avó paterna','femea'),
  ('dddddddd-aaaa-0000-0000-00000000b001','dddddddd-1111-1111-1111-111111111111','Pai','macho'),
  ('dddddddd-aaaa-0000-0000-00000000c001','dddddddd-1111-1111-1111-111111111111','Mãe','femea'),
  ('dddddddd-aaaa-0000-0000-00000000d001','dddddddd-1111-1111-1111-111111111111','Filhote','indefinido');

update public.passaros set pai_id = 'dddddddd-aaaa-0000-0000-00000000f001',
                           mae_id = 'dddddddd-aaaa-0000-0000-00000000a001'
 where id = 'dddddddd-aaaa-0000-0000-00000000b001';

-- Mãe tem o mesmo pai e mãe desconhecida: meia-irmã do Pai.
update public.passaros set pai_id = 'dddddddd-aaaa-0000-0000-00000000f001'
 where id = 'dddddddd-aaaa-0000-0000-00000000c001';

update public.passaros set pai_id = 'dddddddd-aaaa-0000-0000-00000000b001',
                           mae_id = 'dddddddd-aaaa-0000-0000-00000000c001'
 where id = 'dddddddd-aaaa-0000-0000-00000000d001';

create temp table veredito (cenario text, esperado text, obtido text);

insert into veredito values
  ('o caminho coloca o pai em "p"', 'Pai',
   (select nome from public.arvore_genealogica('dddddddd-aaaa-0000-0000-00000000d001', 3) where caminho = 'p')),

  ('o caminho coloca a mãe em "m"', 'Mãe',
   (select nome from public.arvore_genealogica('dddddddd-aaaa-0000-0000-00000000d001', 3) where caminho = 'm')),

  ('avô paterno em "pp"', 'Fundador',
   (select nome from public.arvore_genealogica('dddddddd-aaaa-0000-0000-00000000d001', 3) where caminho = 'pp')),

  ('avó paterna em "pm"', 'Avó paterna',
   (select nome from public.arvore_genealogica('dddddddd-aaaa-0000-0000-00000000d001', 3) where caminho = 'pm')),

  ('avô materno em "mp"', 'Fundador',
   (select nome from public.arvore_genealogica('dddddddd-aaaa-0000-0000-00000000d001', 3) where caminho = 'mp')),

  -- Avó materna não existe: a função não inventa linha, e a tela mostra
  -- "Desconhecido" no lugar.
  ('avó materna ausente não vira linha', '0',
   (select count(*)::text from public.arvore_genealogica('dddddddd-aaaa-0000-0000-00000000d001', 3) where caminho = 'mm')),

  ('ancestral repetido aparece em dois caminhos', '2',
   (select count(*)::text from public.arvore_genealogica('dddddddd-aaaa-0000-0000-00000000d001', 3)
     where passaro_id = 'dddddddd-aaaa-0000-0000-00000000f001')),

  ('a raiz não se repete na árvore', '1',
   (select count(*)::text from public.arvore_genealogica('dddddddd-aaaa-0000-0000-00000000d001', 3)
     where caminho = 'raiz')),

  -- Meios-irmãos: um só progenitor em comum.
  ('endogamia de meios-irmãos é 12,5%', '12.50',
   (select public.coeficiente_endogamia('dddddddd-aaaa-0000-0000-00000000b001',
                                        'dddddddd-aaaa-0000-0000-00000000c001')::text)),

  ('profundidade respeita o limite pedido', '0',
   (select count(*)::text from public.arvore_genealogica('dddddddd-aaaa-0000-0000-00000000d001', 1)
     where geracao > 1)),

  ('o snapshot do CRO guarda o caminho', 'pp',
   (select g->>'caminho'
      from jsonb_array_elements(
             public.montar_snapshot_certificado('dddddddd-aaaa-0000-0000-00000000d001')->'genealogia') g
     where g->>'nome' = 'Fundador' and g->>'caminho' = 'pp'));

select cenario, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from veredito;

rollback;
