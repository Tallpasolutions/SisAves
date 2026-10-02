"use client";

import { CircleAlert, TriangleAlert, WifiOff } from "lucide-react";
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ChangeEvent,
} from "react";
import { Button, Field, InbreedingMeter, Input, Select } from "@/components/ui";
import { SalvoNoAparelho } from "@/components/offline/SalvoNoAparelho";
import { useEnvioOffline } from "@/components/offline/useEnvioOffline";
import type { OpcaoProgenitor, OpcoesFormarCasal } from "@/lib/dados/cadastro";
import { descreverAve } from "@/lib/formato";
import { useErrosQueEnvelhecem } from "@/lib/formulario";
import {
  consultarEndogamia,
  formarCasal,
  type EstadoFormarCasal,
  type LeituraEndogamia,
} from "./acoes";
import styles from "./novo.module.css";

export function FormularioCasal({ opcoes }: { opcoes: OpcoesFormarCasal }) {
  const [estado, acao, enviando] = useActionState<EstadoFormarCasal, FormData>(
    formarCasal,
    {},
  );

  // Controlados pelo mesmo motivo da tela de cadastro: o React 19 reseta o
  // formulário quando a ação termina, inclusive em erro.
  const [machoId, setMachoId] = useState("");
  const [femeaId, setFemeaId] = useState("");
  const [gaiola, setGaiola] = useState("");
  const [inicio, setInicio] = useState(() => new Date().toISOString().slice(0, 10));
  const [observacoes, setObservacoes] = useState("");

  const macho = useMemo(
    () => opcoes.machos.find((p) => p.id === machoId) ?? null,
    [opcoes.machos, machoId],
  );
  const femea = useMemo(
    () => opcoes.femeas.find((p) => p.id === femeaId) ?? null,
    [opcoes.femeas, femeaId],
  );

  // A resposta carrega o par que a originou. Assim uma consulta lenta de um par
  // antigo não aparece como se fosse do par que está na tela agora.
  const chaveDoPar = machoId && femeaId ? `${machoId}:${femeaId}` : "";
  const [resposta, setResposta] = useState<{
    par: string;
    dados: LeituraEndogamia;
  } | null>(null);
  const [consultando, iniciarConsulta] = useTransition();

  /**
   * O coeficiente é buscado assim que o par fica completo — antes de confirmar,
   * nunca depois. É a decisão técnica central do criador, e um aviso que chega
   * na confirmação chega tarde.
   */
  useEffect(() => {
    if (!chaveDoPar) return;
    let atual = true;
    iniciarConsulta(async () => {
      const [m, f] = chaveDoPar.split(":");
      const dados = await consultarEndogamia(m, f);
      if (atual) setResposta({ par: chaveDoPar, dados });
    });
    return () => {
      atual = false;
    };
  }, [chaveDoPar]);

  const leitura = resposta?.par === chaveDoPar ? resposta.dados : null;

  const especiesDiferentes =
    macho?.especieId && femea?.especieId && macho.especieId !== femea.especieId;

  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const mudar =
    (campo: string, set: (v: string) => void) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      set(e.target.value);
      marcar(campo);
    };

  // O erro geral desta tela é sempre sobre o par. Se o criador trocou macho ou
  // fêmea, a frase passa a acusar um casal que não está mais selecionado.
  const [parEnviado, setParEnviado] = useState("");
  const erroGeral = chaveDoPar === parEnviado ? estado.erro : undefined;

  const numero = String(opcoes.proximoNumero).padStart(2, "0");

  const { id, aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "casal",
    resumo: () =>
      `Casal ${numero} · ${macho?.nome ?? "macho"} e ${femea?.nome ?? "fêmea"}`,
  });

  if (salvoNoAparelho) {
    return (
      <SalvoNoAparelho
        titulo={`Casal ${numero} salvo no aparelho · ${macho?.nome ?? "macho"} e ${femea?.nome ?? "fêmea"}`}
        consequencia={
          leitura?.valor !== null && leitura
            ? `Endogamia de ${leitura.valor.toFixed(2).replace(".", ",")}% será registrada na formação.`
            : "Só recebe postura depois que o registro subir."
        }
        voltarPara="/casais"
        rotuloVoltar="Voltar para os casais"
      />
    );
  }

  return (
    <form
      action={acao}
      onSubmit={(evento) => {
        enviar();
        setParEnviado(chaveDoPar);
        aoEnviar(evento);
      }}
      className={styles.formulario}
    >
      {/* Chave do casal gerada aqui: idempotência do reenvio da fila. */}
      <input type="hidden" name="casal_id" value={id} />
      {erroGeral ? (
        <p className={styles.alerta} role="alert">
          <span className={styles.alertaIcone}>
            <CircleAlert size={16} aria-hidden="true" />
          </span>
          {erroGeral}
        </p>
      ) : null}

      <fieldset className={styles.grupo}>
        <legend className={styles.grupoTitulo}>O par</legend>

        <Field label="Macho" required error={erro("macho_id")}>
          {({ id, descritoPor, invalido }) => (
            <Select
              id={id}
              name="macho_id"
              size="lg"
              value={machoId}
              onChange={mudar("macho_id", setMachoId)}
              aria-describedby={descritoPor}
              invalid={invalido}
              required
            >
              <option value="">Escolha o macho</option>
              {opcoes.machos.map((p) => (
                <option key={p.id} value={p.id}>
                  {descreverAve(p)}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Fêmea" required error={erro("femea_id")}>
          {({ id, descritoPor, invalido }) => (
            <Select
              id={id}
              name="femea_id"
              size="lg"
              value={femeaId}
              onChange={mudar("femea_id", setFemeaId)}
              aria-describedby={descritoPor}
              invalid={invalido}
              required
            >
              <option value="">Escolha a fêmea</option>
              {opcoes.femeas.map((p) => (
                <option key={p.id} value={p.id}>
                  {descreverAve(p)}
                </option>
              ))}
            </Select>
          )}
        </Field>

        {especiesDiferentes ? (
          <p className={styles.atencao} role="status">
            <span className={styles.atencaoIcone}>
              <TriangleAlert size={16} aria-hidden="true" />
            </span>
            {macho?.especie} e {femea?.especie} são espécies diferentes. Os
            prazos do ciclo do ovo seguirão os da espécie do macho.
          </p>
        ) : null}
      </fieldset>

      <Endogamia
        par={macho && femea ? { macho, femea } : null}
        leitura={leitura}
        consultando={consultando}
      />

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
              onChange={mudar("vigencia_inicio", setInicio)}
              aria-describedby={descritoPor}
              invalid={invalido}
              required
            />
          )}
        </Field>

        <Field
          label="Gaiola"
          hint="Opcional. Onde o casal está no galpão."
          error={erro("gaiola")}
        >
          {({ id, descritoPor, invalido }) => (
            <Input
              id={id}
              name="gaiola"
              size="lg"
              autoComplete="off"
              placeholder="Ex.: A-12"
              value={gaiola}
              onChange={mudar("gaiola", setGaiola)}
              aria-describedby={descritoPor}
              invalid={invalido}
            />
          )}
        </Field>
      </fieldset>

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
            onChange={mudar("observacoes", setObservacoes)}
            aria-describedby={descritoPor}
            invalid={invalido}
          />
        )}
      </Field>

      <div className={styles.acaoFixa}>
        <div className={styles.acaoFixaInterno}>
          <Button type="submit" size="lg" bloco disabled={enviando}>
            {enviando ? "Formando…" : `Formar casal ${numero}`}
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
 * O coeficiente, no lugar em que ele ainda muda a decisão.
 *
 * Enquanto o par não está completo a seção diz o que falta, em vez de sumir —
 * assim o criador sabe que o número vem, e não que ele não existe.
 */
function Endogamia({
  par,
  leitura,
  consultando,
}: {
  par: { macho: OpcaoProgenitor; femea: OpcaoProgenitor } | null;
  leitura: LeituraEndogamia | null;
  consultando: boolean;
}) {
  return (
    <section className={styles.grupo} aria-live="polite">
      <h2 className={styles.grupoTitulo}>Coeficiente de endogamia</h2>

      <div className={styles.cartao}>
        {!par ? (
          <p className={styles.nota}>
            Escolha macho e fêmea para ver o parentesco entre os dois.
          </p>
        ) : consultando && leitura === null ? (
          <p className={styles.nota}>Calculando sobre a árvore genealógica…</p>
        ) : leitura?.valor !== null && leitura !== null ? (
          <InbreedingMeter
            value={leitura.valor}
            showScale
            explicacao={
              leitura.explicacao ??
              "Sem ancestrais em comum nas gerações registradas."
            }
          />
        ) : (
          <p className={styles.nota}>
            Não foi possível calcular agora. O casal pode ser formado assim
            mesmo, e o coeficiente aparece na ficha dele.
          </p>
        )}
      </div>
    </section>
  );
}
