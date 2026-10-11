-- =============================================================================
-- SisAves · 0016 · Movimentações do criatório
--
-- O painel do desktop (prancha 4a) mostra "Últimas movimentações": o que
-- aconteceu no criatório, em ordem. Não existe tabela de eventos, e criar uma
-- obrigaria toda escrita a lembrar de registrar o próprio evento — o tipo de
-- acoplamento que acaba em histórico com buraco.
--
-- A view DERIVA os eventos dos fatos que já estão gravados, pelo mesmo
-- princípio da situação da postura: o que aconteceu está nas datas observadas.
-- Um evento não pode existir sem o fato, nem faltar quando o fato existe.
--
-- A view devolve FATOS, não frases. A sentença ("Postura registrada · 5 ovos")
-- é montada na interface, onde já vivem os rótulos do domínio.
-- =============================================================================

create or replace view public.vw_movimentacoes as

-- Postura: uma linha por ninhada, não por ovo.
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

-- Eclosão: agrupada por ninhada e dia, porque filhotes da mesma ninhada
-- costumam nascer juntos e seriam cinco linhas iguais.
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

-- Anilhamento: uma linha por ave, porque cada uma ganhou a sua anilha — é o
-- evento que o criador procura quando quer achar uma ave específica.
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

-- Perda e ovo infértil: desfecho declarado pelo criador. Agrupa por ninhada e
-- dia; a data é a do registro, porque o desfecho não tem data própria.
select
  p.criatorio_id,
  p.updated_at::date,
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
group by p.criatorio_id, p.updated_at::date, p.desfecho, c.id, c.numero, p.ninhada_id

union all

-- Pesagem: o peso vai em `quantidade`, em gramas, arredondado para inteiro.
-- A ficha da ave guarda a decimal; aqui é linha de histórico.
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

-- CRO emitido. A tabela está vazia até a Fase 8; incluir agora evita ter de
-- mexer na view depois.
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
where t.revogado_em is null;

comment on view public.vw_movimentacoes is
  'Histórico do criatório derivado dos fatos já gravados — não há tabela de eventos. Devolve fatos; a frase é montada na interface. Alimenta o painel do desktop.';

alter view public.vw_movimentacoes set (security_invoker = on);
