# Testes de banco

Rodam contra o Postgres real (não há Docker local). Cada arquivo abre uma
transação e termina em `rollback` — nada fica no banco.

Todos de uma vez, que é como se roda:

```bash
node scripts/testar.mjs
```

Um arquivo isolado, para ver o veredito linha a linha:

```bash
node scripts/sql.mjs -f supabase/tests/01_ciclo_do_ovo.sql
```

**Não verifique com `grep -c FALHOU`.** Ele devolve zero tanto quando tudo
passa quanto quando o script MORRE antes do veredito — dois arquivos ficaram
quebrados por essa troca sem ninguém ver. O runner trata erro de SQL e arquivo
sem asserção nenhuma como falha, e sai com código 1.

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
| `11_hoje_do_criatorio.sql` | `public.hoje()` segue o fuso de São Paulo, e a máquina de estados usa o dia do criatório por padrão sem deixar de aceitar um dia informado — que é como o cálculo roda offline. |
| `12_desfazer_marco.sql` | Desfazer devolve o ovo ao ciclo; a perda de filhote anilhado desfaz o óbito junto, mas só quando foi ela que o gravou; eclosão de filhote anilhado não se desfaz. |
| `13_transferir_postura.sql` | Transferir muda quem choca e não de quem é o ovo — o filhote criado pela babá e anilhado lá continua filho do casal que o pôs; devolver mantém a passagem no histórico. |
| `14_corrigir_data_marco.sql` | Trocar a data de um marco mantém o registro e o motivo; data recusada deixa a anterior valendo; as guardas de `desfazer_marco` continuam valendo, inclusive a do filhote anilhado. |

## Regra dos fixtures

E-mails de teste usam o TLD reservado **`.invalid`**, com prefixo por arquivo
(`endogamia@`, `rls-ana@`, `cert-carla@`). O motivo é concreto: os testes já
quebraram por usarem `teste@sisaves.local`, o mesmo e-mail da conta de
desenvolvimento criada por `scripts/usuario-teste.mjs` — a conta persiste no
banco e colidia com o `insert` do fixture, mesmo dentro de transação.

## O "hoje" dos fixtures

Os fixtures usam `public.hoje()`, não `current_date`. As funções do domínio
comparam com `public.hoje()` (fuso do criatório) desde 0022, e misturar os dois
quebra os testes das 21h à meia-noite — justamente o horário em que alguém
rodaria um teste depois do expediente.

## Armadilha de snapshot

Num mesmo `insert into veredito values (a), (b)`, todas as linhas enxergam o
snapshot do início do comando. Se `(a)` chama a função que escreve e `(b)` lê o
resultado, `(b)` lê o estado anterior e o teste acusa falha onde não há. **A
chamada que escreve vai em comando próprio**, separada por `;` da que confere.
