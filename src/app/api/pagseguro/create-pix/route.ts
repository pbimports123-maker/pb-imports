// src/app/api/pagseguro/create-pix/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PAGSEGURO_EMAIL = process.env.PAGSEGURO_EMAIL!;
const PAGSEGURO_TOKEN = process.env.PAGSEGURO_TOKEN!;
const PAGSEGURO_BASE_URL = "https://ws.pagseguro.uol.com.br";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "orderId obrigatório" }, { status: 400 });

    // 1. Busca pedido + itens
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    // 2. Monta os itens no formato PagSeguro v2
    const items = order.order_items.map((item: any, index: number) => ({
      [`itemId${index + 1}`]: item.product_id.slice(0, 36),
      [`itemDescription${index + 1}`]: item.product_name.slice(0, 100),
      [`itemAmount${index + 1}`]: Number(item.product_price).toFixed(2),
      [`itemQuantity${index + 1}`]: item.quantity,
    }));

    const itemsFlat = items.reduce((acc: any, item: any) => ({ ...acc, ...item }), {});

    // 3. Monta o payload no formato URLEncoded (API v2)
    const phone = order.customer_phone.replace(/\D/g, "");
    const cpf = order.customer_cpf.replace(/\D/g, "");
    const zip = order.address_zip.replace(/\D/g, "");

    const params: Record<string, string> = {
      email: PAGSEGURO_EMAIL,
      token: PAGSEGURO_TOKEN,
      paymentMode: "default",
      paymentMethod: "pix",
      receiverEmail: PAGSEGURO_EMAIL,
      currency: "BRL",
      notificationURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/pagseguro/webhook`,
      reference: orderId,

      // Cliente
      senderName: order.customer_name,
      senderCPF: cpf,
      senderAreaCode: phone.slice(0, 2),
      senderPhone: phone.slice(2),
      senderEmail: `${cpf}@sandbox.pagseguro.com.br`,

      // Endereço de entrega
      shippingAddressStreet: order.address_street,
      shippingAddressNumber: order.address_number,
      shippingAddressComplement: order.address_complement || "N/A",
      shippingAddressDistrict: order.address_district,
      shippingAddressPostalCode: zip,
      shippingAddressCity: order.address_city,
      shippingAddressState: order.address_state,
      shippingAddressCountry: "BRA",
      shippingType: "3", // 1=PAC, 2=SEDEX, 3=Outro
      shippingCost: Number(order.shipping_price).toFixed(2),

      // Extras
      extraAmount: Number(order.insurance_price).toFixed(2),

      // Configurações
      timeout: "25",
      ...itemsFlat,
    };

    const body = new URLSearchParams(params).toString();

    // 4. Chama API PagSeguro v2
    const psRes = await fetch(`${PAGSEGURO_BASE_URL}/v2/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });

    const psText = await psRes.text();
    console.log("PagSeguro response:", psText);

    if (!psRes.ok) {
      console.error("PagSeguro error:", psText);
      return NextResponse.json(
        { error: "Erro no PagSeguro: " + psText },
        { status: 400 }
      );
    }

    // 5. Parse da resposta (XML ou JSON)
    let transactionCode = "";
    let qrcodeText = "";
    let qrcodeBase64 = "";

    // API v2 retorna XML — faz parse simples
    const codeMatch = psText.match(/<code>(.*?)<\/code>/);
    const pixMatch = psText.match(/<paymentLink>(.*?)<\/paymentLink>/);
    const qrMatch = psText.match(/<qrcode>(.*?)<\/qrcode>/);
    const qrImageMatch = psText.match(/<qrcodeImage>(.*?)<\/qrcodeImage>/);

    transactionCode = codeMatch?.[1] || "";
    qrcodeText = qrMatch?.[1] || pixMatch?.[1] || "";
    qrcodeBase64 = qrImageMatch?.[1] || "";

    // 6. Salva no Supabase
    await supabaseAdmin.from("orders").update({
      pagseguro_order_id: transactionCode,
      pagseguro_qrcode: qrcodeBase64,
      pagseguro_qrcode_text: qrcodeText,
    }).eq("id", orderId);

    // 7. Notifica admin
    await notifyAdmin(order);

    return NextResponse.json({
      success: true,
      qrcode: qrcodeBase64,
      qrcodeText,
      transactionCode,
    });

  } catch (err: any) {
    console.error("create-pix error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── Notifica admin no WhatsApp ────────────────────────────────
async function notifyAdmin(order: any) {
  const UAZAPI_URL = process.env.UAZAPI_URL;
  const UAZAPI_TOKEN = process.env.UAZAPI_TOKEN;
  const ADMIN_PHONE = process.env.ADMIN_WHATSAPP;

  if (!UAZAPI_URL || !UAZAPI_TOKEN || !ADMIN_PHONE) return;

  const itemsList = order.order_items
    .map((i: any) => `▸ ${i.quantity}x ${i.product_name} — R$ ${Number(i.subtotal).toFixed(2).replace(".", ",")}`)
    .join("\n");

  const message = `🛒 *NOVO PEDIDO — PB IMPORTS*

👤 *Cliente:* ${order.customer_name}
📱 *WhatsApp:* ${order.customer_phone}
📍 *Cidade:* ${order.address_city} — ${order.address_state}

📦 *Itens:*
${itemsList}

💰 *Subtotal:* R$ ${Number(order.subtotal).toFixed(2).replace(".", ",")}
🚚 *Frete (${order.shipping_type}):* R$ ${Number(order.shipping_price).toFixed(2).replace(".", ",")}
${order.has_insurance ? `🔒 *Seguro:* R$ ${Number(order.insurance_price).toFixed(2).replace(".", ",")}\n` : ""}
*💳 TOTAL: R$ ${Number(order.total).toFixed(2).replace(".", ",")}*

🔔 Status: Aguardando Pix
🔗 Pedido: ${process.env.NEXT_PUBLIC_APP_URL}/admin/pedidos/${order.id}`;

  try {
    await fetch(`${UAZAPI_URL}/message/sendText/${ADMIN_PHONE}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: UAZAPI_TOKEN,
      },
      body: JSON.stringify({ text: message }),
    });
  } catch (err) {
    console.error("UazAPI admin notify error:", err);
  }
}
