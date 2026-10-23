-- SisAves · 0041 · O painel chamava de vencido quem estava em dia
-- =============================================================================
-- A `vw_admin_criatorios` da 0040 usava `public.criatorio_com_acesso(c.id)`
-- para dizer se o criatório pode escrever. A view é `security_invoker = off`,
-- então as leituras DELA rodam como dona e enxergam tudo — mas a função não é
-- `security definer`, e por isso continuava lendo `public.assinaturas` sob a
-- RLS da sessão.
--
-- Resultado: o operador via a própria assinatura corretamente e TODAS as
-- outras como vencidas, porque a função não achava a linha. Um criatório em
-- teste até 27/10 aparecia "Vencido · 27/10/2026" no dia 23.
--
-- A correção não é tornar a função `definer`. Isso resolveria o sintoma e
-- abriria outra coisa: qualquer usuário autenticado poderia perguntar se o
-- criatório de um vizinho está em dia, e a situação comercial de um criador
-- não é assunto de outro. A view já tem a assinatura no `join` — basta
-- calcular ali, com o dado que ela legitimamente enxerga.
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

    -- A mesma regra de `criatorio_com_acesso()`, calculada sobre a linha que a
    -- view já trouxe. Se a regra mudar lá, muda aqui: o teste 22 compara as
    -- duas para o dia em que alguém esquecer.
    coalesce(
      a.status in ('ativa', 'teste')
        and (a.fim is null or a.fim >= public.hoje()),
      false
    )                                                     as com_acesso,

    (select count(*) from public.passaros x where x.criatorio_id = c.id)     as aves,
    (select count(*) from public.casais x where x.criatorio_id = c.id)       as casais,
    (select count(*) from public.ninhadas x where x.criatorio_id = c.id)     as ninhadas,
    (select count(*) from public.certificados x where x.criatorio_id = c.id) as certificados,

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
  'Todos os criatórios, para quem opera o SisAves. Contagens do plantel, nunca o conteúdo. O `where sou_admin()` é a trava. `com_acesso` é calculado aqui, e não pela função: dentro da view ela leria assinaturas sob a RLS da sessão e acusaria de vencido todo criatório alheio.';
