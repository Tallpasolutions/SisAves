begin;

-- Um criatório com um casal vigente e dois filhotes com filiação registrada.
insert into auth.users (id, email, aud, role) values
  ('ed17ed17-0000-0000-0000-000000000001', 'editar-elza@teste.invalid', 'authenticated', 'authenticated');

insert into public.criatorios (id, owner_id, nome, slug) values
  ('ed17ed17-1111-1111-1111-111111111111','ed17ed17-0000-0000-0000-000000000001','Criatório Elza','elza-editar');

insert into public.especies (id, criatorio_id, nome, dias_choco, dias_anilha, dias_separa, dias_ovoscopia, janela_anilha_dias)
values ('ed17ed17-eeee-eeee-eeee-eeeeeeeeeeee','ed17ed17-1111-1111-1111-111111111111','Diamante de Gould',
        16::smallint, 4::smallint, 42::smallint, 7::smallint, 2::smallint);

insert into public.passaros (id, criatorio_id, nome, sexo, especie_id, dt_nascimento) values
  ('ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa1','ed17ed17-1111-1111-1111-111111111111','Pai do plantel','macho','ed17ed17-eeee-eeee-eeee-eeeeeeeeeeee', public.hoje() - 800),
  ('ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa2','ed17ed17-1111-1111-1111-111111111111','Mãe do plantel','femea','ed17ed17-eeee-eeee-eeee-eeeeeeeeeeee', public.hoje() - 800),
  ('ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa3','ed17ed17-1111-1111-1111-111111111111','Macho solto','macho','ed17ed17-eeee-eeee-eeee-eeeeeeeeeeee', public.hoje() - 700);

-- Dois filhotes do par, para o pai ter filiação registrada.
insert into public.passaros (id, criatorio_id, nome, sexo, especie_id, dt_nascimento, pai_id, mae_id) values
  ('ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaf1','ed17ed17-1111-1111-1111-111111111111','Filho 1','indefinido','ed17ed17-eeee-eeee-eeee-eeeeeeeeeeee', public.hoje() - 100,
   'ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa1','ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
  ('ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaf2','ed17ed17-1111-1111-1111-111111111111','Filho 2','indefinido','ed17ed17-eeee-eeee-eeee-eeeeeeeeeeee', public.hoje() - 100,
   'ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa1','ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa2');

insert into public.casais (id, criatorio_id, numero, macho_id, femea_id, vigencia_inicio)
values ('ed17ed17-cccc-cccc-cccc-cccccccccc01','ed17ed17-1111-1111-1111-111111111111',1,
        'ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa1','ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa2', public.hoje() - 200);

create temp table veredito (cenario text, esperado text, obtido text);

-- ---- Trocar o sexo de quem é pai deixaria filhotes com "pai" fêmea ---------
-- `tg_valida_genealogia` valida o FILHO ao gravar o filho; ninguém validava o
-- progenitor quando é ELE que muda.
do $$
begin
  update public.passaros set sexo = 'femea'
   where id = 'ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa1';
  insert into veredito values ('trocar sexo de ave que é pai é barrado', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('trocar sexo de ave que é pai é barrado', 'barrado', 'barrado');
end $$;

insert into veredito values
  ('o pai continua macho', 'macho',
   (select sexo::text from public.passaros where id = 'ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa1'));

-- 'indefinido' também quebra a filiação: o filho ficaria com um pai sem sexo.
do $$
begin
  update public.passaros set sexo = 'indefinido'
   where id = 'ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa2';
  insert into veredito values ('voltar mãe para indefinido é barrado', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('voltar mãe para indefinido é barrado', 'barrado', 'barrado');
end $$;

-- ---- Trocar o sexo de quem está em casal vigente ----------------------------
-- O macho solto não tem filhote; o que o impede é o casal.
insert into public.casais (id, criatorio_id, numero, macho_id, femea_id, vigencia_inicio)
values ('ed17ed17-cccc-cccc-cccc-cccccccccc02','ed17ed17-1111-1111-1111-111111111111',2,
        'ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa3', null, public.hoje() - 150);

do $$
begin
  update public.passaros set sexo = 'femea'
   where id = 'ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa3';
  insert into veredito values ('trocar sexo de ave em casal vigente é barrado', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('trocar sexo de ave em casal vigente é barrado', 'barrado', 'barrado');
end $$;

-- Encerrado o casal, a correção passa: a guarda protege o vínculo vivo, não
-- congela o dado para sempre.
update public.casais set vigencia_fim = public.hoje()
 where id = 'ed17ed17-cccc-cccc-cccc-cccccccccc02';

update public.passaros set sexo = 'femea'
 where id = 'ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa3';

insert into veredito values
  ('com o casal encerrado, a correção passa', 'femea',
   (select sexo::text from public.passaros where id = 'ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa3'));

-- ---- Filhote sem filiação pode ser sexado normalmente ----------------------
-- É o caso mais comum: o filhote nasce 'indefinido' e ganha sexo meses depois.
update public.passaros set sexo = 'macho'
 where id = 'ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaf1';

insert into veredito values
  ('sexar filhote sem filhos continua livre', 'macho',
   (select sexo::text from public.passaros where id = 'ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaf1'));

-- ---- Editar o que não é sexo não dispara a guarda --------------------------
update public.passaros set nome = 'Nome corrigido', observacoes = 'conferido'
 where id = 'ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa1';

insert into veredito values
  ('corrigir nome do pai é livre', 'Nome corrigido',
   (select nome from public.passaros where id = 'ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa1'));

-- ---- As guardas antigas continuam valendo na edição ------------------------
-- Ciclo na genealogia: o pai não pode virar filho do próprio filho.
do $$
begin
  update public.passaros set pai_id = 'ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaf1'
   where id = 'ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa1';
  insert into veredito values ('ciclo na genealogia é barrado ao editar', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('ciclo na genealogia é barrado ao editar', 'barrado', 'barrado');
end $$;

-- Anilha repetida: o erro mais caro do domínio, agora alcançável pela edição.
update public.passaros
   set anilha_sigla = 'COF', anilha_criador = '7777', anilha_ano = 2026, anilha_numero = 901
 where id = 'ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa1';

do $$
begin
  update public.passaros
     set anilha_sigla = 'COF', anilha_criador = '7777', anilha_ano = 2026, anilha_numero = 901
   where id = 'ed17ed17-aaaa-aaaa-aaaa-aaaaaaaaaaa2';
  insert into veredito values ('anilha repetida é barrada ao editar', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('anilha repetida é barrada ao editar', 'barrado', 'barrado');
end $$;

select cenario, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from veredito;

rollback;
