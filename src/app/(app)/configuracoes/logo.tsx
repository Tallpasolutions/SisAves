"use client";

import { CircleAlert, ImageUp, Trash2 } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { removerLogo, salvarLogo, type EstadoConfiguracoes } from "./acoes";
import styles from "./configuracoes.module.css";

/**
 * A logo que sai impressa nas peças.
 *
 * Fora da fila offline, como as ações de membro: a fila guarda campos de
 * formulário como texto, e um binário não cabe nela — enfileirar daria ao
 * criador a impressão de que a imagem subiu do galpão, sem sinal.
 *
 * Certificado já emitido NÃO muda: o snapshot congelou a URL da logo que
 * estava valendo no dia. Trocar a logo hoje vale para o que for emitido daqui
 * em diante, e a via impressa continua igual a si mesma.
 */
export function Logo({ logoUrl }: { logoUrl: string | null }) {
  const [estado, acao, enviando] = useActionState<EstadoConfiguracoes, FormData>(
    salvarLogo,
    {},
  );
  const [removendo, acaoRemover, removendoAgora] = useActionState<
    EstadoConfiguracoes,
    FormData
  >(removerLogo, {});

  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);
  const campo = useRef<HTMLInputElement>(null);

  const erro = estado.campos?.logo ?? estado.erro ?? removendo.erro;

  return (
    <section className={styles.bloco}>
      <h2 className={styles.blocoTitulo}>Logo do criatório</h2>
      <p className={styles.blocoNota}>
        Sai impressa no certificado, na árvore e no crachá, e aparece na página
        de validação. PNG, JPG ou WEBP, até 2 MB.
      </p>

      <div className={styles.logo}>
        <div className={styles.logoPreview}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo do criatório" className={styles.logoImagem} />
          ) : (
            <span className={styles.logoVazia}>Sem logo</span>
          )}
        </div>

        <div className={styles.logoControles}>
          <form action={acao} className={styles.logoFormulario}>
            {/* O input de arquivo nativo é feio e o rótulo dele muda por
                navegador; o botão é o alvo, e o nome escolhido aparece ao
                lado — sem isso o criador não sabe o que vai enviar. */}
            <input
              ref={campo}
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/webp"
              className="visually-hidden"
              onChange={(e) => setNomeArquivo(e.target.files?.[0]?.name ?? null)}
            />

            <div className={styles.logoAcoes}>
              <Button
                variant="secondary"
                size="md"
                iconeEsquerda={<ImageUp size={18} aria-hidden="true" />}
                onClick={() => campo.current?.click()}
              >
                Escolher imagem
              </Button>

              <Button type="submit" size="md" disabled={!nomeArquivo || enviando}>
                {enviando ? "Enviando…" : "Enviar"}
              </Button>
            </div>

            {nomeArquivo ? (
              <span className={styles.logoArquivo}>{nomeArquivo}</span>
            ) : null}
          </form>

          {logoUrl ? (
            <form action={acaoRemover}>
              <Button
                type="submit"
                variant="ghost"
                size="md"
                disabled={removendoAgora}
                iconeEsquerda={<Trash2 size={18} aria-hidden="true" />}
              >
                {removendoAgora ? "Removendo…" : "Remover"}
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      {erro ? (
        <p className={styles.logoErro} role="alert">
          <CircleAlert size={16} aria-hidden="true" />
          {erro}
        </p>
      ) : null}
    </section>
  );
}
