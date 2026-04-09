// src/app/api/pagseguro/create-pix/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "orderId obrigatório" }, { status: 400 });

    // Chama a Edge Function do Supabase
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-pix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ orderId }),
    });

    const data = await res.json();
    console.log("Edge Function response:", JSON.stringify(data));

    if (!res.ok) {
      return NextResponse.json({ error: data.error || "Erro na Edge Function", details: data }, { status: res.status });
    }

    // Notifica admin no WhatsApp
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (order) await notifyAdmin(order);

    return NextResponse.json(data);

  } catch (err: any) {
    console.error("create-pix error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function notifyAdmin(order: any) {
  const UAZAPI_URL   = process.env.UAZAPI_URL;
  const UAZAPI_TOKEN = process.env.UAZAPI_TOKEN;
  const ADMIN_PHONE  = process.env.ADMIN_WHATSAPP;

  if (!UAZAPI_URL || !UAZAPI_TOKEN || !ADMIN_PHONE) return;

  const itemsList = order.order_items
    .map((i: any) => `▸ ${i.quantity}x ${i.product_name} — R$ ${Number(i.product_price).toFixed(2).replace(".", ",")}`)
    .join("\n");

  const subtotal = order.order_items.reduce(
    (sum: number, item: any) => sum + Number(item.product_price) * item.quantity, 0
  );
  const shipping = Number(order.shipping_price) || 0;
  const insurance = Number(order.insurance_price) || 0;
  const total = subtotal + shipping + insurance;

  const message = `🛒 *NOVO PEDIDO — PB IMPORTS*

👤 *Cliente:* ${order.customer_name}
📱 *WhatsApp:* ${order.customer_phone}
📍 *Cidade:* ${order.address_city} — ${order.address_state}

📦 *Itens:*
${itemsList}

💰 *Subtotal:* R$ ${subtotal.toFixed(2).replace(".", ",")}
🚚 *Frete (${order.shipping_type}):* R$ ${shipping.toFixed(2).replace(".", ",")}
${order.has_insurance ? `🔒 *Seguro:* R$ ${insurance.toFixed(2).replace(".", ",")}\n` : ""}
*💳 TOTAL: R$ ${total.toFixed(2).replace(".", ",")}*

🔔 Status: Aguardando Pix
🔗 Pedido: ${process.env.NEXT_PUBLIC_APP_URL}/admin/pedidos/${order.id}`;

  try {
    await fetch(`${UAZAPI_URL}/message/sendText/${ADMIN_PHONE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", token: UAZAPI_TOKEN },
      body: JSON.stringify({ text: message }),
    });
  } catch (err) {
    console.error("UazAPI admin notify error:", err);
  }
}