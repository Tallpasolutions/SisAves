"use client";

import {
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
  Button,
  Field,
  InbreedingMeter,
  Input,
  SexChip,
} from "@/components/ui";
import styles from "./page.module.css";

/**
 * Referência viva da biblioteca de componentes (artboard A3).
 *
 * Usa a cópia exata de docs/design/02-componentes.md para servir de conferência
 * contra as pranchas. Não é tela de produto — sai do app antes do lançamento.
 */
export default function DesignSystem() {
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
