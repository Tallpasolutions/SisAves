-- =============================================================================
-- SisAves · 0011 · Semente do catálogo compartilhado
--
-- Dados fornecidos pelo cliente: 60 espécies de passeriformes brasileiros com
-- nome científico, período de incubação para 25 delas, e 33 clubes de Santa
-- Catarina.
--
-- Duas decisões registradas aqui:
--
-- 1. dias_choco recebe o MENOR valor da faixa informada (ex.: "12-13 dias"
--    vira 12) e dias_choco_max guarda o maior. A máquina de estados usa o
--    menor de propósito: o estado "nascendo" abre um dia antes da previsão,
--    então partir do piso faz o criador estar de olho ANTES da eclosão. Partir
--    do teto atrasaria o aviso e ele perderia o nascimento.
--
-- 2. dias_anilha e dias_separa ficam NULOS: o cliente ainda não forneceu esses
--    prazos, e inventá-los seria pior que deixá-los em branco — é dias_anilha
--    que dispara o estado crítico "anilhar", cuja janela, se perdida, faz a ave
--    não poder ser registrada. O criador informa ao adotar a espécie, e no
--    criatório (public.especies) as colunas seguem NOT NULL.
-- =============================================================================

-- Quatro dos clubes informados não têm sigla divulgada.
alter table public.clubes alter column sigla drop not null;

-- O catálogo é referência e pode estar incompleto; a espécie do criatório não.
alter table public.especies_catalogo alter column dias_anilha  drop not null;
alter table public.especies_catalogo alter column dias_separa  drop not null;
alter table public.especies_catalogo add column if not exists dias_choco_max smallint;
alter table public.especies_catalogo alter column dias_choco   drop not null;

comment on column public.especies_catalogo.dias_choco is
  'Piso da faixa de incubação informada. Ver decisão 1 na migration 0011.';
comment on column public.especies_catalogo.dias_choco_max is
  'Teto da faixa de incubação, quando conhecido. Usado só para exibir "12 a 13 dias".';


-- Grupos ---------------------------------------------------------------------
insert into public.grupos (nome, ordem) values
  ('Coleiros e patativas', 0),
  ('Cardeais e tico-ticos', 10),
  ('Azulões', 20),
  ('Canários e pintassilgos', 30),
  ('Sanhaços e saíras', 40),
  ('Icterídeos', 50),
  ('Trinca-ferros', 60),
  ('Sabiás', 70)
on conflict (nome) do nothing;

-- Clubes (Santa Catarina) ----------------------------------------------------
insert into public.clubes (sigla, nome, uf) values
  ('AOCE', 'Associação Ornitofílica Costa Esmeralda', 'SC'),
  ('BAC', 'Brusque Amantes de Coleiros', 'SC'),
  ('ACPJ', 'Associação dos Criadores de Pássaros de Joinville', 'SC'),
  ('UCPT', 'União de Criadores de Pássaros de Tubarão', 'SC'),
  ('ACPP', 'Associação dos Criadores de Pássaros de Palhoça', 'SC'),
  (null, 'Clube Amigos do Coleira', 'SC'),
  (null, 'Clube Ornitofílico de São Bento do Sul e Rio Negrinho', 'SC'),
  ('SOCO', 'Sociedade Oeste Catarinense de Ornitologia', 'SC'),
  (null, 'Sociedade Ornitológica Batistense', 'SC'),
  (null, 'Associação Blumenauense dos Criadores e Mantenedores de Pássaros Silvestres', 'SC'),
  ('CBO', 'Clube Brusquense de Ornitologia', 'SC'),
  ('SOCSC', 'Sociedade Ornitológica de Concórdia', 'SC'),
  ('UCRC', 'União Criciumense de Canaricultores', 'SC'),
  ('ACO', 'Associação Catarinense de Ornitologia', 'SC'),
  ('COF', 'Clube Ornitológico da Grande Florianópolis', 'SC'),
  ('ASOI', 'Associação Ornitológica Iporã do Oeste', 'SC'),
  ('SICO', 'Sociedade Itajaiense de Canaricultura e Ornitologia', 'SC'),
  ('CCAL', 'Criadores de Canários Amigos do Litoral', 'SC'),
  ('SJCO', 'Sociedade Jaraguaense de Canaricultura e Ornitologia', 'SC'),
  ('CJCC', 'Centro Joinvillense de Criadores de Canários', 'SC'),
  ('AJO', 'Associação Joinvilense de Ornitologia', 'SC'),
  ('ACOS', 'Associação de Canaricultura e Ornitologia Serrana', 'SC'),
  ('ALO', 'Associação Lageana de Ornitologia', 'SC'),
  ('ACAV-SC', 'Associação dos Criadores do Alto Vale', 'SC'),
  ('ARCO', 'Associação Rioframense de Canaricultura e Ornitologia', 'SC'),
  ('AOMAR', 'Associação Ornitológica de Maravilha', 'SC'),
  ('ARO', 'Associação Riosulense de Ornitologia', 'SC'),
  ('ASSO', 'Associação Sãobentense de Ornitologia', 'SC'),
  ('SOSMO', 'Sociedade Ornitológica de São Miguel do Oeste', 'SC'),
  ('UOSC', 'União Ornitológica Sul Catarinense', 'SC'),
  ('AVO', 'Associação Videirense de Ornitologia', 'SC'),
  ('SOMA', 'Sociedade Ornitológica dos Municípios de Amai', 'SC'),
  ('BCCB', 'Border Canary Club do Brasil', 'SC')
on conflict (sigla) do nothing;

-- Espécies -------------------------------------------------------------------
insert into public.especies_catalogo (grupo_id, nome_comum, nome_cientifico, dias_choco, dias_choco_max)
values
  ((select id from public.grupos where nome = 'Coleiros e patativas'), 'Curió', 'Sporophila angolensis', 12, 13),
  ((select id from public.grupos where nome = 'Coleiros e patativas'), 'Bicudo-verdadeiro', 'Sporophila maximiliani', 12, 13),
  ((select id from public.grupos where nome = 'Cardeais e tico-ticos'), 'Cardeal', 'Paroaria coronata', 13, 14),
  ((select id from public.grupos where nome = 'Cardeais e tico-ticos'), 'Galo-da-campina', 'Paroaria dominicana', 13, 14),
  ((select id from public.grupos where nome = 'Azulões'), 'Azulão-da-amazônia', 'Passerina cyanoides', null, null),
  ((select id from public.grupos where nome = 'Canários e pintassilgos'), 'Canário-da-terra', 'Sicalis flaveola brasiliensis', 13, 14),
  ((select id from public.grupos where nome = 'Coleiros e patativas'), 'Coleiro-papa-capim', 'Sporophila caerulescens', 12, 13),
  ((select id from public.grupos where nome = 'Coleiros e patativas'), 'Bigodinho', 'Sporophila lineola', 12, 13),
  ((select id from public.grupos where nome = 'Coleiros e patativas'), 'Pichochó', 'Sporophila frontalis', 12, 13),
  ((select id from public.grupos where nome = 'Coleiros e patativas'), 'Coleiro-baiano', 'Sporophila nigricollis', 12, 13),
  ((select id from public.grupos where nome = 'Cardeais e tico-ticos'), 'Tico-tico', 'Zonotrichia capensis', 12, 14),
  ((select id from public.grupos where nome = 'Coleiros e patativas'), 'Bicudo-pantaneiro', 'Sporophila maximiliani gigantirostris', 12, 13),
  ((select id from public.grupos where nome = 'Coleiros e patativas'), 'Bicudo-do-bico-preto', 'Sporophila maximiliani atrirostris', 12, 13),
  ((select id from public.grupos where nome = 'Cardeais e tico-ticos'), 'Tico-tico-rei', 'Coryphospingus cucullatus', 12, 13),
  ((select id from public.grupos where nome = 'Coleiros e patativas'), 'Coleiro-do-brejo', 'Sporophila collaris', 12, 13),
  ((select id from public.grupos where nome = 'Coleiros e patativas'), 'Patativa-verdadeira', 'Sporophila plumbea', 12, 13),
  ((select id from public.grupos where nome = 'Cardeais e tico-ticos'), 'Tico-tico-rei-cinza', 'Coryphospingus pileatus', null, null),
  ((select id from public.grupos where nome = 'Coleiros e patativas'), 'Cigarra-rainha', 'Sporophila leucoptera', null, null),
  ((select id from public.grupos where nome = 'Coleiros e patativas'), 'Cigarra-verdadeira', 'Sporophila falcirostris', null, null),
  ((select id from public.grupos where nome = 'Canários e pintassilgos'), 'Canário-chapinha', 'Sicalis flaveola pelzelni', 13, 14),
  ((select id from public.grupos where nome = 'Coleiros e patativas'), 'Tiziu', 'Volatinia jacarina', 11, 12),
  ((select id from public.grupos where nome = 'Cardeais e tico-ticos'), 'Cardeal-amarelo', 'Gubernatrix cristata', null, null),
  ((select id from public.grupos where nome = 'Coleiros e patativas'), 'Caboclinho-de-papo-escuro', 'Sporophila ruficollis', null, null),
  ((select id from public.grupos where nome = 'Coleiros e patativas'), 'Caboclinho', 'Sporophila bouvreuil', null, null),
  ((select id from public.grupos where nome = 'Sanhaços e saíras'), 'Cigarra-bambu', 'Haplospiza unicolor', null, null),
  ((select id from public.grupos where nome = 'Coleiros e patativas'), 'Caboclinho-lindo', 'Sporophila minuta', null, null),
  ((select id from public.grupos where nome = 'Coleiros e patativas'), 'Golinho', 'Sporophila albogularis', null, null),
  ((select id from public.grupos where nome = 'Coleiros e patativas'), 'Bicudinho', 'Sporophila crassirostris', null, null),
  ((select id from public.grupos where nome = 'Icterídeos'), 'Corrupião', 'Icterus jamacaii', 13, 14),
  ((select id from public.grupos where nome = 'Icterídeos'), 'Graúna', 'Gnorimopsar chopi', 13, 15),
  ((select id from public.grupos where nome = 'Icterídeos'), 'Iraúna-grande', 'Molothrus oryzivorus', null, null),
  ((select id from public.grupos where nome = 'Icterídeos'), 'Sargento', 'Agelasticus thilius', null, null),
  ((select id from public.grupos where nome = 'Icterídeos'), 'Tecelão', 'Cacicus chrysopterus', null, null),
  ((select id from public.grupos where nome = 'Icterídeos'), 'Xexéu', 'Cacicus cela', null, null),
  ((select id from public.grupos where nome = 'Azulões'), 'Azulão-verdadeiro', 'Cyanoloxia brissonii', 13, 14),
  ((select id from public.grupos where nome = 'Trinca-ferros'), 'Pimentão', 'Saltator fuliginosus', null, null),
  ((select id from public.grupos where nome = 'Trinca-ferros'), 'Trinca-ferro-verdadeiro', 'Saltator similis', 13, 14),
  ((select id from public.grupos where nome = 'Trinca-ferros'), 'Bico-duro', 'Saltator aurantiirostris', null, null),
  ((select id from public.grupos where nome = 'Azulões'), 'Azulinho', 'Cyanoloxia glaucocaerulea', null, null),
  ((select id from public.grupos where nome = 'Trinca-ferros'), 'Bico-de-pimenta', 'Saltator atricollis', null, null),
  ((select id from public.grupos where nome = 'Canários e pintassilgos'), 'Pintassilgo', 'Carduelis magellanicus', 12, 14),
  ((select id from public.grupos where nome = 'Canários e pintassilgos'), 'Pintassilgo-do-nordeste', 'Carduelis yarrellii', null, null),
  ((select id from public.grupos where nome = 'Sanhaços e saíras'), 'Gaturamo-de-bico-grosso', 'Euphonia laniirostris', null, null),
  ((select id from public.grupos where nome = 'Sabiás'), 'Sabiá-coleira', 'Turdus albicollis', null, null),
  ((select id from public.grupos where nome = 'Sabiás'), 'Sabiá-pocá', 'Turdus amaurochalinus', null, null),
  ((select id from public.grupos where nome = 'Sabiás'), 'Sabiá-da-mata', 'Turdus fumigatus', null, null),
  ((select id from public.grupos where nome = 'Sabiás'), 'Sabiá-laranjeira', 'Turdus rufiventris', 12, 13),
  ((select id from public.grupos where nome = 'Sabiás'), 'Sabiá-barranco', 'Turdus leucomelas', 12, 14),
  ((select id from public.grupos where nome = 'Sabiás'), 'Sabiá-una', 'Turdus flavipes', 12, 14),
  ((select id from public.grupos where nome = 'Sanhaços e saíras'), 'Sanhaço-frade', 'Stephanophorus diadematus', null, null),
  ((select id from public.grupos where nome = 'Sanhaços e saíras'), 'Sanhaço-cinzento', 'Thraupis sayaca', 12, 14),
  ((select id from public.grupos where nome = 'Trinca-ferros'), 'Tempera-viola', 'Saltator maximus', null, null),
  ((select id from public.grupos where nome = 'Sanhaços e saíras'), 'Bico-de-veludo', 'Schistochlamys ruficapillus', null, null),
  ((select id from public.grupos where nome = 'Sanhaços e saíras'), 'Tiê-sangue', 'Ramphocelus bresilius', 12, 14),
  ((select id from public.grupos where nome = 'Sanhaços e saíras'), 'Sanhaço-da-amazônia', 'Thraupis episcopus', null, null),
  ((select id from public.grupos where nome = 'Sanhaços e saíras'), 'Tiê-preto', 'Tachyphonus coronatus', 12, 14),
  ((select id from public.grupos where nome = 'Sanhaços e saíras'), 'Saíra-sete-cores', 'Tangara seledon', null, null),
  ((select id from public.grupos where nome = 'Sanhaços e saíras'), 'Sanhaço-do-coqueiro', 'Thraupis palmarum', null, null),
  ((select id from public.grupos where nome = 'Sanhaços e saíras'), 'Sanhaço-de-coleira', 'Schistochlamys melanopis', null, null),
  ((select id from public.grupos where nome = 'Sabiás'), 'Sabiá-do-campo', 'Mimus saturninus', null, null)
on conflict (grupo_id, nome_comum) do nothing;
