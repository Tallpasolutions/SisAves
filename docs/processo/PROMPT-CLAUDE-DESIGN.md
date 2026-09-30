# PROMPTS — Claude Design · SisAves

> O **SisAves Design System** já está cadastrado no Claude Design (paleta, tipografia,
> logos e regras de uso). Por isso os prompts abaixo **não repetem** a identidade —
> apenas referenciam. Use um bloco por vez, na ordem.

---

## CONTEXTO (cole junto com o primeiro pedido, uma única vez)

```
CONTEXTO DO PRODUTO — leia antes de desenhar

SisAves é um SaaS brasileiro de gestão de criatórios de aves ornamentais. O usuário é um
criador filiado a um clube/federação (ex.: sigla "SOV", criador nº 1234), que cria canários,
agapornis, diamantes de Gould, curiós, coleiros, trinca-ferros e calopsitas.

Ele usa o sistema EM PÉ, DENTRO DO GALPÃO, NO CELULAR, muitas vezes com uma ave na mão e
sem sinal de internet. Depois senta no computador para relatórios, documentos e análise genética.

O CICLO PRODUTIVO (espinha dorsal do produto):
ESPÉCIE → PÁSSARO → CASAL → POSTURA (ovo) → FILHOTE → vira PÁSSARO e recomeça

1. ESPÉCIE — o criador cadastra as espécies que cria e, para cada uma, três prazos em dias:
   dias de choco, dias para anilhar, dias para separar. ESSES PRAZOS AUTOMATIZAM TODO O RESTO.
2. PÁSSARO — a ave individual: anilha, sexo, nascimento, espécie, mutação, foto, pai e mãe.
3. CASAL — par macho + fêmea, com número, vigência, rodadas e etiquetas coloridas.
4. POSTURA/OVO — cada ovo de uma rodada. Avança de estado sozinho, pelos prazos da espécie.
5. FILHOTE — ao nascer e ser anilhado, vira um novo Pássaro.

A ANILHA é o "código de barras" da ave: sigla do clube + nº do criador + ano + nº sequencial.
Ex.: SOV 1234 · 2026 · 0087. Aparece em quase toda tela e deve ser tipograficamente distinta
(tabular-nums, com destaque), porque é assim que o criador reconhece cada animal.

OS 6 ESTADOS DO OVO (o pipeline mais importante da interface):
- Chocando  — ovo posto, em incubação → aguardar
- Verificar — hora da ovoscopia, checar se é fértil → confirmar fértil/infértil
- Nascendo  — previsão de eclosão chegou → acompanhar
- Nascido   — filhote eclodiu → registrar
- Anilhar   — JANELA CRÍTICA, fecha em poucos dias → anilhar HOJE
- Separar   — filhote pronto para desmame → separar do casal

"ANILHAR" É O ESTADO CRÍTICO DO NEGÓCIO: a anilha só entra na perna do filhote numa janela
de poucos dias; perdida a janela, a ave não pode ser registrada e perde valor comercial.
É NESSE MOMENTO que o âmbar #F2B544 deve aparecer. Desenhe a interface para que
"o que preciso fazer hoje" seja a primeira coisa visível.

GENÉTICA: cada ave aponta para pai e mãe, formando um banco genético automático. O sistema
calcula o COEFICIENTE DE ENDOGAMIA (%) de um casal antes do acasalamento — evitar
consanguinidade é decisão técnica central. Faixas: até 6,25% baixo (ok), 6,25–12,5% moderado
(atenção), acima de 12,5% alto (risco). Há também busca de ancestrais comuns entre duas aves.

DOCUMENTOS (grande diferencial comercial): certificado/CRO de autenticidade com genealogia e
QR Code de validação pública (qualquer pessoa escaneia e confere, sem login), crachá para
exposições e ficha do casal para impressão.

OUTROS MÓDULOS: financeiro (receitas/despesas, venda e compra de aves, dashboard mensal) e
saúde (medicamentos com dosagem e princípio ativo, doenças e sintomas).

O QUE MELHORAR EM RELAÇÃO AO SISTEMA LEGADO (requisitos, não sugestões):
1. Do cadastro para a operação — o app antigo abre em listas; o SisAves abre em "o que fazer
   hoje", uma agenda de tarefas do galpão derivada dos prazos.
2. Estados visíveis — o ciclo do ovo hoje é um filtro de texto; aqui deve ser pipeline visual.
3. Densidade honesta no desktop — tabela densa e comparável, não cards enormes espaçados.
4. Offline em primeiro lugar — indicador claro de "salvo no aparelho, sincroniza depois".
5. Genética legível — endogamia com faixa, cor semântica e o parentesco que a causou.
6. Entrada rápida com uma mão — filhote cadastrado em ~30 segundos.

CONTEÚDO REAL PARA AS TELAS (use estes dados, nunca lorem ipsum):
- Criatório: "Criatório Santos" · criador Hygor Santos · clube SOV · criador nº 1234
- Espécies: Agapornis Roseicollis, Canário Belga, Diamante de Gould, Calopsita, Curió, Coleiro
- Mutações: Lutino, Opalino, Arlequim, Canela, Face-de-pêssego, Albino, Pastel
- Anilhas: SOV 1234 · 2026 · 0087 / SOV 1234 · 2025 · 0042 / SOV 1234 · 2024 · 0311
- Casais: Casal 03, Casal 07, Casal 12 — rodadas 1ª, 2ª, 3ª
- Etiquetas de casal: Matriz, Teste genético, Exposição, Vendido
- Financeiro: "Venda casal Agapornis R$ 850,00", "Ração extrusada 15kg R$ 240,00",
  "Anilhas SOV 2026 R$ 180,00", "Taxa exposição regional R$ 120,00"
- Medicamentos: Enrofloxacina, Ivermectina, Complexo vitamínico AD3E
- Datas em 2026, coerentes entre si (ovo posto 12/08, previsão de eclosão 30/08)

Tudo em português do Brasil. Domínio: sisaves.tallpa.com.br
```

---

## FAIXA A — Fundamentos (comece por aqui · template "Blank")

```
Crie o canvas de design do SisAves começando pelos fundamentos. Três artboards:

A1. GUIA DE ESTILO (1400x1000)
Paleta com os 5 tokens (hex, nome e uso), escala tipográfica completa Montserrat/Inter
(display, H1-H4, corpo, legenda, dado numérico), grid de espaçamento, raios de canto e
elevações. Inclua as cores semânticas derivadas — sucesso, atenção, crítico, informação —
harmonizadas com o petróleo e DISTINTAS do âmbar, que é reservado para ação.

A2. APLICAÇÃO DO LOGO (1400x800)
Assinatura horizontal sobre Neve; versão branca sobre petróleo; símbolo isolado; app icon;
favicon 16 e 32px; demonstração da área livre de 1/4 da altura do símbolo; e um quadro de
"usos incorretos" mostrando o que é proibido (gradiente, sombra, contorno, rotação, distorção).

A3. BIBLIOTECA DE COMPONENTES (1400x1200)
- Botões: primário petróleo, secundário contornado, terciário texto, destrutivo —
  nos estados normal, hover, foco e desabilitado
- Campos de formulário: com rótulo, texto de ajuda, erro e preenchido
- ETIQUETA DE ANILHA como componente próprio (formato "SOV 1234 · 2026 · 0087")
- Os 6 CHIPS DE ESTADO DO OVO — sendo "Anilhar" o crítico, em âmbar
- Chip de sexo (macho / fêmea / indefinido)
- Medidor de coeficiente de endogamia com as três faixas
- Card de ave, linha de tabela, tabs, toast, modal
- Estado vazio, indicador offline/sincronizando, badge de notificação

Acessibilidade: contraste AA (4.5:1). Atenção — o âmbar #F2B544 NÃO passa em texto pequeno
sobre branco; use-o como fundo com texto escuro ou em elementos grandes. Alvos de toque ≥44px.
```

---

## FAIXA B — App mobile (390x844 · template "Mobile app design")

> Peça **em duas levas**. Primeiro as três telas que definem o produto:

```
Agora as telas mobile do SisAves (390x844), usando os componentes da Faixa A.
Comece pelas três telas que definem o produto:

B1. HOJE (tela inicial) — a mais importante do sistema
Saudação curta com o nome do criatório. Em seguida "Tarefas de hoje": cartões acionáveis
ordenados por urgência, ex.: "3 filhotes para anilhar — Casal 07, nasceram há 5 dias" (âmbar),
"2 ovos para ovoscopia — Casal 12", "1 filhote para separar — Casal 03". Abaixo, indicadores
do plantel (total de aves, casais ativos, ovos em choco, nascimentos no mês) e resumo da
temporada. Navegação inferior: Hoje · Plantel · Casais · Ovos · Mais.

B2. OVOS — PIPELINE
As ninhadas organizadas pelos 6 estados, com contagem por estado e cartões mostrando casal,
rodada, dias decorridos e prazo. Os cartões em "Anilhar" recebem o âmbar. Filtro por estado no topo.

B3. FICHA DA AVE
Foto no topo, anilha em destaque, dados (espécie, mutação, sexo, nascimento, situação,
portador) e atalhos para árvore genealógica, certificado e histórico. Pai e mãe visíveis
com suas anilhas, clicáveis.

Inclua também B1 e B2 em TEMA ESCURO — o criador usa o app de madrugada no galpão durante
as eclosões.
```

> Depois de aprovar essas, peça o restante:

```
Continue as telas mobile do SisAves (390x844), mesma linguagem:

B4. LOGIN — logo, e-mail/senha, entrar com Google, recuperar senha. Fundo petróleo com o
    símbolo em marca-d'água sutil, cartão claro sobre ele.
B5. PLANTEL — lista de aves com busca, filtros por espécie/sexo/situação; cada linha com
    miniatura, anilha em destaque, espécie + mutação, sexo e idade. Mostre 7 aves distintas.
B6. ÁRVORE GENEALÓGICA — três gerações em cartões conectados por linhas finas, rolagem
    horizontal, macho e fêmea diferenciados, aviso se houver ancestral repetido.
B7. CASAIS — lista com número, macho × fêmea (anilhas), etiquetas coloridas, rodada atual,
    ovos ativos e o estado mais urgente da ninhada.
B8. FICHA DO CASAL + ENDOGAMIA — dados do par, medidor de endogamia com faixa e cor
    semântica, explicação em uma frase ("Avós paternos em comum"), histórico de rodadas e
    botão de nova postura.
B9. REGISTRAR POSTURA / NOVO FILHOTE — formulário para uma mão: campos grandes, teclado
    numérico para a anilha, seletor de data, sugestão automática do próximo número de anilha,
    botão salvar fixo na base, indicador "salvo offline".
B10. FINANCEIRO — resumo do mês (receita, despesa, saldo), gráfico de barras dos últimos
     6 meses e lista de lançamentos reais.
B11. MAIS / MENU — Saúde, Espécies, Relatórios, Certificados, Configurações, Perfil, Ajuda
     no WhatsApp, com cabeçalho da conta e status da assinatura.

Inclua um estado vazio (primeiro acesso, sem aves), um de carregamento e um de erro/sem conexão.
```

---

## FAIXA C — Desktop (1440x1024)

```
Agora as telas desktop do SisAves (1440x1024). No computador o criador quer densidade e
comparação, não cards enormes espaçados.

C1. PAINEL — barra lateral fixa com a assinatura SisAves e navegação; conteúdo com
    indicadores do plantel, gráfico de nascimentos por mês, tarefas pendentes e últimas
    movimentações.
C2. PLANTEL EM TABELA — tabela de verdade: anilha, foto, espécie, mutação, sexo, nascimento,
    casal de origem, situação. Filtros laterais, ordenação, seleção múltipla, ações em lote.
    Números alinhados com tabular-nums.
C3. EDITOR DE CERTIFICADO/CRO — painel esquerdo com opções (modelo, cores, quais campos
    exibir, logotipo do criatório, redes sociais) e, à direita, preview em tempo real do
    certificado com genealogia e QR Code.
```

---

## FAIXA D — Documentos e site

```
Por fim, os documentos e o site do SisAves:

D1. CERTIFICADO/CRO IMPRESSO (A4 retrato) — documento sóbrio e elegante: cabeçalho com logo
    do criatório, dados da ave, anilha em destaque, árvore genealógica de 3 gerações,
    assinatura do criador, QR Code de validação e rodapé "Emitido por SisAves". Deve parecer
    documento oficial com valor, não panfleto.
D2. PÁGINA PÚBLICA DE VALIDAÇÃO POR QR (390x844) — o que abre ao escanear: selo de
    "Certificado autêntico", dados da ave, criatório emissor, genealogia resumida. Sem login.
    Precisa transmitir confiança imediata.
D3. LANDING PAGE sisaves.tallpa.com.br (1440x3000) — hero com proposta clara, prova social de
    criadores brasileiros, blocos das funcionalidades (banco genético automático, certificados
    com QR, controle de ovos por prazo, financeiro, funciona offline), demonstração visual do
    app, planos e preço, FAQ e rodapé. Tom profissional e direto — o público é criador
    experiente, não startup.
```
