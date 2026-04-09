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
    console.log("Asaas webhook:", JSON.stringify(body, null, 2));

    const event = body.event;
    const payment = body.payment;

    if (!payment?.externalReference) {
      return NextResponse.json({ received: true });
    }

    const orderId = payment.externalReference;

    if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "paid", status: "paid" })
        .eq("id", orderId);

      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId)
        .single();

      if (order) {
        // Baixa de estoque para cada item do pedido
        for (const item of order.order_items) {
          const { data: product } = await supabaseAdmin
            .from("products")
            .select("id, stock")
            .eq("id", item.product_id)
            .single();

          if (product) {
            const newStock = Math.max(0, Number(product.stock) - Number(item.quantity));
            await supabaseAdmin
              .from("products")
              .update({
                stock: newStock,
                is_out_of_stock: newStock <= 0,
              })
              .eq("id", item.product_id);
          }
        }

        await notifyCustomer(order);
      }
    }

    if (event === "PAYMENT_OVERDUE" || event === "PAYMENT_DELETED") {
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "expired", status: "cancelled" })
        .eq("id", orderId);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function notifyCustomer(order: any) {
  const UAZAPI_URL   = process.env.UAZAPI_URL;
  const UAZAPI_TOKEN = process.env.UAZAPI_TOKEN;

  if (!UAZAPI_URL || !UAZAPI_TOKEN) return;

  const phone = order.customer_phone.replace(/\D/g, "");

  const message = `✅ *PAGAMENTO CONFIRMADO — PB IMPORTS*

Olá, *${order.customer_name.split(" ")[0]}*! 🎉

Seu pagamento foi confirmado e seu pedido está sendo preparado!

📦 *Pedido:* #${order.id.slice(0, 8).toUpperCase()}
💰 *Total:* R$ ${Number(order.total).toFixed(2).replace(".", ",")}
🚚 *Frete:* ${order.shipping_type}
📍 *Entrega:* ${order.address_city} — ${order.address_state}

⏱ Prazo de envio: 48–72h úteis

Qualquer dúvida, entre em contato conosco! 💬`;

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