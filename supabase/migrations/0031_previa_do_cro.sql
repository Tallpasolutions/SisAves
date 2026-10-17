-- =============================================================================
-- SisAves · 0031 · A prévia do CRO
--
-- A tela C3 mostra a folha A4 ao vivo enquanto o criador escolhe a ave, ANTES
-- de emitir. Para isso ela precisa do mesmo snapshot que a emissão vai
-- congelar — não de uma montagem paralela em TypeScript, que divergiria do
-- papel na primeira mudança de qualquer uma das duas.
--
-- `montar_snapshot_certificado` já existe e é `stable`; faltava o grant para
-- o cliente autenticado. Ela lê pelas tabelas normais, então a RLS continua
-- sendo a fronteira: o criador só monta prévia de ave do próprio criatório.
-- =============================================================================

grant execute on function public.montar_snapshot_certificado(uuid) to authenticated;

comment on function public.montar_snapshot_certificado is
  'Monta o retrato da ave que o CRO congela: identidade, criatório, endogamia e três gerações. Usada pela emissão E pela prévia da tela C3 — uma função só, para a prévia não divergir do papel.';
