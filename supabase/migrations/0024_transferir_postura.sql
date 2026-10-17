-- =============================================================================
-- SisAves · 0024 · Transferir postura entre casais
--
-- Prática real do galpão: o ovo passa para outro casal chocar — a "babá". O
-- legado tinha transferir/desfazer sem deixar rastro, e a tabela
-- `postura_transferencias` existe desde 0005 justamente para guardar o rastro.
-- Faltava o que ela registra.
--
-- A armadilha: NÃO dá para mudar `posturas.casal_id`. É dele que
-- `anilhar_filhotes` tira a filiação do filhote, e dele que `vw_posturas` tira
-- a espécie e, com ela, todos os prazos do ciclo. Mover o ovo de casal daria
-- ao filhote os pais errados — em silêncio, e para sempre, porque a anilha
-- copia a filiação no momento em que entra.
--
-- São duas perguntas diferentes: de quem é o ovo e quem está chocando. Duas
-- colunas.
-- =============================================================================

alter table public.posturas
  add column casal_chocador_id uuid references public.casais(id) on delete set null;

alter table public.posturas
  add constraint posturas_chocador_distinto
  check (casal_chocador_id is null or casal_chocador_id <> casal_id);

comment on column public.posturas.casal_chocador_id is
  'Casal que está chocando o ovo, quando não é o que o pôs. Nulo é o caso normal. A FILIAÇÃO do filhote vem sempre de casal_id — esta coluna não participa dela.';

create index on public.posturas (casal_chocador_id) where deleted_at is null;

-- -----------------------------------------------------------------------------
-- transferir_posturas
-- -----------------------------------------------------------------------------
-- Toca a postura e o histórico de transferências: tem de valer inteira, senão
-- o ovo muda de ninho sem deixar rastro — exatamente o defeito do legado.
create or replace function public.transferir_posturas(
  p_destino_id uuid,
  p_posturas   uuid[],
  p_motivo     text default null
)
returns integer
language plpgsql
as $$
declare
  v_postura     public.posturas%rowtype;
  v_destino     public.casais%rowtype;
  v_id          uuid;
  v_origem      uuid;
  v_transferidos integer := 0;
begin
  if p_posturas is null or array_length(p_posturas, 1) is null then
    raise exception 'Nenhum ovo escolhido para transferir.';
  end if;

  select * into v_destino
    from public.casais
   where id = p_destino_id and deleted_at is null
   for update;

  if not found then
    raise exception 'Casal de destino não encontrado ou fora do seu criatório.';
  end if;

  if v_destino.vigencia_fim is not null then
    raise exception 'O casal % está encerrado e não recebe ovo para chocar.',
      lpad(v_destino.numero::text, 2, '0');
  end if;

  foreach v_id in array p_posturas
  loop
    select * into v_postura
      from public.posturas
     where id = v_id and deleted_at is null
     for update;

    if not found then
      raise exception 'Ovo não encontrado ou fora do seu criatório.';
    end if;

    -- Já está com este casal: silêncio, não erro. É o reenvio da fila offline
    -- chegando pela segunda vez, ou o toque duplo no botão.
    if v_postura.casal_chocador_id is not distinct from p_destino_id then
      continue;
    end if;

    if v_postura.casal_id = p_destino_id then
      raise exception 'O ovo % já é do casal %.',
        coalesce(v_postura.numero_ovo::text, 'escolhido'),
        lpad(v_destino.numero::text, 2, '0');
    end if;

    if v_postura.desfecho is not null then
      raise exception 'O ovo % já saiu do ciclo e não se transfere.',
        coalesce(v_postura.numero_ovo::text, 'escolhido');
    end if;

    if v_postura.data_separacao is not null then
      raise exception 'O filhote do ovo % já foi separado.',
        coalesce(v_postura.numero_ovo::text, 'escolhido');
    end if;

    v_origem := coalesce(v_postura.casal_chocador_id, v_postura.casal_id);

    update public.posturas
       set casal_chocador_id = p_destino_id
     where id = v_postura.id;

    insert into public.postura_transferencias
      (criatorio_id, postura_id, casal_origem_id, casal_destino_id, motivo)
    values
      (v_postura.criatorio_id, v_postura.id, v_origem, p_destino_id, nullif(trim(p_motivo), ''));

    v_transferidos := v_transferidos + 1;
  end loop;

  return v_transferidos;
end;
$$;

comment on function public.transferir_posturas is
  'Passa ovos para outro casal chocar. Muda quem choca, nunca de quem é o ovo: a filiação do filhote continua vindo de casal_id. Registra cada passagem em postura_transferencias.';

grant execute on function public.transferir_posturas(uuid, uuid[], text) to authenticated;

-- -----------------------------------------------------------------------------
-- devolver_postura
-- -----------------------------------------------------------------------------
-- O ovo volta para o ninho de origem. A transferência não some do histórico —
-- ela aconteceu; ganha data de fim.
create or replace function public.devolver_postura(p_postura_id uuid)
returns boolean
language plpgsql
as $$
declare
  v_postura public.posturas%rowtype;
begin
  select * into v_postura
    from public.posturas
   where id = p_postura_id and deleted_at is null
   for update;

  if not found then
    raise exception 'Ovo não encontrado ou fora do seu criatório.';
  end if;

  if v_postura.casal_chocador_id is null then
    return false;  -- Já está no ninho de origem.
  end if;

  update public.posturas set casal_chocador_id = null where id = v_postura.id;

  update public.postura_transferencias
     set desfeita_em = now()
   where postura_id = v_postura.id and desfeita_em is null;

  return true;
end;
$$;

comment on function public.devolver_postura is
  'Devolve o ovo ao casal que o pôs. A transferência fica no histórico com desfeita_em — ela aconteceu.';

grant execute on function public.devolver_postura(uuid) to authenticated;
