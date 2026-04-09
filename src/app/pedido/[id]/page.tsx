"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, Copy, Clock, RefreshCw } from "lucide-react";

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
  pagseguro_qrcode: string | null;
  pagseguro_qrcode_text: string | null;
  pagseguro_order_id: string | null;
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
  const [generatingPix, setGeneratingPix] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800);

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

        if (!orderData.pagseguro_qrcode && orderData.payment_status === "pending") {
          await generatePix(orderData);
        }
      } catch (err: any) {
        toast.error("Pedido não encontrado");
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Realtime — detecta pagamento e recarrega a página
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`order-${id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `id=eq.${id}`,
      }, (payload) => {
        setOrder((prev) => prev ? { ...prev, ...payload.new } : prev);
        if (payload.new.payment_status === "paid") {
          toast.success("🎉 Pagamento confirmado!");
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // Timer de expiração
  useEffect(() => {
    if (!order?.pagseguro_qrcode || order.payment_status === "paid") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [order?.pagseguro_qrcode, order?.payment_status]);

  const generatePix = async (orderData: Order) => {
    setGeneratingPix(true);
    try {
      const res = await fetch("/api/pagseguro/create-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderData.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar Pix");
      setOrder((prev) => prev ? {
        ...prev,
        pagseguro_qrcode: data.qrcode,
        pagseguro_qrcode_text: data.qrcodeText,
      } : prev);
      setTimeLeft(1800);
    } catch (err: any) {
      toast.error("Erro ao gerar Pix: " + err.message);
    } finally {
      setGeneratingPix(false);
    }
  };

  const copyPix = () => {
    if (!order?.pagseguro_qrcode_text) return;
    navigator.clipboard.writeText(order.pagseguro_qrcode_text);
    setCopied(true);
    toast.success("Código Pix copiado!");
    setTimeout(() => setCopied(false), 3000);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

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

        /* Pago */
        .paid-box { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 32px 16px; text-align: center; }
        .paid-icon { width: 80px; height: 80px; background: rgba(122,175,144,0.1); border: 2px solid #7AAF90; border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: pulse 2s ease-in-out infinite; }
        .paid-title { font-family: "Raleway", sans-serif; font-size: 24px; font-weight: 700; color: #5A8F70; }
        .paid-sub { font-size: 14px; color: #7A6558; line-height: 1.6; max-width: 400px; }
        .paid-steps { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 380px; margin-top: 8px; }
        .paid-step { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: rgba(122,175,144,0.06); border: 1px solid rgba(122,175,144,0.2); border-radius: 10px; font-size: 13px; color: #3A2E28; text-align: left; }
        .paid-step-num { width: 24px; height: 24px; border-radius: 50%; background: #7AAF90; color: #fff; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

        /* Pix */
        .pix-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .pix-title { font-family: "Raleway", sans-serif; font-size: 15px; font-weight: 700; color: #0D0F13; text-transform: uppercase; letter-spacing: 0.5px; display: flex; align-items: center; gap: 8px; }
        .pix-timer { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; }
        .qrcode-wrap { display: flex; justify-content: center; margin-bottom: 20px; }
        .qrcode-wrap img { width: 220px; height: 220px; border-radius: 12px; border: 2px solid rgba(194,130,102,0.2); }
        .qrcode-placeholder { width: 220px; height: 220px; border-radius: 12px; border: 2px dashed rgba(194,130,102,0.3); display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 8px; color: #B0A090; font-size: 13px; }
        .pix-separator { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; color: #B0A090; font-size: 12px; }
        .pix-separator::before, .pix-separator::after { content: ""; flex: 1; height: 1px; background: rgba(194,130,102,0.15); }
        .pix-code-box { background: #FAF8EF; border: 1px solid rgba(194,130,102,0.25); border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .pix-code-text { flex: 1; font-size: 11px; color: #7A6558; word-break: break-all; line-height: 1.4; font-family: monospace; }
        .copy-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; flex-shrink: 0; font-family: "Raleway", sans-serif; }
        .pix-info { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: #7A6558; line-height: 1.5; padding: 10px 14px; background: rgba(194,130,102,0.06); border-radius: 8px; }

        /* Aguardando */
        .waiting-badge { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; background: rgba(212,169,106,0.1); border: 1px solid rgba(212,169,106,0.25); border-radius: 8px; margin-top: 12px; font-size: 12px; color: #8A6830; font-weight: 500; }
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

        .regen-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: transparent; border: 1.5px solid rgba(194,130,102,0.4); border-radius: 8px; color: #C28266; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin: 0 auto; font-family: "Raleway", sans-serif; }
        .regen-btn:hover { background: rgba(194,130,102,0.06); }

        .back-link { display: block; text-align: center; margin-top: 20px; font-size: 13px; color: #A8978E; text-decoration: none; }
        .back-link:hover { color: #C28266; }
      `}</style>

      <div className="wrap">
        <div className="page-top">
          <div className="order-num">Pedido #{order.id.slice(0, 8).toUpperCase()}</div>
          <h1 className="page-title">
            {isPaid ? "Pedido " : "Finalizar "}
            <span>{isPaid ? "Confirmado! 🎉" : "Pagamento"}</span>
          </h1>
        </div>

        {/* PAGO */}
        {isPaid && (
          <div className="card">
            <div className="paid-box">
              <div className="paid-icon">
                <CheckCircle size={40} color="#5A8F70" />
              </div>
              <div className="paid-title">Pagamento confirmado!</div>
              <div className="paid-sub">
                Olá, <strong>{order.customer_name.split(" ")[0]}</strong>! 🎉<br />
                Seu pedido foi aprovado e será preparado com carinho.<br />
                Você receberá confirmação no WhatsApp <strong>{order.customer_phone}</strong>.
              </div>
              <div className="paid-steps">
                <div className="paid-step">
                  <div className="paid-step-num">1</div>
                  Pagamento confirmado ✓
                </div>
                <div className="paid-step">
                  <div className="paid-step-num">2</div>
                  Separação e embalagem em até 48h úteis
                </div>
                <div className="paid-step">
                  <div className="paid-step-num">3</div>
                  Envio com código de rastreio via WhatsApp
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PIX */}
        {!isPaid && (
          <div className="card">
            <div className="pix-header">
              <div className="pix-title">
                💳 Pague com Pix
              </div>
              {order.pagseguro_qrcode && timeLeft > 0 && (
                <div className="pix-timer" style={{ color: timeLeft < 300 ? "#C0614F" : "#D4A96A" }}>
                  <Clock size={14} />
                  Expira em {formatTime(timeLeft)}
                </div>
              )}
            </div>

            {generatingPix ? (
              <div className="qrcode-wrap">
                <div className="qrcode-placeholder">
                  <div style={{ width: 32, height: 32, border: "3px solid #EDE8DA", borderTop: "3px solid #C28266", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Gerando QR Code...
                </div>
              </div>
            ) : order.pagseguro_qrcode && timeLeft > 0 ? (
              <>
                <div className="qrcode-wrap">
                  <img src={`data:image/png;base64,${order.pagseguro_qrcode}`} alt="QR Code Pix" />
                </div>
                <div className="pix-separator">ou copie o código abaixo</div>
                <div className="pix-code-box">
                  <span className="pix-code-text">{order.pagseguro_qrcode_text}</span>
                  <button
                    className="copy-btn"
                    onClick={copyPix}
                    style={{ background: copied ? "#7AAF90" : "#C28266" }}
                  >
                    <Copy size={13} />
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                <div className="pix-info">
                  📌 Abra o app do seu banco → Pix → Ler QR Code ou Pix Copia e Cola. O pagamento é confirmado em segundos.
                </div>
                <div className="waiting-badge">
                  <div className="waiting-dot" />
                  Aguardando confirmação do pagamento...
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ color: "#C0614F", fontSize: 14, marginBottom: 16 }}>
                  {timeLeft === 0 ? "QR Code expirado." : "Não foi possível gerar o QR Code."}
                </p>
                <button className="regen-btn" onClick={() => order && generatePix(order)}>
                  <RefreshCw size={14} /> Gerar novo QR Code
                </button>
              </div>
            )}
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
          <div className="info-row"><span>Prazo</span><strong>48–72h úteis após confirmação</strong></div>
          {order.has_insurance && (
            <div className="info-row"><span>Seguro</span><strong style={{ color: "#5A8F70" }}>✓ Ativo (15%)</strong></div>
          )}
        </div>

        <Link href="/" className="back-link">← Voltar ao catálogo</Link>
      </div>
    </div>
  );
}