"use server";

import { Preference } from "mercadopago";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  clienteMercadoPago,
  origemDaRequisicao,
  origemPublica,
} from "@/lib/mercadopago/cliente";
import { oferta } from "@/lib/mercadopago/ofertas";
import { obterCriatorioAtual } from "@/lib/criatorio";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export interface EstadoAssinatura {
  erro?: string;
}

/**
 * Leva ao Checkout Pro.
 *
 * O formulário manda só a chave da oferta. Valor, prazo e meios de pagamento
 * saem do catálogo do servidor, e a intenção é gravada ANTES da ida — é ela
 * que o webhook vai encontrar pelo `external_reference` quando o pagamento
 * voltar, sem precisar confiar em nada que venha no corpo da notificação.
 */
export async function irParaCheckout(
  _anterior: EstadoAssinatura,
  dados: FormData,
): Promise<EstadoAssinatura> {
  const escolhida = oferta(dados.get("oferta"));
  if (!escolhida) return { erro: "Plano não reconhecido. Recarregue a página." };

  const criatorio = await obterCriatorioAtual();
  if (!criatorio) return { erro: "Cadastre o criatório antes de assinar." };

  const supabase = await criarClienteServidor();

  // A intenção nasce com a sessão do criador, então a RLS vale: ninguém grava
  // intenção no criatório de outro.
  const { data: intencao, error: erroIntencao } = await supabase
    .from("assinatura_intencoes")
    .insert({
      criatorio_id: criatorio.id,
      oferta: escolhida.chave,
      valor: escolhida.valor,
      meses: escolhida.meses,
    })
    .select("id")
    .single();

  if (erroIntencao || !intencao) {
    console.error("assinatura_intencoes:", erroIntencao?.message);
    return { erro: "Não foi possível iniciar o pagamento. Tente de novo." };
  }

  const cabecalhos = await headers();
  const origem = origemDaRequisicao(cabecalhos);

  let destino: string;
  try {
    const resultado = await new Preference(clienteMercadoPago()).create({
      body: {
        items: [
          {
            id: escolhida.chave,
            title: escolhida.titulo,
            quantity: 1,
            unit_price: escolhida.valor,
            currency_id: "BRL",
          },
        ],
        payment_methods: { excluded_payment_types: [...escolhida.excluir] },
        back_urls: {
          success: `${origem}/assinatura/retorno`,
          failure: `${origem}/assinatura/retorno`,
          pending: `${origem}/assinatura/retorno`,
        },
        // Condicional, e não por capricho: a API RECUSA a preferência quando
        // `auto_return` vem com `back_urls.success` em http:// ou em
        // https://localhost (e 127.0.0.1, e 0.0.0.0). Não ignora o campo —
        // recusa a criação inteira. Só origem https:// pública o aceita.
        ...(origemPublica(origem) ? { auto_return: "approved" } : {}),
        notification_url: `${origem}/api/mercadopago/webhook`,
        // A âncora de reconciliação. É o que o webhook recebe de volta.
        external_reference: intencao.id,
        statement_descriptor: "SISAVES",
      },
      // Chave estável e nossa: a do SDK é gerada por chamada, então uma
      // retentativa criaria uma segunda preferência para a mesma intenção.
      requestOptions: { idempotencyKey: intencao.id },
    });

    if (!resultado.init_point) {
      return { erro: "O Mercado Pago não devolveu o endereço do checkout." };
    }

    await supabase
      .from("assinatura_intencoes")
      .update({ preference_id: resultado.id })
      .eq("id", intencao.id);

    // Sempre `init_point`. O Mercado Pago removeu o ambiente de sandbox: o
    // campo antigo de redirect não existe mais e levaria a uma página de erro.
    // O que separa teste de produção é a credencial, não a URL.
    destino = resultado.init_point;
  } catch (erro) {
    console.error("mercadopago/preference:", erro);
    return {
      erro: "Não foi possível abrir o Mercado Pago. Tente de novo em instantes.",
    };
  }

  // Fora do try: `redirect` funciona lançando, e um catch o engoliria.
  redirect(destino);
}
