"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IndicadorSync } from "@/components/offline/IndicadorSync";
import styles from "./TopBar.module.css";

/**
 * O título é derivado da rota, e não passado por cada página, para que
 * nenhuma tela nova possa esquecer de pôr o seu. O que não estiver aqui cai no
 * nome do produto, que é verdadeiro em qualquer rota.
 */
const TITULOS: Array<[RegExp, string]> = [
  [/^\/painel$/, "Painel do criatório"],
  [/^\/plantel\/nova$/, "Cadastrar ave"],
  [/^\/plantel\/[^/]+\/genealogia$/, "Árvore genealógica"],
  [/^\/genealogia$/, "Genealogia"],
  [/^\/plantel\/[^/]+$/, "Ficha da ave"],
  [/^\/plantel$/, "Plantel"],
  [/^\/casais\/novo$/, "Formar casal"],
  [/^\/casais\/[^/]+\/postura$/, "Registrar postura"],
  [/^\/casais\/[^/]+$/, "Ficha do casal"],
  [/^\/casais$/, "Casais"],
  [/^\/ovos\/[^/]+\/anilhar$/, "Anilhar filhote"],
  [/^\/ovos$/, "Ninhadas"],
  [/^\/financeiro\/novo$/, "Novo lançamento"],
  [/^\/financeiro\/categorias$/, "Categorias"],
  [/^\/financeiro\/[^/]+\/editar$/, "Corrigir lançamento"],
  [/^\/financeiro$/, "Financeiro"],
  [/^\/saude\/novo$/, "Registrar tratamento"],
  [/^\/saude\/medicamentos$/, "Medicamentos"],
  [/^\/saude\/doencas$/, "Doenças"],
  [/^\/saude\/sintomas$/, "Sintomas"],
  [/^\/saude\/[^/]+\/editar$/, "Corrigir tratamento"],
  [/^\/saude$/, "Saúde"],
  [/^\/$/, "Hoje"],
];

function tituloDa(caminho: string): string {
  return TITULOS.find(([padrao]) => padrao.test(caminho))?.[1] ?? "SisAves";
}

/** "domingo, 6 de setembro de 2026" */
function hojePorExtenso(): string {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* O nome do criatório saiu daqui: ele já está na marca da sidebar, e o avatar
   agora identifica a PESSOA, não o criatório. */
export function TopBar({ iniciais }: { iniciais: string }) {
  const caminho = usePathname();

  return (
    <header className={styles.barra}>
      <div className={styles.textos}>
        <h1 className={styles.titulo}>{tituloDa(caminho)}</h1>
        <span className={styles.data}>{hojePorExtenso()}</span>
      </div>

      {/* GET sem JavaScript, como a busca do Plantel: o resultado é a própria
          tela de plantel filtrada. */}
      <form className={styles.busca} action="/plantel" role="search">
        <span className={styles.buscaIcone} aria-hidden="true">
          <Search size={18} />
        </span>
        <input
          className={styles.buscaEntrada}
          type="search"
          name="busca"
          placeholder="Buscar anilha ou ave"
          aria-label="Buscar no plantel"
        />
      </form>

      <IndicadorSync compact />

      {/* Era um `span` com `aria-hidden`: ocupava o canto e não levava a
          lugar nenhum — nem para o teclado, nem para o leitor de tela. O
          perfil e o sair viviam só em `/mais`, que não existe no desktop. */}
      <Link href="/perfil" className={styles.avatarElo} aria-label="Seu perfil">
        <span className={styles.avatar} aria-hidden="true">
          {iniciais}
        </span>
      </Link>
    </header>
  );
}
