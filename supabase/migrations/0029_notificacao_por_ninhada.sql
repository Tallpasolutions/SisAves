-- =============================================================================
-- SisAves · 0029 · Um aviso por ninhada, não por ovo
--
-- `vw_tarefas_hoje` devolve uma linha por OVO, e 0028 gerava uma notificação
-- para cada uma. Uma ninhada com dois filhotes na janela produzia dois avisos
-- idênticos — mesma frase, mesmo casal, mesma ninhada. Quem lê não distingue
-- um do outro e não sabe se são dois filhotes ou um aviso repetido.
--
-- A unidade do aviso é a ninhada, e a quantidade entra na frase: é como a tela
-- "Hoje" já fala ("3 filhotes para anilhar").
-- =============================================================================

create or replace function public.gerar_notificacoes()
returns integer
language plpgsql
as $$
declare
  v_usuario uuid := auth.uid();
  v_grupo   record;
  v_criados integer := 0;
  v_titulo  text;
  v_corpo   text;
  v_ref     uuid;
begin
  if v_usuario is null then
    return 0;
  end if;

  for v_grupo in
    select
      t.criatorio_id,
      t.ninhada_id,
      t.casal_id,
      t.situacao,
      min(t.casal_numero)                as casal_numero,
      min(t.ninhada_numero)              as ninhada_numero,
      min(t.especie_nome)                as especie_nome,
      count(*)                           as quantos,
      min(t.postura_id::text)::uuid      as uma_postura,
      bool_or(t.anilhamento_vencido)     as vencido,
      min(t.limite_anilhamento)          as limite
    from public.vw_tarefas_hoje t
    where t.situacao in ('anilhar', 'verificar', 'separar')
    group by t.criatorio_id, t.ninhada_id, t.casal_id, t.situacao
  loop
    -- Contagem antes do substantivo, como manda a cópia do produto.
    v_titulo := case v_grupo.situacao
      when 'anilhar' then
        v_grupo.quantos || case when v_grupo.quantos = 1
                                then ' filhote para anilhar'
                                else ' filhotes para anilhar' end
      when 'verificar' then
        v_grupo.quantos || case when v_grupo.quantos = 1
                                then ' ovo para ovoscopia'
                                else ' ovos para ovoscopia' end
      when 'separar' then
        v_grupo.quantos || case when v_grupo.quantos = 1
                                then ' filhote para separar'
                                else ' filhotes para separar' end
    end;

    v_corpo := concat_ws(' · ',
      'Casal ' || lpad(v_grupo.casal_numero::text, 2, '0'),
      case when v_grupo.ninhada_numero is not null
           then 'Ninhada ' || lpad(v_grupo.ninhada_numero::text, 2, '0') end,
      v_grupo.especie_nome,
      case when v_grupo.situacao = 'anilhar' and v_grupo.vencido
             then 'janela encerrada'
           when v_grupo.situacao = 'anilhar' and v_grupo.limite is not null
             then 'até ' || to_char(v_grupo.limite, 'DD/MM') end
    );

    -- A ninhada é a referência. Postura antiga sem ninhada cai no id dela
    -- própria, para o índice único continuar valendo.
    v_ref := coalesce(v_grupo.ninhada_id, v_grupo.uma_postura);

    insert into public.notificacoes
      (criatorio_id, usuario_id, tipo, titulo, corpo, link, referencia_id, referencia_dia)
    values (
      v_grupo.criatorio_id,
      v_usuario,
      v_grupo.situacao,
      v_titulo,
      v_corpo,
      case when v_grupo.ninhada_id is null then '/ovos'
           when v_grupo.situacao = 'anilhar'
             then '/ovos/' || v_grupo.ninhada_id || '/anilhar'
           else '/ovos/' || v_grupo.ninhada_id end,
      v_ref,
      public.hoje()
    )
    on conflict do nothing;

    if found then
      v_criados := v_criados + 1;
    end if;
  end loop;

  return v_criados;
end;
$$;

comment on function public.gerar_notificacoes is
  'Materializa os avisos do dia, UM por ninhada e situação, com a contagem na frase. Idempotente por (usuário, tipo, ninhada, dia).';

-- Os avisos por ovo que 0028 gerou viram ruído na lista. Apagados: eles se
-- refazem agrupados na próxima abertura.
delete from public.notificacoes
 where referencia_dia is not null
   and tipo in ('anilhar', 'verificar', 'separar');
