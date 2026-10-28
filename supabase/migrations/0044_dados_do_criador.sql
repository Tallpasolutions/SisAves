-- SisAves · 0044 · Nome completo, CPF e celular do criador
-- =============================================================================
-- `perfis` já tinha `nome` e `telefone`, mas nada obrigava a preenchê-los: o
-- trigger de novo usuário copia o nome do cadastro e o telefone ficava vazio
-- para sempre. Faltava o CPF.
--
-- **O CPF é dado sensível, e o motivo de pedi-lo precisa caber numa frase.**
-- Aqui são dois: emitir nota fiscal da assinatura, e impedir que a mesma
-- pessoa faça teste atrás de teste trocando de e-mail. O segundo é o que a
-- restrição de unicidade abaixo garante — sem ela, cinco dias grátis viram
-- infinitos dias grátis, bastando um endereço novo.
alter table public.perfis
  add column if not exists cpf text,
  add column if not exists dados_em timestamptz;

comment on column public.perfis.cpf is
  'Só dígitos, 11 posições. Serve à nota fiscal e impede teste repetido com outro e-mail.';
comment on column public.perfis.dados_em is
  'Quando o criador preencheu os dados pessoais. Nulo = ainda não passou por essa etapa.';

-- Forma, não validade: os dígitos verificadores são conferidos na aplicação,
-- onde a mensagem de erro pode dizer qual é o problema. Aqui fica o que
-- protege a tabela de lixo.
alter table public.perfis
  drop constraint if exists perfis_cpf_formato;
alter table public.perfis
  add constraint perfis_cpf_formato
  check (cpf is null or cpf ~ '^[0-9]{11}$');

-- Uma pessoa, um cadastro.
--
-- Índice parcial porque `cpf` é nulo para todo mundo que entrou antes desta
-- migration: um `unique` comum trataria os nulos como distintos de qualquer
-- forma, mas o parcial diz a intenção e não indexa o que não existe.
create unique index if not exists perfis_cpf_unico
  on public.perfis (cpf)
  where cpf is not null;

-- O telefone segue o mesmo princípio: só dígitos, com DDD, celular brasileiro.
alter table public.perfis
  drop constraint if exists perfis_telefone_formato;
alter table public.perfis
  add constraint perfis_telefone_formato
  check (telefone is null or telefone ~ '^[0-9]{10,11}$');

-- -----------------------------------------------------------------------------
-- Quem já estava aqui
-- -----------------------------------------------------------------------------
-- Ninguém é obrigado a nada retroativamente, e a coluna nasce nula. Quem já
-- tem criatório nunca mais passa pelo onboarding, então o dado desses só
-- chega por uma tela de perfil ou por pedido direto. É uma escolha: barrar o
-- acesso de quem já usa, para colher CPF, custaria mais que o dado vale.
