"use client";

import { CircleAlert, WifiOff } from "lucide-react";
import { useActionState, useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";
import { useEnvioOffline } from "@/components/offline/useEnvioOffline";
import type { DadosCriatorio, OpcaoClube } from "@/lib/dados/configuracoes";
import { useErrosQueEnvelhecem } from "@/lib/formulario";
import { salvarCriatorio, type EstadoConfiguracoes } from "./acoes";
import styles from "./configuracoes.module.css";

export function FormularioCriatorio({
  criatorio,
  clubes,
}: {
  criatorio: DadosCriatorio;
  clubes: OpcaoClube[];
}) {
  const [estado, acao, enviando] = useActionState<EstadoConfiguracoes, FormData>(
    salvarCriatorio,
    {},
  );
  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const [campos, setCampos] = useState({
    nome: criatorio.nome,
    clube_id: criatorio.clubeId ?? "",
    nro_criador: criatorio.nroCriador ?? "",
    registro_ibama: criatorio.registroIbama ?? "",
    cidade: criatorio.cidade ?? "",
    uf: criatorio.uf ?? "",
    instagram: criatorio.instagram ?? "",
    whatsapp: criatorio.whatsapp ?? "",
  });

  /*
   * O contato nas peças impressas.
   *
   * Vai no papel que acompanha a ave vendida, para o comprador reencontrar
   * quem a criou — e NUNCA na página pública do QR, que prova a ave e não
   * apresenta o vendedor. Por ser dado pessoal num papel que circula, quem
   * decide é o criador.
   */
  const [contatoNoDocumento, setContatoNoDocumento] = useState(
    criatorio.contatoNoDocumento,
  );

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "criatorio",
    resumo: () => `Configurações · ${campos.nome}`,
  });

  const mudar = (campo: keyof typeof campos) => (valor: string) => {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
    marcar(campo);
  };

  if (salvoNoAparelho) {
    return (
      <p className={styles.nota}>
        <WifiOff size={14} aria-hidden="true" />
        Salvo no aparelho. Os dados sobem quando o sinal voltar.
      </p>
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
      {estado.erro ? (
        <p className={styles.alerta} role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          {estado.erro}
        </p>
      ) : null}

      <fieldset className={styles.grupo}>
        <legend className={styles.grupoTitulo}>O criatório</legend>

        <Field label="Nome" required error={erro("nome")}>
          {({ id, descritoPor, invalido }) => (
            <Input
              id={id}
              name="nome"
              size="lg"
              autoComplete="off"
              value={campos.nome}
              onChange={(e) => mudar("nome")(e.target.value)}
              aria-describedby={descritoPor}
              invalid={invalido}
              required
            />
          )}
        </Field>

        <div className={styles.linhaDupla}>
          <Field label="Cidade" error={erro("cidade")}>
            {({ id, descritoPor, invalido }) => (
              <Input
                id={id}
                name="cidade"
                size="lg"
                autoComplete="off"
                value={campos.cidade}
                onChange={(e) => mudar("cidade")(e.target.value)}
                aria-describedby={descritoPor}
                invalid={invalido}
              />
            )}
          </Field>

          <Field label="UF" error={erro("uf")}>
            {({ id, descritoPor, invalido }) => (
              <Input
                id={id}
                name="uf"
                size="lg"
                maxLength={2}
                autoComplete="off"
                value={campos.uf}
                onChange={(e) => mudar("uf")(e.target.value.toUpperCase())}
                aria-describedby={descritoPor}
                invalid={invalido}
              />
            )}
          </Field>
        </div>
      </fieldset>

      <fieldset className={styles.grupo}>
        <legend className={styles.grupoTitulo}>Registro oficial</legend>
        <p className={styles.grupoNota}>
          Estes três saem impressos no cabeçalho do CRO. É o que identifica o
          criatório para quem recebe o certificado.
        </p>

        <Field label="Clube" error={erro("clube_id")}>
          {({ id, descritoPor, invalido }) => (
            <Select
              id={id}
              name="clube_id"
              size="lg"
              value={campos.clube_id}
              onChange={(e) => mudar("clube_id")(e.target.value)}
              aria-describedby={descritoPor}
              invalid={invalido}
            >
              <option value="">Sem clube</option>
              {clubes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.sigla} · {c.nome}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <div className={styles.linhaDupla}>
          <Field
            label="Nº de criador"
            hint="A sua matrícula no clube."
            error={erro("nro_criador")}
          >
            {({ id, descritoPor, invalido }) => (
              <Input
                id={id}
                name="nro_criador"
                size="lg"
                numeric
                autoComplete="off"
                value={campos.nro_criador}
                onChange={(e) => mudar("nro_criador")(e.target.value)}
                aria-describedby={descritoPor}
                invalid={invalido}
              />
            )}
          </Field>

          <Field label="Registro IBAMA" error={erro("registro_ibama")}>
            {({ id, descritoPor, invalido }) => (
              <Input
                id={id}
                name="registro_ibama"
                size="lg"
                numeric
                autoComplete="off"
                value={campos.registro_ibama}
                onChange={(e) => mudar("registro_ibama")(e.target.value)}
                aria-describedby={descritoPor}
                invalid={invalido}
              />
            )}
          </Field>
        </div>
      </fieldset>

      <fieldset className={styles.grupo}>
        <legend className={styles.grupoTitulo}>Contato</legend>
        <p className={styles.grupoNota}>
          Sai nas peças impressas, se você marcar a opção abaixo. A página
          pública de validação do certificado nunca mostra contato — é decisão de privacidade do
          projeto.
        </p>

        <div className={styles.linhaDupla}>
          <Field label="Instagram" error={erro("instagram")}>
            {({ id, descritoPor, invalido }) => (
              <Input
                id={id}
                name="instagram"
                size="lg"
                autoComplete="off"
                prefix="@"
                value={campos.instagram}
                onChange={(e) => mudar("instagram")(e.target.value)}
                aria-describedby={descritoPor}
                invalid={invalido}
              />
            )}
          </Field>

          <Field label="WhatsApp" error={erro("whatsapp")}>
            {({ id, descritoPor, invalido }) => (
              <Input
                id={id}
                name="whatsapp"
                size="lg"
                numeric
                inputMode="tel"
                autoComplete="off"
                value={campos.whatsapp}
                onChange={(e) => mudar("whatsapp")(e.target.value)}
                aria-describedby={descritoPor}
                invalid={invalido}
              />
            )}
          </Field>
        </div>
      </fieldset>

      <label className={styles.opcao}>
        <input
          type="checkbox"
          name="contato_no_documento"
          checked={contatoNoDocumento}
          onChange={(e) => setContatoNoDocumento(e.target.checked)}
          value="1"
        />
        <span className={styles.opcaoTextos}>
          <span className={styles.opcaoRotulo}>
            Imprimir meu contato nas peças
          </span>
          <span className={styles.opcaoNota}>
            WhatsApp e Instagram saem no certificado, na árvore e no crachá. A
            página pública do QR nunca mostra contato.
          </span>
        </span>
      </label>

      <div className={styles.acao}>
        <Button type="submit" size="lg" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar"}
        </Button>
        {!online ? (
          <span className={styles.nota}>
            <WifiOff size={14} aria-hidden="true" />
            Offline. Será salvo no aparelho
          </span>
        ) : null}
      </div>
    </form>
  );
}
