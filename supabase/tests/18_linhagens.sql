begin;

insert into auth.users (id, email, aud, role) values
  ('11a6e5a0-0000-0000-0000-000000000001', 'linha-lucia@teste.invalid', 'authenticated', 'authenticated'),
  ('11a6e5a0-0000-0000-0000-000000000002', 'linha-lauro@teste.invalid', 'authenticated', 'authenticated');

insert into public.criatorios (id, owner_id, nome, slug) values
  ('11a6e5a0-1111-1111-1111-111111111111','11a6e5a0-0000-0000-0000-000000000001','Criatório Lúcia','lucia-linha'),
  ('11a6e5a0-2222-2222-2222-222222222222','11a6e5a0-0000-0000-0000-000000000002','Criatório Lauro','lauro-linha');

-- O pedigree de meios-irmãos: o mesmo fundador chega ao neto pelos DOIS lados.
-- É o caso que separa `descendentes` de `ancestrais` — lá a repetição é o dado,
-- aqui ela seria contagem dobrada.
--
--            Fundador (macho) ─┬─ Fundadora
--                             │
--             Filho ──────────┴────────── Filha
--                       \            /
--                          Neto
insert into public.passaros (id, criatorio_id, nome, sexo) values
  ('11a6e5a0-aaaa-aaaa-aaaa-000000000001','11a6e5a0-1111-1111-1111-111111111111','Fundador','macho'),
  ('11a6e5a0-aaaa-aaaa-aaaa-000000000002','11a6e5a0-1111-1111-1111-111111111111','Fundadora','femea'),
  -- Fundador sem descendência: existe, mas não é linhagem.
  ('11a6e5a0-aaaa-aaaa-aaaa-000000000003','11a6e5a0-1111-1111-1111-111111111111','Solitário','macho');

insert into public.passaros (id, criatorio_id, nome, sexo, pai_id, mae_id) values
  ('11a6e5a0-bbbb-bbbb-bbbb-000000000001','11a6e5a0-1111-1111-1111-111111111111','Filho','macho',
   '11a6e5a0-aaaa-aaaa-aaaa-000000000001','11a6e5a0-aaaa-aaaa-aaaa-000000000002'),
  ('11a6e5a0-bbbb-bbbb-bbbb-000000000002','11a6e5a0-1111-1111-1111-111111111111','Filha','femea',
   '11a6e5a0-aaaa-aaaa-aaaa-000000000001','11a6e5a0-aaaa-aaaa-aaaa-000000000002');

insert into public.passaros (id, criatorio_id, nome, sexo, pai_id, mae_id) values
  ('11a6e5a0-cccc-cccc-cccc-000000000001','11a6e5a0-1111-1111-1111-111111111111','Neto','macho',
   '11a6e5a0-bbbb-bbbb-bbbb-000000000001','11a6e5a0-bbbb-bbbb-bbbb-000000000002');

-- Uma ave apagada não conta em linhagem nenhuma.
insert into public.passaros (id, criatorio_id, nome, sexo, pai_id, deleted_at) values
  ('11a6e5a0-cccc-cccc-cccc-000000000002','11a6e5a0-1111-1111-1111-111111111111','Apagada','femea',
   '11a6e5a0-bbbb-bbbb-bbbb-000000000001', now());

insert into public.passaros (id, criatorio_id, nome, sexo) values
  ('11a6e5a0-dddd-dddd-dddd-000000000001','11a6e5a0-2222-2222-2222-222222222222','Fundador do Lauro','macho');
insert into public.passaros (criatorio_id, nome, sexo, pai_id) values
  ('11a6e5a0-2222-2222-2222-222222222222','Filho do Lauro','macho','11a6e5a0-dddd-dddd-dddd-000000000001');

create temp table veredito (cenario text, esperado text, obtido text);
grant all on veredito to authenticated, anon;

-- ---- descendentes: uma linha por AVE, não por caminho ----------------------
insert into veredito values
  ('o neto aparece uma vez só, apesar dos dois caminhos', '1',
   (select count(*)::text from public.descendentes('11a6e5a0-aaaa-aaaa-aaaa-000000000001')
     where descendente_id = '11a6e5a0-cccc-cccc-cccc-000000000001')),

  ('e `ancestrais` continua contando os dois caminhos', '2',
   (select count(*)::text from public.ancestrais('11a6e5a0-cccc-cccc-cccc-000000000001')
     where ancestral_id = '11a6e5a0-aaaa-aaaa-aaaa-000000000001')),

  ('o fundador tem três descendentes vivos', '3',
   (select count(*)::text from public.descendentes('11a6e5a0-aaaa-aaaa-aaaa-000000000001'))),

  ('a ave apagada não entra', '0',
   (select count(*)::text from public.descendentes('11a6e5a0-aaaa-aaaa-aaaa-000000000001')
     where descendente_id = '11a6e5a0-cccc-cccc-cccc-000000000002')),

  ('a distância guardada é a mais curta', '1',
   (select geracoes::text from public.descendentes('11a6e5a0-aaaa-aaaa-aaaa-000000000001')
     where descendente_id = '11a6e5a0-bbbb-bbbb-bbbb-000000000001')),

  ('o neto está a duas gerações', '2',
   (select geracoes::text from public.descendentes('11a6e5a0-aaaa-aaaa-aaaa-000000000001')
     where descendente_id = '11a6e5a0-cccc-cccc-cccc-000000000001')),

  ('ave sem filhos não tem descendente', '0',
   (select count(*)::text from public.descendentes('11a6e5a0-aaaa-aaaa-aaaa-000000000003')));

-- ---- vw_linhagens -----------------------------------------------------------
insert into veredito values
  ('as linhagens do criatório são duas', '2',
   (select count(*)::text from public.vw_linhagens
     where criatorio_id = '11a6e5a0-1111-1111-1111-111111111111')),

  ('o fundador traz o tamanho da linhagem', '3',
   (select descendentes::text from public.vw_linhagens
     where passaro_id = '11a6e5a0-aaaa-aaaa-aaaa-000000000001')),

  ('e a profundidade dela', '2',
   (select geracoes::text from public.vw_linhagens
     where passaro_id = '11a6e5a0-aaaa-aaaa-aaaa-000000000001')),

  -- Fundador sem descendência é uma ave, não uma linhagem: a lista não pode
  -- virar uma segunda cópia do plantel.
  ('fundador sem descendência fica de fora', '0',
   (select count(*)::text from public.vw_linhagens
     where passaro_id = '11a6e5a0-aaaa-aaaa-aaaa-000000000003')),

  ('ave com progenitor registrado não é fundadora', '0',
   (select count(*)::text from public.vw_linhagens
     where passaro_id = '11a6e5a0-bbbb-bbbb-bbbb-000000000001'));

-- ---- Isolamento -------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11a6e5a0-0000-0000-0000-000000000001"}';

insert into veredito values
  ('Lúcia vê só as linhagens dela', '2',
   (select count(*)::text from public.vw_linhagens)),

  ('a linhagem do Lauro não aparece', '0',
   (select count(*)::text from public.vw_linhagens
     where passaro_id = '11a6e5a0-dddd-dddd-dddd-000000000001')),

  -- A função roda com os direitos de quem chama: a recursão não pode atravessar
  -- a RLS e contar filho de outro criatório.
  ('descendentes do fundador alheio vem vazio', '0',
   (select count(*)::text from public.descendentes('11a6e5a0-dddd-dddd-dddd-000000000001')));
reset role;

set local role anon;
set local request.jwt.claims = '';
insert into veredito values
  ('anônimo vê alguma linhagem (deve ser 0)', '0',
   (select count(*)::text from public.vw_linhagens));
reset role;

-- ---- O que o simulador da tela mostra ---------------------------------------
-- Filho e Filha têm o MESMO pai e a MESMA mãe: são irmãos completos, e o
-- cruzamento entre eles dá 25% — o dobro do limiar de risco do design. É o
-- número que aparece no simulador da genealogia antes de o casal existir.
insert into veredito values
  ('irmãos completos dão 25%', '25.00',
   (select public.coeficiente_endogamia(
      '11a6e5a0-bbbb-bbbb-bbbb-000000000001',
      '11a6e5a0-bbbb-bbbb-bbbb-000000000002')::text));

select cenario, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from veredito;

rollback;
