-- SisAves · 0038 · Período de teste de 5 dias e bloqueio suave
-- =============================================================================
-- "Bloqueio suave" é a promessa escrita no plano: ao vencer, a LEITURA
-- continua inteira e só a ESCRITA para. Os dados do criador nunca são retidos
-- — ele vê o plantel, a genealogia, os certificados já emitidos, e pode
-- exportar e imprimir. O que ele não faz é registrar dados novos.

-- -----------------------------------------------------------------------------
-- 1 · A data do criatório, não a do UTC
-- -----------------------------------------------------------------------------
-- `current_date` em servidor UTC vira o dia seguinte às 21h no Brasil. Uma
-- assinatura que vence hoje passaria a recusar escrita três horas antes da
-- meia-noite do criador — e ele estaria no galpão, anilhando. `public.hoje()`
-- existe desde a 0022 exatamente para isso.
create or replace function public.criatorio_com_acesso(p_criatorio_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.assinaturas a
     where a.criatorio_id = p_criatorio_id
       and a.status in ('ativa', 'teste')
       and (a.fim is null or a.fim >= public.hoje())
  );
$$;

comment on function public.criatorio_com_acesso is
  'Se o criatório pode ESCREVER. Vencido continua lendo tudo. Usa public.hoje(), não current_date: em UTC o dia vira às 21h no Brasil.';

-- -----------------------------------------------------------------------------
-- 2 · Os criatórios em que eu posso escrever
-- -----------------------------------------------------------------------------
-- Espelha `meus_criatorios()` com o filtro de vigência. As políticas de
-- escrita trocam uma pela outra — uma linha por política, legível no diff, em
-- vez de dezenove expressões booleanas reescritas à mão.
create or replace function public.meus_criatorios_ativos()
returns setof uuid
language sql
stable
as $$
  select c from public.meus_criatorios() c
   where public.criatorio_com_acesso(c);
$$;

comment on function public.meus_criatorios_ativos is
  'Os criatórios do usuário cuja assinatura está vigente. Vai no WITH CHECK das políticas de escrita; o USING segue com meus_criatorios(), para a leitura nunca parar.';

grant execute on function public.meus_criatorios_ativos() to authenticated;

-- -----------------------------------------------------------------------------
-- 3 · Cinco dias de teste para todo criatório novo
-- -----------------------------------------------------------------------------
-- `security definer` por necessidade: `assinaturas` só tem política de SELECT
-- para o usuário, de propósito — ninguém se dá assinatura escrevendo na
-- tabela. Quem cria a linha é este gatilho, ou o webhook.
create or replace function public.tg_criatorio_ganha_teste()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.assinaturas (criatorio_id, plano, status, inicio, fim)
  values (new.id, 'teste', 'teste', public.hoje(), public.hoje() + 5);
  return new;
end;
$$;

create trigger criatorio_ganha_teste
  after insert on public.criatorios
  for each row execute function public.tg_criatorio_ganha_teste();

comment on function public.tg_criatorio_ganha_teste is
  'Cinco dias de teste ao criar o criatório. Sem isto, o bloqueio suave trancaria a escrita no primeiro minuto do primeiro criador.';

-- Os criatórios que já existem entram no mesmo regime. Sem este backfill o
-- bloqueio abaixo tranca todo mundo que já está dentro — inclusive a conta de
-- desenvolvimento, que é por onde se testaria o pagamento que destrancaria.
insert into public.assinaturas (criatorio_id, plano, status, inicio, fim)
select c.id, 'teste', 'teste', public.hoje(), public.hoje() + 5
  from public.criatorios c
 where not exists (
   select 1 from public.assinaturas a where a.criatorio_id = c.id
 );

-- -----------------------------------------------------------------------------
-- 4 · O bloqueio
-- -----------------------------------------------------------------------------
-- Só o WITH CHECK muda. Consequências, todas deliberadas:
--
--   · SELECT usa o USING, que segue com `meus_criatorios()` → leitura intacta.
--   · INSERT e UPDATE passam pelo WITH CHECK → barrados quando vencido.
--   · DELETE usa só o USING → continua permitido. É de propósito: barrar
--     apagar seria impedir o criador de limpar os próprios dados por não ter
--     pago, e a promessa é a contrária.
--
-- O que NÃO entra aqui, e por quê:
--   · `assinatura_intencoes` — é o caminho para pagar. Trancá-la deixaria o
--     vencido sem como deixar de estar vencido.
--   · `criatorios`, `criatorio_membros`, `criatorio_convites` — identidade e
--     acesso, não dado de plantel.
--   · `perfis`, `notificacoes`, `push_subscriptions` — são do usuário, não do
--     criatório.

alter policy "tenant_total" on public.casais
  with check (criatorio_id in (select public.meus_criatorios_ativos()));

alter policy "tenant_total" on public.casal_tags
  with check (criatorio_id in (select public.meus_criatorios_ativos()));

alter policy "via_casal" on public.casal_tag_vinculo
  with check (casal_id in (
    select id from public.casais
     where criatorio_id in (select public.meus_criatorios_ativos())));

alter policy "tenant_total" on public.certificados
  with check (criatorio_id in (select public.meus_criatorios_ativos()));

alter policy "tenant_total" on public.especies
  with check (criatorio_id in (select public.meus_criatorios_ativos()));

alter policy "tenant_total" on public.financeiro_lancamentos
  with check (criatorio_id in (select public.meus_criatorios_ativos()));

alter policy "tenant_total" on public.ninhadas
  with check (criatorio_id in (select public.meus_criatorios_ativos()));

alter policy "tenant_total" on public.passaros
  with check (criatorio_id in (select public.meus_criatorios_ativos()));

alter policy "tenant_total" on public.pesagens
  with check (criatorio_id in (select public.meus_criatorios_ativos()));

alter policy "tenant_total" on public.postura_transferencias
  with check (criatorio_id in (select public.meus_criatorios_ativos()));

alter policy "tenant_total" on public.posturas
  with check (criatorio_id in (select public.meus_criatorios_ativos()));

alter policy "tenant_total" on public.tratamentos
  with check (criatorio_id in (select public.meus_criatorios_ativos()));

alter policy "via_doenca" on public.doenca_sintomas
  with check (doenca_id in (
    select id from public.doencas
     where criatorio_id in (select public.meus_criatorios_ativos())));

alter policy "via_medicamento" on public.medicamento_doencas
  with check (medicamento_id in (
    select id from public.medicamentos
     where criatorio_id in (select public.meus_criatorios_ativos())));

-- Os cinco de catálogo próprio, que têm políticas separadas por comando.
alter policy "tenant_escreve"  on public.doencas
  with check (criatorio_id in (select public.meus_criatorios_ativos()));
alter policy "tenant_atualiza" on public.doencas
  with check (criatorio_id in (select public.meus_criatorios_ativos()));

alter policy "tenant_escreve"  on public.financeiro_categorias
  with check (criatorio_id in (select public.meus_criatorios_ativos()));
alter policy "tenant_atualiza" on public.financeiro_categorias
  with check (criatorio_id in (select public.meus_criatorios_ativos()));

alter policy "tenant_escreve"  on public.medicamentos
  with check (criatorio_id in (select public.meus_criatorios_ativos()));
alter policy "tenant_atualiza" on public.medicamentos
  with check (criatorio_id in (select public.meus_criatorios_ativos()));

alter policy "tenant_escreve"  on public.mutacoes
  with check (criatorio_id in (select public.meus_criatorios_ativos()));
alter policy "tenant_atualiza" on public.mutacoes
  with check (criatorio_id in (select public.meus_criatorios_ativos()));

alter policy "tenant_escreve"  on public.sintomas
  with check (criatorio_id in (select public.meus_criatorios_ativos()));
alter policy "tenant_atualiza" on public.sintomas
  with check (criatorio_id in (select public.meus_criatorios_ativos()));
