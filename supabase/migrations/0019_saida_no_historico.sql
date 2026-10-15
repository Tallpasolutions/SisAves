-- =============================================================================
-- SisAves · 0019 · A saída da ave entra no histórico
--
-- `vw_movimentacoes` deriva os eventos dos fatos gravados, para que nenhum
-- evento possa faltar quando o fato existe. Com 0018, passou a existir um fato
-- que ela não enxergava: a ave que deixou o plantel. Uma venda — o evento mais
-- significativo que um criatório registra — não aparecia no painel.
-- =============================================================================

create or replace view public.vw_movimentacoes as

select
  n.criatorio_id,
  n.iniciada_em                       as data,
  'postura'::text                     as tipo,
  count(p.id)::integer                as quantidade,
  c.id                                as casal_id,
  c.numero                            as casal_numero,
  n.id                                as ninhada_id,
  null::uuid                          as passaro_id,
  null::text                          as anilha_sigla,
  null::text                          as anilha_criador,
  null::smallint                      as anilha_ano,
  null::integer                       as anilha_numero
from public.ninhadas n
join public.casais c on c.id = n.casal_id
left join public.posturas p on p.ninhada_id = n.id and p.deleted_at is null
where n.deleted_at is null
group by n.criatorio_id, n.iniciada_em, c.id, c.numero, n.id

union all

-- Ovoscopia: só o resultado fértil. O ovo claro já aparece na sua própria
-- linha, e contar os dois faria o mesmo ovo surgir duas vezes no mesmo dia.
select
  p.criatorio_id,
  p.ovoscopia_em,
  'ovoscopia',
  count(*)::integer,
  c.id,
  c.numero,
  p.ninhada_id,
  null::uuid,
  null::text, null::text, null::smallint, null::integer
from public.posturas p
join public.casais c on c.id = p.casal_id
where p.deleted_at is null and p.ovoscopia_em is not null and p.fertil is true
group by p.criatorio_id, p.ovoscopia_em, c.id, c.numero, p.ninhada_id

union all

select
  p.criatorio_id,
  p.data_eclosao,
  'eclosao',
  count(*)::integer,
  c.id,
  c.numero,
  p.ninhada_id,
  null::uuid,
  null::text, null::text, null::smallint, null::integer
from public.posturas p
join public.casais c on c.id = p.casal_id
where p.deleted_at is null and p.data_eclosao is not null
group by p.criatorio_id, p.data_eclosao, c.id, c.numero, p.ninhada_id

union all

select
  p.criatorio_id,
  p.data_anilhamento,
  'anilhamento',
  1,
  c.id,
  c.numero,
  p.ninhada_id,
  a.id,
  a.anilha_sigla, a.anilha_criador, a.anilha_ano, a.anilha_numero
from public.posturas p
join public.casais c on c.id = p.casal_id
join public.passaros a on a.id = p.passaro_id and a.deleted_at is null
where p.deleted_at is null and p.data_anilhamento is not null

union all

-- Separação: fim do ciclo do ovo. Agrupada por ninhada e dia, como a eclosão.
select
  p.criatorio_id,
  p.data_separacao,
  'separacao',
  count(*)::integer,
  c.id,
  c.numero,
  p.ninhada_id,
  null::uuid,
  null::text, null::text, null::smallint, null::integer
from public.posturas p
join public.casais c on c.id = p.casal_id
where p.deleted_at is null and p.data_separacao is not null
group by p.criatorio_id, p.data_separacao, c.id, c.numero, p.ninhada_id

union all

-- Perda e ovo claro. A data agora é a do desfecho; `updated_at` fica só como
-- recurso para as linhas gravadas antes de 0017, que não têm a data.
select
  p.criatorio_id,
  coalesce(p.desfecho_em, p.updated_at::date),
  case when p.desfecho = 'infertil' then 'infertil' else 'perda' end,
  count(*)::integer,
  c.id,
  c.numero,
  p.ninhada_id,
  null::uuid,
  null::text, null::text, null::smallint, null::integer
from public.posturas p
join public.casais c on c.id = p.casal_id
where p.deleted_at is null and p.desfecho is not null
group by p.criatorio_id, coalesce(p.desfecho_em, p.updated_at::date),
         p.desfecho, c.id, c.numero, p.ninhada_id

union all

select
  g.criatorio_id,
  g.data,
  'pesagem',
  round(g.peso_gramas)::integer,
  null::uuid,
  null::integer,
  null::uuid,
  a.id,
  a.anilha_sigla, a.anilha_criador, a.anilha_ano, a.anilha_numero
from public.pesagens g
join public.passaros a on a.id = g.passaro_id and a.deleted_at is null
where g.deleted_at is null

union all

select
  t.criatorio_id,
  t.created_at::date,
  'certificado',
  1,
  null::uuid,
  null::integer,
  null::uuid,
  a.id,
  a.anilha_sigla, a.anilha_criador, a.anilha_ano, a.anilha_numero
from public.certificados t
join public.passaros a on a.id = t.passaro_id and a.deleted_at is null
where t.revogado_em is null

union all

-- Saída da ave: venda, doação, empréstimo, óbito e fuga. Uma linha por ave,
-- como o anilhamento — é o evento que o criador procura quando quer saber para
-- onde foi uma ave específica. A venda aparece aqui como fato; o dinheiro dela
-- vive no financeiro, e contá-lo duas vezes no mesmo histórico seria ruído.
select
  a.criatorio_id,
  coalesce(a.dt_obito, a.saida_em),
  case a.situacao
    when 'vendido'    then 'venda'
    when 'doado'      then 'doacao'
    when 'emprestado' then 'emprestimo'
    when 'morto'      then 'obito'
    else 'fuga'
  end,
  1,
  null::uuid,
  null::integer,
  null::uuid,
  a.id,
  a.anilha_sigla, a.anilha_criador, a.anilha_ano, a.anilha_numero
from public.passaros a
where a.deleted_at is null
  and a.situacao <> 'ativo'
  and coalesce(a.dt_obito, a.saida_em) is not null;

comment on view public.vw_movimentacoes is
  'Histórico do criatório derivado dos fatos já gravados — não há tabela de eventos. Devolve fatos; a frase é montada na interface. Alimenta o painel do desktop.';

alter view public.vw_movimentacoes set (security_invoker = on);
