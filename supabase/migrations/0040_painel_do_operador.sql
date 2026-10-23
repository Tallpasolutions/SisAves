-- SisAves · 0040 · O painel de quem opera o SisAves
-- =============================================================================
-- Esta migration faz a ÚNICA coisa no produto que atravessa a fronteira do
-- multi-tenant de propósito: mostrar os criatórios de todo mundo a uma pessoa.
-- Por isso cada decisão aqui é sobre o que ela NÃO pode ver.
--
-- O que o operador precisa: quantos assinaram, quantos estão em teste, quem
-- vence quando, quanto entrou. São números e datas.
--
-- O que ele NÃO precisa, e portanto não recebe: o plantel de ninguém. Nenhuma
-- ave, nenhuma anilha, nenhuma genealogia, nenhum certificado. As views abaixo
-- devolvem CONTAGENS dessas coisas, nunca as linhas. Um operador curioso não
-- consegue navegar no criatório de um cliente por esta porta — teria de abrir
-- o banco, que é outro nível de acesso e deixa rastro diferente.

-- -----------------------------------------------------------------------------
-- Quem é operador
-- -----------------------------------------------------------------------------
-- `perfis.is_admin` existe desde a 0002 e nunca foi usado: nenhuma função,
-- nenhuma política o lia. Começa a valer aqui.
create or replace function public.sou_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.perfis p where p.id = (select auth.uid())),
    false
  );
$$;

comment on function public.sou_admin is
  'Se o usuário da sessão opera o SisAves. `security definer` porque precisa ler o próprio perfil antes de qualquer política decidir se ele pode.';

grant execute on function public.sou_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- Os criatórios, para quem opera
-- -----------------------------------------------------------------------------
-- **A view é `security_invoker = off` de propósito, e é a única assim.**
--
-- Com `on`, a RLS de `criatorios` se aplicaria e o operador veria só o dele —
-- inútil. Com `off`, a view lê tudo. O que impede qualquer pessoa de consultá-la
-- não é a RLS da tabela: é o `where public.sou_admin()` na própria view. Quem
-- não é operador recebe zero linhas, não erro.
--
-- Se alguém algum dia remover esse `where` achando que é redundante, abre o
-- banco inteiro para qualquer usuário autenticado. O teste 22 existe para
-- quebrar nesse dia.
create or replace view public.vw_admin_criatorios as
  select
    c.id,
    c.nome,
    c.slug,
    c.cidade,
    c.uf,
    cl.sigla                                              as clube,
    u.email                                               as dono_email,
    p.nome                                                as dono_nome,
    c.created_at                                          as criado_em,
    a.status                                              as assinatura_status,
    a.fim                                                 as assinatura_fim,
    a.valor                                               as assinatura_valor,
    case when a.fim is null then null
         else (a.fim - public.hoje())::int end            as dias_restantes,
    public.criatorio_com_acesso(c.id)                     as com_acesso,

    -- Contagens, nunca conteúdo.
    (select count(*) from public.passaros x where x.criatorio_id = c.id)     as aves,
    (select count(*) from public.casais x where x.criatorio_id = c.id)       as casais,
    (select count(*) from public.ninhadas x where x.criatorio_id = c.id)     as ninhadas,
    (select count(*) from public.certificados x where x.criatorio_id = c.id) as certificados,

    -- Último sinal de vida: é o que separa quem adotou de quem só olhou.
    greatest(
      c.updated_at,
      (select max(x.created_at) from public.passaros x where x.criatorio_id = c.id),
      (select max(x.created_at) from public.ninhadas x where x.criatorio_id = c.id)
    )                                                     as ultima_atividade
  from public.criatorios c
  join auth.users u on u.id = c.owner_id
  left join public.perfis p on p.id = c.owner_id
  left join public.clubes cl on cl.id = c.clube_id
  left join lateral (
    select * from public.assinaturas s
     where s.criatorio_id = c.id
     order by s.created_at desc
     limit 1
  ) a on true
 where public.sou_admin();

alter view public.vw_admin_criatorios set (security_invoker = off);
grant select on public.vw_admin_criatorios to authenticated;

comment on view public.vw_admin_criatorios is
  'Todos os criatórios, para quem opera o SisAves. Devolve contagens do plantel, NUNCA o conteúdo dele. O `where sou_admin()` é a trava: sem ele, qualquer autenticado leria o banco inteiro.';

-- -----------------------------------------------------------------------------
-- As contas que pararam no meio
-- -----------------------------------------------------------------------------
-- Criar conta e não cadastrar o criatório é o abandono mais caro: a pessoa
-- quis entrar e desistiu na primeira tela. Sem isto, uma contagem de inscritos
-- diria "sete" e esconderia que cinco nunca chegaram a usar nada.
create or replace view public.vw_admin_contas as
  select
    u.id,
    u.email,
    p.nome,
    u.created_at                                       as conta_criada_em,
    u.email_confirmed_at is not null                   as email_confirmado,
    u.last_sign_in_at,
    exists (select 1 from public.criatorios c where c.owner_id = u.id) as tem_criatorio,
    exists (select 1 from public.criatorio_membros m where m.usuario_id = u.id) as e_membro
  from auth.users u
  left join public.perfis p on p.id = u.id
 where public.sou_admin();

alter view public.vw_admin_contas set (security_invoker = off);
grant select on public.vw_admin_contas to authenticated;

comment on view public.vw_admin_contas is
  'Contas criadas, com e sem criatório. Expõe e-mail e último acesso a quem opera — dado pessoal de cliente, que é o preço de poder dar suporte.';

-- -----------------------------------------------------------------------------
-- Os pagamentos
-- -----------------------------------------------------------------------------
create or replace view public.vw_admin_pagamentos as
  select
    pg.id,
    pg.created_at                                      as pago_em,
    pg.status,
    pg.valor,
    pg.meio,
    pg.provedor_id,
    c.nome                                             as criatorio,
    u.email                                            as dono_email
  from public.assinatura_pagamentos pg
  join public.assinaturas a on a.id = pg.assinatura_id
  join public.criatorios c on c.id = a.criatorio_id
  join auth.users u on u.id = c.owner_id
 where public.sou_admin();

alter view public.vw_admin_pagamentos set (security_invoker = off);
grant select on public.vw_admin_pagamentos to authenticated;

-- -----------------------------------------------------------------------------
-- O primeiro operador
-- -----------------------------------------------------------------------------
-- Sem isto a tela nasce vazia para todo mundo, inclusive para quem a pediu.
update public.perfis
   set is_admin = true
 where id in (select id from auth.users where email = 'jhonicleyton@gmail.com');
