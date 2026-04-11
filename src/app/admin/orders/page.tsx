"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, CheckCircle, Truck, XCircle, Clock } from "lucide-react";

type OrderItem = {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
};

type Order = {
  id: string;
  customer_name: string;
  customer_cpf: string;
  customer_phone: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_district: string;
  address_zip: string;
  address_city: string;
  address_state: string;
  shipping_type: string;
  shipping_price: number;
  has_insurance: boolean;
  insurance_price: number;
  subtotal: number;
  total: number;
  status: string;
  admin_notes: string;
  created_at: string;
  items?: OrderItem[];
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  aguardando_pagamento: { label: "Aguardando Pagamento", color: "#D4A96A", bg: "rgba(212,169,106,0.1)", icon: Clock },
  pagamento_confirmado: { label: "Pagamento Confirmado", color: "#7AAF90", bg: "rgba(122,175,144,0.1)", icon: CheckCircle },
  enviado: { label: "Enviado", color: "#8AAFC2", bg: "rgba(138,175,194,0.1)", icon: Truck },
  cancelado: { label: "Cancelado", color: "#C0614F", bg: "rgba(192,97,79,0.1)", icon: XCircle },
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar pedidos: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadItems(orderId: string) {
    const { data } = await supabase.from("order_items").select("*").eq("order_id", orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: data || [] } : o));
  }

  async function updateStatus(orderId: string, newStatus: string, currentOrder: Order) {
    setUpdatingId(orderId);
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus, updated_at: new Date().toISOString() }).eq("id", orderId);
      if (error) throw error;

      // Se confirmar pagamento, baixa o estoque
      if (newStatus === "pagamento_confirmado" && currentOrder.status !== "pagamento_confirmado") {
        const items = currentOrder.items || [];
        for (const item of items) {
          // Busca produto e atualiza estoque
          const { data: prod } = await supabase.from("products").select("stock").eq("id", (item as any).product_id).single();
          if (prod) {
            const newStock = Math.max(0, (prod.stock || 0) - item.quantity);
            await supabase.from("products").update({ stock: newStock, is_out_of_stock: newStock <= 0 }).eq("id", (item as any).product_id);
            await supabase.from("stock_movements").insert({ product_id: (item as any).product_id, type: "OUT", quantity: item.quantity, notes: `Pedido confirmado #${orderId.slice(0, 8)}` });
          }
        }
        toast.success("Pagamento confirmado! Estoque atualizado.");
      } else {
        toast.success("Status atualizado!");
      }

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err: any) {
      toast.error("Erro ao atualizar: " + err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function saveNotes(orderId: string, notes: string) {
    await supabase.from("orders").update({ admin_notes: notes }).eq("id", orderId);
    toast.success("Observações salvas!");
  }

  const toggleExpand = async (orderId: string) => {
    if (expandedId === orderId) { setExpandedId(null); return; }
    setExpandedId(orderId);
    const order = orders.find(o => o.id === orderId);
    if (order && !order.items) await loadItems(orderId);
  };

  const filtered = orders.filter(o => {
    const matchStatus = !filterStatus || o.status === filterStatus;
    const matchSearch = !search || o.customer_name.toLowerCase().includes(search.toLowerCase()) || o.customer_cpf.includes(search) || o.customer_phone.includes(search);
    return matchStatus && matchSearch;
  });

  return (
    <div className="content">
      <style jsx>{`
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .title { font-family: "Raleway", sans-serif; font-size: 26px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--text-primary); }
        .title span { color: var(--accent-terra); }
        .sub { font-size: 12px; color: var(--text-muted); margin-top: 6px; }
        .filters { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
        .search-input { padding: 10px 14px; background: #fff; border: 1px solid rgba(194,130,102,0.25); border-radius: 8px; font-size: 14px; outline: none; width: 240px; }
        .filter-select { padding: 10px 14px; background: #fff; border: 1px solid rgba(194,130,102,0.25); border-radius: 8px; font-size: 14px; outline: none; color: var(--text-primary); cursor: pointer; }
        .refresh-btn { padding: 10px 18px; background: var(--accent-terra); color: #fff; border: none; border-radius: 8px; font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; }
        .order-card { background: #fff; border: 1px solid rgba(194,130,102,0.18); border-radius: 12px; margin-bottom: 10px; overflow: hidden; }
        .order-header { display: flex; align-items: center; gap: 14px; padding: 16px 20px; cursor: pointer; transition: background 0.2s; }
        .order-header:hover { background: rgba(194,130,102,0.03); }
        .order-id { font-family: "Raleway", sans-serif; font-size: 12px; font-weight: 700; color: var(--text-muted); letter-spacing: 1px; }
        .order-name { font-size: 15px; font-weight: 600; color: var(--text-primary); }
        .order-meta { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        .status-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; white-space: nowrap; }
        .order-total { font-family: "Raleway", sans-serif; font-size: 16px; font-weight: 700; color: var(--accent-terra-dark); white-space: nowrap; }
        .order-body { border-top: 1px solid rgba(194,130,102,0.1); padding: 20px; }
        .section-title { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-bottom: 20px; }
        .info-item label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 3px; }
        .info-item span { font-size: 14px; color: var(--text-primary); font-weight: 500; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
        .items-table th { text-align: left; padding: 8px 12px; background: rgba(194,130,102,0.05); color: var(--text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .items-table td { padding: 10px 12px; border-bottom: 1px solid rgba(194,130,102,0.08); }
        .status-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
        .status-btn { padding: 8px 14px; border-radius: 8px; border: 1.5px solid; font-family: "Raleway", sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .notes-area { width: 100%; padding: 10px 14px; background: #FAF8EF; border: 1px solid rgba(194,130,102,0.25); border-radius: 8px; font-size: 13px; resize: vertical; outline: none; font-family: "DM Sans", sans-serif; min-height: 80px; }
        .save-notes-btn { padding: 8px 16px; background: var(--accent-terra); color: #fff; border: none; border-radius: 8px; font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; margin-top: 8px; }
        .empty { text-align: center; padding: 48px; color: var(--text-muted); font-size: 14px; }
        .kpi-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .kpi-mini { flex: 1; min-width: 120px; background: #fff; border: 1px solid rgba(194,130,102,0.18); border-radius: 10px; padding: 14px 16px; }
        .kpi-mini-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .kpi-mini-val { font-family: "Raleway", sans-serif; font-size: 22px; font-weight: 700; color: var(--accent-terra); margin-top: 4px; }
      `}</style>

      <div className="header">
        <div>
          <div className="title">Pedidos</div>
          <div className="sub">Acompanhe e gerencie todos os pedidos</div>
        </div>
        <button className="refresh-btn" onClick={fetchOrders}>↻ Atualizar</button>
      </div>

      {/* KPIs */}
      <div className="kpi-row">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div className="kpi-mini" key={key}>
            <div className="kpi-mini-label">{cfg.label}</div>
            <div className="kpi-mini-val" style={{ color: cfg.color }}>{orders.filter(o => o.status === key).length}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="filters">
        <input className="search-input" placeholder="Buscar por nome, CPF ou telefone..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="empty">Carregando pedidos...</div>
      ) : filtered.length === 0 ? (
        <div className="empty">Nenhum pedido encontrado</div>
      ) : (
        filtered.map(order => {
          const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.aguardando_pagamento;
          const Icon = cfg.icon;
          const isExpanded = expandedId === order.id;

          return (
            <div className="order-card" key={order.id}>
              <div className="order-header" onClick={() => toggleExpand(order.id)}>
                <div style={{ flex: 1 }}>
                  <div className="order-id">#{order.id.slice(0, 8).toUpperCase()}</div>
                  <div className="order-name">{order.customer_name}</div>
                  <div className="order-meta">{formatDate(order.created_at)} · {order.customer_phone}</div>
                </div>
                <div className="status-badge" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33` }}>
                  <Icon size={11} /> {cfg.label}
                </div>
                <div className="order-total">R$ {Number(order.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                {isExpanded ? <ChevronUp size={16} color="#A8978E" /> : <ChevronDown size={16} color="#A8978E" />}
              </div>

              {isExpanded && (
                <div className="order-body">
                  {/* Dados do cliente */}
                  <div className="section-title">👤 Dados do Cliente</div>
                  <div className="info-grid">
                    <div className="info-item"><label>Nome</label><span>{order.customer_name}</span></div>
                    <div className="info-item"><label>CPF</label><span>{order.customer_cpf}</span></div>
                    <div className="info-item"><label>Telefone</label><span>{order.customer_phone}</span></div>
                  </div>

                  {/* Endereço */}
                  <div className="section-title">📍 Endereço</div>
                  <div className="info-grid">
                    <div className="info-item"><label>Endereço</label><span>{order.address_street}, {order.address_number}{order.address_complement ? ` - ${order.address_complement}` : ""}</span></div>
                    <div className="info-item"><label>Bairro</label><span>{order.address_district}</span></div>
                    <div className="info-item"><label>Cidade/Estado</label><span>{order.address_city}/{order.address_state}</span></div>
                    <div className="info-item"><label>CEP</label><span>{order.address_zip}</span></div>
                  </div>

                  {/* Itens */}
                  <div className="section-title">📦 Itens do Pedido</div>
                  {order.items ? (
                    <table className="items-table">
                      <thead><tr><th>Produto</th><th>Qtd</th><th>Preço Unit.</th><th>Subtotal</th></tr></thead>
                      <tbody>
                        {order.items.map(item => (
                          <tr key={item.id}>
                            <td>{item.product_name}</td>
                            <td>{item.quantity}</td>
                            <td>R$ {Number(item.product_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                            <td>R$ {Number(item.subtotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Carregando itens...</div>}

                  {/* Totais */}
                  <div style={{ background: "rgba(194,130,102,0.05)", border: "1px solid rgba(194,130,102,0.15)", borderRadius: 8, padding: "12px 16px", marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span style={{ color: "var(--text-muted)" }}>Subtotal</span><strong>R$ {Number(order.subtotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span style={{ color: "var(--text-muted)" }}>Frete ({order.shipping_type})</span><strong>R$ {Number(order.shipping_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>
                    {order.has_insurance && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span style={{ color: "var(--text-muted)" }}>Seguro (15%)</span><strong>R$ {Number(order.insurance_price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontFamily: "Raleway, sans-serif", fontWeight: 700, marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(194,130,102,0.15)" }}><span>TOTAL</span><strong style={{ color: "#9E6650" }}>R$ {Number(order.total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>
                  </div>

                  {/* Atualizar Status */}
                  <div className="section-title">🔄 Atualizar Status</div>
                  <div className="status-actions">
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <button key={key} className="status-btn"
                        onClick={() => updateStatus(order.id, key, order)}
                        disabled={updatingId === order.id || order.status === key}
                        style={{ borderColor: cfg.color, color: order.status === key ? "#fff" : cfg.color, background: order.status === key ? cfg.color : "transparent", opacity: updatingId === order.id ? 0.6 : 1 }}>
                        {order.status === key ? "✓ " : ""}{cfg.label}
                      </button>
                    ))}
                  </div>

                  {/* Observações */}
                  <div className="section-title">📝 Observações do Admin</div>
                  <textarea className="notes-area" defaultValue={order.admin_notes || ""} placeholder="Adicione observações sobre este pedido..."
                    id={`notes-${order.id}`} />
                  <button className="save-notes-btn" onClick={() => {
                    const el = document.getElementById(`notes-${order.id}`) as HTMLTextAreaElement;
                    saveNotes(order.id, el.value);
                  }}>Salvar Observações</button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
