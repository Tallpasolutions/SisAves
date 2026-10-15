-- =============================================================================
-- SisAves · 0021 · Uma definição só de "casal ativo"
--
-- `casal_ativo()` nasceu em 0005 dizendo que o par encerrado HOJE ainda conta
-- como ativo (`vigencia_fim >= current_date`). A função nunca foi chamada por
-- ninguém — mas a aplicação copiou a regra, e ela produziu uma contradição
-- visível assim que o encerramento virou uma ação de verdade: a tela avisava
-- "o casal não aceita mais postura" e logo abaixo oferecia "Registrar postura".
--
-- A definição que o produto usa é a direta: ativo é o par que ainda não foi
-- encerrado. Que uma postura DAQUELE dia ainda caiba no casal é outra regra, e
-- ela vive na validação da postura, onde pertence.
--
-- Função morta que contradiz o produto é como o próximo erro entra.
-- =============================================================================

create or replace function public.casal_ativo(p_casal public.casais)
returns boolean language sql immutable as $$
  select p_casal.vigencia_fim is null;
$$;

comment on function public.casal_ativo is
  'Ativo é o casal ainda não encerrado. A postura datada no dia do encerramento continua aceita — essa regra é da postura, não daqui.';
