"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  address_city: string;
  address_state: string;
  shipping_type: string;
  shipping_price: number;
  has_insurance: boolean;
  insurance_price: number;
  subtotal: number;
  total: number;
  payment_status: string;
  created_at: string;
};

type OrderItem = {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
};

export default function PedidoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const { data: orderData, error } = await supabase
          .from("orders").select("*").eq("id", id).single();
        if (error) throw error;
        setOrder(orderData);

        const { data: itemsData } = await supabase
          .from("order_items").select("*").eq("order_id", id);
        setItems(itemsData || []);
      } catch (err: any) {
        toast.error("Pedido não encontrado");
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF8EF" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #EDE8DA", borderTop: "3px solid #C28266", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!order) return null;

  const isPaid = order.payment_status === "paid";

  return (
    <div className="root">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FAF8EF; font-family: "DM Sans", sans-serif; color: #0D0F13; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(90,143,112,0.4); } 50% { box-shadow: 0 0 0 12px rgba(90,143,112,0); } }
      `}</style>
      <style jsx>{`
        .root { min-height: 100vh; background: #FAF8EF; padding: 32px 16px 80px; }
        .wrap { max-width: 680px; margin: 0 auto; }

        .page-top { text-align: center; margin-bottom: 28px; }
        .order-num { font-size: 12px; color: #A8978E; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
        .page-title { font-family: "Raleway", sans-serif; font-size: 26px; font-weight: 700; color: #0D0F13; }
        .page-title span { color: #C28266; }

        .card { background: #fff; border: 1px solid rgba(194,130,102,0.18); border-radius: 14px; padding: 24px; margin-bottom: 16px; animation: fadeIn 0.4s ease both; }

        /* Confirmado */
        .confirmed-box { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 32px 16px; text-align: center; }
        .confirmed-icon { width: 80px; height: 80px; background: rgba(122,175,144,0.1); border: 2px solid #7AAF90; border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: pulse 2s ease-in-out infinite; }
        .confirmed-title { font-family: "Raleway", sans-serif; font-size: 24px; font-weight: 700; color: #5A8F70; }
        .confirmed-sub { font-size: 14px; color: #7A6558; line-height: 1.6; max-width: 400px; }
        .confirmed-steps { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 380px; margin-top: 8px; }
        .confirmed-step { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: rgba(122,175,144,0.06); border: 1px solid rgba(122,175,144,0.2); border-radius: 10px; font-size: 13px; color: #3A2E28; text-align: left; }
        .confirmed-step-num { width: 24px; height: 24px; border-radius: 50%; background: #7AAF90; color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        /* Aguardando comprovante */
        .waiting-box { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 32px 16px; text-align: center; }
        .waiting-icon { font-size: 48px; }
        .waiting-title { font-family: "Raleway", sans-serif; font-size: 22px; font-weight: 700; color: #D4A96A; }
        .waiting-sub { font-size: 14px; color: #7A6558; line-height: 1.6; max-width: 400px; }
        .waiting-badge { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 16px; background: rgba(212,169,106,0.1); border: 1px solid rgba(212,169,106,0.25); border-radius: 8px; font-size: 12px; color: #8A6830; font-weight: 500; }
        .waiting-dot { width: 8px; height: 8px; border-radius: 50%; background: #D4A96A; animation: blink 1.5s ease-in-out infinite; }
        @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0.3;} }

        /* Resumo */
        .section-title { font-size: 11px; font-weight: 700; color: #A8978E; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
        .item-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid rgba(194,130,102,0.08); font-size: 14px; gap: 12px; }
        .item-row:last-child { border-bottom: none; }
        .item-name { color: #0D0F13; font-weight: 500; }
        .item-qty { font-size: 12px; color: #A8978E; }
        .item-price { color: #C28266; font-weight: 600; white-space: nowrap; }
        .total-box { background: rgba(194,130,102,0.06); border: 1.5px solid rgba(194,130,102,0.2); border-radius: 10px; padding: 16px 20px; margin-top: 16px; }
        .total-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
        .total-row span { color: #7A6558; }
        .total-row strong { color: #0D0F13; font-weight: 600; }
        .total-final { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; margin-top: 8px; border-top: 1px solid rgba(194,130,102,0.2); }
        .total-final span { font-family: "Raleway", sans-serif; font-size: 15px; font-weight: 700; color: #0D0F13; }
        .total-final strong { font-family: "Raleway", sans-serif; font-size: 26px; font-weight: 700; color: #9E6650; }

        /* Entrega */
        .info-row { display: flex; justify-content: space-between; font-size: 13px; padding: 8px 0; border-bottom: 1px solid rgba(194,130,102,0.08); }
        .info-row:last-child { border-bottom: none; }
        .info-row span { color: #7A6558; }
        .info-row strong { color: #0D0F13; font-weight: 500; }

        .back-link { display: block; text-align: center; margin-top: 20px; font-size: 13px; color: #A8978E; text-decoration: none; }
        .back-link:hover { color: #C28266; }
      `}</style>

      <div className="wrap">
        <div className="page-top">
          <div className="order-num">Pedido #{order.id.slice(0, 8).toUpperCase()}</div>
          <h1 className="page-title">
            {isPaid ? "Pedido " : "Pedido "}
            <span>{isPaid ? "Confirmado! 🎉" : "Recebido!"}</span>
          </h1>
        </div>

        {/* PAGO */}
        {isPaid ? (
          <div className="card">
            <div className="confirmed-box">
              <div className="confirmed-icon">
                <CheckCircle size={40} color="#5A8F70" />
              </div>
              <div className="confirmed-title">Pagamento confirmado!</div>
              <div className="confirmed-sub">
                Olá, <strong>{order.customer_name.split(" ")[0]}</strong>! 🎉<br />
                Seu pedido foi aprovado e será preparado com carinho.<br />
                Você receberá confirmação no WhatsApp <strong>{order.customer_phone}</strong>.
              </div>
              <div className="confirmed-steps">
                <div className="confirmed-step">
                  <div className="confirmed-step-num">1</div>
                  Pagamento confirmado ✓
                </div>
                <div className="confirmed-step">
                  <div className="confirmed-step-num">2</div>
                  Separação e embalagem em até 72h úteis
                </div>
                <div className="confirmed-step">
                  <div className="confirmed-step-num">3</div>
                  Envio com código de rastreio via WhatsApp
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="waiting-box">
              <div className="waiting-icon">📋</div>
              <div className="waiting-title">Pedido enviado!</div>
              <div className="waiting-sub">
                Olá, <strong>{order.customer_name.split(" ")[0]}</strong>!<br />
                Seu pedido foi registrado e enviado via WhatsApp.<br />
                Aguarde a confirmação do vendedor após enviar o comprovante.
              </div>
              <div className="waiting-badge">
                <div className="waiting-dot" />
                Aguardando confirmação do pagamento...
              </div>
            </div>
          </div>
        )}

        {/* Resumo */}
        <div className="card">
          <div className="section-title">📦 Itens do pedido</div>
          {items.map((item) => (
            <div className="item-row" key={item.id}>
              <div>
                <div className="item-name">{item.product_name}</div>
                <div className="item-qty">{item.quantity}x · R$ {Number(item.product_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} cada</div>
              </div>
              <div className="item-price">R$ {Number(item.subtotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
            </div>
          ))}
          <div className="total-box">
            <div className="total-row"><span>Subtotal produtos</span><strong>R$ {Number(order.subtotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>
            <div className="total-row"><span>Frete ({order.shipping_type})</span><strong>R$ {Number(order.shipping_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>
            {order.has_insurance && (
              <div className="total-row"><span>🔒 Seguro de envio (15%)</span><strong style={{ color: "#C0614F" }}>R$ {Number(order.insurance_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>
            )}
            <div className="total-final">
              <span>Total</span>
              <strong>R$ {Number(order.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        </div>

        {/* Entrega */}
        <div className="card">
          <div className="section-title">🚚 Informações de entrega</div>
          <div className="info-row"><span>Destinatário</span><strong>{order.customer_name}</strong></div>
          <div className="info-row"><span>Cidade</span><strong>{order.address_city} — {order.address_state}</strong></div>
          <div className="info-row"><span>Modalidade</span><strong>{order.shipping_type}</strong></div>
          <div className="info-row"><span>Prazo de postagem</span><strong>até 72h úteis após confirmação</strong></div>
          {order.has_insurance && (
            <div className="info-row"><span>Seguro</span><strong style={{ color: "#5A8F70" }}>✓ Ativo (15%)</strong></div>
          )}
        </div>

        <Link href="/" className="back-link">← Voltar ao catálogo</Link>
      </div>
    </div>
  );
}