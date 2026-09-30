-- =============================================================================
-- SisAves · 0009 · Row Level Security
--
-- A fronteira de segurança do multi-tenant fica NO BANCO, não na aplicação.
-- O sistema legado filtrava por usuario_id na camada PHP: bastava um endpoint
-- esquecer o filtro para vazar plantel de outro criador. Aqui, uma consulta
-- sem filtro simplesmente não retorna linha alheia.
--
-- Toda política usa public.meus_criatorios() (definida em 0002), que é
-- SECURITY DEFINER para não recursar sobre a própria RLS de criatorio_membros.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Catálogos compartilhados: leitura para autenticados, escrita só service_role
-- -----------------------------------------------------------------------------
alter table public.clubes             enable row level security;
alter table public.grupos             enable row level security;
alter table public.especies_catalogo  enable row level security;

create policy "catalogo_leitura" on public.clubes
  for select to authenticated using (true);
create policy "catalogo_leitura" on public.grupos
  for select to authenticated using (true);
create policy "catalogo_leitura" on public.especies_catalogo
  for select to authenticated using (true);

-- -----------------------------------------------------------------------------
-- Perfil: cada um enxerga e edita o seu
-- -----------------------------------------------------------------------------
alter table public.perfis enable row level security;

create policy "perfil_proprio_leitura" on public.perfis
  for select to authenticated using (id = (select auth.uid()));
create policy "perfil_proprio_escrita" on public.perfis
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "perfil_proprio_insercao" on public.perfis
  for insert to authenticated with check (id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- Criatórios e membros
-- -----------------------------------------------------------------------------
alter table public.criatorios        enable row level security;
alter table public.criatorio_membros enable row level security;

create policy "criatorio_membro_le" on public.criatorios
  for select to authenticated using (id in (select public.meus_criatorios()));
-- Qualquer autenticado pode criar o próprio criatório; o trigger de 0002 já o
-- inscreve como proprietário.
create policy "criatorio_cria" on public.criatorios
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "criatorio_dono_edita" on public.criatorios
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "criatorio_dono_apaga" on public.criatorios
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "membros_le" on public.criatorio_membros
  for select to authenticated using (criatorio_id in (select public.meus_criatorios()));
create policy "membros_dono_administra" on public.criatorio_membros
  for all to authenticated
  using (criatorio_id in (select id from public.criatorios where owner_id = (select auth.uid())))
  with check (criatorio_id in (select id from public.criatorios where owner_id = (select auth.uid())));

-- -----------------------------------------------------------------------------
-- Tabelas de dados do criatório: política única por tabela
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
  tabelas text[] := array[
    'especies', 'passaros', 'pesagens', 'casal_tags', 'casais',
    'ninhadas', 'posturas', 'postura_transferencias',
    'tratamentos', 'financeiro_lancamentos'
  ];
begin
  foreach t in array tabelas loop
    execute format('alter table public.%I enable row level security', t);
    execute format($f$
      create policy "tenant_total" on public.%I
        for all to authenticated
        using (criatorio_id in (select public.meus_criatorios()))
        with check (criatorio_id in (select public.meus_criatorios()))
    $f$, t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Tabelas com escopo misto: criatorio_id nulo = catálogo compartilhado
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
  tabelas text[] := array['mutacoes', 'sintomas', 'doencas', 'medicamentos', 'financeiro_categorias'];
begin
  foreach t in array tabelas loop
    execute format('alter table public.%I enable row level security', t);
    -- Lê o próprio e o catálogo (criatorio_id nulo).
    execute format($f$
      create policy "tenant_ou_catalogo_le" on public.%I
        for select to authenticated
        using (criatorio_id is null or criatorio_id in (select public.meus_criatorios()))
    $f$, t);
    -- Escreve só o próprio: ninguém edita o catálogo compartilhado.
    execute format($f$
      create policy "tenant_escreve" on public.%I
        for insert to authenticated
        with check (criatorio_id in (select public.meus_criatorios()))
    $f$, t);
    execute format($f$
      create policy "tenant_atualiza" on public.%I
        for update to authenticated
        using (criatorio_id in (select public.meus_criatorios()))
        with check (criatorio_id in (select public.meus_criatorios()))
    $f$, t);
    execute format($f$
      create policy "tenant_apaga" on public.%I
        for delete to authenticated
        using (criatorio_id in (select public.meus_criatorios()))
    $f$, t);
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Tabelas de junção: herdam o escopo do pai
-- -----------------------------------------------------------------------------
alter table public.casal_tag_vinculo    enable row level security;
alter table public.doenca_sintomas      enable row level security;
alter table public.medicamento_doencas  enable row level security;

create policy "via_casal" on public.casal_tag_vinculo
  for all to authenticated
  using (casal_id in (select id from public.casais where criatorio_id in (select public.meus_criatorios())))
  with check (casal_id in (select id from public.casais where criatorio_id in (select public.meus_criatorios())));

create policy "via_doenca" on public.doenca_sintomas
  for all to authenticated
  using (doenca_id in (select id from public.doencas where criatorio_id in (select public.meus_criatorios())))
  with check (doenca_id in (select id from public.doencas where criatorio_id in (select public.meus_criatorios())));

create policy "via_medicamento" on public.medicamento_doencas
  for all to authenticated
  using (medicamento_id in (select id from public.medicamentos where criatorio_id in (select public.meus_criatorios())))
  with check (medicamento_id in (select id from public.medicamentos where criatorio_id in (select public.meus_criatorios())));

-- -----------------------------------------------------------------------------
-- Views herdam a RLS das tabelas de base (security_invoker)
-- -----------------------------------------------------------------------------
alter view public.vw_posturas      set (security_invoker = on);
alter view public.vw_tarefas_hoje  set (security_invoker = on);
