-- =============================================================================
-- SisAves · 0032 · O financeiro na tela
--
-- As tabelas existem desde a 0007 e nunca tiveram interface. A B10 precisa de
-- duas coisas que o PostgREST não dá: soma por mês (não há `group by` na API) e
-- o padrão de data no fuso do criatório.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- O fuso nos padrões que a 0022 não alcançou
-- -----------------------------------------------------------------------------
-- A 0022 trocou `current_date` por `public.hoje()` nas funções e nas views, mas
-- não nos DEFAULT das colunas `date` — e `current_date` é UTC. Das 21h à
-- meia-noite, horário de Brasília, um lançamento gravado sem data explícita
-- nasce no dia seguinte: o mês fecha com uma despesa que ninguém lançou nele.
--
-- Hoje toda escrita da aplicação manda a data junto, então nenhum registro
-- errado existe por causa disto. É o padrão que fica certo antes de a próxima
-- escrita confiar nele.
alter table public.financeiro_lancamentos alter column data   set default public.hoje();
alter table public.tratamentos            alter column inicio set default public.hoje();
alter table public.pesagens               alter column data   set default public.hoje();
alter table public.casais       alter column vigencia_inicio set default public.hoje();
alter table public.ninhadas     alter column iniciada_em     set default public.hoje();
alter table public.assinaturas  alter column inicio          set default public.hoje();

-- -----------------------------------------------------------------------------
-- vw_financeiro_mensal
-- -----------------------------------------------------------------------------
-- O saldo dos últimos seis meses é o gráfico da B10, e o resumo do mês são os
-- três StatCards. Sem esta view a tela teria de baixar todos os lançamentos do
-- semestre para somar no navegador — e o criatório que lança todo saco de ração
-- tem centenas por mês.
--
-- Mês sem lançamento não aparece aqui. Ele não é zero no sentido de "fechou em
-- zero": é mês sem registro, e quem preenche a lacuna é a tela, que sabe quais
-- seis meses está mostrando.
create view public.vw_financeiro_mensal as
  select
    l.criatorio_id,
    date_trunc('month', l.data)::date as mes,
    sum(case when l.tipo = 'receita' then l.valor else 0 end) as receita,
    sum(case when l.tipo = 'despesa' then l.valor else 0 end) as despesa,
    -- O valor é sempre positivo e o sinal vem do tipo (ver 0007). O saldo é o
    -- único lugar que pode ser negativo, e é por isso que ele é calculado aqui
    -- em vez de a tela subtrair duas somas que podem ter vindo de meses
    -- diferentes.
    sum(case when l.tipo = 'receita' then l.valor else -l.valor end) as saldo,
    count(*) as lancamentos
  from public.financeiro_lancamentos l
  where l.deleted_at is null
  group by l.criatorio_id, date_trunc('month', l.data);

alter view public.vw_financeiro_mensal set (security_invoker = on);

comment on view public.vw_financeiro_mensal is
  'Receita, despesa, saldo e contagem por mês do criatório. Mês sem lançamento não tem linha — a lacuna é preenchida pela tela, que sabe quais meses está mostrando.';

grant select on public.vw_financeiro_mensal to authenticated;
