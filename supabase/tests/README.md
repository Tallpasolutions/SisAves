# Testes de banco

Rodam contra o Postgres real (não há Docker local). Cada arquivo abre uma
transação e termina em `rollback` — nada fica no banco.

```bash
node scripts/sql.mjs -f supabase/tests/01_ciclo_do_ovo.sql
node scripts/sql.mjs -f supabase/tests/02_endogamia.sql
node scripts/sql.mjs -f supabase/tests/03_isolamento_rls.sql
node scripts/sql.mjs -f supabase/tests/04_certificado.sql
```

Toda linha deve sair com `resultado = ok`.

| Arquivo | O que prova |
|---|---|
| `01_ciclo_do_ovo.sql` | Os 9 estados da postura derivam corretamente das datas e dos prazos da espécie, incluindo a volta de "anilhar" para "nascido" depois de anilhada. |
| `02_endogamia.sql` | Coeficiente de Wright em pedigrees de valor conhecido: meios-irmãos 12,50%, irmãos completos 25%, primos-primeiros 6,25%, pai × filha 25%, sem parentesco 0%. |
| `03_isolamento_rls.sql` | Dois criatórios não enxergam dado um do outro, e o acesso anônimo não enxerga nada. |
| `04_certificado.sql` | O snapshot do CRO congela na emissão (renomear a ave depois não muda o documento), nenhum contato do criador sai na validação pública, e o anônimo não lê a tabela — só a função `validar_certificado`. |

## Regra dos fixtures

E-mails de teste usam o TLD reservado **`.invalid`**, com prefixo por arquivo
(`endogamia@`, `rls-ana@`, `cert-carla@`). O motivo é concreto: os testes já
quebraram por usarem `teste@sisaves.local`, o mesmo e-mail da conta de
desenvolvimento criada por `scripts/usuario-teste.mjs` — a conta persiste no
banco e colidia com o `insert` do fixture, mesmo dentro de transação.
