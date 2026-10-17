-- =============================================================================
-- SisAves · 0022 · O "hoje" do criatório
--
-- `current_date` no Postgres do Supabase é UTC. Das 21h à meia-noite de
-- Brasília ele já está no dia seguinte — e é exatamente a janela em que o
-- criador trabalha, porque eclosão acontece de madrugada.
--
-- O efeito era discreto e espalhado: a situação do ovo avançava um dia antes
-- do tempo, a janela de anilhamento abria e vencia cedo, e a guarda "não pode
-- ser no futuro" aceitava amanhã. Nada quebrava; tudo ficava um dia errado.
--
-- O produto é brasileiro e o criatório tem um lugar. O fuso fica explícito.
-- =============================================================================

create or replace function public.hoje()
returns date
language sql
stable
as $$
  select (now() at time zone 'America/Sao_Paulo')::date;
$$;

comment on function public.hoje is
  'Data de hoje no fuso do criatório. `current_date` é UTC e adianta um dia entre 21h e meia-noite — a janela da madrugada, que é quando o criatório trabalha.';

grant execute on function public.hoje() to authenticated, anon;

-- -----------------------------------------------------------------------------
-- A máquina de estados passa a receber o dia certo
-- -----------------------------------------------------------------------------
-- A função continua `immutable`: ela não lê relógio nenhum, recebe o dia como
-- parâmetro. O que muda é o DEFAULT, avaliado por quem chama — e é por isso
-- que o mesmo cálculo segue rodando no cliente offline.
create or replace function public.situacao_postura(
  p_data_postura     date,
  p_ovoscopia_em     date,
  p_fertil           boolean,
  p_data_eclosao     date,
  p_data_anilhamento date,
  p_data_separacao   date,
  p_desfecho         desfecho_postura,
  p_dias_choco       smallint,
  p_dias_ovoscopia   smallint,
  p_dias_anilha      smallint,
  p_dias_separa      smallint,
  p_hoje             date default public.hoje()
)
returns situacao_postura
language sql
immutable
as $$
  select case
    when p_desfecho = 'infertil' then 'infertil'::situacao_postura
    when p_desfecho = 'perdido'  then 'perdido'::situacao_postura
    when p_fertil is false       then 'infertil'::situacao_postura

    when p_data_separacao is not null then 'separado'::situacao_postura

    when p_data_eclosao is not null then
      case
        when p_data_anilhamento is null
             and p_hoje >= p_data_eclosao + p_dias_anilha
          then 'anilhar'::situacao_postura
        when p_hoje >= p_data_eclosao + p_dias_separa
          then 'separar'::situacao_postura
        else 'nascido'::situacao_postura
      end

    -- Margem de 1 dia antes da previsão: o criador precisa estar atento na véspera.
    when p_hoje >= p_data_postura + p_dias_choco - 1
      then 'nascendo'::situacao_postura
    when p_ovoscopia_em is null
         and p_hoje >= p_data_postura + p_dias_ovoscopia
      then 'verificar'::situacao_postura
    else 'chocando'::situacao_postura
  end;
$$;

comment on function public.situacao_postura is
  'Deriva o estado do ovo a partir das datas observadas e dos prazos da espécie. Immutable: o mesmo cálculo roda no servidor e no cliente offline.';

-- -----------------------------------------------------------------------------
-- vw_posturas: o sinal de urgência do anilhamento também lia UTC
-- -----------------------------------------------------------------------------
-- `anilhamento_vencido` e `dias_restantes_anilha` comparavam com `current_date`
-- direto. Numa janela de dois dias, um dia a mais é metade do prazo.
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
     and public.hoje() > p.data_eclosao + e.dias_anilha + e.janela_anilha_dias
    then true else false
  end as anilhamento_vencido,

  case
    when p.data_eclosao is not null and p.data_anilhamento is null
    then (p.data_eclosao + e.dias_anilha + e.janela_anilha_dias) - public.hoje()
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

alter view public.vw_posturas set (security_invoker = on);

-- -----------------------------------------------------------------------------
-- As guardas de "não pode ser no futuro"
-- -----------------------------------------------------------------------------
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

  if p_data > public.hoje() then
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
     * Marco que já está gravado é silêncio, não erro. É o que torna o reenvio
     * da fila offline idempotente sem depender de ler mensagem de erro.
     */
    if (v_marco = 'fertil'   and v_postura.ovoscopia_em is not null and v_postura.fertil is true)
    or (v_marco = 'infertil' and v_postura.fertil is false)
    or (v_marco = 'eclodiu'  and v_postura.data_eclosao is not null)
    or (v_marco = 'separado' and v_postura.data_separacao is not null)
    or (v_marco = 'perdido'  and v_postura.desfecho = 'perdido')
    then
      continue;
    end if;

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
           set ovoscopia_em = p_data, fertil = true
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
               -- `ovoscopia_em` fica em branco: inventar a data da observação
               -- seria inventar a observação.
               fertil       = true
         where id = v_postura.id;

      when 'separado' then
        if v_postura.data_eclosao is null then
          raise exception 'Só é possível separar filhote que já eclodiu.';
        end if;
        if v_postura.data_anilhamento is null then
          raise exception 'Este filhote ainda não foi anilhado. Anilhe antes de separar — separado, ele encerra o ciclo sem entrar no plantel.';
        end if;
        if p_data < v_postura.data_eclosao then
          raise exception 'A separação é anterior à eclosão, de %.',
            to_char(v_postura.data_eclosao, 'DD/MM/YYYY');
        end if;
        update public.posturas set data_separacao = p_data where id = v_postura.id;

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

        -- Filhote já anilhado é ave no plantel: marcar só a postura deixaria a
        -- ave viva na listagem e disponível para formar casal.
        if v_postura.passaro_id is not null then
          update public.passaros
             set situacao = 'morto', dt_obito = p_data
           where id = v_postura.passaro_id and situacao = 'ativo';
        end if;

      else
        raise exception 'Marco desconhecido: %.', coalesce(v_marco, 'vazio');
    end case;

    v_aplicados := v_aplicados + 1;
  end loop;

  return v_aplicados;
end;
$$;

create or replace function public.registrar_saida(
  p_passaro_id uuid,
  p_situacao   situacao_ave,
  p_data       date,
  p_destino    text default null,
  p_motivo     text default null,
  p_valor      numeric default null
)
returns uuid
language plpgsql
as $$
declare
  v_ave        public.passaros%rowtype;
  v_casal      public.casais%rowtype;
  v_categoria  uuid;
  v_lancamento uuid;
  v_rotulo     text;
begin
  if p_situacao = 'ativo' then
    raise exception 'Saída do plantel não aceita a situação "ativo".';
  end if;

  if p_data > public.hoje() then
    raise exception 'A saída não pode ser no futuro.';
  end if;

  select * into v_ave
    from public.passaros
   where id = p_passaro_id and deleted_at is null
   for update;

  if not found then
    raise exception 'Ave não encontrada ou fora do seu criatório.';
  end if;

  -- Já registrada do mesmo jeito: silêncio, não erro. É o reenvio da fila
  -- offline chegando pela segunda vez, ou o toque duplo no botão.
  if v_ave.situacao = p_situacao
     and coalesce(v_ave.dt_obito, v_ave.saida_em) is not distinct from p_data then
    return null;
  end if;

  if v_ave.situacao <> 'ativo' then
    raise exception 'Esta ave já saiu do plantel: %.',
      case v_ave.situacao
        when 'vendido'    then 'vendida'
        when 'doado'      then 'doada'
        when 'morto'      then 'óbito registrado'
        when 'perdido'    then 'registrada como fuga'
        when 'emprestado' then 'emprestada'
      end;
  end if;

  if v_ave.dt_nascimento is not null and p_data < v_ave.dt_nascimento then
    raise exception 'A saída é anterior ao nascimento da ave, de %.',
      to_char(v_ave.dt_nascimento, 'DD/MM/YYYY');
  end if;

  if p_valor is not null and p_situacao <> 'vendido' then
    raise exception 'Valor só entra em venda.';
  end if;

  if p_valor is not null and p_valor <= 0 then
    raise exception 'O valor da venda precisa ser maior que zero.';
  end if;

  /*
   * O casal que a ave formava acaba junto.
   *
   * Não é efeito colateral escondido: a tela avisa antes e a confirmação diz
   * qual casal foi encerrado e em que dia. Deixar o casal vigente seria manter
   * um par com uma ave que não está mais no galpão — ele seguiria na lista de
   * casais ativos, aceitando postura nova.
   */
  select * into v_casal
    from public.casais
   where (macho_id = p_passaro_id or femea_id = p_passaro_id)
     and deleted_at is null
     and vigencia_fim is null
   limit 1
   for update;

  if found then
    if p_data < v_casal.vigencia_inicio then
      raise exception 'O casal % começou em % e não pode ser encerrado antes disso.',
        lpad(v_casal.numero::text, 2, '0'),
        to_char(v_casal.vigencia_inicio, 'DD/MM/YYYY');
    end if;
    update public.casais set vigencia_fim = p_data where id = v_casal.id;
  end if;

  update public.passaros
     set situacao     = p_situacao,
         dt_obito     = case when p_situacao = 'morto' then p_data else null end,
         saida_em     = case when p_situacao = 'morto' then null else p_data end,
         saida_motivo = nullif(trim(p_motivo), ''),
         -- Quem ficou com a ave. Óbito e fuga não têm portador.
         portador     = case
                          when p_situacao in ('vendido','doado','emprestado')
                          then nullif(trim(p_destino), '')
                          else v_ave.portador
                        end
   where id = p_passaro_id;

  -- A venda com valor vira receita. Sem valor informado, não inventa número:
  -- doação e troca existem, e zero não é o mesmo que "não informado".
  if p_situacao = 'vendido' and p_valor is not null then
    select id into v_categoria
      from public.financeiro_categorias
     where chave = 'venda_passaro' and deleted_at is null;

    v_rotulo := coalesce(
      nullif(trim(v_ave.nome), ''),
      nullif(concat_ws(' ', v_ave.anilha_sigla, v_ave.anilha_numero::text), ''),
      'ave sem nome'
    );

    insert into public.financeiro_lancamentos
      (criatorio_id, tipo, categoria_id, valor, data, descricao, passaro_id)
    values
      (v_ave.criatorio_id, 'receita', v_categoria, p_valor, p_data,
       concat('Venda · ', v_rotulo, case when p_destino is null then '' else concat(' · ', trim(p_destino)) end),
       p_passaro_id)
    returning id into v_lancamento;
  end if;

  return v_lancamento;
end;
$$;
