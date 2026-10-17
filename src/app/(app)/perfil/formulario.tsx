"use client";

import { CircleAlert, WifiOff } from "lucide-react";
import { useActionState, useState } from "react";
import { Button, Field, Input } from "@/components/ui";
import { useEnvioOffline } from "@/components/offline/useEnvioOffline";
import type { DadosPerfil } from "@/lib/dados/configuracoes";
import { useErrosQueEnvelhecem } from "@/lib/formulario";
import { salvarPerfil, type EstadoConfiguracoes } from "@/app/(app)/configuracoes/acoes";
import styles from "@/app/(app)/configuracoes/configuracoes.module.css";

export function FormularioPerfil({ perfil }: { perfil: DadosPerfil }) {
  const [estado, acao, enviando] = useActionState<EstadoConfiguracoes, FormData>(
    salvarPerfil,
    {},
  );
  const { erro, marcar, enviar } = useErrosQueEnvelhecem(estado.campos);

  const [nome, setNome] = useState(perfil.nome);
  const [telefone, setTelefone] = useState(perfil.telefone ?? "");

  const { aoEnviar, salvoNoAparelho, online } = useEnvioOffline({
    tipo: "perfil",
    resumo: () => `Perfil · ${nome}`,
  });

  if (salvoNoAparelho) {
    return (
      <p className={styles.nota}>
        <WifiOff size={14} aria-hidden="true" />
        Salvo no aparelho. Sobe quando o sinal voltar.
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

      <Field label="Nome" required error={erro("nome")}>
        {({ id, descritoPor, invalido }) => (
          <Input
            id={id}
            name="nome"
            size="lg"
            autoComplete="name"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              marcar("nome");
            }}
            aria-describedby={descritoPor}
            invalid={invalido}
            required
          />
        )}
      </Field>

      <Field label="Telefone" hint="Opcional." error={erro("telefone")}>
        {({ id, descritoPor, invalido }) => (
          <Input
            id={id}
            name="telefone"
            size="lg"
            numeric
            inputMode="tel"
            autoComplete="tel"
            value={telefone}
            onChange={(e) => {
              setTelefone(e.target.value);
              marcar("telefone");
            }}
            aria-describedby={descritoPor}
            invalid={invalido}
          />
        )}
      </Field>

      {/* O e-mail é credencial, não perfil: mudá-lo é mudar como se entra. */}
      <Field label="E-mail" hint="É por ele que você entra. Não se altera aqui.">
        {({ id, descritoPor }) => (
          <Input
            id={id}
            size="lg"
            value={perfil.email ?? ""}
            readOnly
            disabled
            aria-describedby={descritoPor}
          />
        )}
      </Field>

      <div className={styles.acao}>
        <Button type="submit" size="lg" disabled={enviando}>
          {enviando ? "Salvando…" : "Salvar"}
        </Button>
        {!online ? (
          <span className={styles.nota}>
            <WifiOff size={14} aria-hidden="true" />
            Offline — será salvo no aparelho
          </span>
        ) : null}
      </div>
    </form>
  );
}
