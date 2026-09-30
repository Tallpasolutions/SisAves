begin;

-- Usuário e criatório de teste. Tudo desfeito no rollback ao final.
insert into auth.users (id, email, aud, role)
values ('11111111-1111-1111-1111-111111111111', 'teste@sisaves.local', 'authenticated', 'authenticated');

insert into public.criatorios (id, owner_id, nome, slug)
values ('22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111', 'Criatório de teste', 'teste');

-- Atalho para criar ave: nome, sexo, pai, mãe.
create or replace function pg_temp.ave(n text, s sexo_ave, pai uuid, mae uuid)
returns uuid language plpgsql as $$
declare v uuid := gen_random_uuid();
begin
  insert into public.passaros (id, criatorio_id, nome, sexo, pai_id, mae_id)
  values (v, '22222222-2222-2222-2222-222222222222', n, s, pai, mae);
  return v;
end $$;

do $$
declare
  -- Fundadores, sem parentesco entre si
  p uuid; m1 uuid; m2 uuid; m uuid; x1 uuid; x2 uuid;
  gp uuid; gm uuid;
  -- Meios-irmãos (mesmo pai, mães diferentes)
  mi_a uuid; mi_b uuid;
  -- Irmãos completos
  ic_a uuid; ic_b uuid;
  -- Primos-primeiros
  c1 uuid; c2 uuid; pc_a uuid; pc_b uuid;
  -- Sem parentesco
  sp_a uuid; sp_b uuid;
begin
  p  := pg_temp.ave('Pai comum',   'macho', null, null);
  m1 := pg_temp.ave('Mãe 1',       'femea', null, null);
  m2 := pg_temp.ave('Mãe 2',       'femea', null, null);
  m  := pg_temp.ave('Mãe única',   'femea', null, null);

  -- meios-irmãos: mesmo pai, mães distintas  -> esperado 12,50%
  mi_a := pg_temp.ave('MI macho', 'macho', p, m1);
  mi_b := pg_temp.ave('MI fêmea', 'femea', p, m2);

  -- irmãos completos: mesmo pai E mesma mãe   -> esperado 25,00%
  ic_a := pg_temp.ave('IC macho', 'macho', p, m);
  ic_b := pg_temp.ave('IC fêmea', 'femea', p, m);

  -- primos-primeiros                          -> esperado 6,25%
  gp := pg_temp.ave('Avô',  'macho', null, null);
  gm := pg_temp.ave('Avó',  'femea', null, null);
  c1 := pg_temp.ave('Tio',  'macho', gp, gm);
  c2 := pg_temp.ave('Tia',  'femea', gp, gm);
  x1 := pg_temp.ave('Sem parentesco 1', 'femea', null, null);
  x2 := pg_temp.ave('Sem parentesco 2', 'macho', null, null);
  pc_a := pg_temp.ave('PC macho', 'macho', c1, x1);
  pc_b := pg_temp.ave('PC fêmea', 'femea', x2, c2);

  -- sem parentesco                            -> esperado 0,00%
  sp_a := pg_temp.ave('SP macho', 'macho', null, null);
  sp_b := pg_temp.ave('SP fêmea', 'femea', null, null);

  create temp table resultado (caso text, esperado numeric, obtido numeric, faixa text);
  insert into resultado values
    ('meios-irmãos',      12.50, public.coeficiente_endogamia(mi_a, mi_b), public.faixa_endogamia(public.coeficiente_endogamia(mi_a, mi_b))),
    ('irmãos completos',  25.00, public.coeficiente_endogamia(ic_a, ic_b), public.faixa_endogamia(public.coeficiente_endogamia(ic_a, ic_b))),
    ('primos-primeiros',   6.25, public.coeficiente_endogamia(pc_a, pc_b), public.faixa_endogamia(public.coeficiente_endogamia(pc_a, pc_b))),
    ('pai × filha',       25.00, public.coeficiente_endogamia(p, mi_b),    public.faixa_endogamia(public.coeficiente_endogamia(p, mi_b))),
    ('sem parentesco',     0.00, public.coeficiente_endogamia(sp_a, sp_b), public.faixa_endogamia(public.coeficiente_endogamia(sp_a, sp_b)));
end $$;

select caso, esperado, obtido, faixa,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from resultado;

rollback;
