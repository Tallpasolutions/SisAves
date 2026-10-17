-- =============================================================================
-- SisAves · 0025 · Quem está chocando aparece nas telas
--
-- 0024 criou `posturas.casal_chocador_id`. Sem levá-la às views, o ovo
-- transferido continuaria listado no ninho de origem — e o criador iria
-- procurá-lo na gaiola errada, que é o problema que a transferência existe
-- para resolver.
--
-- A ESPÉCIE e os prazos continuam vindo do casal que pôs: eles são do embrião,
-- não do ninho. Só a localização muda.
-- =============================================================================

create or replace view public.vw_posturas as
select
  p.id,
  p.criatorio_id,
  p.casal_id,
  c.numero                as casal_numero,
  p.ninhada_id,
  r.numero                as ninhada_numero,
  p.numero_ovo,
  p.data_postura,
  p.ovoscopia_em,
  p.fertil,
  p.data_eclosao,
  p.data_anilhamento,
  p.data_separacao,
  p.desfecho,
  p.passaro_id,
  e.id                    as especie_id,
  e.nome                  as especie_nome,

  (p.data_postura + e.dias_ovoscopia)::date              as previsao_ovoscopia,
  (p.data_postura + e.dias_choco)::date                  as previsao_eclosao,
  (p.data_eclosao + e.dias_anilha)::date                 as previsao_anilhamento,
  (p.data_eclosao + e.dias_anilha + e.janela_anilha_dias)::date as limite_anilhamento,
  (p.data_eclosao + e.dias_separa)::date                 as previsao_separacao,

  public.situacao_postura(
    p.data_postura, p.ovoscopia_em, p.fertil, p.data_eclosao,
    p.data_anilhamento, p.data_separacao, p.desfecho,
    e.dias_choco, e.dias_ovoscopia, e.dias_anilha, e.dias_separa
  ) as situacao,

  case
    when p.data_eclosao is not null
     and p.data_anilhamento is null
     and public.hoje() > p.data_eclosao + e.dias_anilha + e.janela_anilha_dias
    then true else false
  end as anilhamento_vencido,

  case
    when p.data_eclosao is not null and p.data_anilhamento is null
    then (p.data_eclosao + e.dias_anilha + e.janela_anilha_dias) - public.hoje()
  end as dias_restantes_anilha,

  p.observacoes,
  p.created_at,
  p.updated_at,
  p.desfecho_motivo,
  p.desfecho_em,
  p.casal_chocador_id,
  cc.numero as casal_chocador_numero
from public.posturas p
join public.casais   c on c.id = p.casal_id
left join public.casais cc on cc.id = p.casal_chocador_id
left join public.ninhadas r on r.id = p.ninhada_id
left join public.passaros mp on mp.id = c.macho_id
left join public.passaros fp on fp.id = c.femea_id
left join public.especies e  on e.id = coalesce(mp.especie_id, fp.especie_id)
where p.deleted_at is null;

alter view public.vw_posturas set (security_invoker = on);

-- -----------------------------------------------------------------------------
-- A agenda do dia aponta para onde o ovo ESTÁ
-- -----------------------------------------------------------------------------
create or replace view public.vw_tarefas_hoje as
select
  v.criatorio_id,
  v.id            as postura_id,
  v.casal_id,
  v.casal_numero,
  v.ninhada_numero,
  v.especie_nome,
  v.situacao,
  case v.situacao
    when 'anilhar'   then 1   -- janela fecha e a ave perde valor: máxima prioridade
    when 'verificar' then 2
    when 'nascendo'  then 3
    when 'separar'   then 4
    else 9
  end as prioridade,
  v.dias_restantes_anilha,
  v.anilhamento_vencido,
  v.previsao_eclosao,
  v.limite_anilhamento,
  case v.situacao
    when 'anilhar'   then 'Anilhar filhote'
    when 'verificar' then 'Fazer ovoscopia'
    when 'nascendo'  then 'Eclosão prevista'
    when 'separar'   then 'Separar filhote'
  end as acao,
  v.ninhada_id,
  v.casal_chocador_numero
from public.vw_posturas v
where v.situacao in ('anilhar','verificar','nascendo','separar');

alter view public.vw_tarefas_hoje set (security_invoker = on);
