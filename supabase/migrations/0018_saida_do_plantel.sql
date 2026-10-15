-- =============================================================================
-- SisAves · 0018 · A saída da ave do plantel
--
-- `passaros.situacao` existia desde 0004 com seis valores, e nenhuma tela
-- escrevia cinco deles. Na prática toda ave ficava 'ativo' para sempre: a ave
-- vendida continuava contada no plantel, aparecia na busca e podia ser posta
-- num casal novo. O único caminho que tirava uma ave do ativo era a perda de
-- filhote anilhado, registrada na conferência da ninhada (0017).
--
-- Um plantel que não sabe quem saiu não serve de base para o CRO, que é a
-- próxima fase: o certificado afirma um plantel.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A data da saída
-- -----------------------------------------------------------------------------
-- `dt_obito` já existia e continua sendo a data do óbito — é ela que `0017`
-- escreve quando um filhote anilhado se perde. `saida_em` cobre as saídas que
-- não são morte. As duas nunca convivem: são o mesmo fato contado uma vez só.
--
-- Quem a ave foi parar não ganha coluna nova: `portador` existe desde 0004 e é
-- exatamente isso — "criador/terceiro que está com a ave".
alter table public.passaros
  add column saida_em date,
  add column saida_motivo text;

alter table public.passaros
  add constraint passaros_saida_exclusiva
  check (dt_obito is null or saida_em is null);

alter table public.passaros
  add constraint passaros_saida_posterior
  check (saida_em is null or dt_nascimento is null or saida_em >= dt_nascimento);

-- Ave ativa não tem data de saída. Sem isto, reativar uma ave emprestada
-- deixaria para trás a data de quando ela foi embora, e a ficha mostraria uma
-- saída que não vale mais.
alter table public.passaros
  add constraint passaros_ativo_sem_saida
  check (situacao <> 'ativo' or (dt_obito is null and saida_em is null));

comment on column public.passaros.saida_em is
  'Dia em que a ave deixou o plantel por venda, doação, empréstimo ou fuga. Óbito usa dt_obito; as duas colunas nunca convivem.';

-- -----------------------------------------------------------------------------
-- registrar_saida
-- -----------------------------------------------------------------------------
-- Toca até três tabelas: a ave, o casal que ela formava e o lançamento da
-- venda. Precisa valer inteira — uma venda que gravasse a receita e deixasse a
-- ave no plantel ativo é pior que uma venda não registrada, porque parece
-- registrada.
--
-- `security invoker`: a RLS segue sendo a fronteira.
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

  if p_data > current_date then
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

comment on function public.registrar_saida is
  'Tira a ave do plantel ativo: grava a situação e a data, encerra o casal vigente e, na venda com valor, lança a receita. Tudo numa transação. Repetir a mesma saída é silêncio, não erro.';

grant execute on function public.registrar_saida(uuid, situacao_ave, date, text, text, numeric) to authenticated;

-- -----------------------------------------------------------------------------
-- reativar_ave
-- -----------------------------------------------------------------------------
-- Só para quem pode voltar: a ave emprestada que o criador buscou de volta e a
-- que fugiu e apareceu. Venda e doação não voltam por aqui — a ave recomprada
-- entra como aquisição nova, com origem e anilha próprias. Óbito não volta.
--
-- O casal encerrado NÃO se reabre: ele teve fim e o histórico de ninhadas
-- pertence àquele período. Formar o par de novo é formar um casal novo.
create or replace function public.reativar_ave(p_passaro_id uuid)
returns void
language plpgsql
as $$
declare
  v_ave public.passaros%rowtype;
begin
  select * into v_ave
    from public.passaros
   where id = p_passaro_id and deleted_at is null
   for update;

  if not found then
    raise exception 'Ave não encontrada ou fora do seu criatório.';
  end if;

  if v_ave.situacao = 'ativo' then
    return;  -- Já está no plantel: reenvio ou toque duplo.
  end if;

  if v_ave.situacao not in ('emprestado', 'perdido') then
    raise exception 'Só volta ao plantel a ave emprestada ou que fugiu. Ave recomprada entra como aquisição nova.';
  end if;

  update public.passaros
     set situacao     = 'ativo',
         saida_em     = null,
         saida_motivo = null,
         portador     = null
   where id = p_passaro_id;
end;
$$;

comment on function public.reativar_ave is
  'Devolve ao plantel ativo a ave emprestada ou fugida. Limpa a data e o portador — ave ativa não tem saída em aberto. Não reabre o casal encerrado.';

grant execute on function public.reativar_ave(uuid) to authenticated;
