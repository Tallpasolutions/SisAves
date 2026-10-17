-- =============================================================================
-- SisAves · 0028 · As notificações se geram sozinhas
--
-- `notificacoes` existe desde 0010 e nunca recebeu uma linha. O que havia era
-- a agenda derivada (`vw_tarefas_hoje`), que só existe enquanto o criador tem
-- o app aberto — e o prazo de anilhamento dura dois dias.
--
-- A notificação é DERIVADA da mesma agenda, mas gravada: é o que permite
-- marcar como lida e, depois, enviar por push. A chave de idempotência é
-- (usuário, tipo, postura, dia): abrir a tela cinco vezes no mesmo dia não
-- produz cinco avisos iguais.
-- =============================================================================

alter table public.notificacoes
  add column referencia_id uuid,
  add column referencia_dia date;

-- Um aviso por tarefa por dia e por pessoa.
create unique index notificacoes_unica_no_dia
  on public.notificacoes (usuario_id, tipo, referencia_id, referencia_dia)
  where referencia_id is not null;

comment on column public.notificacoes.referencia_id is
  'A postura que originou o aviso. Com referencia_dia, é a chave que impede o mesmo aviso de nascer duas vezes no mesmo dia.';

-- -----------------------------------------------------------------------------
-- gerar_notificacoes
-- -----------------------------------------------------------------------------
-- Roda quando o criador abre o app. Não é agendador: enquanto não houver cron,
-- é o próprio uso que materializa os avisos — e é por isso que o push ainda
-- não substitui abrir o aplicativo.
--
-- `security invoker`: a RLS continua sendo a fronteira, e a função só enxerga
-- as tarefas dos criatórios de quem a chamou.
create or replace function public.gerar_notificacoes()
returns integer
language plpgsql
as $$
declare
  v_usuario uuid := auth.uid();
  v_tarefa  record;
  v_criados integer := 0;
  v_titulo  text;
  v_corpo   text;
begin
  if v_usuario is null then
    return 0;
  end if;

  for v_tarefa in
    select t.*, count(*) over (
             partition by t.criatorio_id, t.ninhada_id, t.situacao
           ) as quantos
      from public.vw_tarefas_hoje t
     where t.situacao in ('anilhar', 'verificar', 'separar')
  loop
    -- A frase é montada aqui, e não na interface, porque o push sai do
    -- servidor e precisa do texto pronto.
    v_titulo := case v_tarefa.situacao
      when 'anilhar'   then 'Anilhar filhote'
      when 'verificar' then 'Fazer ovoscopia'
      when 'separar'   then 'Separar filhote'
    end;

    v_corpo := concat_ws(' · ',
      'Casal ' || lpad(v_tarefa.casal_numero::text, 2, '0'),
      case when v_tarefa.ninhada_numero is not null
           then 'Ninhada ' || lpad(v_tarefa.ninhada_numero::text, 2, '0') end,
      v_tarefa.especie_nome,
      case when v_tarefa.situacao = 'anilhar' and v_tarefa.anilhamento_vencido
           then 'janela encerrada'
           when v_tarefa.situacao = 'anilhar' and v_tarefa.limite_anilhamento is not null
           then 'até ' || to_char(v_tarefa.limite_anilhamento, 'DD/MM') end
    );

    insert into public.notificacoes
      (criatorio_id, usuario_id, tipo, titulo, corpo, link, referencia_id, referencia_dia)
    values (
      v_tarefa.criatorio_id,
      v_usuario,
      v_tarefa.situacao,
      v_titulo,
      v_corpo,
      case when v_tarefa.ninhada_id is null then '/ovos'
           when v_tarefa.situacao = 'anilhar'
             then '/ovos/' || v_tarefa.ninhada_id || '/anilhar'
           else '/ovos/' || v_tarefa.ninhada_id end,
      v_tarefa.postura_id,
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
  'Materializa os avisos do dia a partir da agenda derivada. Idempotente por (usuário, tipo, postura, dia): abrir a tela cinco vezes não cria cinco avisos.';

grant execute on function public.gerar_notificacoes() to authenticated;
