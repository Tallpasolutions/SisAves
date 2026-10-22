import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Award,
  Dna,
  Egg,
  FileSpreadsheet,
  Minus,
  QrCode,
  Wallet,
  WifiOff,
} from "lucide-react";
import type { ReactNode } from "react";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { CADASTRO_ABERTO } from "@/lib/portas";
import { PIX_ATIVO } from "@/lib/mercadopago/ofertas";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  // `absolute` porque o layout raiz acrescenta "· SisAves" a todo título, e
  // numa aba isso sairia "SisAves — … · SisAves". A raiz é a única página em
  // que o nome do produto já está no começo.
  title: {
    absolute: "SisAves — gestão de criatórios de aves ornamentais",
  },
  description:
    "Plantel, casais, ciclo do ovo, genealogia com coeficiente de endogamia, " +
    "financeiro e certificado com QR Code. Funciona no galpão, sem sinal.",
  alternates: { canonical: "/" },
};

/**
 * A landing (D3 do handoff).
 *
 * Tom profissional e direto: o público é criador experiente. Nenhuma palavra de
 * startup, nenhum gradiente, nenhuma ilustração.
 *
 * **Duas seções do desenho não foram construídas, de propósito:** a faixa com
 * "1.240 criadores · 86 mil aves · 19 mil CRO" e os três depoimentos de
 * criadores com nome e cidade. São marcadores de posição do artboard, e
 * publicá-los seria estatística e depoimento fabricados numa página de venda.
 * O lugar deles está reservado — entram quando houver número real e criador que
 * autorize o nome. Até lá, a prova é o que o produto faz, que é verificável.
 */
export default async function Landing() {
  // Criador que já tem conta não precisa ser convencido: vai direto ao galpão.
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/hoje");

  return (
    <div className={styles.pagina}>
      <Navegacao />
      <main id="conteudo">
        <Hero />
        <Funcionalidades />
        <Demonstracao />
        <Planos />
        <Perguntas />
        <ChamadaFinal />
      </main>
      <Rodape />
    </div>
  );
}

/* --- 1 · Navegação ------------------------------------------------------ */
function Navegacao() {
  return (
    <header className={styles.navegacao}>
      <div className={styles.navegacaoInterna}>
        <Link href="/" className={styles.marca} aria-label="SisAves, página inicial">
          <Image
            src="/brand/sisaves-logo-horizontal.svg"
            alt="SisAves"
            width={132}
            height={32}
            priority
          />
        </Link>

        <nav className={styles.links} aria-label="Seções desta página">
          <a href="#funcionalidades">O que faz</a>
          <a href="#demonstracao">No galpão</a>
          <a href="#planos">Preço</a>
          <a href="#perguntas">Perguntas</a>
        </nav>

        <div className={styles.navegacaoAcoes}>
          <Link href="/entrar" className={styles.botaoTerciario}>
            Entrar
          </Link>
          {CADASTRO_ABERTO ? (
            <Link href="/cadastrar" className={styles.botaoAmbar}>
              Testar 5 dias
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

/* --- 2 · Hero ------------------------------------------------------------ */
function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroInterno}>
        <div className={styles.heroTexto}>
          <p className={styles.pilula}>
            <WifiOff size={14} aria-hidden="true" />
            Funciona no galpão, sem sinal
          </p>

          <h1 className={styles.heroTitulo}>
            A genealogia do seu plantel, registrada como deve ser
          </h1>

          <p className={styles.heroParagrafo}>
            Anilha oficial de clube, ninhada acompanhada do choco à separação,
            ovoscopia na data certa, coeficiente de endogamia antes de formar o
            casal e certificado com QR Code que o comprador confere na hora.
          </p>

          <div className={styles.heroAcoes}>
            {CADASTRO_ABERTO ? (
              <Link href="/cadastrar" className={styles.botaoAmbarGrande}>
                Testar 5 dias
              </Link>
            ) : (
              <Link href="/entrar" className={styles.botaoAmbarGrande}>
                Entrar
              </Link>
            )}
            <a href="#demonstracao" className={styles.botaoClaro}>
              Ver no celular
            </a>
          </div>

          <p className={styles.heroNota}>
            Sem cartão para testar. O plantel continua seu, assinando ou não.
          </p>
        </div>

        {/*
         * O artboard pede foto do criador usando o app. O contrato manda foto
         * real do plantel enviada pelo criador — não banco de imagens, não
         * ilustração. Enquanto ela não existe, o espaço mostra o que o produto
         * de fato devolve, que é mais honesto que um avatar genérico.
         */}
        <aside className={styles.heroPeca} aria-label="O certificado emitido pelo SisAves">
          <div className={styles.pecaCabecalho}>
            <Award size={18} aria-hidden="true" />
            <span>Certificado de Registro de Origem</span>
          </div>
          <dl className={styles.pecaDados}>
            <PecaDado rotulo="Ave" valor="Tibiriçá" />
            <PecaDado rotulo="Anilha" valor="COF 1234 · 2026 · 0087" numerico />
            <PecaDado rotulo="Espécie" valor="Curió" />
            <PecaDado rotulo="Endogamia" valor="3,13%" numerico />
          </dl>
          <div className={styles.pecaRodape}>
            <QrCode size={32} aria-hidden="true" />
            <span>
              Quem recebe a ave escaneia e confere a genealogia inteira, sem
              precisar de conta.
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}

function PecaDado({
  rotulo,
  valor,
  numerico = false,
}: {
  rotulo: string;
  valor: string;
  numerico?: boolean;
}) {
  return (
    <div className={styles.pecaLinha}>
      <dt>{rotulo}</dt>
      <dd className={numerico ? styles.numerico : undefined}>{valor}</dd>
    </div>
  );
}

/* --- 4 · Funcionalidades ------------------------------------------------- */
function Funcionalidades() {
  return (
    <section className={styles.secao} id="funcionalidades">
      <div className={styles.secaoInterna}>
        <h2 className={styles.secaoTitulo}>O que o SisAves faz</h2>
        <p className={styles.secaoResumo}>
          O ciclo inteiro do criatório, do ovo ao certificado. Nada de planilha
          paralela.
        </p>

        <div className={styles.grade}>
          <Cartao
            Icone={Dna}
            titulo="Banco genético automático"
            texto="Cadastre pai e mãe e a árvore se monta sozinha. O coeficiente de endogamia de Wright aparece antes de você formar o casal, não depois da ninhada."
            dado="4 gerações · 3,13%"
          />
          <Cartao
            Icone={Award}
            titulo="Certificado com QR Code"
            texto="Certificado, árvore de quatro gerações e crachá de gaiola, prontos para imprimir em A4. O QR leva a uma página pública que mostra a genealogia congelada na emissão."
            dado="CRO Nº 0087"
          />
          <Cartao
            Icone={Egg}
            titulo="Ciclo do ovo por prazo"
            texto="Cada espécie tem os seus dias de choco, ovoscopia, anilhamento e separação. O painel do dia mostra o que vence hoje, e a janela da anilha não passa batido."
            dado="Anilhar hoje"
            acao
          />
          <Cartao
            Icone={Wallet}
            titulo="Financeiro do criatório"
            texto="Receita de venda, despesa de ração e medicamento, saldo por mês. Com vínculo opcional à ave, para você saber quanto custou cada filhote."
            dado="R$ 1.240,00 em setembro"
          />
          <Cartao
            Icone={WifiOff}
            titulo="Funciona sem sinal"
            texto="O galpão não tem rede. O registro é gravado no aparelho e sincroniza quando a rede volta, com a contagem do que está pendente sempre visível na tela."
            dado="Salvo no aparelho"
          />
          <Cartao
            Icone={FileSpreadsheet}
            titulo="Traga a sua planilha"
            texto="Se o seu plantel está em Excel ou em outro sistema, a importação é feita junto com você, preservando a validade dos QR Codes já impressos."
            dado="Importação acompanhada"
            destaque
          />
        </div>
      </div>
    </section>
  );
}

function Cartao({
  Icone,
  titulo,
  texto,
  dado,
  acao = false,
  destaque = false,
}: {
  Icone: typeof Dna;
  titulo: string;
  texto: string;
  dado: string;
  /** O único bloco de prazo da página, e por isso o único âmbar daqui. */
  acao?: boolean;
  destaque?: boolean;
}) {
  return (
    <article
      className={`${styles.cartao} ${destaque ? styles.cartaoDestaque : ""}`}
    >
      <span className={`${styles.cartaoIcone} ${acao ? styles.cartaoIconeAcao : ""}`}>
        <Icone size={20} aria-hidden="true" />
      </span>
      <h3 className={styles.cartaoTitulo}>{titulo}</h3>
      <p className={styles.cartaoTexto}>{texto}</p>
      <span className={`${styles.cartaoDado} ${acao ? styles.cartaoDadoAcao : ""}`}>
        {dado}
      </span>
    </article>
  );
}

/* --- 5 · Demonstração ---------------------------------------------------- */
function Demonstracao() {
  return (
    <section className={styles.secao} id="demonstracao">
      <div className={styles.secaoInterna}>
        <h2 className={styles.secaoTitulo}>Operação no galpão</h2>
        <p className={styles.secaoResumo}>
          As telas de campo foram dimensionadas para o uso em pé, com luva, e
          funcionam sem rede.
        </p>

        <div className={styles.demonstracao}>
          <div className={styles.provas}>
            <Prova
              titulo="Alvo de 48 pixels"
              texto="Botão que se acerta com luva, e não com a ponta da unha. A ação principal de cada tela é uma só."
            />
            <Prova
              titulo="Anilha legível a meio metro"
              texto="O código oficial em fonte tabular, do tamanho que se lê com o celular apoiado no viveiro."
            />
            <Prova
              titulo="Três toques, offline"
              texto="Registrar a postura são três toques e um teclado numérico de 52 pixels. Sem rede, grava no aparelho e avisa."
            />
          </div>

          <div className={styles.telas}>
            <Captura
              arquivo="hoje"
              titulo="Painel do dia"
              descricao="A tela Hoje do SisAves, com três ninhadas na janela de anilhamento e as tarefas do dia em ordem de urgência."
            />
            <Captura
              arquivo="ovos"
              titulo="Ciclo do ovo"
              descricao="A tela de ninhadas do SisAves, com o estado de cada postura e o prazo de anilhamento de cada uma."
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Prova({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className={styles.prova}>
      <h3 className={styles.provaTitulo}>{titulo}</h3>
      <p className={styles.provaTexto}>{texto}</p>
    </div>
  );
}

/**
 * As molduras do artboard, com captura real do produto.
 *
 * São telas do SisAves em execução, tiradas em 375 × 812, não maquete: o que
 * aparece aqui é exatamente o que o criador recebe. O `alt` descreve o que a
 * imagem mostra, porque para quem usa leitor de tela a prova precisa chegar em
 * palavras.
 */
function Captura({
  arquivo,
  titulo,
  descricao,
}: {
  arquivo: string;
  titulo: string;
  descricao: string;
}) {
  return (
    <figure className={styles.tela}>
      <Image
        src={`/capturas/${arquivo}.png`}
        alt={descricao}
        width={420}
        height={900}
        className={styles.telaImagem}
        sizes="(max-width: 1023px) 45vw, 300px"
      />
      <figcaption className={styles.telaRotulo}>{titulo}</figcaption>
    </figure>
  );
}

/* --- 7 · Planos ---------------------------------------------------------- */
function Planos() {
  return (
    <section className={styles.secao} id="planos">
      <div className={styles.secaoInterna}>
        <h2 className={styles.secaoTitulo}>Um plano só</h2>
        <p className={styles.secaoResumo}>
          Sem degrau, sem recurso escondido atrás de plano melhor. Tudo o que
          está nesta página está incluído.
        </p>

        <div className={styles.planos}>
          <article className={styles.plano}>
            <span className={styles.planoRotulo}>Assinatura anual</span>
            <p className={styles.planoValor}>
              R$ 290<span className={styles.planoPeriodo}>,00 por ano</span>
            </p>
            {/*
             * O preço do PIX só aparece quando a conta consegue receber por
             * PIX. Anunciar um desconto que o checkout não oferece seria
             * prometer o que não se cumpre na página seguinte.
             */}
            {PIX_ATIVO ? (
              <p className={styles.planoPix}>ou R$ 270,00 à vista no PIX</p>
            ) : null}

            <ul className={styles.planoLista}>
              <li>Plantel, casais e ciclo do ovo sem limite de aves</li>
              <li>Genealogia com coeficiente de endogamia</li>
              <li>Certificado, árvore e crachá com QR Code</li>
              <li>Financeiro e saúde do plantel</li>
              <li>Funciona offline, no celular e no computador</li>
              </ul>

            {CADASTRO_ABERTO ? (
              <Link href="/cadastrar" className={styles.botaoPetroleoGrande}>
                Testar 5 dias
              </Link>
            ) : (
              <Link href="/entrar" className={styles.botaoPetroleoGrande}>
                Entrar
              </Link>
            )}
            <p className={styles.planoNota}>
              Cinco dias para testar, sem cartão.
            </p>
          </article>

          {/*
           * A honestidade do artboard: dizer o que NÃO tem, com `Minus`, em vez
           * de omitir. Como o plano é único, o que falta é o que ainda não
           * existe no produto — e prometer o que não está pronto é pior que
           * não prometer.
           */}
          <aside className={styles.planoFalta}>
            <h3 className={styles.planoFaltaTitulo}>O que ainda não tem</h3>
            <ul className={styles.planoFaltaLista}>
              <li>
                <Minus size={16} aria-hidden="true" />
                Aplicativo nas lojas. O SisAves roda no navegador e se instala
                na tela inicial do celular.
              </li>
              <li>
                <Minus size={16} aria-hidden="true" />
                Notificação por push. Os prazos aparecem no painel do dia.
              </li>
              <li>
                <Minus size={16} aria-hidden="true" />
                Leitura de anilha por câmera.
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}

/* --- 8 · Perguntas ------------------------------------------------------- */
function Perguntas() {
  return (
    <section className={styles.secao} id="perguntas">
      <div className={styles.secaoInterna}>
        <h2 className={styles.secaoTitulo}>Perguntas</h2>

        <div className={styles.perguntas}>
          <Pergunta pergunta="O certificado do SisAves tem valor legal?">
            <strong>Não substitui a documentação ambiental.</strong> O CRO é um
            documento de origem e genealogia emitido pelo criatório: prova o que
            o criador registrou, com data, e deixa isso conferível por QR Code.
            A exigência do IBAMA e do seu clube continua sendo sua, exatamente
            como é hoje.
          </Pergunta>

          <Pergunta pergunta="Se eu cancelar, perco os meus dados?">
            Não. Ao vencer, a <strong>leitura continua inteira</strong>:
            plantel, genealogia e certificados já emitidos seguem acessíveis
            para consultar e imprimir. O que para é o registro de dados novos. A
            exportação funciona inclusive depois do cancelamento.
          </Pergunta>

          <Pergunta pergunta="Funciona mesmo sem internet no galpão?">
            Funciona. O registro é gravado no aparelho e sincroniza quando a rede
            volta, com a contagem do que está pendente visível na tela. A
            mensagem é <em>Offline, salvo no aparelho</em>, nunca{" "}
            <em>tente de novo mais tarde</em>.
          </Pergunta>

          <Pergunta pergunta="Como trago o plantel que já tenho?">
            A importação é feita junto com você, a partir da sua planilha ou do
            sistema atual. Se você já entregou certificados com QR Code
            impresso,{" "}
            <strong>esses códigos continuam validando</strong>. É requisito da
            migração, não um detalhe.
          </Pergunta>

          <Pergunta pergunta="Serve para qual espécie?">
            Qualquer ave ornamental anilhada por clube: canário, curió, bicudo,
            agapornis, diamante de Gould, calopsita, trinca-ferro, sabiá. Os
            prazos de choco, ovoscopia e anilhamento são por espécie, e você
            ajusta os do seu criatório.
          </Pergunta>
        </div>
      </div>
    </section>
  );
}

function Pergunta({
  pergunta,
  children,
}: {
  pergunta: string;
  children: ReactNode;
}) {
  return (
    <details className={styles.pergunta}>
      <summary className={styles.perguntaTitulo}>{pergunta}</summary>
      <div className={styles.perguntaResposta}>{children}</div>
    </details>
  );
}

/* --- 9 · Chamada final e rodapé ------------------------------------------ */
function ChamadaFinal() {
  return (
    <section className={styles.chamada}>
      <div className={styles.chamadaInterna}>
        <h2 className={styles.chamadaTitulo}>
          Comece pela próxima ninhada
        </h2>
        <p className={styles.chamadaTexto}>
          Cadastre as espécies que você cria, os seus casais, e deixe o SisAves
          contar os prazos.
        </p>
        {CADASTRO_ABERTO ? (
          <Link href="/cadastrar" className={styles.botaoAmbarGrande}>
            Testar 5 dias
          </Link>
        ) : (
          <Link href="/entrar" className={styles.botaoAmbarGrande}>
            Entrar
          </Link>
        )}
      </div>
    </section>
  );
}

function Rodape() {
  return (
    <footer className={styles.rodape}>
      <div className={styles.rodapeInterno}>
        <div className={styles.rodapeColuna}>
          <Image
            src="/brand/sisaves-logo-horizontal-white.svg"
            alt="SisAves"
            width={132}
            height={32}
          />
          <p className={styles.rodapeTexto}>
            Gestão de criatórios de aves ornamentais.
          </p>
        </div>

        <div className={styles.rodapeColuna}>
          <h2 className={styles.rodapeTitulo}>Produto</h2>
          <a href="#funcionalidades">O que faz</a>
          <a href="#demonstracao">No galpão</a>
          <a href="#planos">Preço</a>
        </div>

        <div className={styles.rodapeColuna}>
          <h2 className={styles.rodapeTitulo}>Conta</h2>
          <Link href="/entrar">Entrar</Link>
          {CADASTRO_ABERTO ? <Link href="/cadastrar">Criar conta</Link> : null}
          <Link href="/recuperar-senha">Esqueci a senha</Link>
        </div>

        <div className={styles.rodapeColuna}>
          <h2 className={styles.rodapeTitulo}>Validação</h2>
          <p className={styles.rodapeTexto}>
            Recebeu uma ave com certificado? Escaneie o QR Code do documento para
            conferir a genealogia. Não é preciso ter conta.
          </p>
        </div>
      </div>

      <p className={styles.rodapeAssinatura}>
        SisAves · Tallpa Solutions · {new Date().getFullYear()}
      </p>
    </footer>
  );
}
