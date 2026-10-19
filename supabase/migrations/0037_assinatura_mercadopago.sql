-- SisAves · 0037 · Assinatura pelo Mercado Pago (Checkout Pro)
-- =============================================================================
-- A Fase 1 já deixou `assinaturas`, `assinatura_pagamentos` (com índice único
-- em provedor + provedor_id) e `criatorio_com_acesso()`. Falta o que liga o
-- checkout ao banco.
--
-- Duas peças, e as duas existem por um motivo de segurança, não de modelagem:
--
-- 1. `assinatura_intencoes` — o preço NUNCA vem do navegador. A Server Action
--    resolve a oferta no servidor, grava a intenção com a sessão do criador
--    (RLS vale), e manda ao Mercado Pago apenas o id dela como
--    `external_reference`. Quando o webhook volta, o valor a creditar está no
--    banco, não no corpo da notificação.
--
-- 2. `creditar_pagamento_mercadopago()` — `security definer`. O webhook chega
--    sem sessão nenhuma (o Mercado Pago não tem cookie), então a escrita
--    precisaria de `service_role`, que ignora RLS em TODAS as tabelas. Com a
--    função, a chave que o servidor carrega consegue fazer uma coisa só:
--    creditar um pagamento de uma intenção que já existia. Nem ler plantel,
--    nem apagar ave.

-- -----------------------------------------------------------------------------
-- A intenção de pagamento
-- -----------------------------------------------------------------------------
create table public.assinatura_intencoes (
  id            uuid primary key default gen_random_uuid(),
  criatorio_id  uuid not null references public.criatorios(id) on delete cascade,

  -- A chave da oferta no catálogo do servidor ('anual-pix', 'anual-cartao').
  -- Guardada por extenso para a conferência depois saber o que foi vendido,
  -- mesmo que o catálogo mude de preço.
  oferta        text not null,
  valor         numeric(10,2) not null check (valor > 0),
  meses         smallint not null default 12 check (meses between 1 and 36),

  -- O id da preferência criada no Mercado Pago, para rastrear a ida.
  preference_id text,

  criada_em     timestamptz not null default now(),
  criada_por    uuid references auth.users(id) on delete set null
);

create index on public.assinatura_intencoes (criatorio_id, criada_em desc);

comment on table public.assinatura_intencoes is
  'O preço resolvido no servidor antes de ir ao Mercado Pago. O navegador manda só o id da oferta; o valor a creditar sai daqui, nunca da notificação.';

alter table public.assinatura_intencoes enable row level security;

create policy "tenant_total" on public.assinatura_intencoes
  for all to authenticated
  using (criatorio_id in (select public.meus_criatorios()))
  with check (criatorio_id in (select public.meus_criatorios()));

-- -----------------------------------------------------------------------------
-- O crédito, chamado pelo webhook
-- -----------------------------------------------------------------------------
-- Idempotente de duas maneiras, porque retentativa do Mercado Pago é o normal
-- e não a exceção:
--   · o pagamento é um upsert pelo índice único (provedor, provedor_id);
--   · a vigência só avança quando o pagamento ENTRA em 'approved'. Segunda
--     entrega do mesmo pagamento aprovado não ganha outro ano.
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

  -- Referência que não existe aqui não é erro nosso: é notificação de outra
  -- aplicação na mesma conta do Mercado Pago, ou teste manual. Responder ok
  -- evita o Mercado Pago retentar por 24h o que nunca vai dar em nada.
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
    -- Pendente é o estado normal do PIX esperando o pagador. Não mexe numa
    -- assinatura já ativa: quem renovou antes do vencimento continua ativo
    -- enquanto o novo pagamento não cai.
    if v_assinatura.status not in ('ativa', 'teste') then
      update public.assinaturas set status = 'pendente' where id = v_assinatura.id;
    end if;
    return jsonb_build_object('ok', true, 'creditado', false, 'status', p_status);
  end if;

  if v_status_anterior = 'approved' then
    return jsonb_build_object('ok', true, 'creditado', false,
                              'motivo', 'ja_creditado');
  end if;

  -- Renovação feita ANTES do vencimento soma ao prazo que ainda resta; feita
  -- depois, conta de hoje. Quem paga adiantado não perde os dias que sobraram.
  v_novo_fim := (
    greatest(coalesce(v_assinatura.fim, public.hoje()), public.hoje())
    + (v_intencao.meses * interval '1 month')
  )::date;

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
  'Credita um pagamento do Checkout Pro. Chamada SÓ pelo webhook, com service_role: é a superfície única dessa chave no servidor. Idempotente — a vigência avança apenas quando o pagamento entra em approved.';

-- A função é `security definer`: quem a executa age como o dono dela. Por isso
-- ninguém de fora do servidor pode chamá-la. Em especial `anon`: o endpoint do
-- PostgREST é público, e com execute para anon qualquer um creditaria um ano de
-- assinatura inventando um provedor_id.
revoke execute on function public.creditar_pagamento_mercadopago(uuid, text, text, numeric, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.creditar_pagamento_mercadopago(uuid, text, text, numeric, text, jsonb)
  to service_role;

-- -----------------------------------------------------------------------------
-- A vigência, para a tela de assinatura ler
-- -----------------------------------------------------------------------------
create or replace view public.vw_assinatura as
  select a.criatorio_id,
         a.id            as assinatura_id,
         a.plano,
         a.status,
         a.inicio,
         a.fim,
         a.valor,
         (a.fim is not null and a.fim >= public.hoje())                     as vigente,
         case when a.fim is null then null
              else (a.fim - public.hoje())::int end                        as dias_restantes,
         public.criatorio_com_acesso(a.criatorio_id)                        as com_acesso,
         (select max(p.created_at) from public.assinatura_pagamentos p
           where p.assinatura_id = a.id and p.status = 'approved')          as ultimo_pagamento_em
    from public.assinaturas a;

-- `security_invoker` para a view respeitar a RLS de quem consulta, e não a do
-- dono. Sem isto, uma view sobre tabela protegida vira buraco no multi-tenant.
alter view public.vw_assinatura set (security_invoker = on);

grant select on public.vw_assinatura to authenticated;
