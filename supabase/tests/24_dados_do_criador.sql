begin;

-- O CPF no perfil serve a duas coisas, e a segunda é a que precisa de teste:
-- impedir que a mesma pessoa faça teste atrás de teste trocando de e-mail.
-- Sem a unicidade, cinco dias grátis viram infinitos dias grátis.

insert into auth.users (id, email, aud, role) values
  ('f0f0f0f0-0000-0000-0000-000000000001','primeira@teste.invalid','authenticated','authenticated'),
  ('f0f0f0f0-0000-0000-0000-000000000002','segunda@teste.invalid','authenticated','authenticated'),
  ('f0f0f0f0-0000-0000-0000-000000000003','terceira@teste.invalid','authenticated','authenticated');

create temp table veredito (cenario text, esperado text, obtido text);

-- ---- O caminho normal ------------------------------------------------------
update public.perfis
   set nome = 'Alex José Fausto', cpf = '11144477735', telefone = '48991793316',
       dados_em = now()
 where id = 'f0f0f0f0-0000-0000-0000-000000000001';

insert into veredito values
  ('o primeiro cadastro grava o CPF', '11144477735',
   (select cpf from public.perfis where id = 'f0f0f0f0-0000-0000-0000-000000000001'));

-- ---- A mesma pessoa, outro e-mail, mesmo CPF -------------------------------
-- É o cenário do teste infinito: conta nova a cada cinco dias.
create temp table repetiu as select 'PASSOU'::text as r;
do $$
begin
  update public.perfis set cpf = '11144477735'
   where id = 'f0f0f0f0-0000-0000-0000-000000000002';
  update repetiu set r = 'PASSOU';
exception when unique_violation then
  update repetiu set r = 'barrado';
end $$;

insert into veredito values
  ('o MESMO CPF em outra conta é barrado', 'barrado', (select r from repetiu));

-- ---- Nulo não colide -------------------------------------------------------
-- Todo mundo que entrou antes desta migration tem cpf nulo. Se o índice
-- tratasse nulos como iguais, o segundo perfil antigo quebraria.
insert into veredito values
  ('duas contas sem CPF convivem', '2',
   (select count(*)::text from public.perfis
     where id in ('f0f0f0f0-0000-0000-0000-000000000002',
                  'f0f0f0f0-0000-0000-0000-000000000003')
       and cpf is null));

-- ---- A forma do CPF --------------------------------------------------------
create temp table formato as select 'PASSOU'::text as r;
do $$
begin
  update public.perfis set cpf = '111.444.777-35'
   where id = 'f0f0f0f0-0000-0000-0000-000000000002';
  update formato set r = 'PASSOU';
exception when check_violation then
  update formato set r = 'barrado';
end $$;

insert into veredito values
  ('CPF com pontuação é barrado: o banco guarda só dígitos', 'barrado',
   (select r from formato));

create temp table curto as select 'PASSOU'::text as r;
do $$
begin
  update public.perfis set cpf = '1114447'
   where id = 'f0f0f0f0-0000-0000-0000-000000000002';
  update curto set r = 'PASSOU';
exception when check_violation then
  update curto set r = 'barrado';
end $$;

insert into veredito values
  ('CPF com menos de onze dígitos é barrado', 'barrado', (select r from curto));

-- ---- A forma do telefone ---------------------------------------------------
create temp table tel as select 'PASSOU'::text as r;
do $$
begin
  update public.perfis set telefone = '(48) 99179-3316'
   where id = 'f0f0f0f0-0000-0000-0000-000000000002';
  update tel set r = 'PASSOU';
exception when check_violation then
  update tel set r = 'barrado';
end $$;

insert into veredito values
  ('telefone com máscara é barrado', 'barrado', (select r from tel));

update public.perfis set telefone = '4899179331'
 where id = 'f0f0f0f0-0000-0000-0000-000000000003';

insert into veredito values
  ('telefone de dez dígitos passa', '4899179331',
   (select telefone from public.perfis where id = 'f0f0f0f0-0000-0000-0000-000000000003'));

-- ---- O criador continua dono do próprio perfil ------------------------------
-- A etapa nova escreve em `perfis` com a sessão do criador. Se a RLS não
-- deixasse, o passo 1 falharia em silêncio.
set local role authenticated;
set local request.jwt.claims = '{"sub":"f0f0f0f0-0000-0000-0000-000000000003"}';

create temp table proprio as select 'BARRADO'::text as r;
grant all on proprio to authenticated, anon;
do $$
begin
  update public.perfis set cpf = '52998224725', nome = 'Terceira Criadora'
   where id = 'f0f0f0f0-0000-0000-0000-000000000003';
  update proprio set r = 'gravou';
exception when insufficient_privilege then
  update proprio set r = 'BARRADO';
end $$;

-- E não pode escrever no perfil de outro.
create temp table alheio as select 'gravou'::text as r;
grant all on alheio to authenticated, anon;
do $$
declare v_linhas int;
begin
  update public.perfis set cpf = '52998224725'
   where id = 'f0f0f0f0-0000-0000-0000-000000000001';
  get diagnostics v_linhas = row_count;
  update alheio set r = case when v_linhas = 0 then 'barrado' else 'GRAVOU' end;
exception when others then
  update alheio set r = 'barrado';
end $$;

reset role;

insert into veredito values
  ('o criador grava o PRÓPRIO perfil', 'gravou', (select r from proprio)),
  ('e NÃO grava no perfil de outro', 'barrado', (select r from alheio));

select cenario, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from veredito;

rollback;
