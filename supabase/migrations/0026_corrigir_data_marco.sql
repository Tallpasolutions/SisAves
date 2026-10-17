-- =============================================================================
-- SisAves · 0026 · Corrigir a data de um marco em um passo
--
-- 0023 trouxe `desfazer_marco`, e a correção de data ficou como "desfaça e
-- registre de novo". Funciona, mas são dois toques e um estado intermediário
-- em que o ovo volta ao ciclo — se o criador parar no meio, o registro some.
--
-- Esta função faz os dois movimentos numa transação. NÃO repete as guardas:
-- chama `desfazer_marco` e `registrar_marcos`, que já as têm. Duplicar as
-- regras aqui era o motivo de ela não existir antes; reusá-las resolve.
-- =============================================================================

create or replace function public.corrigir_data_marco(
  p_postura_id uuid,
  p_marco      text,
  p_data       date
)
returns boolean
language plpgsql
as $$
declare
  v_postura public.posturas%rowtype;
  v_atual   date;
  v_registro text;
  v_motivo  text;
begin
  select * into v_postura
    from public.posturas
   where id = p_postura_id and deleted_at is null
   for update;

  if not found then
    raise exception 'Ovo não encontrado ou fora do seu criatório.';
  end if;

  -- Qual era a data, e com que marca ela volta. `desfazer_marco` fala de
  -- 'ovoscopia'/'eclosao'/'separacao'/'desfecho'; `registrar_marcos` fala de
  -- 'fertil'/'eclodiu'/'separado'/'infertil'/'perdido'. A tradução é aqui.
  case p_marco
    when 'ovoscopia' then
      v_atual := v_postura.ovoscopia_em;
      v_registro := 'fertil';
    when 'eclosao' then
      v_atual := v_postura.data_eclosao;
      v_registro := 'eclodiu';
    when 'separacao' then
      v_atual := v_postura.data_separacao;
      v_registro := 'separado';
    when 'desfecho' then
      v_atual := v_postura.desfecho_em;
      v_registro := v_postura.desfecho::text;
      v_motivo := v_postura.desfecho_motivo;
    else
      raise exception 'Marco desconhecido: %.', coalesce(p_marco, 'vazio');
  end case;

  if v_atual is null then
    raise exception 'Este marco não está registrado neste ovo.';
  end if;

  -- Mesma data: nada a fazer. Vale para o reenvio da fila offline e para o
  -- toque duplo no botão.
  if v_atual = p_data then
    return false;
  end if;

  perform public.desfazer_marco(p_postura_id, p_marco);

  perform public.registrar_marcos(p_data, jsonb_build_array(
    jsonb_build_object(
      'postura_id', p_postura_id,
      'marco', v_registro,
      'motivo', v_motivo
    )
  ));

  return true;
end;
$$;

comment on function public.corrigir_data_marco is
  'Troca a data de um marco já gravado, numa transação. Desfaz e registra de novo pelas funções que já existem, para não duplicar nenhuma guarda — se a data nova for recusada, a antiga continua valendo.';

grant execute on function public.corrigir_data_marco(uuid, text, date) to authenticated;
