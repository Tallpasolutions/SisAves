-- Agapornis: choco 23d, ovoscopia 6d, anilhar 10d, separar 45d.
-- "hoje" é fixado em cada caso para o teste ser determinístico.
with casos(caso, data_postura, ovoscopia_em, fertil, data_eclosao, data_anilhamento, data_separacao, desfecho, hoje, esperado) as (values
  ('1. recém-posto',        date '2026-03-09', null::date, null::boolean, null::date, null::date, null::date, null::desfecho_postura, date '2026-03-10', 'chocando'),
  ('2. chegou a ovoscopia', date '2026-03-09', null,       null,          null,       null,       null,       null, date '2026-03-15', 'verificar'),
  ('3. ovoscopia já feita', date '2026-03-09', date '2026-03-15', true,   null,       null,       null,       null, date '2026-03-16', 'chocando'),
  ('4. véspera da eclosão', date '2026-03-09', date '2026-03-15', true,   null,       null,       null,       null, date '2026-03-31', 'nascendo'),
  ('5. eclodiu',            date '2026-03-09', date '2026-03-15', true,   date '2026-04-01', null, null,       null, date '2026-04-03', 'nascido'),
  ('6. janela de anilhar',  date '2026-03-09', date '2026-03-15', true,   date '2026-04-01', null, null,       null, date '2026-04-11', 'anilhar'),
  ('7. anilhado, crescendo',date '2026-03-09', date '2026-03-15', true,   date '2026-04-01', date '2026-04-11', null, null, date '2026-04-20', 'nascido'),
  ('8. hora de separar',    date '2026-03-09', date '2026-03-15', true,   date '2026-04-01', date '2026-04-11', null, null, date '2026-05-16', 'separar'),
  ('9. separado',           date '2026-03-09', date '2026-03-15', true,   date '2026-04-01', date '2026-04-11', date '2026-05-17', null, date '2026-05-20', 'separado'),
  ('10. ovo claro',         date '2026-03-09', date '2026-03-15', false,  null,       null,       null,       null, date '2026-03-16', 'infertil'),
  ('11. perda declarada',   date '2026-03-09', null,       null,          null,       null,       null,       'perdido', date '2026-03-20', 'perdido')
)
select caso,
       esperado,
       public.situacao_postura(data_postura, ovoscopia_em, fertil, data_eclosao,
         data_anilhamento, data_separacao, desfecho,
         23::smallint, 6::smallint, 10::smallint, 45::smallint, hoje)::text as obtido,
       case when public.situacao_postura(data_postura, ovoscopia_em, fertil, data_eclosao,
              data_anilhamento, data_separacao, desfecho,
              23::smallint, 6::smallint, 10::smallint, 45::smallint, hoje)::text = esperado
            then 'ok' else 'FALHOU' end as resultado
from casos;
