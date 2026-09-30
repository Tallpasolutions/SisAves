-- =============================================================================
-- SisAves · 0008 · Genealogia e coeficiente de endogamia
--
-- É o "banco genético automático" que o produto vende. Três funções:
-- ancestrais (base), ancestrais_comuns (diagnóstico) e coeficiente_endogamia.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Ancestrais de uma ave, com a distância em gerações
-- -----------------------------------------------------------------------------
-- Uma mesma ave pode aparecer em MAIS DE UM caminho (é exatamente isso que
-- gera endogamia), então o retorno traz uma linha por caminho, não por ave.
create or replace function public.ancestrais(
  p_passaro_id uuid,
  p_max_geracoes integer default 10
)
returns table (ancestral_id uuid, geracoes integer)
language sql
stable
as $$
  -- O Postgres admite UMA só referência recursiva por CTE, então pai e mãe
  -- saem juntos de um lateral em vez de dois ramos separados.
  with recursive caminho as (
    select a.id as ancestral_id, 1 as geracoes
      from public.passaros p
      cross join lateral (values (p.pai_id), (p.mae_id)) as a(id)
     where p.id = p_passaro_id and a.id is not null
    union all
    select a.id, c.geracoes + 1
      from caminho c
      join public.passaros p on p.id = c.ancestral_id
      cross join lateral (values (p.pai_id), (p.mae_id)) as a(id)
     where a.id is not null and c.geracoes < p_max_geracoes
  )
  select ancestral_id, geracoes from caminho;
$$;

comment on function public.ancestrais is
  'Uma linha por CAMINHO até o ancestral, não por ancestral. A repetição é o dado que produz endogamia.';

-- -----------------------------------------------------------------------------
-- Ancestrais comuns entre duas aves
-- -----------------------------------------------------------------------------
create or replace function public.ancestrais_comuns(
  p_a uuid,
  p_b uuid,
  p_max_geracoes integer default 10
)
returns table (
  ancestral_id uuid,
  nome text,
  anilha_numero integer,
  anilha_ano smallint,
  geracoes_a integer,
  geracoes_b integer
)
language sql
stable
as $$
  select a.ancestral_id,
         p.nome,
         p.anilha_numero,
         p.anilha_ano,
         min(a.geracoes) as geracoes_a,
         min(b.geracoes) as geracoes_b
    from public.ancestrais(p_a, p_max_geracoes) a
    join public.ancestrais(p_b, p_max_geracoes) b on b.ancestral_id = a.ancestral_id
    join public.passaros p on p.id = a.ancestral_id
   group by a.ancestral_id, p.nome, p.anilha_numero, p.anilha_ano
   order by min(a.geracoes) + min(b.geracoes);
$$;

comment on function public.ancestrais_comuns is
  'Alimenta a explicação de uma frase na ficha do casal ("Avós paternos em comum").';

-- -----------------------------------------------------------------------------
-- Coeficiente de endogamia (Wright)
-- -----------------------------------------------------------------------------
-- F = Σ (0,5)^(n1+n2+1) × (1+F_A), somado sobre CADA PAR de caminhos distintos
-- que ligam o pai e a mãe a um ancestral comum A.
--
-- Simplificação declarada: F_A é assumido 0 (ancestral comum não endogâmico).
-- Calcular F_A exigiria recursão sobre a própria função, e o erro é desprezível
-- nas 3-4 gerações que um criatório de fato registra. Se um dia o plantel tiver
-- pedigree profundo, esta é a primeira coisa a revisitar.
--
-- Os limiares que a interface usa saem daqui: meios-irmãos = 12,5%,
-- primos-primeiros = 6,25%.
create or replace function public.coeficiente_endogamia(
  p_macho_id uuid,
  p_femea_id uuid,
  p_max_geracoes integer default 10
)
returns numeric
language sql
stable
as $$
  with
  -- O próprio par conta como caminho de geração 0: se o macho for ancestral da
  -- fêmea (ou vice-versa), isso precisa entrar na soma.
  cam_m as (
    select p_macho_id as ancestral_id, 0 as geracoes
    union all
    select ancestral_id, geracoes from public.ancestrais(p_macho_id, p_max_geracoes)
  ),
  cam_f as (
    select p_femea_id as ancestral_id, 0 as geracoes
    union all
    select ancestral_id, geracoes from public.ancestrais(p_femea_id, p_max_geracoes)
  )
  select coalesce(
           round(sum(power(0.5, m.geracoes + f.geracoes + 1))::numeric * 100, 2),
           0
         )
    from cam_m m
    join cam_f f on f.ancestral_id = m.ancestral_id;
$$;

comment on function public.coeficiente_endogamia is
  'Coeficiente de Wright em PERCENTUAL, duas decimais. F_A assumido 0 — ver comentário na migration.';

-- Classificação nas três faixas que o design usa.
create or replace function public.faixa_endogamia(p_pct numeric)
returns text
language sql
immutable
as $$
  select case
    when p_pct is null then null
    when p_pct < 6.25  then 'seguro'
    when p_pct <= 12.5 then 'atencao'
    else 'risco'
  end;
$$;

-- -----------------------------------------------------------------------------
-- Árvore genealógica para a tela B6 e para o CRO
-- -----------------------------------------------------------------------------
create or replace function public.arvore_genealogica(
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
  papel text        -- 'raiz' | 'pai' | 'mae', relativo ao nó anterior
)
language sql
stable
as $$
  -- Mesma restrição de referência recursiva única: pai e mãe vêm de um lateral,
  -- que já carrega o papel de cada um.
  with recursive arvore as (
    select p.id, 0 as geracao, 'raiz'::text as papel
      from public.passaros p
     where p.id = p_passaro_id
    union all
    select n.id, a.geracao + 1, n.papel
      from arvore a
      join public.passaros p on p.id = a.id
      cross join lateral (values (p.pai_id, 'pai'), (p.mae_id, 'mae')) as n(id, papel)
     where n.id is not null and a.geracao < p_geracoes
  )
  select p.id, p.nome, p.anilha_sigla, p.anilha_criador, p.anilha_ano,
         p.anilha_numero, p.sexo, e.nome, m.nome, a.geracao, a.papel
    from arvore a
    join public.passaros p on p.id = a.id
    left join public.especies e on e.id = p.especie_id
    left join public.mutacoes m on m.id = p.mutacao_id
   order by a.geracao, a.papel;
$$;
