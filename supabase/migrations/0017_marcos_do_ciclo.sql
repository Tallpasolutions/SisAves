-- =============================================================================
-- SisAves · 0017 · Os marcos do meio do ciclo
--
-- O estado do ovo é derivado de seis datas observadas (ver 0006). Até aqui a
-- interface escrevia duas: a postura e o anilhamento. As outras quatro —
-- ovoscopia, eclosão, separação e perda — só existiam na semente de
-- desenvolvimento, e por isso o ciclo nunca fechava para um criador de verdade:
-- o ovo entrava em "chocando" e ficava lá.
--
-- Esta migration dá ao banco a escrita que faltava, em UMA função. O motivo é o
-- galpão: o criador abre o ninho uma vez e encontra tudo junto — dois filhotes
-- nascidos, um ovo claro, um quebrado, um ainda chocando. Quatro funções
-- separadas o obrigariam a quatro passagens pela mesma ninhada.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A perda passa a ter data própria
-- -----------------------------------------------------------------------------
-- `desfecho` dizia o que aconteceu, nunca quando. A vw_movimentacoes usava
-- `updated_at` como aproximação, o que datava no dia do registro uma perda
-- encontrada três dias antes — e o criador registra o que viu, não o que
-- digitou.
alter table public.posturas
  add column desfecho_em date;

alter table public.posturas
  add constraint posturas_desfecho_em_posterior
  check (desfecho_em is null or desfecho_em >= data_postura);

alter table public.posturas
  add constraint posturas_desfecho_em_com_desfecho
  check (desfecho_em is null or desfecho is not null);

comment on column public.posturas.desfecho_em is
  'Dia em que a perda ou o ovo claro foi observado. Nulo em registro antigo, anterior a 0017.';

-- -----------------------------------------------------------------------------
-- registrar_marcos
-- -----------------------------------------------------------------------------
-- Recebe uma conferência inteira: uma data e a lista de ovos com o marco de
-- cada um. Tudo numa transação — um ovo recusado no fim não pode deixar os
-- anteriores gravados pela metade, senão o criador volta à tela sem saber o que
-- entrou.
--
-- Marcos aceitos:
--   fertil    · ovoscopia positiva  → ovoscopia_em, fertil = true
--   infertil  · ovo claro           → fertil = false, desfecho = 'infertil'
--   eclodiu   · nasceu              → data_eclosao
--   separado  · desmamado           → data_separacao
--   perdido   · ovo ou filhote      → desfecho = 'perdido'
--
-- `security invoker` de propósito, como em anilhar_filhotes: a RLS continua
-- sendo a fronteira, e a função não enxerga nada que o usuário já não enxergue.
create or replace function public.registrar_marcos(
  p_data   date,
  p_marcos jsonb
)
returns integer
language plpgsql
as $$
declare
  v_item      jsonb;
  v_postura   public.posturas%rowtype;
  v_marco     text;
  v_motivo    text;
  v_aplicados integer := 0;
begin
  if jsonb_typeof(p_marcos) <> 'array' or jsonb_array_length(p_marcos) = 0 then
    raise exception 'Nenhum ovo marcado.';
  end if;

  if p_data > current_date then
    raise exception 'A conferência não pode ser no futuro.';
  end if;

  for v_item in select * from jsonb_array_elements(p_marcos)
  loop
    v_marco  := v_item->>'marco';
    v_motivo := nullif(trim(v_item->>'motivo'), '');

    select * into v_postura
      from public.posturas
     where id = (v_item->>'postura_id')::uuid
       and deleted_at is null
     for update;

    if not found then
      raise exception 'Ovo não encontrado ou fora do seu criatório.';
    end if;

    if p_data < v_postura.data_postura then
      raise exception 'A conferência é anterior à postura, de %.',
        to_char(v_postura.data_postura, 'DD/MM/YYYY');
    end if;

    /*
     * Marco que já está gravado é silêncio, não erro.
     *
     * É o que torna o reenvio da fila offline idempotente sem depender de ler
     * mensagem de erro: se a primeira tentativa chegou e só a resposta se
     * perdeu, a segunda encontra o fato já lá e não conta como aplicada. Vale
     * também para o toque duplo no botão, que no celular acontece sozinho.
     */
    if (v_marco = 'fertil'   and v_postura.ovoscopia_em is not null and v_postura.fertil is true)
    or (v_marco = 'infertil' and v_postura.fertil is false)
    or (v_marco = 'eclodiu'  and v_postura.data_eclosao is not null)
    or (v_marco = 'separado' and v_postura.data_separacao is not null)
    or (v_marco = 'perdido'  and v_postura.desfecho = 'perdido')
    then
      continue;
    end if;

    -- Terminal já declarado: o ovo saiu do ciclo e não volta por aqui.
    -- Corrigir um desfecho errado é edição, e edição é outra tela.
    if v_postura.desfecho is not null or v_postura.fertil is false then
      raise exception 'O ovo % já foi registrado como %.',
        coalesce(v_postura.numero_ovo::text, 'desta ninhada'),
        case when coalesce(v_postura.desfecho::text, 'infertil') = 'infertil'
             then 'ovo claro' else 'perda' end;
    end if;

    case v_marco
      when 'fertil' then
        if v_postura.data_eclosao is not null then
          raise exception 'Este ovo já eclodiu em %. A ovoscopia não se aplica mais.',
            to_char(v_postura.data_eclosao, 'DD/MM/YYYY');
        end if;
        update public.posturas
           set ovoscopia_em = p_data,
               fertil       = true
         where id = v_postura.id;

      when 'infertil' then
        if v_postura.data_eclosao is not null then
          raise exception 'Este ovo já eclodiu em %; não pode ser ovo claro.',
            to_char(v_postura.data_eclosao, 'DD/MM/YYYY');
        end if;
        update public.posturas
           set ovoscopia_em    = coalesce(v_postura.ovoscopia_em, p_data),
               fertil          = false,
               desfecho        = 'infertil',
               desfecho_em     = p_data,
               desfecho_motivo = v_motivo
         where id = v_postura.id;

      when 'eclodiu' then
        update public.posturas
           set data_eclosao = p_data,
               -- Ovo que eclodiu era fértil, e isso é dedução segura. Mas
               -- `ovoscopia_em` fica em branco: a ovoscopia não foi feita, e
               -- inventar a data da observação seria inventar a observação.
               fertil       = true
         where id = v_postura.id;

      when 'separado' then
        if v_postura.data_eclosao is null then
          raise exception 'Só é possível separar filhote que já eclodiu.';
        end if;
        /*
         * Separar antes de anilhar perderia a ave.
         *
         * `situacao_postura` trata 'separado' como terminal e ele vence a
         * janela de anilha: o filhote sairia da fila de tarefas sem nunca ter
         * virado registro no plantel. A anilha é a identidade oficial da ave —
         * sem ela o filhote existe no galpão e não existe no criatório.
         *
         * A recusa não é beco sem saída: a tela de anilhamento aceita filhote
         * com a janela vencida, avisando do atraso.
         */
        if v_postura.data_anilhamento is null then
          raise exception 'Este filhote ainda não foi anilhado. Anilhe antes de separar — separado, ele encerra o ciclo sem entrar no plantel.';
        end if;
        if p_data < v_postura.data_eclosao then
          raise exception 'A separação é anterior à eclosão, de %.',
            to_char(v_postura.data_eclosao, 'DD/MM/YYYY');
        end if;
        update public.posturas
           set data_separacao = p_data
         where id = v_postura.id;

      when 'perdido' then
        if v_postura.data_eclosao is not null and p_data < v_postura.data_eclosao then
          raise exception 'A perda é anterior à eclosão, de %.',
            to_char(v_postura.data_eclosao, 'DD/MM/YYYY');
        end if;

        update public.posturas
           set desfecho        = 'perdido',
               desfecho_em     = p_data,
               desfecho_motivo = v_motivo
         where id = v_postura.id;

        -- Filhote já anilhado é ave no plantel. Marcar só a postura deixaria a
        -- ave viva na listagem, contada no plantel ativo e disponível para
        -- formar casal. O óbito acompanha a perda.
        if v_postura.passaro_id is not null then
          update public.passaros
             set situacao = 'morto',
                 dt_obito = p_data
           where id = v_postura.passaro_id
             and situacao = 'ativo';
        end if;

      else
        raise exception 'Marco desconhecido: %.', coalesce(v_marco, 'vazio');
    end case;

    v_aplicados := v_aplicados + 1;
  end loop;

  return v_aplicados;
end;
$$;

comment on function public.registrar_marcos is
  'Grava uma conferência de ninhada: uma data e o marco de cada ovo (fertil, infertil, eclodiu, separado, perdido). Marco já gravado é ignorado em silêncio, o que torna o reenvio da fila offline idempotente.';

grant execute on function public.registrar_marcos(date, jsonb) to authenticated;

-- -----------------------------------------------------------------------------
-- vw_posturas ganha o motivo e a data do desfecho
-- -----------------------------------------------------------------------------
-- Colunas só podem ser ACRESCENTADAS no fim num `create or replace view`; daí a
-- repetição da definição de 0006. A tela da ninhada precisa delas para dizer
-- "Perda · 09/03 · ovo quebrado" em vez de só "Perda".
create or replace view public.vw_posturas as
select
  p.id,
  p.criatorio_id,
  p.casal_id,
  c.numero                as casal_numero,
  p.ninhada_id,
  r.numero                as ninhada_numero,
  p.numero_ovo,
  p.data_postura,
  p.ovoscopia_em,
  p.fertil,
  p.data_eclosao,
  p.data_anilhamento,
  p.data_separacao,
  p.desfecho,
  p.passaro_id,
  e.id                    as especie_id,
  e.nome                  as especie_nome,

  (p.data_postura + e.dias_ovoscopia)::date              as previsao_ovoscopia,
  (p.data_postura + e.dias_choco)::date                  as previsao_eclosao,
  (p.data_eclosao + e.dias_anilha)::date                 as previsao_anilhamento,
  (p.data_eclosao + e.dias_anilha + e.janela_anilha_dias)::date as limite_anilhamento,
  (p.data_eclosao + e.dias_separa)::date                 as previsao_separacao,

  public.situacao_postura(
    p.data_postura, p.ovoscopia_em, p.fertil, p.data_eclosao,
    p.data_anilhamento, p.data_separacao, p.desfecho,
    e.dias_choco, e.dias_ovoscopia, e.dias_anilha, e.dias_separa
  ) as situacao,

  case
    when p.data_eclosao is not null
     and p.data_anilhamento is null
     and current_date > p.data_eclosao + e.dias_anilha + e.janela_anilha_dias
    then true else false
  end as anilhamento_vencido,

  case
    when p.data_eclosao is not null and p.data_anilhamento is null
    then (p.data_eclosao + e.dias_anilha + e.janela_anilha_dias) - current_date
  end as dias_restantes_anilha,

  p.observacoes,
  p.created_at,
  p.updated_at,
  p.desfecho_motivo,
  p.desfecho_em
from public.posturas p
join public.casais   c on c.id = p.casal_id
left join public.ninhadas r on r.id = p.ninhada_id
left join public.passaros mp on mp.id = c.macho_id
left join public.passaros fp on fp.id = c.femea_id
left join public.especies e  on e.id = coalesce(mp.especie_id, fp.especie_id)
where p.deleted_at is null;

-- Reaplicado de propósito: `create or replace view` não garante a preservação
-- das reloptions, e sem isto a view passaria a rodar com os direitos do dono —
-- um vazamento entre criatórios.
alter view public.vw_posturas set (security_invoker = on);

-- -----------------------------------------------------------------------------
-- vw_movimentacoes: ovoscopia e separação viram histórico
-- -----------------------------------------------------------------------------
-- Com a interface escrevendo os marcos, dois eventos que antes não aconteciam
-- passam a acontecer. O painel não pode ter buraco justamente no meio do ciclo.
create or replace view public.vw_movimentacoes as

select
  n.criatorio_id,
  n.iniciada_em                       as data,
  'postura'::text                     as tipo,
  count(p.id)::integer                as quantidade,
  c.id                                as casal_id,
  c.numero                            as casal_numero,
  n.id                                as ninhada_id,
  null::uuid                          as passaro_id,
  null::text                          as anilha_sigla,
  null::text                          as anilha_criador,
  null::smallint                      as anilha_ano,
  null::integer                       as anilha_numero
from public.ninhadas n
join public.casais c on c.id = n.casal_id
left join public.posturas p on p.ninhada_id = n.id and p.deleted_at is null
where n.deleted_at is null
group by n.criatorio_id, n.iniciada_em, c.id, c.numero, n.id

union all

-- Ovoscopia: só o resultado fértil. O ovo claro já aparece na sua própria
-- linha, e contar os dois faria o mesmo ovo surgir duas vezes no mesmo dia.
select
  p.criatorio_id,
  p.ovoscopia_em,
  'ovoscopia',
  count(*)::integer,
  c.id,
  c.numero,
  p.ninhada_id,
  null::uuid,
  null::text, null::text, null::smallint, null::integer
from public.posturas p
join public.casais c on c.id = p.casal_id
where p.deleted_at is null and p.ovoscopia_em is not null and p.fertil is true
group by p.criatorio_id, p.ovoscopia_em, c.id, c.numero, p.ninhada_id

union all

select
  p.criatorio_id,
  p.data_eclosao,
  'eclosao',
  count(*)::integer,
  c.id,
  c.numero,
  p.ninhada_id,
  null::uuid,
  null::text, null::text, null::smallint, null::integer
from public.posturas p
join public.casais c on c.id = p.casal_id
where p.deleted_at is null and p.data_eclosao is not null
group by p.criatorio_id, p.data_eclosao, c.id, c.numero, p.ninhada_id

union all

select
  p.criatorio_id,
  p.data_anilhamento,
  'anilhamento',
  1,
  c.id,
  c.numero,
  p.ninhada_id,
  a.id,
  a.anilha_sigla, a.anilha_criador, a.anilha_ano, a.anilha_numero
from public.posturas p
join public.casais c on c.id = p.casal_id
join public.passaros a on a.id = p.passaro_id and a.deleted_at is null
where p.deleted_at is null and p.data_anilhamento is not null

union all

-- Separação: fim do ciclo do ovo. Agrupada por ninhada e dia, como a eclosão.
select
  p.criatorio_id,
  p.data_separacao,
  'separacao',
  count(*)::integer,
  c.id,
  c.numero,
  p.ninhada_id,
  null::uuid,
  null::text, null::text, null::smallint, null::integer
from public.posturas p
join public.casais c on c.id = p.casal_id
where p.deleted_at is null and p.data_separacao is not null
group by p.criatorio_id, p.data_separacao, c.id, c.numero, p.ninhada_id

union all

-- Perda e ovo claro. A data agora é a do desfecho; `updated_at` fica só como
-- recurso para as linhas gravadas antes de 0017, que não têm a data.
select
  p.criatorio_id,
  coalesce(p.desfecho_em, p.updated_at::date),
  case when p.desfecho = 'infertil' then 'infertil' else 'perda' end,
  count(*)::integer,
  c.id,
  c.numero,
  p.ninhada_id,
  null::uuid,
  null::text, null::text, null::smallint, null::integer
from public.posturas p
join public.casais c on c.id = p.casal_id
where p.deleted_at is null and p.desfecho is not null
group by p.criatorio_id, coalesce(p.desfecho_em, p.updated_at::date),
         p.desfecho, c.id, c.numero, p.ninhada_id

union all

select
  g.criatorio_id,
  g.data,
  'pesagem',
  round(g.peso_gramas)::integer,
  null::uuid,
  null::integer,
  null::uuid,
  a.id,
  a.anilha_sigla, a.anilha_criador, a.anilha_ano, a.anilha_numero
from public.pesagens g
join public.passaros a on a.id = g.passaro_id and a.deleted_at is null
where g.deleted_at is null

union all

select
  t.criatorio_id,
  t.created_at::date,
  'certificado',
  1,
  null::uuid,
  null::integer,
  null::uuid,
  a.id,
  a.anilha_sigla, a.anilha_criador, a.anilha_ano, a.anilha_numero
from public.certificados t
join public.passaros a on a.id = t.passaro_id and a.deleted_at is null
where t.revogado_em is null;

comment on view public.vw_movimentacoes is
  'Histórico do criatório derivado dos fatos já gravados — não há tabela de eventos. Devolve fatos; a frase é montada na interface. Alimenta o painel do desktop.';

alter view public.vw_movimentacoes set (security_invoker = on);
