// src/app/api/pagseguro/create-pix/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as https from "https";
import * as http from "http";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ASAAS_API_KEY = process.env.ASAAS_API_KEY!;
const ASAAS_BASE_URL = "https://api.asaas.com/v3";

// Agente que força HTTP/1.1 para compatibilidade com Asaas
const http1Agent = new https.Agent({ ALPNProtocols: ["http/1.1"] });

// Fetch customizado que usa HTTP/1.1
async function asaasFetch(url: string, options: any = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === "https:";
    const agent = isHttps ? http1Agent : new http.Agent();

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: {
        ...options.headers,
        "Content-Type": "application/json",
      },
      agent,
    };

    const body = options.body ? String(options.body) : null;
    if (body && reqOptions.headers) {
      (reqOptions.headers as any)["Content-Length"] = Buffer.byteLength(body);
    }

    const lib = isHttps ? https : http;
    const req = lib.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        resolve({
          ok: res.statusCode! >= 200 && res.statusCode! < 300,
          status: res.statusCode,
          json: async () => {
            try { return JSON.parse(data); }
            catch { return {}; }
          },
          text: async () => data,
        });
      });
    });

    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: "orderId obrigatório" }, { status: 400 });

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const cpf = order.customer_cpf.replace(/\D/g, "");
    const phone = order.customer_phone.replace(/\D/g, "");

    let asaasCustomerId = order.asaas_customer_id || null;

    if (!asaasCustomerId) {
      const searchRes = await asaasFetch(`${ASAAS_BASE_URL}/customers?cpfCnpj=${cpf}`, {
        headers: { "access_token": ASAAS_API_KEY },
      });
      const searchData = await searchRes.json();
      console.log("Search result:", JSON.stringify(searchData));

      if (searchData.data?.length > 0) {
        asaasCustomerId = searchData.data[0].id;
      } else {
        const customerRes = await asaasFetch(`${ASAAS_BASE_URL}/customers`, {
          method: "POST",
          headers: { "access_token": ASAAS_API_KEY },
          body: JSON.stringify({
            name: order.customer_name,
            cpfCnpj: cpf,
            mobilePhone: phone,
            email: order.customer_email || undefined,
            address: order.address_street,
            addressNumber: order.address_number,
            complement: order.address_complement || undefined,
            province: order.address_district,
            postalCode: order.address_zip.replace(/\D/g, ""),
            city: order.address_city,
            state: order.address_state,
          }),
        });
        const customerData = await customerRes.json();
        console.log("Create customer result:", JSON.stringify(customerData));
        if (!customerRes.ok) {
          // Se der erro de CPF/telefone, tenta criar com dados mínimos
          const minimalRes = await asaasFetch(`${ASAAS_BASE_URL}/customers`, {
            method: "POST",
            headers: { "access_token": ASAAS_API_KEY },
            body: JSON.stringify({
              name: order.customer_name,
              cpfCnpj: cpf,
            }),
          });
          const minimalData = await minimalRes.json();
          console.log("Minimal customer result:", JSON.stringify(minimalData));
          if (!minimalRes.ok) {
            return NextResponse.json({ error: "Erro ao criar cliente", details: minimalData }, { status: 400 });
          }
          asaasCustomerId = minimalData.id;
        } else {
          asaasCustomerId = customerData.id;
        }
        await supabaseAdmin.from("orders").update({ asaas_customer_id: asaasCustomerId }).eq("id", orderId);
      }
    }

    const subtotal = order.order_items.reduce(
      (sum: number, item: any) => sum + Number(item.product_price) * item.quantity, 0
    );
    const shipping = Number(order.shipping_price) || 0;
    const insurance = Number(order.insurance_price) || 0;
    const total = subtotal + shipping + insurance;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    const dueDateStr = dueDate.toISOString().slice(0, 10);

    const chargeRes = await asaasFetch(`${ASAAS_BASE_URL}/payments`, {
      method: "POST",
      headers: { "access_token": ASAAS_API_KEY },
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType: "PIX",
        value: Number(total.toFixed(2)),
        dueDate: dueDateStr,
        description: `Pedido PB Imports #${orderId.slice(0, 8).toUpperCase()}`,
        externalReference: orderId,
      }),
    });

    const chargeData = await chargeRes.json();
    console.log("Charge result:", JSON.stringify(chargeData));
    if (!chargeRes.ok) {
      return NextResponse.json({ error: "Erro ao criar cobrança", details: chargeData }, { status: 400 });
    }

    const paymentId = chargeData.id;

    const qrRes = await asaasFetch(`${ASAAS_BASE_URL}/payments/${paymentId}/pixQrCode`, {
      headers: { "access_token": ASAAS_API_KEY },
    });

    const qrData = await qrRes.json();
    console.log("QR result:", JSON.stringify(qrData));
    if (!qrRes.ok) {
      return NextResponse.json({ error: "Erro ao gerar QR Code", details: qrData }, { status: 400 });
    }

    const qrcodeText = qrData.payload || "";
    const qrcodeBase64 = qrData.encodedImage || "";
    const expirationDate = qrData.expirationDate || "";

    await supabaseAdmin.from("orders").update({
      pagseguro_order_id: paymentId,
      pagseguro_qrcode: qrcodeBase64,
      pagseguro_qrcode_text: qrcodeText,
      asaas_payment_id: paymentId,
      asaas_qrcode: qrcodeBase64,
      asaas_qrcode_text: qrcodeText,
      status: "pending",
    }).eq("id", orderId);

    await notifyAdmin(order);

    return NextResponse.json({
      success: true,
      qrcode: qrcodeBase64,
      qrcodeText,
      paymentId,
      expirationDate,
    });

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