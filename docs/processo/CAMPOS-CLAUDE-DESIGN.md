# Como preencher o "Set up your design system" — SisAves

## CAMPO 1 — "Company name and blurb"
> Apague TUDO que está lá e cole apenas isto:

```
SisAves — Design System

SisAves é um SaaS brasileiro de gestão de criatórios de aves ornamentais (canários, agapornis, diamantes de Gould, curiós, calopsitas). O criador usa o sistema em pé dentro do galpão, no celular, muitas vezes com uma ave na mão e sem sinal de internet — e depois no computador para relatórios, certificados e análise genética.

O produto controla o ciclo completo do criatório: espécies e seus prazos, aves individuais identificadas por anilha oficial de clube, formação de casais, o ciclo dos ovos (chocando, ovoscopia, nascimento, anilhamento, separação), genealogia com cálculo de coeficiente de endogamia, financeiro, saúde do plantel e emissão de certificados/CRO com validação por QR Code.

A interface deve parecer um instrumento de trabalho de campo confiável — clara, densa em dados, calma e séria — nunca um "app fofinho de pet". Domínio: sisaves.tallpa.com.br
```

---

## CAMPO 2 — "Add fonts, logos and assets"
> Clique em **browse** e selecione os arquivos da pasta:
> `/Users/jhonicleyton/Documents/SisAves/identidade-visual/SisAves/`

Selecione estes (pode marcar vários de uma vez):
- `sisaves-brand-tokens.css`  ← o mais importante
- `sisaves-logo-horizontal.svg`
- `sisaves-logo-horizontal-white.svg`
- `sisaves-symbol-primary.svg`
- `sisaves-app-icon.svg`
- `LEIA-ME.txt`
- `site.webmanifest`

(Não precisa subir os PNGs todos — os SVGs bastam e são melhores.)

---

## CAMPO 3 — "Link code from GitHub" e "Link code from your computer"
> **Deixe em branco.** O sistema ainda não existe — é reconstrução do zero.

## CAMPO 4 — "Upload a .fig file"
> **Deixe em branco.** Não temos arquivo Figma.

---

## CAMPO 5 — "Any other notes?"
> Cole isto:

```
PALETA OFICIAL (usar exatamente, não inventar outras cores):
- Petróleo #0B5D5E — cor principal
- Azul profundo #163A45 — textos e contraste
- Âmbar #F2B544 — destaque pontual, só para o que exige ação humana agora
- Neve #F4F7F6 — fundos claros
- Grafite #1B2528 — textos de interface

TIPOGRAFIA:
- Montserrat SemiBold/Bold para marca e títulos
- Inter Regular/Medium para interface e texto corrido
- Fallback: Arial, sans-serif
- Dados numéricos (anilhas, percentuais, valores) sempre com tabular-nums

O SÍMBOLO: uma ave estilizada em voo cujo corpo e asa desenham a letra "S", traço contínuo e cheio, bico em âmbar, olho vazado. No logotipo horizontal, "Sis" fica em azul profundo e "Aves" em petróleo.

REGRAS DE USO DO LOGO:
- Área livre mínima ao redor = 1/4 da altura do símbolo
- Sobre fundo escuro ou petróleo, usar a versão branca
- Proibido: gradiente, sombra, contorno, rotação, distorção
- Abaixo de 32px usar só o app icon, nunca a assinatura horizontal

DIREÇÃO ESTÉTICA:
Interface de instrumento de trabalho, séria e legível. Não encher a tela de petróleo — usá-lo em textos, ícones, cabeçalhos e um bloco de destaque por tela; o resto respira sobre Neve/branco. O âmbar aparece com muita parcimônia.

Acessibilidade: contraste AA (4.5:1). Atenção: o âmbar #F2B544 NÃO passa em texto pequeno sobre branco — usar como fundo com texto escuro ou em elementos grandes. Alvos de toque mínimos de 44px. Precisa de tema claro E escuro (o criador usa de madrugada no galpão durante eclosões).

EVITAR: heróis com gradiente roxo-azul, card com barra colorida à esquerda em tudo, emoji como marcador de seção, tudo centralizado, cantos excessivamente arredondados, ilustração 3D de mascote.
```

---

# DEPOIS DE SALVAR O SETUP

O formulário acima é só o **contexto permanente da marca**. Agora sim, na conversa do Claude Design, cole o prompt grande do arquivo:

`prompt-claude-design.md`

Mas **pule as seções 1 (identidade) e o que já foi para as notas** — ou simplesmente cole o arquivo inteiro; repetir não atrapalha, o Claude Design vai cruzar com o design system cadastrado.

Se quiser começar mais leve (recomendado, para o primeiro canvas sair com qualidade), cole só isto como primeira mensagem:

```
Crie o canvas de design do SisAves começando pela FAIXA A — fundamentos:

A1. Guia de estilo (1400x1000): paleta com os 5 tokens (hex, nome e uso), escala tipográfica completa Montserrat/Inter (display, H1-H4, corpo, legenda, dado numérico), grid de espaçamento, raios de canto, elevações, e as cores semânticas derivadas (sucesso, atenção, crítico, informação) harmonizadas com o petróleo e distintas do âmbar de ação.

A2. Aplicação do logo (1400x800): assinatura horizontal sobre Neve, versão branca sobre petróleo, símbolo isolado, app icon, favicon 16/32px, demonstração da área livre de 1/4, e um quadro de "usos incorretos".

A3. Biblioteca de componentes (1400x1200): botões (primário petróleo, secundário contornado, terciário texto, destrutivo) nos estados normal/hover/foco/desabilitado; campos de formulário com rótulo, ajuda, erro e preenchido; a etiqueta de anilha como componente próprio (formato "SOV 1234 · 2026 · 0087"); os 6 chips de estado do ovo (Chocando, Verificar, Nascendo, Nascido, Anilhar, Separar) — sendo "Anilhar" o crítico, em âmbar; chip de sexo macho/fêmea; barra de coeficiente de endogamia; card de ave; linha de tabela; tabs; toast; modal; estado vazio; indicador offline/sincronizando; badge de notificação.

Tudo em português do Brasil, com conteúdo real do domínio — nada de lorem ipsum.
```

Depois que a Faixa A sair boa, peça a Faixa B (telas mobile), depois C (desktop) e D (documentos e landing). Assim cada faixa herda a qualidade da anterior.
