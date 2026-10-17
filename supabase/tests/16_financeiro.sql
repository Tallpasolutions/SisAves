begin;

-- Dois criatórios: o saldo de um nunca pode aparecer no do outro. A view
-- `vw_financeiro_mensal` agrega, e agregação é exatamente onde um vazamento de
-- RLS passa despercebido — o número sai somado, sem dizer de quem era a linha.
insert into auth.users (id, email, aud, role) values
  ('f1f1f1f1-0000-0000-0000-000000000001', 'fin-flavia@teste.invalid', 'authenticated', 'authenticated'),
  ('f2f2f2f2-0000-0000-0000-000000000002', 'fin-fabio@teste.invalid',  'authenticated', 'authenticated');

insert into public.criatorios (id, owner_id, nome, slug) values
  ('f1f1f1f1-1111-1111-1111-111111111111','f1f1f1f1-0000-0000-0000-000000000001','Criatório Flávia','flavia-fin'),
  ('f2f2f2f2-2222-2222-2222-222222222222','f2f2f2f2-0000-0000-0000-000000000002','Criatório Fábio','fabio-fin');

-- O mês de referência é sempre o primeiro dia do mês corrente no fuso do
-- criatório, escrito por extenso em cada consulta: um objeto temporário para
-- guardá-lo precisaria de grant para `authenticated`, e a sessão de teste
-- troca de papel no meio do arquivo.
insert into public.financeiro_lancamentos (id, criatorio_id, tipo, valor, data, descricao) values
  ('f1f1f1f1-aaaa-aaaa-aaaa-000000000001','f1f1f1f1-1111-1111-1111-111111111111',
   'receita', 1850.00, date_trunc('month', public.hoje())::date, 'Venda de ave'),
  ('f1f1f1f1-aaaa-aaaa-aaaa-000000000002','f1f1f1f1-1111-1111-1111-111111111111',
   'despesa', 1340.50, date_trunc('month', public.hoje())::date + 1, 'Ração'),
  -- Apagado logicamente: não pode entrar em soma nenhuma.
  ('f1f1f1f1-aaaa-aaaa-aaaa-000000000003','f1f1f1f1-1111-1111-1111-111111111111',
   'despesa', 999.99, date_trunc('month', public.hoje())::date + 2, 'Lançado por engano'),
  -- Mês anterior, para a série de seis meses ter mais de um ponto.
  ('f1f1f1f1-aaaa-aaaa-aaaa-000000000004','f1f1f1f1-1111-1111-1111-111111111111',
   'despesa', 300.00, date_trunc('month', public.hoje())::date - 20, 'Anilhas'),
  ('f2f2f2f2-bbbb-bbbb-bbbb-000000000001','f2f2f2f2-2222-2222-2222-222222222222',
   'receita', 5000.00, date_trunc('month', public.hoje())::date, 'Venda do Fábio');

update public.financeiro_lancamentos
   set deleted_at = now()
 where id = 'f1f1f1f1-aaaa-aaaa-aaaa-000000000003';

create temp table veredito (cenario text, esperado text, obtido text);
grant all on veredito to authenticated, anon;

-- ---- A soma do mês ----------------------------------------------------------
insert into veredito values
  ('receita do mês', '1850.00',
   (select receita::text from public.vw_financeiro_mensal
     where criatorio_id = 'f1f1f1f1-1111-1111-1111-111111111111'
       and mes = date_trunc('month', public.hoje())::date)),

  ('despesa do mês ignora o apagado', '1340.50',
   (select despesa::text from public.vw_financeiro_mensal
     where criatorio_id = 'f1f1f1f1-1111-1111-1111-111111111111'
       and mes = date_trunc('month', public.hoje())::date)),

  -- O valor é sempre positivo e o sinal vem do tipo: é a view que faz a conta.
  ('saldo = receita − despesa', '509.50',
   (select saldo::text from public.vw_financeiro_mensal
     where criatorio_id = 'f1f1f1f1-1111-1111-1111-111111111111'
       and mes = date_trunc('month', public.hoje())::date)),

  ('a contagem não conta o apagado', '2',
   (select lancamentos::text from public.vw_financeiro_mensal
     where criatorio_id = 'f1f1f1f1-1111-1111-1111-111111111111'
       and mes = date_trunc('month', public.hoje())::date));

-- ---- Saldo negativo ---------------------------------------------------------
-- O mês anterior só tem despesa: é o único lugar do financeiro onde um número
-- pode sair negativo, e é o que desenha a barra vazada em tijolo.
insert into veredito values
  ('mês só com despesa dá saldo negativo', '-300.00',
   (select saldo::text from public.vw_financeiro_mensal
     where criatorio_id = 'f1f1f1f1-1111-1111-1111-111111111111'
       and mes = date_trunc('month', public.hoje())::date - interval '1 month'));

-- ---- Mês sem lançamento não tem linha ---------------------------------------
-- A tela é que preenche a lacuna, porque só ela sabe quais seis meses mostra.
insert into veredito values
  ('mês sem lançamento não aparece', '0',
   (select count(*)::text from public.vw_financeiro_mensal
     where criatorio_id = 'f1f1f1f1-1111-1111-1111-111111111111'
       and mes = date_trunc('month', public.hoje())::date + interval '1 month'));

-- ---- Isolamento: a agregação respeita a RLS ---------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"f1f1f1f1-0000-0000-0000-000000000001"}';

insert into veredito values
  ('Flávia vê só os meses dela', '2',
   (select count(*)::text from public.vw_financeiro_mensal)),

  ('o saldo da Flávia não traz o do Fábio', '509.50',
   (select saldo::text from public.vw_financeiro_mensal
     where mes = date_trunc('month', public.hoje())::date)),

  ('Flávia vê linha do Fábio (deve ser 0)', '0',
   (select count(*)::text from public.vw_financeiro_mensal
     where criatorio_id = 'f2f2f2f2-2222-2222-2222-222222222222'));
reset role;

set local role anon;
set local request.jwt.claims = '';
insert into veredito values
  ('anônimo vê algum saldo (deve ser 0)', '0',
   (select count(*)::text from public.vw_financeiro_mensal));
reset role;

-- ---- O padrão de data é o fuso do criatório ---------------------------------
-- `current_date` é UTC: das 21h à meia-noite em Brasília ele já virou o dia, e
-- um lançamento sem data explícita nasceria no dia seguinte.
insert into public.financeiro_lancamentos (criatorio_id, tipo, valor, descricao)
values ('f1f1f1f1-1111-1111-1111-111111111111', 'despesa', 10.00, 'Sem data informada');

insert into veredito values
  ('lançamento sem data nasce no hoje do criatório', 'ok',
   (select case when data = public.hoje() then 'ok' else 'FALTOU: ' || data::text end
      from public.financeiro_lancamentos where descricao = 'Sem data informada'));

select cenario, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from veredito;

rollback;
