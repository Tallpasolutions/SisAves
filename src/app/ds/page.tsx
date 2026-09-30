"use client";

import { useState } from "react";
import {
  Bell,
  Calendar,
  CircleAlert,
  CircleCheck,
  Egg,
  Feather,
  Thermometer,
  Users,
} from "lucide-react";
import {
  Anilha,
  Badge,
  BirdCard,
  Button,
  EmptyState,
  Field,
  InbreedingMeter,
  Input,
  Modal,
  NotificationBadge,
  SexChip,
  SyncStatus,
  Table,
  TableRow,
  Tabs,
  Toast,
} from "@/components/ui";
import styles from "./page.module.css";

/**
 * Referência viva da biblioteca de componentes (artboard A3).
 *
 * Usa a cópia exata de docs/design/02-componentes.md para servir de conferência
 * contra as pranchas. Não é tela de produto — sai do app antes do lançamento.
 */
export default function DesignSystem() {
  const [aba, setAba] = useState("plantel");
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <main id="conteudo" className={styles.pagina}>
      <header className={styles.cabecalho}>
        <p className={styles.overline}>SisAves</p>
        <h1 className={styles.titulo}>Biblioteca de componentes</h1>
        <p className={styles.subtitulo}>
          Referência de implementação. Confira contra o artboard A3 em
          docs/design/artboards.
        </p>
      </header>

      <Secao titulo="Botões" nota="O rótulo é verbo. Ícone nunca substitui o rótulo na ação principal.">
        <div className={styles.linha}>
          <Button variant="primary">Registrar postura</Button>
          <Button variant="secondary">Ver ninhada</Button>
          <Button variant="ghost">Cancelar</Button>
          <Button variant="danger">Registrar óbito</Button>
        </div>
        <div className={styles.linha}>
          <Button variant="accent" iconeEsquerda={<Feather size={16} />}>
            Anilhar agora
          </Button>
          <Button variant="primary" disabled>
            Desabilitado
          </Button>
        </div>
        <div className={styles.linha}>
          <Button size="sm">Pequeno 32</Button>
          <Button size="md">Padrão 40</Button>
          <Button size="lg">Campo 48</Button>
        </div>
      </Secao>

      <Secao
        titulo="Etiqueta de anilha"
        nota="Identificador primário da ave. Nunca reformatar, abreviar ou quebrar em duas linhas."
      >
        <div className={styles.linha}>
          <Anilha dados={{ sigla: "SOV", criador: "1234", ano: 2026, numero: 87 }} />
          <Anilha
            dados={{ sigla: "SOV", criador: "1234", ano: 2026, numero: 87 }}
            tone="brand"
            size="lg"
          />
          <Anilha
            dados={{ sigla: "SOV", criador: "1234", ano: 2025, numero: 42 }}
            tone="quiet"
            size="sm"
          />
        </div>
        <div className={styles.linha}>
          <Anilha
            dados={{ sigla: "CAC", criador: "0198", ano: 2026, numero: 105 }}
            club="Clube Amigos do Coleira"
          />
          <Anilha dados={{}} />
        </div>
      </Secao>

      <Secao
        titulo="Os seis estados do ovo"
        nota="Só “Anilhar hoje” é âmbar: a janela tem dois dias e, perdida, a ave não pode ser registrada."
      >
        <div className={styles.linha}>
          <Badge tone="info" icon={<Thermometer size={13} />}>
            Chocando · dia 6
          </Badge>
          <Badge tone="neutro" icon={<Egg size={13} />}>
            Ovoscopia
          </Badge>
          <Badge tone="ok" icon={<CircleCheck size={13} />}>
            Eclosão · 21/03
          </Badge>
          <Badge tone="acao" icon={<Feather size={13} />}>
            Anilhar hoje
          </Badge>
          <Badge tone="neutro" icon={<Users size={13} />}>
            Separação · 24/04
          </Badge>
          <Badge tone="critico" icon={<CircleAlert size={13} />}>
            Perda · 2 ovos
          </Badge>
        </div>
        <div className={styles.linha}>
          <Badge tone="ok" dot size="sm">
            Plantel ativo
          </Badge>
          <Badge tone="neutro" dot size="sm">
            Vendido
          </Badge>
        </div>
      </Secao>

      <Secao titulo="Sexo" nota="Sem unicode de gênero. A cor nunca é o único sinal.">
        <div className={styles.linha}>
          <SexChip sexo="macho" />
          <SexChip sexo="femea" />
          <SexChip sexo="indefinido" />
          <SexChip sexo="macho" avatar />
          <SexChip sexo="femea" avatar />
        </div>
      </Secao>

      <Secao titulo="Campos" nota="Rótulo persistente. O erro substitui a ajuda e cita o dado exato.">
        <div className={styles.grade}>
          <Field label="Anilha da matriz" required>
            {({ id, descritoPor, invalido }) => (
              <Input
                id={id}
                aria-describedby={descritoPor}
                invalid={invalido}
                placeholder="COBP-25-04781"
                numeric
              />
            )}
          </Field>

          <Field
            label="Peso ao anilhamento"
            hint="Gramas, com uma decimal. Não arredondar."
          >
            {({ id, descritoPor, invalido }) => (
              <Input id={id} aria-describedby={descritoPor} invalid={invalido} numeric suffix="g" />
            )}
          </Field>

          <Field label="Código COBP" error="O código COBP-25-04781 já existe no plantel.">
            {({ id, descritoPor, invalido }) => (
              <Input
                id={id}
                aria-describedby={descritoPor}
                invalid={invalido}
                defaultValue="COBP-25-04781"
                numeric
              />
            )}
          </Field>

          <Field label="Data da postura">
            {({ id, descritoPor, invalido }) => (
              <Input
                id={id}
                aria-describedby={descritoPor}
                invalid={invalido}
                defaultValue="09/03/2026"
                numeric
                iconLeft={<Calendar size={16} />}
              />
            )}
          </Field>

          <Field label="Campo desabilitado">
            {({ id }) => <Input id={id} disabled defaultValue="Sem edição" />}
          </Field>

          <Field label="Campo grande (app de campo)">
            {({ id }) => <Input id={id} size="lg" placeholder="48px de altura" />}
          </Field>
        </div>
      </Secao>

      <Secao
        titulo="Coeficiente de endogamia"
        nota="6,25% é primo-primeiro; 12,5% é meio-irmão. Sempre com duas decimais."
      >
        <div className={styles.grade}>
          <div className={styles.cartao}>
            <InbreedingMeter value={3.13} />
          </div>
          <div className={styles.cartao}>
            <InbreedingMeter value={9.38} explicacao="Avós paternos em comum." />
          </div>
          <div className={styles.cartao}>
            <InbreedingMeter value={14.06} showScale />
          </div>
        </div>
      </Secao>

      <Secao titulo="Card de ave" nota="Sem barra colorida à esquerda — isso é exclusivo da linha de tabela.">
        <div className={styles.grade}>
          <BirdCard
            nome="Curió Tibiriçá"
            subtitulo="Curió · mutação clássica · reprodutor"
            sexo="macho"
            anilha={{ sigla: "SOV", criador: "1234", ano: 2024, numero: 10 }}
            status={
              <Badge tone="ok" dot size="sm">
                Plantel ativo
              </Badge>
            }
            dados={[
              { rotulo: "Peso", valor: "18,4 g" },
              { rotulo: "Ninhadas", valor: "6" },
              { rotulo: "Endogamia", valor: "3,13%", destaque: true },
            ]}
            onClick={() => undefined}
          />
          <BirdCard
            nome="Jandaia"
            subtitulo="Coleiro-papa-capim · Lutino · matriz"
            sexo="femea"
            anilha={{ sigla: "CAC", criador: "0198", ano: 2025, numero: 42 }}
            status={
              <Badge tone="neutro" dot size="sm">
                Emprestada
              </Badge>
            }
            dados={[
              { rotulo: "Peso", valor: "16,9 g" },
              { rotulo: "Ninhadas", valor: "3" },
              { rotulo: "Endogamia", valor: "9,38%", destaque: true },
            ]}
          />
        </div>
      </Secao>

      <Secao
        titulo="Linha de tabela"
        nota="A faixa de 3px é um dos dois únicos lugares com barra colorida à esquerda."
      >
        <Table colunas={["Ninhada", "Postura", "Ovos", "Situação"]}>
          <TableRow
            nome="Ninhada 04"
            data="09/03/2026"
            quantidade={5}
            situacao={
              <Badge tone="info" size="sm" icon={<Thermometer size={12} />}>
                Chocando
              </Badge>
            }
            onClick={() => undefined}
          />
          <TableRow
            nome="Ninhada 05"
            data="27/02/2026"
            quantidade={4}
            gravidade="atencao"
            situacao={
              <Badge tone="acao" size="sm" icon={<Feather size={12} />}>
                Anilhar
              </Badge>
            }
            onClick={() => undefined}
          />
          <TableRow
            nome="Ninhada 06"
            data="14/02/2026"
            quantidade={2}
            gravidade="critico"
            selecionada
            situacao={
              <Badge tone="critico" size="sm" icon={<CircleAlert size={12} />}>
                Perda
              </Badge>
            }
            onClick={() => undefined}
          />
        </Table>
      </Secao>

      <Secao titulo="Abas" nota="Contador só onde a contagem informa — “Saúde” não tem, de propósito.">
        <Tabs
          aria-label="Seções do criatório"
          value={aba}
          onChange={setAba}
          tabs={[
            { value: "plantel", label: "Plantel", count: 128 },
            { value: "ninhadas", label: "Ninhadas", count: 6 },
            { value: "casais", label: "Casais", count: 14 },
            { value: "saude", label: "Saúde" },
          ]}
        />
      </Secao>

      <Secao titulo="Toast" nota="Fato + consequência com data. Nunca “Tudo pronto!”.">
        <div className={styles.linha}>
          <Toast
            tone="ok"
            title="Postura registrada · Ninhada 04 · 5 ovos"
            description="Ovoscopia prevista para 17/03/2026."
          />
          <Toast
            tone="critico"
            title="Perda registrada · 2 ovos · 09/03"
            description="A ninhada 06 segue com 2 ovos em choco."
          />
        </div>
      </Secao>

      <Secao titulo="Diálogo" nota="O corpo diz a consequência real, não “Tem certeza?”.">
        <div className={styles.linha}>
          <Button variant="danger" onClick={() => setModalAberto(true)}>
            Registrar óbito
          </Button>
        </div>
        <Modal
          aberto={modalAberto}
          titulo="Registrar óbito"
          onFechar={() => setModalAberto(false)}
          acoes={
            <>
              <Button variant="ghost" size="sm" onClick={() => setModalAberto(false)}>
                Cancelar
              </Button>
              <Button variant="danger" size="sm" onClick={() => setModalAberto(false)}>
                Registrar óbito
              </Button>
            </>
          }
        >
          A ave sai do plantel ativo e permanece na genealogia.
          <Anilha dados={{ sigla: "SOV", criador: "1234", ano: 2024, numero: 10 }} tone="quiet" />
        </Modal>
      </Secao>

      <Secao titulo="Estado vazio" nota="Alinhado à esquerda, sem ilustração e sem emoji.">
        <EmptyState
          icon={<Egg size={28} />}
          title="Nenhuma ninhada ativa"
          description="Registre uma postura para acompanhar o ciclo do ovo até o anilhamento."
          acao={<Button>Registrar postura</Button>}
        />
      </Secao>

      <Secao
        titulo="Sincronização e notificação"
        nota="A cópia nunca sugere perda: o registro fica no aparelho até subir."
      >
        <div className={styles.linha}>
          <SyncStatus state="offline" />
          <SyncStatus state="pendente" pending={4} />
          <SyncStatus state="online" lastSync="hoje 07:42" />
          <SyncStatus state="pendente" pending={1} compact />
        </div>
        <div className={styles.linha}>
          <NotificationBadge count={3} rotulo="3 tarefas pendentes">
            <Button variant="secondary" aria-label="Notificações">
              <Bell size={18} />
            </Button>
          </NotificationBadge>
          <NotificationBadge count={128} rotulo="128 tarefas pendentes">
            <Button variant="secondary" aria-label="Notificações">
              <Bell size={18} />
            </Button>
          </NotificationBadge>
          <NotificationBadge dot rotulo="Há algo grave para ver">
            <Button variant="secondary" aria-label="Notificações">
              <Bell size={18} />
            </Button>
          </NotificationBadge>
        </div>
      </Secao>
    </main>
  );
}

function Secao({
  titulo,
  nota,
  children,
}: {
  titulo: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.secao}>
      <h2 className={styles.secaoTitulo}>{titulo}</h2>
      {nota ? <p className={styles.secaoNota}>{nota}</p> : null}
      <div className={styles.secaoCorpo}>{children}</div>
    </section>
  );
}
