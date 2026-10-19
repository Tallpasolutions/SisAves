begin;

-- O caminho do dinheiro. O que este arquivo guarda não é "a função roda":
-- é que ela NÃO credita duas vezes. O Mercado Pago entrega a mesma notificação
-- várias vezes de propósito, e um `update ... set fim = fim + 1 ano` ingênuo
-- daria três anos de assinatura por um pagamento.

insert into auth.users (id, email, aud, role) values
  ('b0b0b0b0-0000-0000-0000-000000000001', 'mp-sonia@teste.invalid', 'authenticated', 'authenticated');

insert into public.criatorios (id, owner_id, nome, slug, clube_id)
values ('b0b0b0b0-1111-1111-1111-111111111111','b0b0b0b0-0000-0000-0000-000000000001',
        'Criatório do Pagamento','mp-sonia',
        (select id from public.clubes where sigla = 'SOB' limit 1));

-- A intenção, como a Server Action a grava antes de ir ao Mercado Pago.
insert into public.assinatura_intencoes (id, criatorio_id, oferta, valor, meses)
values ('b0b0b0b0-2222-2222-2222-222222222222','b0b0b0b0-1111-1111-1111-111111111111',
        'anual-pix', 270.00, 12);

create temp table veredito (cenario text, esperado text, obtido text);

-- ---- Pendente não libera nada ------------------------------------------------
-- O PIX fica pendente enquanto o pagador não paga. Liberar aqui seria dar o ano
-- a quem só abriu o checkout.
create temp table pendente as
  select public.creditar_pagamento_mercadopago(
    'b0b0b0b0-2222-2222-2222-222222222222','MP-1','pending',270.00,'bank_transfer','{}'::jsonb) as j;

insert into veredito values
  ('pendente não credita', 'false', (select j->>'creditado' from pendente));

-- O criatório nasce com cinco dias de teste (0038). Um PIX pendente não pode
-- derrubá-los: quem está testando continua testando enquanto não paga.
insert into veredito values
  ('pendente não derruba o teste em curso', (public.hoje() + 5)::text,
   (select fim::text from public.assinaturas
     where criatorio_id = 'b0b0b0b0-1111-1111-1111-111111111111')),

  ('e o status segue teste', 'teste',
   (select status::text from public.assinaturas
     where criatorio_id = 'b0b0b0b0-1111-1111-1111-111111111111'));

-- ---- Aprovado credita doze meses ---------------------------------------------
create temp table aprovado as
  select public.creditar_pagamento_mercadopago(
    'b0b0b0b0-2222-2222-2222-222222222222','MP-1','approved',270.00,'bank_transfer','{}'::jsonb) as j;

insert into veredito values
  ('aprovado credita', 'true', (select j->>'creditado' from aprovado));

insert into veredito values
  ('sair do teste conta de HOJE, sem somar os 5 dias de teste',
   (public.hoje() + interval '12 months')::date::text,
   (select fim::text from public.assinaturas
     where criatorio_id = 'b0b0b0b0-1111-1111-1111-111111111111')),

  ('e o status vira ativa', 'ativa',
   (select status::text from public.assinaturas
     where criatorio_id = 'b0b0b0b0-1111-1111-1111-111111111111')),

  ('criatorio_com_acesso passa a dizer sim', 'true',
   (public.criatorio_com_acesso('b0b0b0b0-1111-1111-1111-111111111111')::text));

-- ---- A MESMA entrega, de novo — e é este o ponto -----------------------------
-- Retentativa do Mercado Pago é o normal, não a exceção.
create temp table repetido as
  select public.creditar_pagamento_mercadopago(
    'b0b0b0b0-2222-2222-2222-222222222222','MP-1','approved',270.00,'bank_transfer','{}'::jsonb) as j;

insert into veredito values
  ('a segunda entrega do MESMO pagamento não credita', 'false',
   (select j->>'creditado' from repetido));

insert into veredito values
  ('e a vigência continua onde estava', (public.hoje() + interval '12 months')::date::text,
   (select fim::text from public.assinaturas
     where criatorio_id = 'b0b0b0b0-1111-1111-1111-111111111111')),

  ('o pagamento foi gravado uma vez só', '1',
   (select count(*)::text from public.assinatura_pagamentos
     where provedor = 'mercadopago' and provedor_id = 'MP-1'));

-- ---- Renovação antes do vencimento SOMA ao que resta --------------------------
-- Quem paga adiantado não pode perder os dias que sobraram.
insert into public.assinatura_intencoes (id, criatorio_id, oferta, valor, meses)
values ('b0b0b0b0-3333-3333-3333-333333333333','b0b0b0b0-1111-1111-1111-111111111111',
        'anual-cartao', 290.00, 12);

create temp table renovacao as
  select public.creditar_pagamento_mercadopago(
    'b0b0b0b0-3333-3333-3333-333333333333','MP-2','approved',290.00,'credit_card','{}'::jsonb) as j;

insert into veredito values
  ('a renovação credita', 'true', (select j->>'creditado' from renovacao));

insert into veredito values
  ('e soma ao prazo que restava, não recomeça de hoje',
   (public.hoje() + interval '24 months')::date::text,
   (select fim::text from public.assinaturas
     where criatorio_id = 'b0b0b0b0-1111-1111-1111-111111111111'));

-- ---- Referência desconhecida ---------------------------------------------------
-- Notificação de outra aplicação na mesma conta do Mercado Pago. Responder erro
-- faria o Mercado Pago retentar por 24h o que nunca vai dar em nada.
create temp table desconhecida as
  select public.creditar_pagamento_mercadopago(
    '00000000-0000-0000-0000-000000000000','MP-9','approved',270.00,'bank_transfer','{}'::jsonb) as j;

insert into veredito values
  ('referência que não existe responde ok, sem creditar', 'referencia_desconhecida',
   (select j->>'motivo' from desconhecida));

-- ---- A porta da função ---------------------------------------------------------
-- `security definer` + execute para anon seria um buraco do tamanho do produto:
-- o endpoint do PostgREST é público, e qualquer um creditaria um ano inventando
-- um provedor_id.
insert into veredito values
  ('anon NÃO pode executar a função', 'false',
   (select has_function_privilege('anon',
      'public.creditar_pagamento_mercadopago(uuid,text,text,numeric,text,jsonb)',
      'execute')::text)),

  ('authenticated também NÃO pode', 'false',
   (select has_function_privilege('authenticated',
      'public.creditar_pagamento_mercadopago(uuid,text,text,numeric,text,jsonb)',
      'execute')::text)),

  ('service_role pode', 'true',
   (select has_function_privilege('service_role',
      'public.creditar_pagamento_mercadopago(uuid,text,text,numeric,text,jsonb)',
      'execute')::text));

-- ---- A view respeita a RLS de quem consulta ------------------------------------
insert into veredito values
  ('vw_assinatura é security_invoker', 'true',
   (select (c.reloptions::text like '%security_invoker=on%')::text
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = 'vw_assinatura'));

select cenario, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from veredito;

rollback;
