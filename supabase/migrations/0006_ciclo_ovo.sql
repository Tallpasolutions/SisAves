-- =============================================================================
-- SisAves · 0006 · Máquina de estados do ovo
--
-- Regra de ouro: a situação NUNCA é armazenada. Ela é calculada a partir dos
-- fatos observados (datas) e dos prazos da espécie. No sistema legado a
-- situação era uma coluna gravada, o que produzia registros "congelados" —
-- um ovo continuava marcado "chocando" meses depois porque ninguém abriu a tela.
-- Derivando, o estado está sempre correto, inclusive offline.
-- =============================================================================

create or replace function public.situacao_postura(
  p_data_postura     date,
  p_ovoscopia_em     date,
  p_fertil           boolean,
  p_data_eclosao     date,
  p_data_anilhamento date,
  p_data_separacao   date,
  p_desfecho         desfecho_postura,
  p_dias_choco       smallint,
  p_dias_ovoscopia   smallint,
  p_dias_anilha      smallint,
  p_dias_separa      smallint,
  p_hoje             date default current_date
)
returns situacao_postura
language sql
immutable
as $$
  select case
    -- Terminais declarados pelo criador
    when p_desfecho = 'infertil' then 'infertil'::situacao_postura
    when p_desfecho = 'perdido'  then 'perdido'::situacao_postura
    when p_fertil is false       then 'infertil'::situacao_postura

    -- Ciclo concluído
    when p_data_separacao is not null then 'separado'::situacao_postura

    -- Pós-eclosão
    when p_data_eclosao is not null then
      case
        when p_data_anilhamento is null
             and p_hoje >= p_data_eclosao + p_dias_anilha
          then 'anilhar'::situacao_postura
        when p_hoje >= p_data_eclosao + p_dias_separa
          then 'separar'::situacao_postura
        else 'nascido'::situacao_postura
      end

    -- Pré-eclosão
    -- Margem de 1 dia antes da previsão: o criador precisa estar atento na véspera.
    when p_hoje >= p_data_postura + p_dias_choco - 1
      then 'nascendo'::situacao_postura
    when p_ovoscopia_em is null
         and p_hoje >= p_data_postura + p_dias_ovoscopia
      then 'verificar'::situacao_postura
    else 'chocando'::situacao_postura
  end;
$$;

comment on function public.situacao_postura is
  'Deriva o estado do ovo a partir das datas observadas e dos prazos da espécie. Immutable: o mesmo cálculo roda no servidor e no cliente offline.';

-- -----------------------------------------------------------------------------
-- Visão operacional das posturas
-- -----------------------------------------------------------------------------
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

  -- Datas previstas, para a interface mostrar "faltam N dias"
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

  -- Sinal de urgência: a janela de anilhamento está se fechando.
  case
    when p.data_eclosao is not null
     and p.data_anilhamento is null
     and current_date > p.data_eclosao + e.dias_anilha + e.janela_anilha_dias
    then true else false
  end as anilhamento_vencido,

  case
    when p.data_eclosao is not null and p.data_anilhamento is null
    then (p.data_eclosao + e.dias_anilha + e.janela_anilha_dias) - current_date
  end as dias_restantes_anilha,

  p.observacoes,
  p.created_at,
  p.updated_at
from public.posturas p
join public.casais   c on c.id = p.casal_id
left join public.ninhadas r on r.id = p.ninhada_id
-- A espécie do ovo vem do casal (pelo macho, com a fêmea como alternativa).
left join public.passaros mp on mp.id = c.macho_id
left join public.passaros fp on fp.id = c.femea_id
left join public.especies e  on e.id = coalesce(mp.especie_id, fp.especie_id)
where p.deleted_at is null;

comment on view public.vw_posturas is
  'Posturas com situação derivada, previsões de data e sinal de urgência do anilhamento. Fonte da tela "Ovos".';

-- -----------------------------------------------------------------------------
-- Agenda "Hoje" — a tela inicial do aplicativo
-- -----------------------------------------------------------------------------
-- Esta view É o produto: responde "o que preciso fazer no galpão agora".
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
  end as acao
from public.vw_posturas v
where v.situacao in ('anilhar','verificar','nascendo','separar');

comment on view public.vw_tarefas_hoje is
  'Tarefas acionáveis do dia, ordenáveis por prioridade. Alimenta a tela "Hoje".';
