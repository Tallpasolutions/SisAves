-- =============================================================================
-- SisAves · 0023 · Desfazer um marco do ciclo
--
-- `registrar_marcos` (0017) recusa sobrepor um marco já gravado, e isso está
-- certo: conferência não é edição. Mas a correção não existia em lugar nenhum,
-- e o marco errado é fácil de produzir — basta tocar "Ovo claro" na linha do
-- ovo de cima, com a lanterna na boca.
--
-- Desfazer apaga o fato observado e devolve o ovo ao ciclo. Corrigir a DATA de
-- um marco é desfazer e registrar de novo: são dois toques, e evita uma
-- segunda função que teria de repetir todas as guardas desta.
-- =============================================================================

create or replace function public.desfazer_marco(
  p_postura_id uuid,
  p_marco      text
)
returns boolean
language plpgsql
as $$
declare
  v_postura public.posturas%rowtype;
  v_ave     public.passaros%rowtype;
begin
  select * into v_postura
    from public.posturas
   where id = p_postura_id and deleted_at is null
   for update;

  if not found then
    raise exception 'Ovo não encontrado ou fora do seu criatório.';
  end if;

  case p_marco
    -- -------------------------------------------------------------------------
    when 'ovoscopia' then
      if v_postura.ovoscopia_em is null then
        return false;  -- Nada a desfazer: silêncio, não erro.
      end if;
      if v_postura.desfecho = 'infertil' then
        raise exception 'Este ovo foi declarado claro. Desfaça o desfecho, que a ovoscopia vem junto.';
      end if;
      if v_postura.data_eclosao is not null then
        raise exception 'Este ovo já eclodiu em %; a ovoscopia dele é história.',
          to_char(v_postura.data_eclosao, 'DD/MM/YYYY');
      end if;
      update public.posturas
         set ovoscopia_em = null, fertil = null
       where id = v_postura.id;

    -- -------------------------------------------------------------------------
    when 'eclosao' then
      if v_postura.data_eclosao is null then
        return false;
      end if;
      -- A ave existe no plantel e tem a data de nascimento vinda daqui.
      -- Apagar a eclosão deixaria a ave órfã do fato que a criou.
      if v_postura.data_anilhamento is not null then
        raise exception 'Este filhote já foi anilhado em % e virou ave no plantel. A eclosão não se desfaz depois disso.',
          to_char(v_postura.data_anilhamento, 'DD/MM/YYYY');
      end if;
      if v_postura.data_separacao is not null then
        raise exception 'Este filhote já foi separado. Desfaça a separação primeiro.';
      end if;
      update public.posturas
         set data_eclosao = null,
             -- `fertil` tinha sido deduzido da eclosão, não observado.
             fertil = case when v_postura.ovoscopia_em is null then null else v_postura.fertil end
       where id = v_postura.id;

    -- -------------------------------------------------------------------------
    when 'separacao' then
      if v_postura.data_separacao is null then
        return false;
      end if;
      update public.posturas set data_separacao = null where id = v_postura.id;

    -- -------------------------------------------------------------------------
    when 'desfecho' then
      if v_postura.desfecho is null then
        return false;
      end if;

      /*
       * Perda de filhote anilhado matou a ave junto (ver 0017). Desfazer tem de
       * desfazer as duas pontas: deixar a ave morta seria guardar metade de um
       * registro que o criador acabou de dizer que nunca aconteceu.
       *
       * Só vale quando a morte veio DESTE marco — mesma data. Ave morta por
       * outro motivo tem história própria, e aqui não é lugar de apagá-la.
       */
      if v_postura.passaro_id is not null then
        select * into v_ave from public.passaros where id = v_postura.passaro_id for update;

        if found and v_ave.situacao = 'morto' then
          if v_ave.dt_obito is distinct from v_postura.desfecho_em then
            raise exception 'A ave deste filhote consta como morta em %, data diferente da perda registrada aqui. Resolva na ficha da ave.',
              to_char(v_ave.dt_obito, 'DD/MM/YYYY');
          end if;
          update public.passaros
             set situacao = 'ativo', dt_obito = null
           where id = v_ave.id;
        end if;
      end if;

      update public.posturas
         set desfecho        = null,
             desfecho_em     = null,
             desfecho_motivo = null,
             -- 'infertil' gravou a ovoscopia junto; desfazer devolve as duas.
             fertil          = case when v_postura.desfecho = 'infertil' then null else v_postura.fertil end,
             ovoscopia_em    = case when v_postura.desfecho = 'infertil' then null else v_postura.ovoscopia_em end
       where id = v_postura.id;

    else
      raise exception 'Marco desconhecido: %.', coalesce(p_marco, 'vazio');
  end case;

  return true;
end;
$$;

comment on function public.desfazer_marco is
  'Apaga um marco do ciclo registrado por engano e devolve o ovo ao ciclo. Desfazer a perda de filhote anilhado desfaz também o óbito da ave, quando foi esse marco que o gravou. Marco ausente devolve false, sem erro.';

grant execute on function public.desfazer_marco(uuid, text) to authenticated;
