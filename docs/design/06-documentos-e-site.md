# Documentos e site — Faixa D

Arquivos: `artboards/SisAves - Certificado CRO.dc.html` (D1) e
`artboards/SisAves - Validacao e Site.dc.html` (D2 e D3).

## D1 — Certificado/CRO impresso · A4 retrato

Construído sobre o componente de documento paginado do ambiente (`<doc-page size="a4">` com uma
`<section class="page">`), então **já sai pronto para PDF/impressão** — sem CSS de impressão
próprio, sem régua de página falsa. A4 retrato porque o público é brasileiro; margens
16/15/13 mm.

**Medidas em pt e mm, não px** — é um documento físico. Corpo 10pt, rótulos-guia 7,5pt,
título 27pt, anilha 19pt. Nada abaixo de 7,5pt.

Estrutura, de cima para baixo:

1. **Cabeçalho institucional** — logotipo do criatório (espaço arrastável de 19 mm), nome,
   registro IBAMA e clube, cidade; à direita o nº do CRO e a data de emissão. Régua de 2px em
   petróleo fecha o bloco.
2. **Título e declaração** — "Certificado de Registro de Origem" + um parágrafo que declara o
   que o documento afirma (nascimento no plantel, anilha oficial, filiação conforme
   assentamentos). É o que dá ao papel cara de documento e não de panfleto.
3. **Faixa da anilha** — bloco petróleo-50 com borda petróleo-200: anilha em 19pt tabular com
   tracking largo à esquerda, coeficiente de endogamia à direita. É o dado que o comprador
   procura primeiro.
4. **Dados da ave** — grade de 3 × 3: nome, espécie, nome científico (itálico), mutação, sexo,
   nascimento, anilhamento, ninhada de origem, portador.
5. **Foto** — espaço arrastável de 52 mm na coluna direita, com legenda datada.
6. **Genealogia de três gerações** — três colunas (pais, avós, bisavós), cada ancestral com
   faixa de 2px à esquerda: petróleo = macho, azul profundo = fêmea, cinza = desconhecido.
   Uma linha em texto explica a repetição de ancestral que gera o coeficiente.
7. **Assinatura e validação** — linha de assinatura do responsável com CPF, aviso de que o
   documento não substitui a documentação ambiental, e à direita o QR Code de 26 mm com a URL
   de validação.
8. **Rodapé** — "Emitido por **SisAves** · sisaves.tallpa.com.br" e a numeração do documento.

O QR é um **placeholder gráfico** (padrão xadrez CSS com os três marcadores de canto). Em
produção, gerar o código real a partir da URL `/v/<hash>-<sequencial>`.

## D2 — Página pública de validação · 390 × 844 (`5a`)

O que abre ao escanear o QR. Sem login, sem menu, sem tab bar — é uma página de consulta.

- **Selo de confiança** primeiro: bloco petróleo cheio com ícone `CircleCheck` em disco branco,
  "Certificado autêntico" em 24px e a frase que diz o que foi verificado ("consta no registro do
  SisAves e não foi alterado desde a emissão"). Abaixo, a data e hora da consulta em pílula.
  A confiança vem do selo + do dado bruto, não de adjetivo.
- **Cartão da ave** — foto, nome, anilha em `tone="brand"`, espécie/mutação/sexo, e quatro dados
  em grade (nascimento, anilhamento, nº do CRO, endogamia).
- **Criatório emissor** — monograma, nome, registro IBAMA, clube e cidade.
- **Genealogia resumida** — só pai e mãe, com faixa de sexo e anilha; uma linha informa que as
  três gerações completas estão no certificado impresso.
- **Ação única** — baixar o PDF. Mais a nota de que a consulta é pública e **nenhum contato do
  criador é exibido** (decisão de privacidade: a página prova a ave, não expõe o vendedor).

## D3 — Landing page · 1440 × 3000 (`5b`)

Tom profissional e direto: o público é criador experiente. Nenhuma palavra de startup
("revolucionar", "plataforma inteligente"), nenhum gradiente, nenhuma ilustração.

Ordem das seções e o que cada uma carrega:

1. **Barra de navegação** (72px) — logo, 4 links, Entrar e "Testar 14 dias".
2. **Hero** em petróleo cheio — pílula "Funciona no galpão, sem sinal", título de 54px
   ("A genealogia do seu plantel, registrada como deve ser"), parágrafo que nomeia o ciclo
   (anilha, ninhada, ovoscopia, endogamia, certificado), dois botões — **âmbar na ação
   principal, único âmbar da dobra** — e três números de prova (1.240 criadores, 86 mil aves,
   19 mil CRO). À direita, foto do criador usando o app.
3. **Faixa de prova social** — clubes e criatórios em texto, sem logotipos inventados.
4. **Funcionalidades** — grade 3 × 2: banco genético automático, certificado com QR, controle
   de ovos por prazo (ícone e pílula em âmbar — é o único bloco de prazo), financeiro, funciona
   offline, mais um cartão em azul profundo oferecendo a importação da planilha. Cada cartão
   termina com uma pílula de dado concreto ("3 gerações · 3,13%", "Anilhar hoje",
   "R$ 1.240,00 em setembro").
5. **Demonstração do app** — duas molduras de 300 × 640 (Hoje e Ovos) com três provas em
   marcador: alvo de 48px com luva, anilha legível a meio metro, registro em três toques
   offline.
6. **Depoimentos** — três criadores brasileiros com espécie, cidade e tamanho do plantel. As
   falas são específicas (janela da anilha perdida, QR escaneado na frente do comprador, 12,5%
   descoberto antes de formar o casal), não elogios genéricos.
7. **Planos** — Iniciante R$ 19,90 (até 30 aves), **Criador R$ 39,90** com borda petróleo de 2px
   e selo âmbar "Mais escolhido", e Clube sob consulta. O plano barato mostra o que **não** tem
   ("Sem emissão de CRO") com ícone `Minus` — honestidade em vez de omissão.
8. **FAQ** — cinco perguntas reais, com a resposta sobre valor legal dizendo explicitamente que
   o CRO **não substitui** a documentação ambiental, e a de dados afirmando exportação inclusive
   no cancelamento.
9. **Chamada final** em petróleo + **rodapé** em azul profundo com quatro colunas.

Duas superfícies em petróleo cheio (hero e chamada final) e uma em azul profundo (rodapé), bem
separadas na rolagem — a regra de "um bloco de petróleo por tela" vale por dobra, não pela
página inteira de 3000px.

## Imagens

Todos os espaços de imagem são `<image-slot>` arrastáveis, com id estável (a foto solta
permanece): `cro-logo-criatorio`, `cro-foto-ave`, `val-foto-ave`, `lp-hero-app`, `lp-app-hoje`,
`lp-app-ovos`, `lp-dep-1…3`. Em produção são upload do criador (foto real do plantel) e captura
de tela real do app — nunca banco de imagem.
