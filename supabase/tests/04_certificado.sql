begin;

insert into auth.users (id, email, aud, role)
values ('cccccccc-0000-0000-0000-000000000003', 'carla@sisaves.local', 'authenticated', 'authenticated');

insert into public.clubes (id, sigla, nome) values
  ('dddddddd-0000-0000-0000-000000000004', 'TESTE-SOV', 'Clube de teste');

-- O criatório tem contato: é justamente o que NÃO pode sair na página pública.
insert into public.criatorios (id, owner_id, nome, slug, clube_id, nro_criador,
                               registro_ibama, cidade, uf, whatsapp, instagram)
values ('cccccccc-1111-1111-1111-111111111111','cccccccc-0000-0000-0000-000000000003',
        'Criatório Carla','carla','dddddddd-0000-0000-0000-000000000004','1234',
        'IBAMA-99887','Maricá','RJ','21999998888','@criatoriocarla');

create or replace function pg_temp.ave(n text, s sexo_ave, pai uuid, mae uuid, ano integer, nro integer)
returns uuid language plpgsql as $$
declare v uuid := gen_random_uuid();
begin
  insert into public.passaros (id, criatorio_id, nome, sexo, pai_id, mae_id,
                               anilha_sigla, anilha_criador, anilha_ano, anilha_numero)
  values (v,'cccccccc-1111-1111-1111-111111111111', n, s, pai, mae,
          'TESTE-SOV','1234', ano::smallint, nro);
  return v;
end $$;

create temp table res (verificacao text, esperado text, obtido text);
grant all on res to anon, authenticated;

do $$
declare avo uuid; avoa uuid; avoa2 uuid; pai uuid; mae uuid; filhote uuid; cert uuid;
begin
  -- Pai e mãe são meios-irmãos (mesmo avô), então o filhote tem 12,50%.
  avo   := pg_temp.ave('Avô',     'macho', null, null, 2023, 1);
  avoa  := pg_temp.ave('Avó 1',   'femea', null, null, 2023, 2);
  avoa2 := pg_temp.ave('Avó 2',   'femea', null, null, 2023, 3);
  pai   := pg_temp.ave('Tibiriçá','macho', avo, avoa,  2024, 10);
  mae   := pg_temp.ave('Jandaia', 'femea', avo, avoa2, 2024, 11);
  filhote := pg_temp.ave('Curió Sabiá','macho', pai, mae, 2026, 87);

  insert into public.certificados (criatorio_id, passaro_id, snapshot)
  values ('cccccccc-1111-1111-1111-111111111111', filhote,
          public.montar_snapshot_certificado(filhote))
  returning id into cert;

  -- Depois de emitido, o criador renomeia a ave e corrige a filiação.
  -- O certificado já impresso não pode mudar por causa disso.
  update public.passaros set nome = 'NOME TROCADO DEPOIS' where id = filhote;
  update public.passaros set mae_id = avoa2 where id = filhote;

  insert into res
  select 'certificado autêntico', 'true',
         (public.validar_certificado(c.hash, c.sequencial) ->> 'autentico')
    from public.certificados c where c.id = cert;

  insert into res
  select 'snapshot congelou o nome', 'Curió Sabiá',
         (public.validar_certificado(c.hash, c.sequencial) #>> '{dados,ave,nome}')
    from public.certificados c where c.id = cert;

  insert into res
  select 'endogamia congelada (meios-irmãos)', '12.50',
         (public.validar_certificado(c.hash, c.sequencial) #>> '{dados,endogamia_pct}')
    from public.certificados c where c.id = cert;

  insert into res
  select 'ancestrais na genealogia', '6',
         jsonb_array_length(public.validar_certificado(c.hash, c.sequencial) #> '{dados,genealogia}')::text
    from public.certificados c where c.id = cert;

  insert into res
  select 'whatsapp do criador vazou?', 'nao',
         case when public.validar_certificado(c.hash, c.sequencial)::text like '%21999998888%'
              then 'SIM - VAZOU' else 'nao' end
    from public.certificados c where c.id = cert;

  insert into res
  select 'instagram do criador vazou?', 'nao',
         case when public.validar_certificado(c.hash, c.sequencial)::text like '%criatoriocarla%'
              then 'SIM - VAZOU' else 'nao' end
    from public.certificados c where c.id = cert;

  insert into res
  select 'hash imprevisível (>= 18 hex)', 'true',
         (length(c.hash) >= 18)::text from public.certificados c where c.id = cert;

  insert into res
  select 'sequencial começa em 1', '1', c.sequencial::text
    from public.certificados c where c.id = cert;
end $$;

-- Anônimo consegue ler a tabela direto?
set local role anon;
set local request.jwt.claims = '';
insert into res
select 'anônimo lê a tabela certificados (deve ser 0)', '0',
       (select count(*) from public.certificados)::text;
reset role;

select verificacao, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from res;

rollback;
