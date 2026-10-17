-- =============================================================================
-- SisAves · 0030 · Emitir o CRO
--
-- A tabela, o snapshot e a porta pública de validação existem desde 0010 e
-- 0015. Faltava a emissão — e ela não é um `insert`, é três decisões:
--
--   · o SEQUENCIAL é por criatório e não pode ter buraco nem repetição, porque
--     é o número impresso no papel;
--   · o SNAPSHOT congela a genealogia do dia. A árvore muda quando o criador
--     corrige uma filiação, e um CRO emitido em 2026 precisa continuar provando
--     o que era verdade em 2026;
--   · o HASH torna a URL pública imprevisível. Sem ele bastaria incrementar o
--     sequencial para varrer os certificados de todos os criatórios.
-- =============================================================================

create or replace function public.emitir_certificado(p_passaro_id uuid)
returns uuid
language plpgsql
as $$
declare
  v_ave         public.passaros%rowtype;
  v_sequencial  bigint;
  v_certificado uuid;
begin
  select * into v_ave
    from public.passaros
   where id = p_passaro_id and deleted_at is null;

  if not found then
    raise exception 'Ave não encontrada ou fora do seu criatório.';
  end if;

  -- O CRO prova a identidade oficial da ave. Sem anilha não há o que provar, e
  -- o documento sairia com o campo mais procurado em branco.
  if v_ave.anilha_numero is null then
    raise exception 'Esta ave não tem anilha. O certificado afirma a anilha oficial — sem ela não há o que certificar.';
  end if;

  /*
   * Sequencial por criatório, calculado sob trava.
   *
   * `lock table` seria exagero; travar a linha do criatório basta e é o que
   * impede dois CRO com o mesmo número quando duas abas emitem ao mesmo tempo.
   * O índice único (criatorio_id, sequencial) é a garantia final.
   */
  perform 1 from public.criatorios where id = v_ave.criatorio_id for update;

  select coalesce(max(sequencial), 0) + 1 into v_sequencial
    from public.certificados
   where criatorio_id = v_ave.criatorio_id;

  insert into public.certificados
    (criatorio_id, passaro_id, sequencial, emitido_por, snapshot)
  values (
    v_ave.criatorio_id,
    p_passaro_id,
    v_sequencial,
    auth.uid(),
    public.montar_snapshot_certificado(p_passaro_id)
  )
  returning id into v_certificado;

  return v_certificado;
end;
$$;

comment on function public.emitir_certificado is
  'Emite um CRO: numera por criatório sob trava, congela o snapshot da genealogia do dia e devolve o id. Recusa ave sem anilha — o documento afirma a anilha oficial.';

grant execute on function public.emitir_certificado(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- revogar_certificado
-- -----------------------------------------------------------------------------
-- O CRO não se apaga. Ele foi impresso, entregue, talvez fotografado — some do
-- banco e o QR passa a dizer "não encontrado", que é ambíguo. Revogado, a
-- página pública diz exatamente o que aconteceu, com data e motivo.
create or replace function public.revogar_certificado(
  p_certificado_id uuid,
  p_motivo text default null
)
returns boolean
language plpgsql
as $$
declare
  v_certificado public.certificados%rowtype;
begin
  select * into v_certificado
    from public.certificados
   where id = p_certificado_id
   for update;

  if not found then
    raise exception 'Certificado não encontrado ou fora do seu criatório.';
  end if;

  if v_certificado.revogado_em is not null then
    return false;  -- Já revogado: silêncio, não erro.
  end if;

  update public.certificados
     set revogado_em = now(),
         revogado_motivo = nullif(trim(p_motivo), '')
   where id = p_certificado_id;

  return true;
end;
$$;

comment on function public.revogar_certificado is
  'Marca o CRO como revogado, com data e motivo. Nunca apaga: a página pública precisa poder dizer que o documento existiu e não vale mais.';

grant execute on function public.revogar_certificado(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- A validação pública passa a contar o motivo
-- -----------------------------------------------------------------------------
-- `validar_certificado` devolvia `revogado_em` sem o motivo. Quem escaneia um
-- QR revogado merece saber por quê — "ave vendida e recertificada" e "emitido
-- por engano" são coisas diferentes para quem está com a ave na mão.
create or replace function public.validar_certificado(
  p_hash text,
  p_sequencial bigint
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'autentico', c.revogado_em is null,
    'revogado_em', c.revogado_em,
    'revogado_motivo', c.revogado_motivo,
    'numero', c.sequencial,
    'emitido_em', c.emitido_em,
    'consultado_em', now(),
    'dados', c.snapshot
  )
  from public.certificados c
  where c.hash = p_hash and c.sequencial = p_sequencial;
$$;

revoke all on function public.validar_certificado(text, bigint) from public;
grant execute on function public.validar_certificado(text, bigint) to anon, authenticated;

comment on function public.validar_certificado is
  'Única porta pública para o CRO. Retorna apenas o snapshot — nenhum contato do criador, nenhum id interno.';
