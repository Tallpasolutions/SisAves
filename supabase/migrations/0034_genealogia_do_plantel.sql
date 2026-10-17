-- =============================================================================
-- SisAves · 0034 · Genealogia do plantel inteiro
--
-- Até aqui a genealogia era sempre de UMA ave: a árvore da B6 sobe três
-- gerações a partir de uma raiz escolhida na ficha. O destino "Genealogia" da
-- sidebar ficava desabilitado porque não existia a pergunta inversa — *de onde
-- vem este plantel* —, e ela precisa do caminho contrário na mesma recursão:
-- descendentes, não ancestrais.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- descendentes
-- -----------------------------------------------------------------------------
-- O espelho de `ancestrais` (0008), com UMA diferença deliberada.
--
-- `ancestrais` devolve uma linha por CAMINHO, porque a repetição é o dado que
-- produz endogamia. Aqui a repetição é ruído: uma ave que descende do mesmo
-- fundador pelo pai E pela mãe continua sendo UMA ave no plantel, e contá-la
-- duas vezes inflaria a linhagem justamente nos criatórios mais fechados. Daí
-- o agrupamento, guardando a distância mais curta.
create or replace function public.descendentes(
  p_passaro_id   uuid,
  p_max_geracoes integer default 10
)
returns table (descendente_id uuid, geracoes integer)
language sql
stable
as $$
  with recursive descendencia as (
    select f.id as descendente_id, 1 as geracoes
      from public.passaros f
     where (f.pai_id = p_passaro_id or f.mae_id = p_passaro_id)
       and f.deleted_at is null
    union all
    select f.id, d.geracoes + 1
      from descendencia d
      join public.passaros f
        on (f.pai_id = d.descendente_id or f.mae_id = d.descendente_id)
     where f.deleted_at is null
       and d.geracoes < p_max_geracoes
  )
  select descendente_id, min(geracoes)::integer
    from descendencia
   group by descendente_id;
$$;

comment on function public.descendentes is
  'Descendentes de uma ave, uma linha por AVE (não por caminho) com a distância mais curta. O inverso de ancestrais(), que conta caminhos de propósito.';

-- -----------------------------------------------------------------------------
-- vw_linhagens
-- -----------------------------------------------------------------------------
-- Uma linhagem é um FUNDADOR com descendência registrada: ave sem pai nem mãe
-- no sistema, da qual o plantel desceu. Normalmente é a ave que o criador
-- comprou ou recebeu — a genealogia dela existe no papel do vendedor, não aqui.
--
-- Fundador sem nenhum descendente não é linhagem, é uma ave: fica de fora para
-- a lista não virar uma segunda cópia do plantel.
create view public.vw_linhagens as
  select
    p.criatorio_id,
    p.id as passaro_id,
    p.nome,
    p.sexo,
    p.situacao,
    p.anilha_sigla,
    p.anilha_criador,
    p.anilha_ano,
    p.anilha_numero,
    e.nome as especie_nome,
    d.total    as descendentes,
    d.geracoes as geracoes
  from public.passaros p
  left join public.especies e on e.id = p.especie_id
  cross join lateral (
    select count(*)::integer as total,
           coalesce(max(geracoes), 0)::integer as geracoes
      from public.descendentes(p.id, 10)
  ) d
  where p.deleted_at is null
    and p.pai_id is null
    and p.mae_id is null
    and d.total > 0;

alter view public.vw_linhagens set (security_invoker = on);

comment on view public.vw_linhagens is
  'Fundadores do plantel — ave sem progenitor registrado e com descendência — com o tamanho e a profundidade da linhagem.';

grant select on public.vw_linhagens to authenticated;
grant execute on function public.descendentes(uuid, integer) to authenticated;
