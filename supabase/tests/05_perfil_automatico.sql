begin;

create temp table res (verificacao text, esperado text, obtido text);

-- 1. Cadastro por e-mail, sem metadados: o nome vem do trecho antes do @.
insert into auth.users (id, email, aud, role)
values ('eeeeeeee-0000-0000-0000-000000000001', 'joao.criador@perfil.teste.invalid', 'authenticated', 'authenticated');

insert into res
select 'perfil criado no cadastro', 'true',
       exists(select 1 from public.perfis where id = 'eeeeeeee-0000-0000-0000-000000000001')::text;

insert into res
select 'nome sem metadados vem do e-mail', 'joao.criador',
       nome from public.perfis where id = 'eeeeeeee-0000-0000-0000-000000000001';

-- 2. Cadastro com 'nome' (formulário próprio).
insert into auth.users (id, email, aud, role, raw_user_meta_data)
values ('eeeeeeee-0000-0000-0000-000000000002', 'ana@perfil.teste.invalid', 'authenticated', 'authenticated',
        '{"nome":"Ana Beatriz Souza"}'::jsonb);

insert into res
select 'nome do formulário', 'Ana Beatriz Souza',
       nome from public.perfis where id = 'eeeeeeee-0000-0000-0000-000000000002';

-- 3. Cadastro pelo Google: manda full_name e avatar_url.
insert into auth.users (id, email, aud, role, raw_user_meta_data)
values ('eeeeeeee-0000-0000-0000-000000000003', 'bruno@perfil-google.teste.invalid', 'authenticated', 'authenticated',
        '{"full_name":"Bruno Lima","avatar_url":"https://exemplo/foto.jpg"}'::jsonb);

insert into res
select 'nome do Google', 'Bruno Lima',
       nome from public.perfis where id = 'eeeeeeee-0000-0000-0000-000000000003';

insert into res
select 'avatar do Google', 'https://exemplo/foto.jpg',
       avatar_url from public.perfis where id = 'eeeeeeee-0000-0000-0000-000000000003';

-- 4. Nome só com espaços não vale: cai para o e-mail.
insert into auth.users (id, email, aud, role, raw_user_meta_data)
values ('eeeeeeee-0000-0000-0000-000000000004', 'vazio@perfil.teste.invalid', 'authenticated', 'authenticated',
        '{"nome":"   "}'::jsonb);

insert into res
select 'nome em branco cai para o e-mail', 'vazio',
       nome from public.perfis where id = 'eeeeeeee-0000-0000-0000-000000000004';

-- 5. Apagar a conta leva o perfil junto (cascade).
delete from auth.users where id = 'eeeeeeee-0000-0000-0000-000000000001';
insert into res
select 'apagar conta apaga o perfil', '0',
       count(*)::text from public.perfis where id = 'eeeeeeee-0000-0000-0000-000000000001';

select verificacao, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from res;

rollback;
