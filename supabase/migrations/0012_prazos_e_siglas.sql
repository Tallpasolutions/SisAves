-- =============================================================================
-- SisAves · 0012 · Prazos de anilhamento/separação e as siglas que faltavam
--
-- Dados informados pelo cliente em 30/09/2026:
--   "Anilhar com 3 dias até 4"  -> dias_anilha = 3, janela = 1 (último dia é o 4º)
--   "40 dias separa"            -> dias_separa = 40
--   Siglas dos quatro clubes que não as divulgavam.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Siglas faltantes
-- -----------------------------------------------------------------------------
-- Em caixa alta, como as outras 29 já cadastradas.
update public.clubes set sigla = 'CAC'
 where sigla is null and nome = 'Clube Amigos do Coleira';

update public.clubes set sigla = 'SOB'
 where sigla is null and nome = 'Sociedade Ornitológica Batistense';

update public.clubes set sigla = 'ASSB'
 where sigla is null and nome = 'Associação Blumenauense dos Criadores e Mantenedores de Pássaros Silvestres';

update public.clubes set sigla = 'COSB'
 where sigla is null and nome = 'Clube Ornitofílico de São Bento do Sul e Rio Negrinho';

-- A sigla volta a ser obrigatória: o formato da anilha depende dela.
alter table public.clubes alter column sigla set not null;

-- -----------------------------------------------------------------------------
-- Janela de anilhamento
-- -----------------------------------------------------------------------------
-- O padrão anterior (3 dias de folga) era chute meu. O cliente informou que a
-- anilha entra no 3º dia e ainda passa no 4º — ou seja, UM dia de folga.
-- É por isso que "anilhar" é o único estado em âmbar: a janela tem dois dias.
alter table public.especies alter column janela_anilha_dias set default 1;

alter table public.especies_catalogo
  add column if not exists janela_anilha_dias smallint;

comment on column public.especies.janela_anilha_dias is
  'Dias de folga após dias_anilha. Cliente informou 1: anilha no 3º dia, último dia útil é o 4º.';

-- -----------------------------------------------------------------------------
-- Prazos no catálogo
-- -----------------------------------------------------------------------------
-- Valor único para as 60 espécies, conforme informado. Todas são passeriformes
-- brasileiros de porte próximo, então um prazo comum é defensável — mas os
-- maiores (sabiás, icterídeos, graúna) costumam anilhar mais tarde que um
-- coleiro, e isso deve ser revisto com o cliente espécie a espécie.
update public.especies_catalogo
   set dias_anilha = 3,
       janela_anilha_dias = 1,
       dias_separa = 40
 where dias_anilha is null;

-- As colunas do catálogo seguem aceitando nulo de propósito: uma espécie nova
-- pode entrar sem prazo conhecido. No criatório (public.especies) continuam
-- obrigatórias — lá o criador precisa ter decidido.
