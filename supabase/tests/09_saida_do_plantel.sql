begin;

-- Um criatório com quatro aves e dois casais vigentes.
insert into auth.users (id, email, aud, role) values
  ('5a1d5a1d-0000-0000-0000-000000000001', 'saida-sonia@teste.invalid', 'authenticated', 'authenticated');

insert into public.criatorios (id, owner_id, nome, slug) values
  ('5a1d5a1d-1111-1111-1111-111111111111','5a1d5a1d-0000-0000-0000-000000000001','Criatório Sônia','sonia-saida');

insert into public.especies (id, criatorio_id, nome, dias_choco, dias_anilha, dias_separa, dias_ovoscopia, janela_anilha_dias)
values ('5a1d5a1d-eeee-eeee-eeee-eeeeeeeeeeee','5a1d5a1d-1111-1111-1111-111111111111','Agapornis',
        23::smallint, 5::smallint, 45::smallint, 7::smallint, 2::smallint);

insert into public.passaros (id, criatorio_id, nome, sexo, especie_id, dt_nascimento, anilha_sigla, anilha_criador, anilha_ano, anilha_numero) values
  ('5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa1','5a1d5a1d-1111-1111-1111-111111111111','Vendido','macho','5a1d5a1d-eeee-eeee-eeee-eeeeeeeeeeee', public.hoje() - 400,'COF','9001',2025,701),
  ('5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa2','5a1d5a1d-1111-1111-1111-111111111111','Parceira','femea','5a1d5a1d-eeee-eeee-eeee-eeeeeeeeeeee', public.hoje() - 400,'COF','9001',2025,702),
  ('5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa3','5a1d5a1d-1111-1111-1111-111111111111','Emprestado','macho','5a1d5a1d-eeee-eeee-eeee-eeeeeeeeeeee', public.hoje() - 400,'COF','9001',2025,703),
  ('5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa4','5a1d5a1d-1111-1111-1111-111111111111','Doado','femea','5a1d5a1d-eeee-eeee-eeee-eeeeeeeeeeee', public.hoje() - 400,'COF','9001',2025,704);

insert into public.casais (id, criatorio_id, numero, macho_id, femea_id, vigencia_inicio) values
  ('5a1d5a1d-cccc-cccc-cccc-cccccccccc01','5a1d5a1d-1111-1111-1111-111111111111',1,
   '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa1','5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa2', public.hoje() - 90),
  ('5a1d5a1d-cccc-cccc-cccc-cccccccccc02','5a1d5a1d-1111-1111-1111-111111111111',2,
   '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa3','5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa4', public.hoje() - 90);

create temp table veredito (cenario text, esperado text, obtido text);

-- ---- Venda com valor ---------------------------------------------------------
-- Chamada em comando próprio: dentro de um mesmo INSERT, as linhas que leem
-- usam o snapshot do início do comando e não veem esta escrita.
select public.registrar_saida(
  '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'vendido', public.hoje(),
  'João da Serra', 'casal desfeito', 1240.00);

insert into veredito values
  ('ave vendida sai do plantel ativo', 'ok',
   (select case when situacao = 'vendido' and saida_em = public.hoje()
                 and dt_obito is null and portador = 'João da Serra'
                 and saida_motivo = 'casal desfeito'
           then 'ok' else 'FALTOU' end
      from public.passaros where id = '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa1')),

  ('o casal vigente foi encerrado na data da saída', 'ok',
   (select case when vigencia_fim = public.hoje() then 'ok' else 'FALTOU' end
      from public.casais where id = '5a1d5a1d-cccc-cccc-cccc-cccccccccc01')),

  ('a venda virou receita na categoria de sistema', 'ok',
   (select case when l.tipo = 'receita' and l.valor = 1240.00
                 and l.data = public.hoje() and c.chave = 'venda_passaro'
           then 'ok' else 'FALTOU' end
      from public.financeiro_lancamentos l
      join public.financeiro_categorias c on c.id = l.categoria_id
     where l.passaro_id = '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa1')),

  ('a descrição do lançamento nomeia a ave e o destino', 'Venda · Vendido · João da Serra',
   (select descricao from public.financeiro_lancamentos
     where passaro_id = '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa1')),

  ('a parceira continua no plantel', 'ativo',
   (select situacao::text from public.passaros where id = '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa2'));

-- ---- Repetir a mesma venda ---------------------------------------------------
-- O reenvio da fila offline chegando pela segunda vez não pode lançar a
-- receita de novo: o criador veria a venda em dobro no financeiro.
select public.registrar_saida(
  '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'vendido', public.hoje(),
  'João da Serra', 'casal desfeito', 1240.00);

insert into veredito values
  ('reenvio não duplica o lançamento', '1',
   (select count(*)::text from public.financeiro_lancamentos
     where passaro_id = '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa1'));

-- ---- Segunda saída, diferente, é barrada ------------------------------------
do $$
begin
  perform public.registrar_saida(
    '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'doado', public.hoje());
  insert into veredito values ('ave que já saiu não sai de novo', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('ave que já saiu não sai de novo', 'barrado', 'barrado');
end $$;

-- ---- Óbito -------------------------------------------------------------------
select public.registrar_saida(
  '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'morto', public.hoje() - 1, null, 'doença respiratória');

insert into veredito values
  ('óbito grava dt_obito e deixa saida_em em branco', 'ok',
   (select case when situacao = 'morto' and dt_obito = public.hoje() - 1
                 and saida_em is null and portador is null
           then 'ok' else 'FALTOU' end
      from public.passaros where id = '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa2')),

  ('óbito não lança nada no financeiro', '0',
   (select count(*)::text from public.financeiro_lancamentos
     where passaro_id = '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa2'));

-- ---- Doação sem valor --------------------------------------------------------
select public.registrar_saida(
  '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'doado', public.hoje(), 'Clube de Joinville');

insert into veredito values
  ('doação registra destino sem lançar receita', 'ok',
   (select case when p.situacao = 'doado' and p.portador = 'Clube de Joinville'
                 and not exists (select 1 from public.financeiro_lancamentos
                                  where passaro_id = p.id)
           then 'ok' else 'FALTOU' end
      from public.passaros p where p.id = '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa4')),

  ('o casal do doado também encerrou', 'ok',
   (select case when vigencia_fim = public.hoje() then 'ok' else 'FALTOU' end
      from public.casais where id = '5a1d5a1d-cccc-cccc-cccc-cccccccccc02'));

-- ---- Empréstimo e volta ------------------------------------------------------
select public.registrar_saida(
  '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'emprestado', public.hoje(), 'Criatório Vizinho');

insert into veredito values
  ('ave emprestada sai do ativo com portador', 'ok',
   (select case when situacao = 'emprestado' and portador = 'Criatório Vizinho'
                 and saida_em = public.hoje()
           then 'ok' else 'FALTOU' end
      from public.passaros where id = '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa3'));

select public.reativar_ave('5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa3');

insert into veredito values
  ('ave que voltou não guarda saída em aberto', 'ok',
   (select case when situacao = 'ativo' and saida_em is null
                 and saida_motivo is null and portador is null
           then 'ok' else 'FALTOU' end
      from public.passaros where id = '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa3')),

  ('o casal encerrado não reabre sozinho', 'ok',
   (select case when vigencia_fim = public.hoje() then 'ok' else 'FALTOU' end
      from public.casais where id = '5a1d5a1d-cccc-cccc-cccc-cccccccccc02'));

do $$
begin
  perform public.reativar_ave('5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa2');
  insert into veredito values ('ave morta não volta ao plantel', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('ave morta não volta ao plantel', 'barrado', 'barrado');
end $$;

do $$
begin
  perform public.reativar_ave('5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa1');
  insert into veredito values ('ave vendida não volta por reativação', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('ave vendida não volta por reativação', 'barrado', 'barrado');
end $$;

-- ---- Guardas -----------------------------------------------------------------
do $$
begin
  perform public.registrar_saida(
    '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'vendido', public.hoje() + 1);
  insert into veredito values ('saída no futuro é barrada', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('saída no futuro é barrada', 'barrado', 'barrado');
end $$;

do $$
begin
  perform public.registrar_saida(
    '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'vendido', public.hoje() - 500);
  insert into veredito values ('saída anterior ao nascimento é barrada', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('saída anterior ao nascimento é barrada', 'barrado', 'barrado');
end $$;

do $$
begin
  perform public.registrar_saida(
    '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'doado', public.hoje(), 'Alguém', null, 300.00);
  insert into veredito values ('valor fora de venda é barrado', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('valor fora de venda é barrado', 'barrado', 'barrado');
end $$;

do $$
begin
  perform public.registrar_saida(
    '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'ativo', public.hoje());
  insert into veredito values ('"ativo" não é saída', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('"ativo" não é saída', 'barrado', 'barrado');
end $$;

-- A constraint é a garantia final: ave ativa não guarda data de saída, mesmo
-- que alguém escreva direto na tabela.
do $$
begin
  update public.passaros set saida_em = public.hoje()
   where id = '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa3';
  insert into veredito values ('ave ativa com data de saída é barrada pela constraint', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('ave ativa com data de saída é barrada pela constraint', 'barrado', 'barrado');
end $$;

do $$
begin
  update public.passaros set dt_obito = public.hoje()
   where id = '5a1d5a1d-aaaa-aaaa-aaaa-aaaaaaaaaaa1';
  insert into veredito values ('óbito e saída não convivem na mesma ave', 'barrado', 'PASSOU');
exception when others then
  insert into veredito values ('óbito e saída não convivem na mesma ave', 'barrado', 'barrado');
end $$;

-- ---- O plantel ativo ficou verdadeiro ----------------------------------------
insert into veredito values
  ('plantel ativo conta só quem está no galpão', '1',
   (select count(*)::text from public.passaros
     where criatorio_id = '5a1d5a1d-1111-1111-1111-111111111111'
       and situacao = 'ativo' and deleted_at is null));

select cenario, esperado, obtido,
       case when esperado = obtido then 'ok' else 'FALHOU' end as resultado
from veredito;

rollback;
