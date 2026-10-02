-- =============================================================================
-- SisAves · 0015 · Caminho na árvore genealógica
--
-- `arvore_genealogica` devolvia `papel` ('pai' | 'mae') relativo ao nó anterior,
-- o que não basta para montar a árvore: na geração dos avós há DOIS 'pai' e
-- DOIS 'mae', e nada dizia qual deles é paterno e qual é materno. Pior quando o
-- mesmo ancestral aparece dos dois lados — justamente o caso que a tela B6
-- precisa destacar.
--
-- `caminho` resolve: 'raiz', depois 'p' e 'm' concatenados da raiz para cima.
--   p   = pai          m   = mãe
--   pp  = avô paterno  pm  = avó paterna
--   mp  = avô materno  mm  = avó materna
--
-- O mesmo `passaro_id` em mais de um caminho é ancestral repetido.
--
-- Vale também para o CRO: um certificado que não diz de que lado veio o avô não
-- prova a linhagem que ele existe para provar.
-- =============================================================================

-- O tipo de retorno muda, então não dá para `create or replace`.
drop function if exists public.arvore_genealogica(uuid, integer);

create function public.arvore_genealogica(
  p_passaro_id uuid,
  p_geracoes integer default 3
)
returns table (
  passaro_id uuid,
  nome text,
  anilha_sigla text,
  anilha_criador text,
  anilha_ano smallint,
  anilha_numero integer,
  sexo sexo_ave,
  especie_nome text,
  mutacao_nome text,
  geracao integer,
  papel text,      -- 'raiz' | 'pai' | 'mae', relativo ao nó anterior
  caminho text     -- 'raiz' | 'p' | 'm' | 'pp' | 'pm' | 'mp' | 'mm' | ...
)
language sql
stable
as $$
  -- Mesma restrição de referência recursiva única: pai e mãe vêm de um lateral,
  -- que já carrega o papel de cada um.
  with recursive arvore as (
    select p.id, 0 as geracao, 'raiz'::text as papel, 'raiz'::text as caminho
      from public.passaros p
     where p.id = p_passaro_id
    union all
    select n.id,
           a.geracao + 1,
           n.papel,
           case when a.caminho = 'raiz' then n.sigla else a.caminho || n.sigla end
      from arvore a
      join public.passaros p on p.id = a.id
      cross join lateral (values (p.pai_id, 'pai', 'p'), (p.mae_id, 'mae', 'm'))
        as n(id, papel, sigla)
     where n.id is not null and a.geracao < p_geracoes
  )
  select p.id, p.nome, p.anilha_sigla, p.anilha_criador, p.anilha_ano,
         p.anilha_numero, p.sexo, e.nome, m.nome, a.geracao, a.papel, a.caminho
    from arvore a
    join public.passaros p on p.id = a.id
    left join public.especies e on e.id = p.especie_id
    left join public.mutacoes m on m.id = p.mutacao_id
   order by a.geracao, a.caminho;
$$;

comment on function public.arvore_genealogica is
  'Árvore de ancestrais com o caminho desde a raiz ("pp" = avô paterno). Alimenta a tela B6 e o snapshot do CRO. O mesmo passaro_id em dois caminhos é ancestral repetido.';

-- -----------------------------------------------------------------------------
-- O snapshot do certificado passa a guardar o caminho
-- -----------------------------------------------------------------------------
-- Sem ele, um CRO emitido hoje não diria de que lado veio cada avô — e o
-- snapshot existe exatamente para provar o que era verdade na emissão.
create or replace function public.montar_snapshot_certificado(p_passaro_id uuid)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'emitido_em', now(),
    'ave', jsonb_build_object(
      'nome', p.nome,
      'anilha', jsonb_build_object(
        'sigla', p.anilha_sigla, 'criador', p.anilha_criador,
        'ano', p.anilha_ano, 'numero', p.anilha_numero),
      'codigo_alternativo', p.codigo_alternativo,
      'sexo', p.sexo,
      'dt_nascimento', p.dt_nascimento,
      'especie', e.nome,
      'mutacao', m.nome,
      'foto_url', p.foto_url
    ),
    'criatorio', jsonb_build_object(
      -- Só o que identifica a origem da ave. Telefone, e-mail e redes do criador
      -- ficam de fora: a página pública prova a ave, não expõe o vendedor.
      'nome', c.nome,
      'slug', c.slug,
      'registro_ibama', c.registro_ibama,
      'clube', cl.sigla,
      'nro_criador', c.nro_criador,
      'cidade', c.cidade,
      'uf', c.uf,
      'logo_url', c.logo_url
    ),
    'endogamia_pct', public.coeficiente_endogamia(p.pai_id, p.mae_id),
    'genealogia', coalesce((
      select jsonb_agg(jsonb_build_object(
               'geracao', a.geracao, 'papel', a.papel, 'caminho', a.caminho,
               'nome', a.nome,
               'sexo', a.sexo, 'especie', a.especie_nome, 'mutacao', a.mutacao_nome,
               'anilha', jsonb_build_object(
                 'sigla', a.anilha_sigla, 'criador', a.anilha_criador,
                 'ano', a.anilha_ano, 'numero', a.anilha_numero)
             ) order by a.geracao, a.caminho)
        from public.arvore_genealogica(p_passaro_id, 3) a
       where a.geracao > 0
    ), '[]'::jsonb)
  )
  from public.passaros p
  left join public.especies e on e.id = p.especie_id
  left join public.mutacoes m on m.id = p.mutacao_id
  join public.criatorios c on c.id = p.criatorio_id
  left join public.clubes cl on cl.id = c.clube_id
  where p.id = p_passaro_id;
$$;
