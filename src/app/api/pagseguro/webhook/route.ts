// src/app/api/pagseguro/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  getSupabaseAdminEnvDiagnostics,
} from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await req.json();
    console.log("Asaas webhook:", JSON.stringify(body, null, 2));

    const event = body.event;
    const payment = body.payment;

    if (!payment?.externalReference) {
      return NextResponse.json({ received: true });
    }

    const orderId = payment.externalReference;

    if (event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
      const paidPayload = { payment_status: "paid" };
      console.log("Webhook updating order to paid:", {
        orderId,
        event,
        payload: paidPayload,
      });

      const { data: updatedRows, error: updateError } = await supabaseAdmin
        .from("orders")
        .update(paidPayload)
        .select("id, payment_status, status")
        .eq("id", orderId);

      if (updateError) {
        console.error("Webhook order update failed:", {
          orderId,
          event,
          error: updateError,
          env: getSupabaseAdminEnvDiagnostics(),
        });

        return NextResponse.json(
          { error: "Failed to update order as paid" },
          { status: 500 }
        );
      }

      console.log("Webhook order update result:", {
        orderId,
        event,
        updatedRows,
        updatedCount: updatedRows?.length ?? 0,
      });

      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .select("*, order_items(*)")
        .eq("id", orderId)
        .single();

      if (orderError) {
        console.error("Webhook order fetch after payment failed:", {
          orderId,
          event,
          error: orderError,
        });
      }

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
      const expiredPayload = { payment_status: "expired" };
      console.log("Webhook updating order to expired:", {
        orderId,
        event,
        payload: expiredPayload,
      });

      const { data: updatedRows, error: updateError } = await supabaseAdmin
        .from("orders")
        .update(expiredPayload)
        .select("id, payment_status, status")
        .eq("id", orderId);

      if (updateError) {
        console.error("Webhook order expiration update failed:", {
          orderId,
          event,
          error: updateError,
          env: getSupabaseAdminEnvDiagnostics(),
        });

        return NextResponse.json(
          { error: "Failed to update order as expired" },
          { status: 500 }
        );
      }

      console.log("Webhook order expiration update result:", {
        orderId,
        event,
        updatedRows,
        updatedCount: updatedRows?.length ?? 0,
      });
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err, getSupabaseAdminEnvDiagnostics());
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
