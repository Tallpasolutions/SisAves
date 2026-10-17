begin;

create temp table veredito (cenario text, esperado text, obtido text);

-- `public.hoje()` é a data do criatório, não a do servidor.
insert into veredito values
  ('hoje() segue o fuso de São Paulo', 'ok',
   (select case when public.hoje() = (now() at time zone 'America/Sao_Paulo')::date
           then 'ok' else 'FALTOU' end));

-- A diferença só aparece à noite, que é quando o criatório trabalha: das 21h
-- de Brasília à meia-noite, o UTC já está no dia seguinte.
insert into veredito values
  ('à meia-noite e meia UTC, o criatório ainda está no dia anterior', 'ok',
   (select case
      when (timestamptz '2026-03-10 00:30:00+00' at time zone 'America/Sao_Paulo')::date
         = date '2026-03-09'
      then 'ok' else 'FALTOU' end));

-- A máquina de estados usa o dia do criatório por padrão. Um ovo cuja
-- ovoscopia vence HOJE no Brasil não pode já estar vencida porque o servidor
-- virou o dia três horas antes.
insert into veredito values
  ('situacao_postura usa o dia do criatório por padrão', 'verificar',
   (select public.situacao_postura(
      public.hoje() - 6,   -- posta há 6 dias
      null, null, null, null, null, null,
      14::smallint, 6::smallint, 3::smallint, 40::smallint)::text)),

  ('e aceita um dia informado, para o cálculo offline', 'chocando',
   (select public.situacao_postura(
      public.hoje() - 6,
      null, null, null, null, null, null,
      14::smallint, 6::smallint, 3::smallint, 40::smallint,
      public.hoje() - 1)::text));

select cenario, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from veredito;

rollback;
