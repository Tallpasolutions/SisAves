"use client";

import { CircleAlert, TriangleAlert, WifiOff } from "lucide-react";
import { useActionState, useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { SalvoNoAparelho } from "@/components/offline/SalvoNoAparelho";
import { useEnvioOffline } from "@/components/offline/useEnvioOffline";
import type { CasalDetalhe } from "@/lib/dados/casais";
import { descreverAve, formatarData } from "@/lib/formato";
import { useErrosQueEnvelhecem } from "@/lib/formulario";
import { editarCasal, type EstadoEdicaoCasal } from "./acoes";
import styles from "./editar.module.css";

export function FormularioCasal({ casal }: { casal: CasalDetalhe }) {
  const [estado, acao, enviando] = useActionState<EstadoEdicaoCasal, FormData>(
    editarCasal,
    {},
  );
  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const [gaiola, setGaiola] = useState(casal.gaiola ?? "");
  const [observacoes, setObservacoes] = useState(casal.observacoes ?? "");
  const [inicio, setInicio] = useState(casal.vigenciaInicio);
  const [fim, setFim] = useState(casal.vigenciaFim ?? "");

  const numero = String(casal.numero).padStart(2, "0");
  const encerrando = fim !== "" && casal.vigenciaFim === null;

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "edicao-casal",
    resumo: () => `Edição de casal · Casal ${numero}`,
  });

  if (salvoNoAparelho) {
    return (
      <SalvoNoAparelho
        titulo={`Alterações salvas no aparelho · Casal ${numero}`}
        consequencia="A ficha passa a mostrar os dados novos assim que o registro subir."
        voltarPara={`/casais/${casal.id}`}
        rotuloVoltar="Voltar para o casal"
      />
    );
  }

  return (
    <form
      action={acao}
      onSubmit={(evento) => {
        enviar();
        aoEnviar(evento);
      }}
      className={styles.formulario}
    >
      <input type="hidden" name="casal_id" value={casal.id} />

      {estado.erro ? (
        <p className={styles.alerta} role="alert">
          <span className={styles.alertaIcone}>
            <CircleAlert size={16} aria-hidden="true" />
          </span>
          {estado.erro}
        </p>
      ) : null}

      {/* O par aparece, mas não se edita: trocar uma das aves deixaria as
          ninhadas já registradas penduradas num par que nunca as gerou. */}
      <section className={styles.par}>
        <h2 className={styles.grupoTitulo}>O par</h2>
        <p className={styles.parLinha}>
          {casal.macho ? descreverAve(casal.macho) : "Macho não informado"}
        </p>
        <p className={styles.parLinha}>
          {casal.femea ? descreverAve(casal.femea) : "Fêmea não informada"}
        </p>
        <p className={styles.grupoNota}>
          O par não se edita. Um casal com outra ave é um casal novo — as
          ninhadas deste aqui pertencem a esta dupla.
        </p>
      </section>

      <fieldset className={styles.grupo}>
        <legend className={styles.grupoTitulo}>Onde e como</legend>

        <Field label="Gaiola" hint="Opcional. Onde o casal está no galpão." error={erro("gaiola")}>
          {({ id, descritoPor, invalido }) => (
            <Input
              id={id}
              name="gaiola"
              size="lg"
              autoComplete="off"
              value={gaiola}
              onChange={(e) => {
                setGaiola(e.target.value);
                marcar("gaiola");
              }}
              aria-describedby={descritoPor}
              invalid={invalido}
            />
          )}
        </Field>

        <Field
          label="Observações"
          hint="Opcional. Ex.: segunda temporada juntos, fêmea de postura tardia."
          error={erro("observacoes")}
        >
          {({ id, descritoPor, invalido }) => (
            <Input
              id={id}
              name="observacoes"
              size="lg"
              value={observacoes}
              onChange={(e) => {
                setObservacoes(e.target.value);
                marcar("observacoes");
              }}
              aria-describedby={descritoPor}
              invalid={invalido}
            />
          )}
        </Field>
      </fieldset>

      <fieldset className={styles.grupo}>
        <legend className={styles.grupoTitulo}>Vigência</legend>

        <Field
          label="Formado em"
          required
          hint="Postura anterior a esta data não pode ser lançada no casal."
          error={erro("vigencia_inicio")}
        >
          {({ id, descritoPor, invalido }) => (
            <Input
              id={id}
              name="vigencia_inicio"
              type="date"
              size="lg"
              numeric
              max={new Date().toISOString().slice(0, 10)}
              value={inicio}
              onChange={(e) => {
                setInicio(e.target.value);
                marcar("vigencia_inicio");
              }}
              aria-describedby={descritoPor}
              invalid={invalido}
              required
            />
          )}
        </Field>

        <Field
          label="Encerrado em"
          hint="Em branco, o casal segue vigente e aceita postura nova."
          error={erro("vigencia_fim")}
        >
          {({ id, descritoPor, invalido }) => (
            <Input
              id={id}
              name="vigencia_fim"
              type="date"
              size="lg"
              numeric
              min={inicio || undefined}
              max={new Date().toISOString().slice(0, 10)}
              value={fim}
              onChange={(e) => {
                setFim(e.target.value);
                marcar("vigencia_fim");
              }}
              aria-describedby={descritoPor}
              invalid={invalido}
            />
          )}
        </Field>

        {/* O que o encerramento faz, dito antes de confirmar. */}
        {encerrando ? (
          <p className={styles.consequencia}>
            <TriangleAlert size={16} aria-hidden="true" />
            <span>
              O casal {numero} sai da lista de casais ativos em{" "}
              {formatarData(fim)} e deixa de aceitar postura.{" "}
              {historico(casal.ninhadas.length)}
            </span>
          </p>
        ) : null}
      </fieldset>

      <div className={styles.acaoFixa}>
        <div className={styles.acaoFixaInterno}>
          <Button type="submit" size="lg" bloco disabled={enviando}>
            {enviando
              ? "Salvando…"
              : encerrando
                ? `Encerrar casal ${numero}`
                : "Salvar alterações"}
          </Button>
          {!online ? (
            <span className={styles.aviso}>
              <WifiOff size={14} aria-hidden="true" />
              Offline — será salvo no aparelho
            </span>
          ) : null}
        </div>
      </div>
    </form>
  );
}

/**
 * O que acontece com o que já foi registrado.
 *
 * A frase se escreve inteira em vez de compor "As {n} ninhada(s)": compondo,
 * saía "As 1 ninhada já registradas" no caso mais comum, que é o casal com uma
 * ninhada só.
 */
function historico(ninhadas: number): string {
  if (ninhadas === 0) return "As aves seguem no plantel.";
  if (ninhadas === 1) {
    return "A ninhada já registrada fica no histórico, e as aves seguem no plantel.";
  }
  return `As ${ninhadas} ninhadas já registradas ficam no histórico, e as aves seguem no plantel.`;
}
