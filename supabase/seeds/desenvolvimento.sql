-- =============================================================================
-- Semente de desenvolvimento — plantel de exemplo no criatório de teste.
--
-- As datas são relativas a current_date, calculadas a partir dos prazos da
-- própria espécie, para que SEMPRE exista pelo menos uma ninhada em cada
-- estado do ciclo. Sem isso não dá para verificar a tela "Hoje".
--
--   node scripts/sql.mjs -f supabase/seeds/desenvolvimento.sql
--
-- Idempotente: apaga o que semeou antes (pelas observações marcadas) e recria.
-- =============================================================================

do $$
declare
  v_criatorio uuid;
  v_curio uuid; v_sabia uuid;
  -- prazos do curió
  p_choco int; p_ovo int; p_anilha int; p_janela int; p_separa int;
  -- aves
  m1 uuid; f1 uuid; m2 uuid; f2 uuid; m3 uuid; f3 uuid;
  avo uuid; avoa uuid;
  c1 uuid; c2 uuid; c3 uuid;
  n uuid;
begin
  select c.id into v_criatorio
    from public.criatorios c
    join auth.users u on u.id = c.owner_id
   where u.email = 'teste@sisaves.local'
   limit 1;

  if v_criatorio is null then
    raise exception 'Criatório de teste não encontrado. Rode: node scripts/usuario-teste.mjs criar, e faça o onboarding.';
  end if;

  -- Limpa a semente anterior (em ordem de dependência).
  delete from public.posturas where criatorio_id = v_criatorio;
  delete from public.ninhadas where criatorio_id = v_criatorio;
  delete from public.casais   where criatorio_id = v_criatorio;
  delete from public.passaros where criatorio_id = v_criatorio;

  select id into v_curio from public.especies
   where criatorio_id = v_criatorio and nome = 'Curió' limit 1;
  select id into v_sabia from public.especies
   where criatorio_id = v_criatorio and nome = 'Sabiá-laranjeira' limit 1;

  if v_curio is null then
    raise exception 'Espécie Curió não adotada neste criatório.';
  end if;

  select dias_choco, dias_ovoscopia, dias_anilha, janela_anilha_dias, dias_separa
    into p_choco, p_ovo, p_anilha, p_janela, p_separa
    from public.especies where id = v_curio;

  -- ---- Aves -----------------------------------------------------------------
  -- Avós, para o casal 03 sair com endogamia de meios-irmãos.
  insert into public.passaros (criatorio_id, nome, sexo, especie_id, dt_nascimento,
                               anilha_sigla, anilha_criador, anilha_ano, anilha_numero)
  values (v_criatorio, 'Jacundá', 'macho', v_curio, current_date - 1100, 'COF','1234', 2023, 1)
  returning id into avo;

  insert into public.passaros (criatorio_id, nome, sexo, especie_id, dt_nascimento,
                               anilha_sigla, anilha_criador, anilha_ano, anilha_numero)
  values (v_criatorio, 'Guaraci', 'femea', v_curio, current_date - 1090, 'COF','1234', 2023, 2)
  returning id into avoa;

  insert into public.passaros (criatorio_id, nome, sexo, especie_id, dt_nascimento, pai_id, mae_id,
                               anilha_sigla, anilha_criador, anilha_ano, anilha_numero)
  values (v_criatorio, 'Tibiriçá', 'macho', v_curio, current_date - 700, avo, avoa, 'COF','1234', 2024, 10)
  returning id into m1;

  insert into public.passaros (criatorio_id, nome, sexo, especie_id, dt_nascimento, pai_id,
                               anilha_sigla, anilha_criador, anilha_ano, anilha_numero)
  values (v_criatorio, 'Jandaia', 'femea', v_curio, current_date - 690, avo, 'COF','1234', 2024, 11)
  returning id into f1;

  insert into public.passaros (criatorio_id, nome, sexo, especie_id, dt_nascimento,
                               anilha_sigla, anilha_criador, anilha_ano, anilha_numero)
  values (v_criatorio, 'Aratu', 'macho', v_curio, current_date - 640, 'COF','1234', 2024, 12)
  returning id into m2;

  insert into public.passaros (criatorio_id, nome, sexo, especie_id, dt_nascimento,
                               anilha_sigla, anilha_criador, anilha_ano, anilha_numero)
  values (v_criatorio, 'Iracema', 'femea', v_curio, current_date - 620, 'COF','1234', 2024, 13)
  returning id into f2;

  insert into public.passaros (criatorio_id, nome, sexo, especie_id, dt_nascimento,
                               anilha_sigla, anilha_criador, anilha_ano, anilha_numero)
  values (v_criatorio, 'Peitica', 'macho', coalesce(v_sabia, v_curio), current_date - 500, 'COF','1234', 2025, 20)
  returning id into m3;

  insert into public.passaros (criatorio_id, nome, sexo, especie_id, dt_nascimento,
                               anilha_sigla, anilha_criador, anilha_ano, anilha_numero)
  values (v_criatorio, 'Sabiá-do-Vale', 'femea', coalesce(v_sabia, v_curio), current_date - 480, 'COF','1234', 2025, 21)
  returning id into f3;

  -- Filhotes do ano, já anilhados
  insert into public.passaros (criatorio_id, nome, sexo, especie_id, dt_nascimento, pai_id, mae_id,
                               anilha_sigla, anilha_criador, anilha_ano, anilha_numero)
  values (v_criatorio, 'Curió Sabiá', 'indefinido', v_curio, current_date - 60, m1, f1, 'COF','1234', 2026, 87),
         (v_criatorio, 'Guairá',      'macho',      v_curio, current_date - 58, m1, f1, 'COF','1234', 2026, 88),
         (v_criatorio, 'Jurema',      'femea',      v_curio, current_date - 55, m2, f2, 'COF','1234', 2026, 89);

  -- ---- Casais ---------------------------------------------------------------
  -- Casal 03: Tibiriçá x Jandaia são meios-irmãos (mesmo pai) -> 12,50%.
  insert into public.casais (criatorio_id, numero, macho_id, femea_id, gaiola,
                             vigencia_inicio, endogamia_pct)
  values (v_criatorio, 3, m1, f1, 'A-07', current_date - 120,
          public.coeficiente_endogamia(m1, f1))
  returning id into c1;

  insert into public.casais (criatorio_id, numero, macho_id, femea_id, gaiola,
                             vigencia_inicio, endogamia_pct)
  values (v_criatorio, 7, m2, f2, 'A-12', current_date - 95,
          public.coeficiente_endogamia(m2, f2))
  returning id into c2;

  insert into public.casais (criatorio_id, numero, macho_id, femea_id, gaiola,
                             vigencia_inicio, endogamia_pct)
  values (v_criatorio, 12, m3, f3, 'B-02', current_date - 60,
          public.coeficiente_endogamia(m3, f3))
  returning id into c3;

  -- ---- Ninhadas e posturas, uma por estado do ciclo -------------------------

  -- ANILHAR (o estado crítico): eclodiu há dias_anilha dias, ainda sem anilha.
  insert into public.ninhadas (criatorio_id, casal_id, numero, iniciada_em)
  values (v_criatorio, c1, 5, current_date - p_choco - p_anilha) returning id into n;
  insert into public.posturas (criatorio_id, casal_id, ninhada_id, numero_ovo,
                               data_postura, ovoscopia_em, fertil, data_eclosao)
  values
    (v_criatorio, c1, n, 1, current_date - p_choco - p_anilha, current_date - p_choco - p_anilha + p_ovo, true, current_date - p_anilha),
    (v_criatorio, c1, n, 2, current_date - p_choco - p_anilha, current_date - p_choco - p_anilha + p_ovo, true, current_date - p_anilha),
    (v_criatorio, c1, n, 3, current_date - p_choco - p_anilha, current_date - p_choco - p_anilha + p_ovo, true, current_date - p_anilha);

  -- VERIFICAR: posto há dias_ovoscopia, ovoscopia ainda não feita.
  insert into public.ninhadas (criatorio_id, casal_id, numero, iniciada_em)
  values (v_criatorio, c2, 2, current_date - p_ovo) returning id into n;
  insert into public.posturas (criatorio_id, casal_id, ninhada_id, numero_ovo, data_postura)
  values
    (v_criatorio, c2, n, 1, current_date - p_ovo),
    (v_criatorio, c2, n, 2, current_date - p_ovo);

  -- NASCENDO: véspera da eclosão.
  insert into public.ninhadas (criatorio_id, casal_id, numero, iniciada_em)
  values (v_criatorio, c3, 1, current_date - p_choco + 1) returning id into n;
  insert into public.posturas (criatorio_id, casal_id, ninhada_id, numero_ovo,
                               data_postura, ovoscopia_em, fertil)
  values
    (v_criatorio, c3, n, 1, current_date - p_choco + 1, current_date - p_choco + 1 + p_ovo, true),
    (v_criatorio, c3, n, 2, current_date - p_choco + 1, current_date - p_choco + 1 + p_ovo, true),
    (v_criatorio, c3, n, 3, current_date - p_choco + 1, current_date - p_choco + 1 + p_ovo, true),
    (v_criatorio, c3, n, 4, current_date - p_choco + 1, current_date - p_choco + 1 + p_ovo, true);

  -- SEPARAR: anilhado e já na idade de desmame.
  insert into public.ninhadas (criatorio_id, casal_id, numero, iniciada_em)
  values (v_criatorio, c1, 4, current_date - p_choco - p_separa) returning id into n;
  insert into public.posturas (criatorio_id, casal_id, ninhada_id, numero_ovo,
                               data_postura, ovoscopia_em, fertil, data_eclosao, data_anilhamento)
  values (v_criatorio, c1, n, 1, current_date - p_choco - p_separa,
          current_date - p_choco - p_separa + p_ovo, true,
          current_date - p_separa, current_date - p_separa + p_anilha);

  -- CHOCANDO: posto anteontem, nada a fazer ainda.
  insert into public.ninhadas (criatorio_id, casal_id, numero, iniciada_em)
  values (v_criatorio, c2, 3, current_date - 2) returning id into n;
  insert into public.posturas (criatorio_id, casal_id, ninhada_id, numero_ovo, data_postura)
  values
    (v_criatorio, c2, n, 1, current_date - 2),
    (v_criatorio, c2, n, 2, current_date - 2),
    (v_criatorio, c2, n, 3, current_date - 2);

  -- PERDA: fato registrado, não tarefa.
  insert into public.ninhadas (criatorio_id, casal_id, numero, iniciada_em)
  values (v_criatorio, c3, 2, current_date - 20) returning id into n;
  insert into public.posturas (criatorio_id, casal_id, ninhada_id, numero_ovo,
                               data_postura, desfecho, desfecho_motivo)
  values
    (v_criatorio, c3, n, 1, current_date - 20, 'perdido', 'Ovo quebrado no ninho'),
    (v_criatorio, c3, n, 2, current_date - 20, 'infertil', 'Ovoscopia negativa');

  raise notice 'Semente aplicada no criatório %', v_criatorio;
end $$;

-- Confere que existe ninhada em cada estado.
select situacao, count(*) as ovos, count(distinct ninhada_id) as ninhadas
from public.vw_posturas
group by situacao
order by 1;
