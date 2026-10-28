-- SisAves · 0042 · Quem opera o SisAves não é cobrado por ele
-- =============================================================================
-- O criatório de quem opera estava em período de teste como o de qualquer
-- cliente, e venceria em dois dias. Operador não é assinante: ele precisa do
-- sistema de pé para atender quem assina.
--
-- A liberação é por `sou_admin()`, e não por uma assinatura com `fim` nulo
-- numa linha específica. Dois motivos:
--
--   · uma linha com `fim` nulo seria indistinguível, na tabela, de um cliente
--     a quem alguém deu acesso vitalício por engano;
--   · qualquer operador futuro fica liberado sozinho ao receber `is_admin`,
--     sem alguém lembrar de criar a assinatura falsa dele.
--
-- O painel de operação NÃO usa esta função: a `vw_admin_criatorios` calcula a
-- vigência direto da linha de assinatura, de propósito. Se usasse, todo
-- criatório de operador apareceria "ativo" para sempre e a tela mentiria sobre
-- a própria base.
create or replace function public.criatorio_com_acesso(p_criatorio_id uuid)
returns boolean
language sql
stable
as $$
  select public.sou_admin() or exists (
    select 1 from public.assinaturas a
     where a.criatorio_id = p_criatorio_id
       and a.status in ('ativa', 'teste')
       and (a.fim is null or a.fim >= public.hoje())
  );
$$;

comment on function public.criatorio_com_acesso is
  'Se o criatório pode usar o SisAves. Operador passa sempre: ele mantém o sistema, não o assina. Vencido continua com a linha no banco — o bloqueio de leitura é da aplicação, não daqui.';
