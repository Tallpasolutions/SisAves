import crypto from "node:crypto";
import { after } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * O receptor das notificações do Mercado Pago.
 *
 * Três regras, e as três já custaram dinheiro a alguém:
 *
 * 1. **Valide a assinatura ANTES de olhar o corpo.** Esta rota é pública por
 *    necessidade — o Mercado Pago chega sem cookie — então sem HMAC qualquer
 *    um posta "pagamento aprovado" e ganha um ano de assinatura.
 * 2. **Responda 200 e só então processe.** Resposta que não é 200 faz o
 *    Mercado Pago retentar por 24 horas. Em serverless a função congela depois
 *    da resposta, então o trabalho posterior vai no `after()` do Next — o
 *    `queueMicrotask` dos exemplos de Express perderia tudo aqui.
 * 3. **Seja idempotente.** A mesma notificação chega várias vezes, de
 *    propósito. A dedup mora no banco: índice único em (provedor, provedor_id)
 *    e vigência que só avança quando o pagamento ENTRA em approved.
 *
 * A rota está fora do `proxy.ts`: com sessão exigida, o Mercado Pago receberia
 * 307 para /entrar e a notificação nunca chegaria.
 */

/** Tipos de notificação que interessam ao Checkout Pro. */
const TOPICOS = new Set(["payment"]);

export async function POST(request: Request) {
  const segredo = process.env.MP_WEBHOOK_SECRET;
  if (!segredo) {
    console.error("mercadopago/webhook: MP_WEBHOOK_SECRET ausente");
    return new Response(null, { status: 500 });
  }

  const corpoBruto = await request.text();
  let corpo: { type?: string; action?: string; data?: { id?: string } };
  try {
    corpo = JSON.parse(corpoBruto);
  } catch {
    return new Response(null, { status: 400 });
  }

  const assinatura = request.headers.get("x-signature") ?? "";
  const requestId = request.headers.get("x-request-id") ?? "";
  const partes = Object.fromEntries(
    assinatura
      .split(",")
      .map((p) => p.split("=").map((s) => s.trim()))
      .filter((p) => p.length === 2),
  );
  const ts = partes.ts;
  const v1 = partes.v1;
  // O `data.id` da URL vence o do corpo: é o que o Mercado Pago assina.
  const dataId =
    new URL(request.url).searchParams.get("data.id") ?? corpo.data?.id ?? "";

  if (!ts || !v1 || !dataId || !requestId) {
    return new Response(null, { status: 400 });
  }

  const canonica = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const esperada = crypto.createHmac("sha256", segredo).update(canonica).digest("hex");
  const valida =
    esperada.length === v1.length &&
    crypto.timingSafeEqual(Buffer.from(esperada), Buffer.from(v1));

  if (!valida) {
    console.warn("mercadopago/webhook: assinatura inválida");
    return new Response(null, { status: 401 });
  }

  if (!TOPICOS.has(corpo.type ?? "")) {
    // `merchant_order` e os demais chegam junto e não acrescentam nada aqui:
    // o dinheiro está no tópico `payment`. 200 para não virar retentativa.
    return new Response(null, { status: 200 });
  }

  // Responde já; o resto roda depois da resposta ter saído.
  after(async () => {
    try {
      await creditar(dataId);
    } catch (erro) {
      console.error("mercadopago/webhook:", erro);
    }
  });

  return new Response(null, { status: 200 });
}

async function creditar(pagamentoId: string): Promise<void> {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error("MP_ACCESS_TOKEN ausente");

  // O status vem da API, não do corpo da notificação: a notificação diz que
  // ALGO mudou, não qual é a verdade.
  const resposta = await fetch(
    `https://api.mercadopago.com/v1/payments/${pagamentoId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!resposta.ok) {
    throw new Error(`payments/${pagamentoId} devolveu ${resposta.status}`);
  }
  const pagamento = await resposta.json();

  const { data, error } = await supabaseDoServidor().rpc(
    "creditar_pagamento_mercadopago",
    {
      p_referencia: pagamento.external_reference,
      p_provedor_id: String(pagamento.id),
      p_status: pagamento.status,
      p_valor: pagamento.transaction_amount ?? null,
      p_meio: pagamento.payment_type_id ?? null,
      p_payload: pagamento,
    },
  );

  if (error) throw new Error(`creditar_pagamento_mercadopago: ${error.message}`);
  console.log("mercadopago/webhook:", pagamento.id, pagamento.status, data);
}

/**
 * O cliente com `service_role`.
 *
 * Aqui não há sessão — o Mercado Pago não tem conta no SisAves —, então a RLS
 * barraria a escrita. A chave fica confinada a esta rota, que nunca vai para o
 * navegador, e a única coisa que ela faz é chamar uma função `security
 * definer` que não tem execute para `anon` nem para `authenticated`.
 */
function supabaseDoServidor() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) throw new Error("Supabase do servidor não configurado");
  return createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
