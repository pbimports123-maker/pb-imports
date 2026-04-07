// src/app/api/pagseguro/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("PagSeguro webhook:", JSON.stringify(body, null, 2));

    // PagSeguro envia eventos como: PAYMENT.AUTHORIZED, ORDER.PAID, etc.
    const eventType = body.type;
    const orderData = body.data;

    if (!orderData?.reference_id) {
      return NextResponse.json({ ok: true }); // ignora eventos sem referência
    }

    const orderId = orderData.reference_id;

    // ── Pagamento confirmado ──────────────────────────────────
    if (
      eventType === "PAYMENT.AUTHORIZED" ||
      eventType === "ORDER.PAID" ||
      orderData?.status === "PAID"
    ) {
      // 1. Atualiza status no Supabase
      const { data: order, error } = await supabaseAdmin
        .from("orders")
        .update({ payment_status: "paid" })
        .eq("id", orderId)
        .select("*")
        .single();

      if (error) {
        console.error("Supabase update error:", error);
        return NextResponse.json({ error: "Erro ao atualizar pedido" }, { status: 500 });
      }

      // 2. Notifica cliente no WhatsApp
      await notifyCustomer(order);

      return NextResponse.json({ ok: true, status: "paid" });
    }

    // ── Pagamento cancelado ───────────────────────────────────
    if (eventType === "ORDER.CANCELLED" || orderData?.status === "CANCELLED") {
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "cancelled" })
        .eq("id", orderId);

      return NextResponse.json({ ok: true, status: "cancelled" });
    }

    return NextResponse.json({ ok: true });

  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── Notifica cliente no WhatsApp após pagamento ───────────────
async function notifyCustomer(order: any) {
  const UAZAPI_URL = process.env.UAZAPI_URL;
  const UAZAPI_TOKEN = process.env.UAZAPI_TOKEN;

  if (!UAZAPI_URL || !UAZAPI_TOKEN) return;

  // Busca itens do pedido
  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);

  const itemsList = (items || [])
    .map((i: any) => `▸ ${i.quantity}x ${i.product_name}`)
    .join("\n");

  // Formata telefone para o padrão UazAPI (55 + DDD + número)
  const phone = "55" + order.customer_phone.replace(/\D/g, "");

  const message = `✅ *Pagamento confirmado!*

Olá, *${order.customer_name.split(" ")[0]}*! Recebemos seu pagamento com sucesso. 🎉

📦 *Seu pedido:*
${itemsList}

🚚 *Envio:* ${order.shipping_type}
📍 *Destino:* ${order.address_city} — ${order.address_state}
${order.has_insurance ? "🔒 *Seguro de envio:* Ativo\n" : ""}
⏳ *Prazo:* 48–72h úteis para envio após confirmação.

Você receberá o código de rastreio assim que o pedido for despachado.

_PB Imports — obrigada pela confiança!_ 💛`;

  try {
    await fetch(`${UAZAPI_URL}/message/sendText/${phone}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: UAZAPI_TOKEN,
      },
      body: JSON.stringify({ text: message }),
    });
  } catch (err) {
    console.error("UazAPI customer notify error:", err);
  }
}
