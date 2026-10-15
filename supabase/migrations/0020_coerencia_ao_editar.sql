-- =============================================================================
-- SisAves · 0020 · Coerência ao editar a ave
--
-- Até aqui a ave só era escrita no cadastro, no anilhamento e na saída — nunca
-- corrigida. Com a edição, abrem-se caminhos que o banco nunca precisou barrar:
--
--   · trocar o sexo de uma ave que é pai de outras deixaria filhotes com um
--     "pai" fêmea, e `tg_valida_genealogia` não pega isso. Aquele trigger
--     valida o FILHO ao gravar o filho; ninguém valida o progenitor quando é
--     ELE que muda;
--   · trocar o sexo de uma ave que está num casal vigente deixaria o casal com
--     duas fêmeas, sem nenhuma constraint reclamar.
--
-- O princípio do projeto é que a aplicação dá a mensagem boa e o banco dá a
-- garantia. A mensagem vive na Server Action; a garantia é este trigger.
-- =============================================================================

create or replace function public.tg_sexo_coerente()
returns trigger
language plpgsql
as $$
declare
  v_filhos  integer;
  v_casal   public.casais%rowtype;
  v_papel   text;
begin
  if new.sexo is not distinct from old.sexo then
    return new;
  end if;

  -- 'indefinido' é o estado de quem ainda não foi sexado; sair de macho ou
  -- fêmea para ele também quebraria a filiação já registrada.
  if old.sexo = 'macho' and new.sexo <> 'macho' then
    select count(*) into v_filhos
      from public.passaros where pai_id = new.id and deleted_at is null;
    v_papel := 'pai';
  elsif old.sexo = 'femea' and new.sexo <> 'femea' then
    select count(*) into v_filhos
      from public.passaros where mae_id = new.id and deleted_at is null;
    v_papel := 'mãe';
  else
    v_filhos := 0;
  end if;

  if v_filhos > 0 then
    raise exception 'Esta ave é % de % ave(s) no plantel. Corrija a filiação delas antes de mudar o sexo.',
      v_papel, v_filhos;
  end if;

  -- Casal vigente: o par guarda macho_id e femea_id, e trocar o sexo por fora
  -- deixaria o casal com dois machos sem ninguém reclamar.
  select * into v_casal
    from public.casais
   where deleted_at is null
     and vigencia_fim is null
     and ((macho_id = new.id and new.sexo <> 'macho')
       or (femea_id = new.id and new.sexo <> 'femea'))
   limit 1;

  if found then
    raise exception 'Esta ave está no casal % como %. Encerre o casal antes de mudar o sexo.',
      lpad(v_casal.numero::text, 2, '0'),
      case when v_casal.macho_id = new.id then 'macho' else 'fêmea' end;
  end if;

  return new;
end;
$$;

comment on function public.tg_sexo_coerente is
  'Impede que a correção do sexo de uma ave deixe filhotes com progenitor do sexo errado ou um casal vigente com duas aves do mesmo sexo.';

create trigger passaros_sexo_coerente
  before update of sexo on public.passaros
  for each row execute function public.tg_sexo_coerente();
