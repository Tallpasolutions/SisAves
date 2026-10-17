-- =============================================================================
-- SisAves · 0033 · A saúde na tela
--
-- As tabelas existem desde a 0007 e nunca tiveram interface: `sintomas`,
-- `doencas`, `medicamentos` e `tratamentos` estavam vazias e sem porta.
--
-- Três coisas faltavam para a tela existir:
--   1. a CARÊNCIA, que é o que um registro sanitário serve para dizer e que
--      ninguém calcula de cabeça;
--   2. uma forma de gravar os vínculos N:N inteiros de uma vez;
--   3. um vocabulário inicial — a tela de tratamento com três listas vazias
--      obrigaria o criador a cadastrar tudo antes de registrar a primeira
--      aplicação.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- vw_tratamentos
-- -----------------------------------------------------------------------------
-- O tratamento é a única entidade da saúde cujo estado é DERIVADO, como a
-- situação da postura: "em curso" é não ter fim ou ter fim no futuro, e a
-- carência é a data do fim mais os dias do medicamento.
--
-- `carencia_ate` só existe quando o tratamento JÁ TERMINOU. A carência conta
-- do fim da aplicação, e enquanto ela não acabou a data seria um alvo móvel —
-- "libera amanhã" todo dia, que é pior do que não dizer nada. No tratamento em
-- curso a tela mostra os dias do medicamento e diz a partir de quando eles
-- contam.
create view public.vw_tratamentos as
  select
    t.id,
    t.criatorio_id,
    t.passaro_id,
    t.casal_id,
    t.medicamento_id,
    t.doenca_id,
    t.inicio,
    t.fim,
    t.dosagem,
    t.observacoes,
    t.created_at,
    m.nome            as medicamento_nome,
    m.principio_ativo as medicamento_principio,
    m.carencia_dias,
    d.nome            as doenca_nome,
    p.nome            as passaro_nome,
    p.anilha_sigla,
    p.anilha_criador,
    p.anilha_ano,
    p.anilha_numero,
    c.numero          as casal_numero,
    (t.fim is null or t.fim >= public.hoje())                        as em_curso,
    case when t.fim is not null and coalesce(m.carencia_dias, 0) > 0
         then t.fim + m.carencia_dias end                            as carencia_ate,
    case when t.fim is not null and coalesce(m.carencia_dias, 0) > 0
         then t.fim + m.carencia_dias >= public.hoje()
         else false end                                              as carencia_ativa
  from public.tratamentos t
  left join public.medicamentos m on m.id = t.medicamento_id
  left join public.doencas      d on d.id = t.doenca_id
  left join public.passaros     p on p.id = t.passaro_id
  left join public.casais       c on c.id = t.casal_id
  where t.deleted_at is null;

alter view public.vw_tratamentos set (security_invoker = on);

comment on view public.vw_tratamentos is
  'Tratamentos com o estado derivado: em curso e carência. `carencia_ate` só existe depois do fim — a carência conta do fim da aplicação, e antes disso a data seria um alvo móvel.';

grant select on public.vw_tratamentos to authenticated;

-- -----------------------------------------------------------------------------
-- Os vínculos N:N, gravados inteiros
-- -----------------------------------------------------------------------------
-- A tela escolhe um CONJUNTO ("esta doença tem estes quatro sintomas"), não
-- vínculos avulsos. Soltas na aplicação seriam um delete e um insert sem
-- transação: a falha no meio deixaria a doença sem sintoma nenhum.
--
-- Gravar o conjunto inteiro também é o que torna a escrita idempotente, e é
-- por isso que ela pode entrar na fila offline sem chave própria: aplicar duas
-- vezes o mesmo conjunto dá o mesmo resultado.
--
-- `security invoker`: a RLS continua sendo a fronteira. Vínculo em doença do
-- catálogo compartilhado (criatorio_id nulo) é recusado pela política
-- `via_doenca` — o catálogo é de todos, e os sintomas que ESTE criador
-- observou pertencem a uma doença dele.
create or replace function public.definir_sintomas_da_doenca(
  p_doenca   uuid,
  p_sintomas uuid[]
)
returns integer
language plpgsql
security invoker
as $$
declare
  v_total integer;
begin
  delete from public.doenca_sintomas
   where doenca_id = p_doenca
     and sintoma_id <> all (coalesce(p_sintomas, '{}'::uuid[]));

  insert into public.doenca_sintomas (doenca_id, sintoma_id)
  select p_doenca, s
    from unnest(coalesce(p_sintomas, '{}'::uuid[])) as s
  on conflict do nothing;

  select count(*) into v_total
    from public.doenca_sintomas where doenca_id = p_doenca;

  return v_total;
end;
$$;

comment on function public.definir_sintomas_da_doenca is
  'Grava o conjunto inteiro de sintomas de uma doença. Idempotente: aplicar duas vezes o mesmo conjunto dá o mesmo resultado.';

create or replace function public.definir_doencas_do_medicamento(
  p_medicamento uuid,
  p_doencas     uuid[]
)
returns integer
language plpgsql
security invoker
as $$
declare
  v_total integer;
begin
  delete from public.medicamento_doencas
   where medicamento_id = p_medicamento
     and doenca_id <> all (coalesce(p_doencas, '{}'::uuid[]));

  insert into public.medicamento_doencas (medicamento_id, doenca_id)
  select p_medicamento, d
    from unnest(coalesce(p_doencas, '{}'::uuid[])) as d
  on conflict do nothing;

  select count(*) into v_total
    from public.medicamento_doencas where medicamento_id = p_medicamento;

  return v_total;
end;
$$;

comment on function public.definir_doencas_do_medicamento is
  'Grava o conjunto inteiro de doenças que um medicamento trata. Idempotente, como a gêmea dos sintomas.';

grant execute on function public.definir_sintomas_da_doenca(uuid, uuid[])    to authenticated;
grant execute on function public.definir_doencas_do_medicamento(uuid, uuid[]) to authenticated;

-- -----------------------------------------------------------------------------
-- Vocabulário inicial — compartilhado, como os clubes e as espécies
-- -----------------------------------------------------------------------------
-- `criatorio_id` nulo é catálogo de todos (mesma convenção de `mutacoes` e
-- `financeiro_categorias`). São NOMES, e só: nenhuma descrição clínica, nenhum
-- protocolo, nenhuma dose. O que o criatório observou e o que o veterinário
-- prescreveu são registros DELE, e entram nas linhas com dono.
--
-- **Nenhum medicamento vem semeado, e é de propósito.** Nome comercial, dose e
-- carência saem da bula e da prescrição, variam por marca e por país, e uma
-- lista pronta aqui seria lida como recomendação. O catálogo de medicamentos
-- nasce vazio e é o criador quem o escreve, com o que está na prateleira dele.
insert into public.sintomas (criatorio_id, nome) values
  (null, 'Penas eriçadas'),
  (null, 'Apatia'),
  (null, 'Falta de apetite'),
  (null, 'Perda de peso'),
  (null, 'Diarreia'),
  (null, 'Fezes com sangue'),
  (null, 'Secreção nasal'),
  (null, 'Espirro'),
  (null, 'Respiração ofegante'),
  (null, 'Chiado ao respirar'),
  (null, 'Olhos inchados ou fechados'),
  (null, 'Queda de penas'),
  (null, 'Crostas nas patas ou no bico'),
  (null, 'Regurgitação'),
  (null, 'Sede excessiva'),
  (null, 'Dificuldade de voar')
on conflict do nothing;

insert into public.doencas (criatorio_id, nome) values
  (null, 'Candidíase'),
  (null, 'Coccidiose'),
  (null, 'Salmonelose'),
  (null, 'Colibacilose'),
  (null, 'Verminose'),
  (null, 'Giardíase'),
  (null, 'Tricomoníase'),
  (null, 'Aspergilose'),
  (null, 'Micoplasmose'),
  (null, 'Ácaro da traqueia'),
  (null, 'Ácaro das penas'),
  (null, 'Sarna (cnemidocoptes)'),
  (null, 'Bouba aviária'),
  (null, 'Megabacteriose'),
  (null, 'Carência nutricional'),
  (null, 'Intoxicação alimentar')
on conflict do nothing;
