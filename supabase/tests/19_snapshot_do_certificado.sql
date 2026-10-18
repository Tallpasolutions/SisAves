begin;

-- O snapshot é o documento. O que entra nele vira papel impresso e vira
-- resposta pública de `validar_certificado` — que devolve o snapshot INTEIRO
-- a quem escaneia o QR, sem login. Por isso o que fica de FORA dele é tão
-- testável quanto o que entra.

insert into auth.users (id, email, aud, role) values
  ('5ab5ab5a-0000-0000-0000-000000000001', 'snap-sonia@teste.invalid', 'authenticated', 'authenticated');

-- O clube vem da semente (0011): `on conflict do nothing` com id próprio não
-- inseria nada, porque a sigla já existe — e a FK estourava em seguida.
insert into public.criatorios
  (id, owner_id, nome, slug, clube_id, nro_criador, registro_ibama, cidade, uf,
   whatsapp, instagram, logo_url)
values
  ('5ab5ab5a-1111-1111-1111-111111111111','5ab5ab5a-0000-0000-0000-000000000001',
   'Criatório Sônia','sonia-snap',
   (select id from public.clubes where sigla = 'SOB' limit 1),'219','CFT-123',
   'São João Batista','SC','48999990000','sonia.criatorio',
   'https://exemplo.invalid/logo.png');

-- O catálogo também vem da semente, e `grupo_id` é obrigatório nele: em vez
-- de inventar uma linha, uso o Curió que já existe.


insert into public.especies
  (id, criatorio_id, catalogo_id, nome, dias_choco, dias_anilha, dias_separa,
   dias_ovoscopia, janela_anilha_dias)
values ('5ab5ab5a-eeee-eeee-eeee-eeeeeeeeeeee','5ab5ab5a-1111-1111-1111-111111111111',
        (select id from public.especies_catalogo
          where nome_cientifico = 'Sporophila angolensis' limit 1),'Curió',
        14::smallint, 3::smallint, 40::smallint, 6::smallint, 1::smallint);

-- Quatro gerações completas de um lado: trisavô paterno paterno paterno
-- existe, e é ele que prova que a árvore sobe até a quarta.
--   T (trisavô) -> B (bisavô) -> A (avô) -> P (pai) -> raiz
insert into public.passaros (id, criatorio_id, nome, sexo, especie_id) values
  ('5ab5ab5a-7777-7777-7777-000000000001','5ab5ab5a-1111-1111-1111-111111111111','Trisavô','macho','5ab5ab5a-eeee-eeee-eeee-eeeeeeeeeeee');

insert into public.passaros (id, criatorio_id, nome, sexo, especie_id, pai_id) values
  ('5ab5ab5a-6666-6666-6666-000000000001','5ab5ab5a-1111-1111-1111-111111111111','Bisavô','macho','5ab5ab5a-eeee-eeee-eeee-eeeeeeeeeeee','5ab5ab5a-7777-7777-7777-000000000001');

insert into public.passaros (id, criatorio_id, nome, sexo, especie_id, pai_id) values
  ('5ab5ab5a-5555-5555-5555-000000000001','5ab5ab5a-1111-1111-1111-111111111111','Avô','macho','5ab5ab5a-eeee-eeee-eeee-eeeeeeeeeeee','5ab5ab5a-6666-6666-6666-000000000001');

insert into public.passaros (id, criatorio_id, nome, sexo, especie_id, pai_id) values
  ('5ab5ab5a-4444-4444-4444-000000000001','5ab5ab5a-1111-1111-1111-111111111111','Pai','macho','5ab5ab5a-eeee-eeee-eeee-eeeeeeeeeeee','5ab5ab5a-5555-5555-5555-000000000001');

insert into public.passaros
  (id, criatorio_id, nome, sexo, especie_id, pai_id,
   anilha_sigla, anilha_criador, anilha_ano, anilha_numero)
values ('5ab5ab5a-aaaa-aaaa-aaaa-000000000001','5ab5ab5a-1111-1111-1111-111111111111',
        'Raiz','macho','5ab5ab5a-eeee-eeee-eeee-eeeeeeeeeeee','5ab5ab5a-4444-4444-4444-000000000001',
        'SOB','219',2026,1);

create temp table veredito (cenario text, esperado text, obtido text);

create temp view snap as
  select public.montar_snapshot_certificado('5ab5ab5a-aaaa-aaaa-aaaa-000000000001') as s;

-- ---- O que ENTRA --------------------------------------------------------------
insert into veredito values
  ('a árvore sobe até a quarta geração', '4',
   (select max((a->>'geracao')::int)::text
      from snap, jsonb_array_elements(s->'genealogia') a)),

  ('o trisavô está lá, pelo caminho ppp', 'Trisavô',
   (select a->>'nome' from snap, jsonb_array_elements(s->'genealogia') a
     where a->>'caminho' = 'pppp')),

  ('o nome científico entra na ave', 'Sporophila angolensis',
   (select s->'ave'->>'especie_cientifica' from snap)),

  ('o criatório leva o que identifica a origem', 'ok',
   (select case when s->'criatorio'->>'nome' = 'Criatório Sônia'
                 and s->'criatorio'->>'clube' = 'SOB'
                 and s->'criatorio'->>'registro_ibama' = 'CFT-123'
                 and s->'criatorio'->>'logo_url' = 'https://exemplo.invalid/logo.png'
                then 'ok' else 'FALTOU' end from snap));

-- ---- O que NÃO entra, e é o ponto ---------------------------------------------
-- `validar_certificado` devolve o snapshot inteiro para visitante anônimo.
-- Acrescentar contato aqui dentro é publicá-lo na internet, e o comentário da
-- função promete o contrário — promessa que só vale se um teste a guardar.
insert into veredito values
  ('o WhatsApp do criador NÃO entra', 'ausente',
   (select case when s::text like '%48999990000%' then 'VAZOU' else 'ausente' end from snap)),

  ('o Instagram do criador NÃO entra', 'ausente',
   (select case when s::text like '%sonia.criatorio%' then 'VAZOU' else 'ausente' end from snap)),

  ('nenhuma chave de contato no bloco do criatório', 'ausente',
   (select case when (s->'criatorio') ?| array['whatsapp','instagram','telefone']
                then 'VAZOU' else 'ausente' end from snap));

-- ---- O que a emissão congela --------------------------------------------------
-- Certificado emitido não muda quando a ave muda: é a razão de o snapshot
-- existir, e já custou uma tela inteira para descobrir.
insert into veredito values
  ('emite e devolve id', 'true',
   (select (public.emitir_certificado('5ab5ab5a-aaaa-aaaa-aaaa-000000000001') is not null)::text));

update public.passaros set nome = 'Renomeada depois'
 where id = '5ab5ab5a-aaaa-aaaa-aaaa-000000000001';

insert into veredito values
  ('o nome congelado não muda com a ave', 'Raiz',
   (select snapshot->'ave'->>'nome' from public.certificados
     where passaro_id = '5ab5ab5a-aaaa-aaaa-aaaa-000000000001'));

-- ---- A chave de contato nas peças ---------------------------------------------
insert into veredito values
  ('contato_no_documento nasce ligado', 'true',
   (select contato_no_documento::text from public.criatorios
     where id = '5ab5ab5a-1111-1111-1111-111111111111'));

-- ---- O bucket da logo ----------------------------------------------------------
insert into veredito values
  ('o bucket das logos existe e é público', 'true',
   (select public::text from storage.buckets where id = 'criatorios')),

  ('e recusa SVG', 'ok',
   (select case when not ('image/svg+xml' = any (allowed_mime_types)) then 'ok' else 'ACEITA' end
      from storage.buckets where id = 'criatorios'));

select cenario, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from veredito;

rollback;
