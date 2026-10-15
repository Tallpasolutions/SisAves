# Testes de banco

Rodam contra o Postgres real (não há Docker local). Cada arquivo abre uma
transação e termina em `rollback` — nada fica no banco.

```bash
node scripts/sql.mjs -f supabase/tests/01_ciclo_do_ovo.sql
node scripts/sql.mjs -f supabase/tests/02_endogamia.sql
node scripts/sql.mjs -f supabase/tests/03_isolamento_rls.sql
node scripts/sql.mjs -f supabase/tests/04_certificado.sql
```

Ou todos de uma vez:

```bash
for t in supabase/tests/0*.sql; do node scripts/sql.mjs -f "$t"; done
```

Toda linha deve sair com `resultado = ok`.

| Arquivo | O que prova |
|---|---|
| `01_ciclo_do_ovo.sql` | Os 9 estados da postura derivam corretamente das datas e dos prazos da espécie, incluindo a volta de "anilhar" para "nascido" depois de anilhada. |
| `02_endogamia.sql` | Coeficiente de Wright em pedigrees de valor conhecido: meios-irmãos 12,50%, irmãos completos 25%, primos-primeiros 6,25%, pai × filha 25%, sem parentesco 0%. |
| `03_isolamento_rls.sql` | Dois criatórios não enxergam dado um do outro, e o acesso anônimo não enxerga nada. |
| `04_certificado.sql` | O snapshot do CRO congela na emissão (renomear a ave depois não muda o documento), nenhum contato do criador sai na validação pública, e o anônimo não lê a tabela — só a função `validar_certificado`. |
| `05_perfil_automatico.sql` | O trigger cria `perfis` junto com `auth.users`, sem deixar usuário órfão. |
| `06_anilhamento.sql` | O anilhamento cria a ave com filiação do casal, recusa ovo não eclodido e filhote já anilhado, e um lote que falha no último não deixa os anteriores criados. |
| `07_arvore_genealogica.sql` | A árvore devolve `caminho` (`pp`, `pm`, `mp`, `mm`), distinguindo avô paterno de avô materno. |
| `08_marcos_do_ciclo.sql` | Uma conferência grava marcos diferentes no mesmo lote; o reenvio aplica zero; separar filhote não anilhado é barrado; perda de filhote anilhado mata a ave no plantel; lote que falha no fim não grava o começo. |
| `09_saida_do_plantel.sql` | A venda tira a ave do ativo, encerra o casal vigente e lança a receita numa transação; o reenvio não duplica o lançamento; só empréstimo e fuga voltam ao plantel; as constraints barram ave ativa com data de saída e óbito convivendo com saída. |
| `10_coerencia_ao_editar.sql` | Corrigir o sexo de uma ave que é pai, ou que está em casal vigente, é barrado; encerrado o casal, a correção passa; ciclo na genealogia e anilha repetida continuam barrados pela edição. |

## Regra dos fixtures

E-mails de teste usam o TLD reservado **`.invalid`**, com prefixo por arquivo
(`endogamia@`, `rls-ana@`, `cert-carla@`). O motivo é concreto: os testes já
quebraram por usarem `teste@sisaves.local`, o mesmo e-mail da conta de
desenvolvimento criada por `scripts/usuario-teste.mjs` — a conta persiste no
banco e colidia com o `insert` do fixture, mesmo dentro de transação.

## Armadilha de snapshot

Num mesmo `insert into veredito values (a), (b)`, todas as linhas enxergam o
snapshot do início do comando. Se `(a)` chama a função que escreve e `(b)` lê o
resultado, `(b)` lê o estado anterior e o teste acusa falha onde não há. **A
chamada que escreve vai em comando próprio**, separada por `;` da que confere.
