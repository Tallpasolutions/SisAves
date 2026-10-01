-- =============================================================================
-- SisAves · 0014 · Anilhamento: fechar o ciclo do ovo
--
-- Anilhar é a ação mais urgente do produto: a janela dura dois dias e, perdida,
-- a ave não recebe anilha oficial e perde valor de criação. O ato cria a ave no
-- plantel E marca a postura — se um dos dois falhar, nenhum pode valer.
-- =============================================================================

-- A tela "Hoje" precisa do id da ninhada para abrir o anilhamento direto da
-- tarefa. Acrescentado no fim porque `create or replace view` só admite colunas
-- novas depois das que já existem.
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
  v.ninhada_id
from public.vw_posturas v
where v.situacao in ('anilhar','verificar','nascendo','separar');

alter view public.vw_tarefas_hoje set (security_invoker = on);

-- -----------------------------------------------------------------------------
-- anilhar_filhotes
-- -----------------------------------------------------------------------------
-- Um filhote anilhado vira ave no plantel com a filiação já resolvida pelo
-- casal, e a postura passa a apontar para ela. São três escritas por filhote
-- (ave, postura, pesagem) que precisam valer juntas ou não valer: com elas
-- soltas na aplicação, uma anilha repetida no terceiro filhote deixaria os dois
-- primeiros criados e a ninhada pela metade.
--
-- `security invoker` de propósito: a RLS continua sendo a fronteira. A função
-- não enxerga nada que o usuário já não enxergue.
create or replace function public.anilhar_filhotes(
  p_data_anilhamento date,
  p_filhotes jsonb
)
returns setof uuid
language plpgsql
as $$
declare
  v_filhote    jsonb;
  v_postura    public.posturas%rowtype;
  v_casal      public.casais%rowtype;
  v_especie_id uuid;
  v_passaro_id uuid;
  v_peso       numeric(6,2);
begin
  if jsonb_typeof(p_filhotes) <> 'array' or jsonb_array_length(p_filhotes) = 0 then
    raise exception 'Nenhum filhote informado para anilhar.';
  end if;

  for v_filhote in select * from jsonb_array_elements(p_filhotes)
  loop
    select * into v_postura
      from public.posturas
     where id = (v_filhote->>'postura_id')::uuid
       and deleted_at is null
     for update;

    if not found then
      raise exception 'Postura não encontrada ou fora do seu criatório.';
    end if;

    if v_postura.data_eclosao is null then
      raise exception 'Só é possível anilhar filhote que já eclodiu.';
    end if;

    if v_postura.data_anilhamento is not null then
      raise exception 'Este filhote já foi anilhado em %.',
        to_char(v_postura.data_anilhamento, 'DD/MM/YYYY');
    end if;

    select * into v_casal from public.casais where id = v_postura.casal_id;

    -- A espécie do filhote é a do casal: pelo macho, com a fêmea como
    -- alternativa — a mesma regra que a vw_posturas usa para os prazos.
    select coalesce(m.especie_id, f.especie_id) into v_especie_id
      from public.casais c
      left join public.passaros m on m.id = c.macho_id
      left join public.passaros f on f.id = c.femea_id
     where c.id = v_postura.casal_id;

    insert into public.passaros (
      criatorio_id, nome, especie_id, sexo, dt_nascimento, origem,
      anilha_sigla, anilha_criador, anilha_ano, anilha_numero,
      pai_id, mae_id, postura_id
    ) values (
      v_postura.criatorio_id,
      nullif(trim(v_filhote->>'nome'), ''),
      v_especie_id,
      'indefinido',                      -- sexagem vem depois do anilhamento
      v_postura.data_eclosao,
      'nascimento_proprio',
      nullif(trim(v_filhote->>'anilha_sigla'), ''),
      nullif(trim(v_filhote->>'anilha_criador'), ''),
      (v_filhote->>'anilha_ano')::smallint,
      (v_filhote->>'anilha_numero')::integer,
      v_casal.macho_id,
      v_casal.femea_id,
      v_postura.id
    )
    returning id into v_passaro_id;

    update public.posturas
       set data_anilhamento = p_data_anilhamento,
           passaro_id       = v_passaro_id
     where id = v_postura.id;

    -- Peso ao anilhamento é o primeiro ponto da curva de crescimento, e a
    -- ficha da ave tem atalho próprio para ela.
    v_peso := nullif(v_filhote->>'peso_gramas', '')::numeric(6,2);
    if v_peso is not null then
      insert into public.pesagens (criatorio_id, passaro_id, data, peso_gramas, contexto)
      values (v_postura.criatorio_id, v_passaro_id, p_data_anilhamento, v_peso, 'anilhamento');
    end if;

    return next v_passaro_id;
  end loop;
end;
$$;

comment on function public.anilhar_filhotes is
  'Anilha um ou mais filhotes de uma vez: cria a ave com filiação do casal, marca a postura e registra o peso. Tudo numa transação — anilha repetida no último filhote não pode deixar os anteriores criados.';

grant execute on function public.anilhar_filhotes(date, jsonb) to authenticated;
