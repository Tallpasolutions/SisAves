"use client";

import { Award, Bird, ChevronDown, ChevronUp, Download, Tag, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Anilha, Badge, Button, SexChip } from "@/components/ui";
import type { AveNaTabela } from "@/lib/dados/plantel";
import { descreverSituacao } from "@/lib/dados/situacao";
import { formatarData } from "@/lib/formato";
import styles from "./tabela.module.css";

export interface TabelaPlantelProps {
  aves: AveNaTabela[];
  ordem: string;
  direcao: string;
  /**
   * Os links de ordenação já prontos, por coluna.
   *
   * Vêm como dados e não como função: função não atravessa a fronteira entre
   * Server e Client Component. Montá-los no servidor também mantém a regra de
   * composição da URL num lugar só.
   */
  hrefsOrdenacao: Record<string, string>;
}

/**
 * Plantel em tabela — prancha `4b`.
 *
 * Filtro, ordenação e paginação ficam na URL (servidor). O que é estado de
 * cliente aqui é só a SELEÇÃO: ela não sobrevive à navegação de propósito —
 * selecionar três aves e mudar de página não deveria acumular uma seleção
 * invisível.
 */
export function TabelaPlantel({ aves, ordem, direcao, hrefsOrdenacao }: TabelaPlantelProps) {
  const [selecionadas, setSelecionadas] = useState<ReadonlySet<string>>(new Set());

  const alternar = (id: string) =>
    setSelecionadas((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });

  const todasMarcadas = aves.length > 0 && aves.every((a) => selecionadas.has(a.id));

  const alternarTodas = () =>
    setSelecionadas(todasMarcadas ? new Set() : new Set(aves.map((a) => a.id)));

  const escolhidas = useMemo(
    () => aves.filter((a) => selecionadas.has(a.id)),
    [aves, selecionadas],
  );

  // "Formar casal" só faz sentido com exatamente um macho e uma fêmea.
  const parValido =
    escolhidas.length === 2 &&
    escolhidas.some((a) => a.sexo === "macho") &&
    escolhidas.some((a) => a.sexo === "femea");

  return (
    <div className={styles.painelTabela}>
      {escolhidas.length > 0 ? (
        <BarraSelecao
          quantidade={escolhidas.length}
          parValido={parValido}
          aoCancelar={() => setSelecionadas(new Set())}
        />
      ) : null}

      <div className={styles.rolagem}>
        <div className={styles.grade} role="table" aria-label="Plantel">
          <div className={styles.cabecalhoTabela} role="row">
            <span />
            <span className={styles.celulaMarca}>
              <Caixa
                marcada={todasMarcadas}
                aoAlternar={alternarTodas}
                rotulo={
                  todasMarcadas
                    ? "Desmarcar todas as aves da página"
                    : "Marcar todas as aves da página"
                }
              />
            </span>
            <Ordenavel coluna="anilha" rotulo="Anilha" ordem={ordem} direcao={direcao} href={hrefsOrdenacao.anilha} />
            <span role="columnheader">Foto</span>
            <span role="columnheader">Espécie</span>
            <span role="columnheader">Mutação</span>
            <span role="columnheader">Sexo</span>
            <Ordenavel coluna="nascimento" rotulo="Nascimento" ordem={ordem} direcao={direcao} href={hrefsOrdenacao.nascimento} />
            <span role="columnheader">Casal de origem</span>
            <span role="columnheader">Situação</span>
          </div>

          {aves.map((ave) => (
            <Linha
              key={ave.id}
              ave={ave}
              marcada={selecionadas.has(ave.id)}
              aoAlternar={() => alternar(ave.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function BarraSelecao({
  quantidade,
  parValido,
  aoCancelar,
}: {
  quantidade: number;
  parValido: boolean;
  aoCancelar: () => void;
}) {
  return (
    <div className={styles.barraSelecao} role="status">
      <span className={styles.selecaoContagem}>
        {quantidade} {quantidade === 1 ? "ave selecionada" : "aves selecionadas"}
      </span>
      <span className={styles.divisor} aria-hidden="true" />

      {/* As ações que ainda não existem ficam desabilitadas, com o motivo no
          title — some-las esconderia o que a tela vai fazer, e habilitá-las
          prometeria o que o sistema ainda não faz. */}
      <Button
        variant="secondary"
        size="sm"
        iconeEsquerda={<Award size={16} />}
        disabled
        title="Emissão de CRO entra na Fase 8"
      >
        Emitir CRO
      </Button>

      <Button
        href={parValido ? "/casais/novo" : undefined}
        variant="secondary"
        size="sm"
        iconeEsquerda={<Users size={16} />}
        disabled={!parValido}
        title={parValido ? undefined : "Escolha exatamente um macho e uma fêmea"}
      >
        Formar casal
      </Button>

      <Button
        variant="secondary"
        size="sm"
        iconeEsquerda={<Tag size={16} />}
        disabled
        title="Etiquetas entram com a Fase 9"
      >
        Etiquetar
      </Button>

      <Button
        variant="ghost"
        size="sm"
        iconeEsquerda={<Download size={16} />}
        disabled
        title="Exportação entra com os Relatórios"
      >
        Exportar seleção
      </Button>

      <span className={styles.espaco} />

      <Button variant="ghost" size="sm" onClick={aoCancelar}>
        Cancelar seleção
      </Button>
    </div>
  );
}

function Ordenavel({
  coluna,
  rotulo,
  ordem,
  direcao,
  href,
}: {
  coluna: string;
  rotulo: string;
  ordem: string;
  direcao: string;
  href: string;
}) {
  const ativa = ordem === coluna;
  const Seta = direcao === "desc" ? ChevronDown : ChevronUp;

  return (
    <span role="columnheader" aria-sort={ativa ? (direcao === "desc" ? "descending" : "ascending") : "none"}>
      <Link href={href} className={`${styles.ordenar} ${ativa ? styles.ordenarAtiva : ""}`}>
        {rotulo}
        {ativa ? <Seta size={12} aria-hidden="true" /> : null}
      </Link>
    </span>
  );
}

function Linha({
  ave,
  marcada,
  aoAlternar,
}: {
  ave: AveNaTabela;
  marcada: boolean;
  aoAlternar: () => void;
}) {
  const situacao = descreverSituacao(ave.situacao);
  const gravidade = situacao.tom === "critico" ? "critico" : "neutro";

  return (
    <div className={`${styles.linha} ${marcada ? styles.linhaMarcada : ""}`} role="row">
      <span className={`${styles.faixa} ${styles[`faixa_${gravidade}`]}`} aria-hidden="true" />

      <span className={styles.celulaMarca} role="cell">
        <Caixa
          marcada={marcada}
          aoAlternar={aoAlternar}
          rotulo={`Selecionar ${ave.nome ?? "ave sem nome"}`}
        />
      </span>

      <span role="cell">
        <Link href={`/plantel/${ave.id}`} className={styles.elo}>
          <Anilha dados={ave.anilha} size="sm" tone="quiet" />
        </Link>
      </span>

      <span className={styles.celulaFoto} role="cell">
        {ave.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.miniatura} src={ave.fotoUrl} alt="" />
        ) : (
          <span className={styles.miniaturaVazia} aria-hidden="true">
            <Bird size={14} />
          </span>
        )}
      </span>

      <span className={styles.celulaTexto} role="cell">
        {ave.especie ?? <span className={styles.vazio}>—</span>}
      </span>

      <span className={styles.celulaTexto} role="cell">
        {ave.mutacaoNome ?? <span className={styles.vazio}>—</span>}
      </span>

      <span role="cell">
        <SexChip sexo={ave.sexo} compacta />
      </span>

      <span className={styles.celulaData} role="cell">
        {ave.dtNascimento ? formatarData(ave.dtNascimento) : <span className={styles.vazio}>—</span>}
      </span>

      <span className={styles.celulaTexto} role="cell">
        {ave.casalNumero !== null ? (
          <Link href={`/casais/${ave.casalId}`} className={styles.elo}>
            Casal {String(ave.casalNumero).padStart(2, "0")}
          </Link>
        ) : (
          <span className={styles.vazio}>—</span>
        )}
      </span>

      <span role="cell">
        <Badge tone={situacao.tom} size="sm">
          {situacao.texto}
        </Badge>
      </span>
    </div>
  );
}

function Caixa({
  marcada,
  aoAlternar,
  rotulo,
}: {
  marcada: boolean;
  aoAlternar: () => void;
  rotulo: string;
}) {
  return (
    <label className={styles.caixaAlvo}>
      <input
        type="checkbox"
        className={styles.caixaEntrada}
        checked={marcada}
        onChange={aoAlternar}
        aria-label={rotulo}
      />
      <span className={`${styles.caixa} ${marcada ? styles.caixaMarcada : ""}`} aria-hidden="true">
        {marcada ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : null}
      </span>
    </label>
  );
}
