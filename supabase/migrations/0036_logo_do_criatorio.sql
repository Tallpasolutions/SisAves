-- =============================================================================
-- SisAves · 0036 · A logo do criatório
--
-- `criatorios.logo_url` existe desde a 0002 e a folha do CRO já sabe imprimi-la.
-- Faltava tudo o resto: não havia bucket no Storage, não havia upload, não
-- havia campo em Configurações. Coluna que ninguém consegue preencher.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'criatorios',
  'criatorios',
  -- Público na LEITURA, e precisa ser: a logo sai impressa no certificado e
  -- aparece na página de validação, que é anônima por definição. Quem recebeu
  -- a ave não tem conta.
  true,
  2097152,                                   -- 2 MB
  /*
   * PNG, JPEG e WEBP. **SVG fica de fora de propósito**: o bucket é público e
   * o arquivo é servido inline, então um SVG com `<script>` dentro vira
   * execução de código no domínio que hospeda o certificado. Logo é imagem,
   * não documento executável.
   */
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- Quem pode escrever
-- -----------------------------------------------------------------------------
-- O caminho do arquivo é `<criatorio_id>/logo.<ext>`, e é a PRIMEIRA PASTA que
-- decide a permissão: só escreve no criatório de que você é membro. Sem isso,
-- qualquer autenticado trocaria a logo impressa no certificado de qualquer
-- outro criatório.
drop policy if exists "logo_leitura_publica" on storage.objects;
create policy "logo_leitura_publica" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'criatorios');

drop policy if exists "logo_do_proprio_criatorio" on storage.objects;
create policy "logo_do_proprio_criatorio" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'criatorios'
    and (storage.foldername(name))[1] in (
      select c::text from public.meus_criatorios() c
    )
  )
  with check (
    bucket_id = 'criatorios'
    and (storage.foldername(name))[1] in (
      select c::text from public.meus_criatorios() c
    )
  );

comment on column public.criatorios.logo_url is
  'URL pública da logo no bucket `criatorios`, caminho `<criatorio_id>/logo.<ext>`. Sai impressa nas peças e aparece na validação pública.';
