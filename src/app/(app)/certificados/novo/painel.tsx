"use client";

import { Award, CircleAlert, Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useMemo, useState } from "react";
import { Badge, Button, Field, Input } from "@/components/ui";
import { emitirCertificado, type EstadoCertificado } from "@/app/(app)/plantel/[id]/certificado/acoes";
import { useMarcacaoFirme } from "@/lib/formulario";
import styles from "../certificados.module.css";

interface AveCertificavel {
  id: string;
  nome: string | null;
  especie: string | null;
  anilha: {
    sigla: string | null;
    criador: string | null;
    ano: number | null;
    numero: number | null;
  };
  emitidos: number;
}

export function PainelEscolha({
  aves,
  escolhida,
  buscaInicial,
}: {
  aves: AveCertificavel[];
  escolhida: string | null;
  buscaInicial: string;
}) {
  const router = useRouter();
  const parametros = useSearchParams();
  const [busca, setBusca] = useState(buscaInicial);

  const [estado, acao, enviando] = useActionState<EstadoCertificado, FormData>(
    emitirCertificado,
    {},
  );

  /** Busca sem acento: "sabia" encontra "Sabiá-laranjeira". */
  const semAcento = (texto: string) =>
    texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  const filtradas = useMemo(() => {
    const alvo = semAcento(busca.trim());
    if (!alvo) return aves;
    return aves.filter(
      (a) =>
        semAcento(a.nome ?? "").includes(alvo) ||
        semAcento(a.especie ?? "").includes(alvo) ||
        String(a.anilha.numero ?? "").includes(alvo),
    );
  }, [aves, busca]);

  /**
   * A escolha vai para a URL.
   *
   * A prévia é uma folha A4 inteira renderizada no servidor; guardar a escolha
   * em estado de cliente obrigaria o navegador a reimplementar o documento. E
   * de quebra o endereço fica compartilhável.
   */
  const escolher = (id: string) => {
    const novos = new URLSearchParams(parametros.toString());
    novos.set("ave", id);
    if (busca.trim()) novos.set("busca", busca.trim());
    else novos.delete("busca");
    router.replace(`/certificados/novo?${novos.toString()}`, { scroll: false });
  };

  const ave = aves.find((a) => a.id === escolhida) ?? null;

  return (
    <div className={styles.painelCorpo}>
      <Field label="Buscar ave">
        {({ id, descritoPor }) => (
          <Input
            id={id}
            size="lg"
            autoComplete="off"
            iconLeft={<Search size={18} aria-hidden="true" />}
            placeholder="Nome, espécie ou número"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-describedby={descritoPor}
          />
        )}
      </Field>

      {aves.length === 0 ? (
        <p className={styles.painelNota}>
          Nenhuma ave anilhada no plantel. O certificado afirma a anilha
          oficial, então só ave anilhada pode receber um.
        </p>
      ) : (
        <ul className={styles.opcoes}>
          {filtradas.map((a) => (
            <li key={a.id}>
              <OpcaoAve
                ave={a}
                marcada={a.id === escolhida}
                onEscolher={() => escolher(a.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {ave ? (
        <form action={acao} className={styles.emissao}>
          <input type="hidden" name="passaro_id" value={ave.id} />

          {estado.erro ? (
            <p className={styles.alerta} role="alert">
              <CircleAlert size={16} aria-hidden="true" />
              {estado.erro}
            </p>
          ) : null}

          {ave.emitidos > 0 ? (
            <p className={styles.painelNota}>
              Esta ave já tem {ave.emitidos}{" "}
              {ave.emitidos === 1 ? "via válida" : "vias válidas"}. A nova
              recebe o próximo número e não invalida as anteriores.
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            bloco
            disabled={enviando}
            iconeEsquerda={<Award size={18} aria-hidden="true" />}
          >
            {enviando ? "Emitindo…" : "Emitir e abrir a folha"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function OpcaoAve({
  ave,
  marcada,
  onEscolher,
}: {
  ave: AveCertificavel;
  marcada: boolean;
  onEscolher: () => void;
}) {
  // O reset do React 19 desmarca o radio sem o React reaplicar.
  const ref = useMarcacaoFirme(marcada);

  return (
    <label className={`${styles.opcao} ${marcada ? styles.opcaoMarcada : ""}`}>
      <input
        ref={ref}
        type="radio"
        name="ave"
        value={ave.id}
        checked={marcada}
        onChange={onEscolher}
        className={styles.radio}
      />
      <span className={styles.opcaoTextos}>
        <span className={styles.opcaoNome}>{ave.nome ?? "Sem nome"}</span>
        <span className={styles.opcaoContexto}>
          {[
            ave.especie,
            [ave.anilha.sigla, ave.anilha.ano, String(ave.anilha.numero ?? "").padStart(4, "0")]
              .filter(Boolean)
              .join(" "),
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
      {ave.emitidos > 0 ? (
        <Badge tone="neutro" size="sm">
          {ave.emitidos}
        </Badge>
      ) : null}
    </label>
  );
}
