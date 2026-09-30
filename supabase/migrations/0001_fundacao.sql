-- =============================================================================
-- SisAves · 0001 · Fundação
-- Extensões, tipos enumerados e utilitários compartilhados.
-- =============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";     -- texto case-insensitive (e-mails)
create extension if not exists "unaccent";   -- busca sem acento (nomes de espécies)
create extension if not exists "pg_trgm";    -- busca aproximada

-- -----------------------------------------------------------------------------
-- Tipos do domínio
-- -----------------------------------------------------------------------------

-- Sexo da ave. O sistema legado usava 1=macho / 2=fêmea (inteiro mágico);
-- aqui vira enum legível. 'indefinido' cobre filhotes ainda não sexados —
-- situação real e frequente que o legado não representava.
create type sexo_ave as enum ('macho', 'femea', 'indefinido');

-- Situação da ave no plantel.
create type situacao_ave as enum (
  'ativo',        -- no plantel
  'vendido',
  'doado',
  'morto',
  'perdido',      -- fuga
  'emprestado'    -- cedido a outro criador temporariamente
);

-- Ciclo de vida do ovo/filhote. Os seis primeiros espelham o legado;
-- os terminais foram acrescentados para fechar o ciclo corretamente.
create type situacao_postura as enum (
  'chocando',     -- ovo posto, em incubação
  'verificar',    -- janela de ovoscopia
  'nascendo',     -- previsão de eclosão atingida
  'nascido',      -- filhote eclodiu
  'anilhar',      -- JANELA CRÍTICA: anilha precisa entrar agora
  'separar',      -- filhote pronto para desmame
  'separado',     -- ciclo concluído com sucesso
  'infertil',     -- ovoscopia negativa (ovo claro)
  'perdido'       -- ovo quebrado / embrião morto / filhote não vingou
);

-- Desfecho registrado manualmente pelo criador (sobrepõe o cálculo por prazo).
create type desfecho_postura as enum ('infertil', 'perdido');

create type tipo_lancamento as enum ('receita', 'despesa');

create type origem_ave as enum (
  'nascimento_proprio',  -- nasceu no criatório
  'compra',
  'doacao_recebida',
  'transferencia'
);

-- -----------------------------------------------------------------------------
-- Utilitários
-- -----------------------------------------------------------------------------

-- Mantém updated_at coerente. Além de auditoria, é a coluna que o cliente
-- offline usa como marca-d'água para sincronizar apenas o que mudou.
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.tg_set_updated_at is
  'Trigger BEFORE UPDATE: atualiza updated_at. Usada pela sincronização offline.';
