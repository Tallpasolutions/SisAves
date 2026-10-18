-- =============================================================================
-- SisAves · 0035 · A árvore do certificado vai a quatro gerações
--
-- O certificado do sistema antigo — o que o criador entrega junto com a ave há
-- anos — tem QUATRO gerações: 2 pais, 4 avós, 8 bisavós e 16 trisavós, trinta
-- posições. O nosso congelava três.
--
-- `arvore_genealogica()` já aceita a profundidade por parâmetro desde a 0015,
-- então aqui só muda o argumento no snapshot. Certificado já emitido continua
-- com as três gerações que congelou — é exatamente para isso que o snapshot
-- existe, e reescrevê-lo seria mentir sobre o que foi impresso.
-- =============================================================================

create or replace function public.montar_snapshot_certificado(p_passaro_id uuid)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'emitido_em', now(),
    'ave', jsonb_build_object(
      'nome', p.nome,
      'anilha', jsonb_build_object(
        'sigla', p.anilha_sigla, 'criador', p.anilha_criador,
        'ano', p.anilha_ano, 'numero', p.anilha_numero),
      'codigo_alternativo', p.codigo_alternativo,
      'sexo', p.sexo,
      'dt_nascimento', p.dt_nascimento,
      'especie', e.nome,
      -- "Coleiro (Sporophila caerulescens)" é como a espécie aparece no
      -- documento do criador. O nome científico mora no CATÁLOGO, não na
      -- espécie adotada pelo criatório — daí o join.
      'especie_cientifica', ec.nome_cientifico,
      'mutacao', m.nome,
      'foto_url', p.foto_url
    ),
    'criatorio', jsonb_build_object(
      -- Só o que identifica a ORIGEM da ave. WhatsApp e Instagram do criador
      -- ficam de fora, e não por esquecimento: `validar_certificado` devolve
      -- este snapshot INTEIRO para quem escaneia o QR, sem login. Contato aqui
      -- dentro é contato publicado na internet. Na folha impressa ele é lido
      -- ao vivo da tabela, que é também mais correto: telefone muda, e o que
      -- se congela é o que a ave era, não como falar com quem a criou.
      'nome', c.nome,
      'slug', c.slug,
      'registro_ibama', c.registro_ibama,
      'clube', cl.sigla,
      'nro_criador', c.nro_criador,
      'cidade', c.cidade,
      'uf', c.uf,
      'logo_url', c.logo_url
    ),
    'endogamia_pct', public.coeficiente_endogamia(p.pai_id, p.mae_id),
    'genealogia', coalesce((
      select jsonb_agg(jsonb_build_object(
               'geracao', a.geracao, 'papel', a.papel, 'caminho', a.caminho,
               'nome', a.nome,
               'sexo', a.sexo, 'especie', a.especie_nome, 'mutacao', a.mutacao_nome,
               'anilha', jsonb_build_object(
                 'sigla', a.anilha_sigla, 'criador', a.anilha_criador,
                 'ano', a.anilha_ano, 'numero', a.anilha_numero)
             ) order by a.geracao, a.caminho)
        -- Quatro gerações: a quarta é a dos trisavós, dezesseis posições.
        from public.arvore_genealogica(p_passaro_id, 4) a
       where a.geracao > 0
    ), '[]'::jsonb)
  )
  from public.passaros p
  left join public.especies e on e.id = p.especie_id
  left join public.especies_catalogo ec on ec.id = e.catalogo_id
  left join public.mutacoes m on m.id = p.mutacao_id
  join public.criatorios c on c.id = p.criatorio_id
  left join public.clubes cl on cl.id = c.clube_id
  where p.id = p_passaro_id;
$$;

comment on function public.montar_snapshot_certificado is
  'O retrato que a emissão congela: ave, criatório (sem contato), endogamia e quatro gerações de genealogia. O contato do criador fica de fora de propósito — validar_certificado devolve este snapshot a quem não tem login.';

-- -----------------------------------------------------------------------------
-- O contato do criador nas peças impressas
-- -----------------------------------------------------------------------------
-- O documento do legado traz WhatsApp e Instagram, e faz sentido: o papel vai
-- junto com a ave vendida, e é por ele que o comprador reencontra quem a criou.
-- Mas é dado pessoal num papel que circula, então quem decide é o criador.
--
-- Padrão ligado: os campos já existem em Configurações e estão em branco até
-- alguém preenchê-los — com eles vazios, nada é impresso de qualquer forma.
alter table public.criatorios
  add column if not exists contato_no_documento boolean not null default true;

comment on column public.criatorios.contato_no_documento is
  'Se WhatsApp e Instagram saem nas peças impressas. Nunca na página pública de validação, que não tem contato nenhum.';
