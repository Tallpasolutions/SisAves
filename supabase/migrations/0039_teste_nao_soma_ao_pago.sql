-- SisAves · 0039 · O período de teste não se soma ao período pago
-- =============================================================================
-- A 0038 deu cinco dias de teste a todo criatório novo, e com isso a conta da
-- 0037 passou a somar esses cinco dias ao ano comprado: quem pagasse no
-- primeiro dia levava doze meses e cinco dias. Pequeno, mas é regra, e regra
-- errada vira política.
--
-- A distinção certa:
--   · sair do TESTE para o pago → o prazo conta de hoje. Teste não é tempo
--     comprado, e somá-lo seria dar de graça a todo assinante.
--   · renovar um período PAGO → o prazo soma ao que ainda resta. Quem paga
--     adiantado não pode perder os dias que sobraram.
create or replace function public.creditar_pagamento_mercadopago(
  p_referencia  uuid,
  p_provedor_id text,
  p_status      text,
  p_valor       numeric,
  p_meio        text,
  p_payload     jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_intencao        public.assinatura_intencoes;
  v_assinatura      public.assinaturas;
  v_status_anterior text;
  v_novo_fim        date;
begin
  select * into v_intencao
    from public.assinatura_intencoes
   where id = p_referencia;

  if not found then
    return jsonb_build_object('ok', true, 'creditado', false,
                              'motivo', 'referencia_desconhecida');
  end if;

  select * into v_assinatura
    from public.assinaturas
   where criatorio_id = v_intencao.criatorio_id
   order by created_at desc
   limit 1;

  if not found then
    insert into public.assinaturas (criatorio_id, plano, status, inicio, valor)
    values (v_intencao.criatorio_id, 'anual', 'pendente', public.hoje(), v_intencao.valor)
    returning * into v_assinatura;
  end if;

  select status into v_status_anterior
    from public.assinatura_pagamentos
   where provedor = 'mercadopago' and provedor_id = p_provedor_id;

  insert into public.assinatura_pagamentos
    (assinatura_id, provedor, provedor_id, status, valor, meio, payload)
  values
    (v_assinatura.id, 'mercadopago', p_provedor_id, p_status, p_valor, p_meio, p_payload)
  on conflict (provedor, provedor_id) do update
    set status  = excluded.status,
        valor   = excluded.valor,
        meio    = excluded.meio,
        payload = excluded.payload;

  if p_status <> 'approved' then
    -- PIX pendente é o estado normal de quem ainda não pagou. Não derruba um
    -- teste em curso nem uma assinatura já ativa.
    if v_assinatura.status not in ('ativa', 'teste') then
      update public.assinaturas set status = 'pendente' where id = v_assinatura.id;
    end if;
    return jsonb_build_object('ok', true, 'creditado', false, 'status', p_status);
  end if;

  if v_status_anterior = 'approved' then
    return jsonb_build_object('ok', true, 'creditado', false,
                              'motivo', 'ja_creditado');
  end if;

  if v_assinatura.status = 'teste' then
    v_novo_fim := (public.hoje() + (v_intencao.meses * interval '1 month'))::date;
  else
    v_novo_fim := (
      greatest(coalesce(v_assinatura.fim, public.hoje()), public.hoje())
      + (v_intencao.meses * interval '1 month')
    )::date;
  end if;

  update public.assinaturas
     set status = 'ativa',
         fim    = v_novo_fim,
         valor  = v_intencao.valor,
         plano  = 'anual'
   where id = v_assinatura.id;

  return jsonb_build_object('ok', true, 'creditado', true, 'fim', v_novo_fim);
end;
$$;

comment on function public.creditar_pagamento_mercadopago is
  'Credita um pagamento do Checkout Pro. Só o webhook a chama, com service_role. Idempotente. Sair do teste conta de hoje; renovar um período pago soma ao que resta.';

revoke execute on function public.creditar_pagamento_mercadopago(uuid, text, text, numeric, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.creditar_pagamento_mercadopago(uuid, text, text, numeric, text, jsonb)
  to service_role;
