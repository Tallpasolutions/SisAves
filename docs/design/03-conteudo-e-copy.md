# Conteúdo, voz e cópia

Regras de escrita do produto. Valem para rótulo, botão, vazio, erro, toast, e-mail e documento —
qualquer texto que o criador leia.

## Vibe

**Um caderno de campo bem organizado.** O sistema fala como um técnico experiente que respeita o
tempo do criador: **informa, não celebra**. Nunca "app fofinho de pet".

## Pessoa e tratamento

Fala-se **com** o criador, na segunda pessoa implícita — "Registre a postura", "Confirme o peso".
Nunca em primeira pessoa do sistema ("Estamos processando…"). O sistema não tem personalidade nem
nome próprio na fala.

- **Rótulos e cabeçalhos são substantivos:** "Ninhadas", "Coeficiente de endogamia".
- **Botões são verbos** no infinitivo ou imperativo curto: "Registrar postura", "Emitir CRO".

## Caixa

Frase capitalizada em títulos, rótulos e botões — só a primeira letra e nomes próprios:
**"Registrar postura"**, não "Registrar Postura".

Caixa alta **apenas** em rótulos-guia (`--type-overline`, ex. `AVES ATIVAS`) e em siglas do
domínio (CRO, COBP, FOB, QR). **Nunca caixa alta em frase inteira.**

## Números

Sempre com o dado bruto à vista. "78% de eclosão nos últimos 30 dias", não "eclosão excelente".

- Percentuais com no máximo duas decimais; **coeficiente de endogamia sempre com duas** ("3,13%").
- **Nunca arredondar peso ou valor financeiro na exibição.**
- Datas `dd/mm/aaaa`. Decimais com vírgula. Moeda `R$ 1.240,00`.
- Todo número na tela usa `tabular-nums`.

## Emoji: não

Em nenhuma superfície — nem em vazio, nem em toast, nem como marcador de seção. Ícones de traço
fazem esse trabalho. Unicode como ícone (▲ ✓ × ♂ ♀) também não.

## Vocabulário do domínio — usar exatamente

anilha · plantel · criatório · galpão · ninhada · postura · ovoscopia · eclosão · anilhamento ·
separação · matriz / reprodutor · mutação · plantel ativo · CRO

**Não traduzir nem simplificar** para termos genéricos ("pássaro", "ovo bom", "bebê").
O criador conhece o vocabulário técnico melhor que o produto; usá-lo é sinal de respeito e de
competência.

## Erro, perda e óbito

Diretos, sem eufemismo e sem culpa. Perda de ninhada e óbito são **eventos normais de criatório**:
o sistema registra sem dramatizar e sem consolar.

✅ "Perda registrada · 2 ovos · 09/03"
❌ "Que pena! Sentimos muito 😢"

Mensagem de erro **cita o dado exato** e diz o que fazer. Nunca "Ops, algo deu errado."

## Tabela de cópia

| Situação | Escreva assim | Não assim |
|---|---|---|
| Alerta de prazo | "3 ninhadas precisam de ovoscopia hoje" | "Você tem tarefas pendentes!" |
| Vazio | "Nenhuma ninhada ativa. Registre uma postura para acompanhar o ciclo." | "Nada por aqui ainda 🐣" |
| Offline | "Offline — salvo no aparelho" | "Sem conexão. Tente novamente mais tarde." |
| Sucesso | "Postura registrada · Ninhada 04 · 5 ovos" | "Tudo pronto! 🎉" |
| Erro de validação | "O código COBP-25-04781 já existe no plantel." | "Ops, algo deu errado." |
| Risco genético | "Risco — 14,06%. Endogamia acima de 12,5%." | "Cuidado com esse casal!" |
| Botão destrutivo | "Registrar óbito" | "Remover passarinho" |
| Confirmação destrutiva | "A ave sai do plantel ativo e permanece na genealogia." | "Tem certeza? Esta ação não pode ser desfeita." |
| Chip de prazo hoje | "Anilhar hoje" | "URGENTE!" |
| Sincronizado | "Sincronizado · hoje 07:42" | "Tudo em ordem ✅" |

## Padrões que se repetem

- **Separador `·`** (ponto médio com espaços) para encadear fatos curtos de mesmo nível:
  "Postura registrada · Ninhada 04 · 5 ovos". Não usar `|`, `-` nem `/`.
- **Fato + consequência com data** em toda confirmação: o que aconteceu e o que isso agenda
  ("Ovoscopia prevista para 17/03/2026.").
- **Contagem antes do substantivo** em alertas: "3 ninhadas precisam de ovoscopia hoje".
- **Uma ação principal por tela** no app de campo — e o rótulo dela nomeia o resultado, não o
  gesto ("Registrar postura", não "Enviar").
- **Vazio nomeia o que falta e dá o próximo passo**, em duas frases no máximo.
