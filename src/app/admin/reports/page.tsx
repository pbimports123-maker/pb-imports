"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

// Paleta harmoniosa com o tema terracota
const COLORS = [
  "#C28266","#7AAF90","#D4A96A","#8AAFC2","#C0614F",
  "#9E6650","#A8C4B0","#E8C4B2","#5A8F70","#B0A090",
  "#D9A890","#6B8FA8","#E0C090","#8B6B80","#90B8A0",
];

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ products: any[]; categories: any[]; movements: any[] }>({
    products: [], categories: [], movements: []
  });

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [prodRes, catRes, movRes] = await Promise.all([
        supabase.from("products").select("*"),
        supabase.from("categories").select("*"),
        supabase.from("stock_movements").select("*").order("created_at", { ascending: true })
      ]);
      if (prodRes.error) throw prodRes.error;
      if (catRes.error) throw catRes.error;
      if (movRes.error) throw movRes.error;
      setData({ products: prodRes.data || [], categories: catRes.data || [], movements: movRes.data || [] });
    } catch (err: any) {
      toast.error("Erro ao carregar relatórios: " + err.message);
    } finally { setLoading(false); }
  }

  const stats = useMemo(() => {
    const totalValue = data.products.reduce((acc, p) => acc + (Number(p.price) || 0) * p.stock, 0);
    const totalItems = data.products.reduce((acc, p) => acc + p.stock, 0);
    const critical = data.products.filter(p => p.stock > 0 && p.stock <= 5).length;
    const out = data.products.filter(p => p.stock === 0).length;
    return { totalValue, totalItems, critical, out };
  }, [data.products]);

  const stockByCategory = useMemo(() =>
    data.categories.map(cat => ({
      name: cat.name,
      quantidade: data.products.filter(p => p.category_id === cat.id).reduce((a, p) => a + p.stock, 0)
    })).filter(i => i.quantidade > 0),
    [data.categories, data.products]);

  const valueByCategory = useMemo(() =>
    data.categories.map(cat => ({
      name: cat.name,
      value: data.products.filter(p => p.category_id === cat.id).reduce((a, p) => a + (Number(p.price) || 0) * p.stock, 0)
    })).filter(i => i.value > 0),
    [data.categories, data.products]);

  const movementTrend = useMemo(() => {
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().split("T")[0];
    });
    return last7.map(date => {
      const mv = data.movements.filter(m => m.created_at?.startsWith(date));
      return {
        date: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        entradas: mv.filter(m => m.type === "IN").reduce((a, m) => a + m.quantity, 0),
        saidas: mv.filter(m => m.type === "OUT").reduce((a, m) => a + m.quantity, 0),
      };
    });
  }, [data.movements]);

  const criticalList = useMemo(() =>
    data.products.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock).slice(0, 6),
    [data.products]);

  const topProducts = useMemo(() =>
    data.products.slice(0, 6).sort((a, b) => b.stock - a.stock),
    [data.products]);

  // Tooltip customizado para o tema claro
  const tooltipStyle = {
    background: "#fff",
    border: "1px solid rgba(194,130,102,0.25)",
    borderRadius: 8,
    color: "#0D0F13",
    fontSize: 12,
  };

  return (
    <div className="content">
      <style jsx>{`
        /* Header */
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .title { font-family: "Raleway", sans-serif; font-size: 26px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--text-primary); }
        .title span { color: var(--accent-terra); }
        .sub { font-family: "DM Sans", sans-serif; font-size: 12px; color: var(--text-muted); margin-top: 6px; }
        .btn-export { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border: 1px solid rgba(194,130,102,0.35); border-radius: 8px; background: transparent; color: var(--accent-terra); font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-export:hover { background: rgba(194,130,102,0.08); }

        /* KPIs */
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 20px; }
        .kpi { background: #fff; border: 1px solid rgba(194,130,102,0.18); border-radius: 12px; padding: 18px 20px; position: relative; overflow: hidden; transition: box-shadow 0.2s; }
        .kpi:hover { box-shadow: 0 4px 20px rgba(194,130,102,0.12); }
        .kpi::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 12px 12px 0 0; }
        .kpi.terra::before { background: var(--accent-terra); }
        .kpi.sage::before { background: #7AAF90; }
        .kpi.red::before { background: #C0614F; }
        .kpi.amber::before { background: #D4A96A; }
        .k-label { font-family: "DM Sans", sans-serif; font-size: 11px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px; }
        .k-value { font-family: "Raleway", sans-serif; font-size: 28px; font-weight: 700; letter-spacing: 1px; line-height: 1; margin-bottom: 6px; }
        .kpi.terra .k-value { color: var(--accent-terra-dark); }
        .kpi.sage .k-value { color: #5A8F70; }
        .kpi.red .k-value { color: #C0614F; }
        .kpi.amber .k-value { color: #8A6830; }
        .k-sub { font-size: 11px; color: var(--text-muted); }

        /* Panels */
        .panel { background: #fff; border: 1px solid rgba(194,130,102,0.18); border-radius: 12px; overflow: hidden; animation: fadeIn 0.4s ease both; }
        .p-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid rgba(194,130,102,0.1); font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; color: var(--text-primary); }
        .p-body { padding: 16px 20px; }

        /* Grids */
        .grid2 { display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px; margin-bottom: 14px; }
        .grid2b { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
        @media (max-width: 900px) { .grid2, .grid2b { grid-template-columns: 1fr; } }

        /* Critical list */
        .crit-list { padding: 8px 0; }
        .crit-item { display: flex; align-items: center; gap: 12px; padding: 12px 20px; border-bottom: 1px solid rgba(194,130,102,0.08); transition: background 0.15s; }
        .crit-item:last-child { border-bottom: none; }
        .crit-item:hover { background: rgba(194,130,102,0.04); }
        .crit-name { font-weight: 600; color: var(--text-primary); font-size: 14px; }
        .crit-brand { font-size: 11px; color: var(--text-muted); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
        .crit-stock { font-family: "Raleway", sans-serif; font-size: 15px; font-weight: 700; }
        .crit-dot { width: 8px; height: 8px; border-radius: 50%; }

        /* Top table */
        .top-table table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .top-table th { padding: 10px 12px; color: var(--text-muted); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; border-bottom: 1px solid rgba(194,130,102,0.1); }
        .top-table td { padding: 10px 12px; color: var(--text-primary); border-bottom: 1px solid rgba(194,130,102,0.06); }
        .top-table tr:last-child td { border-bottom: none; }
        .tag { border: 1px solid; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; letter-spacing: 0.5px; }
        .color-dot { width: 10px; height: 10px; border-radius: 50%; }

        .empty { padding: 32px; text-align: center; font-size: 13px; color: var(--text-muted); }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Header */}
      <div className="header">
        <div>
          <div className="title">Relatórios <span>e Insights</span></div>
          <div className="sub">Análise do inventário e operações</div>
        </div>
        <button className="btn-export" onClick={() => window.print()}>📊 Exportar</button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi amber">
          <div className="k-label">Valor Total em Estoque</div>
          <div className="k-value">R${stats.totalValue.toLocaleString("pt-BR")}</div>
          <div className="k-sub">+8.3% vs mês anterior</div>
        </div>
        <div className="kpi terra">
          <div className="k-label">Total de Itens</div>
          <div className="k-value">{stats.totalItems}</div>
          <div className="k-sub">Entradas recentes incluídas</div>
        </div>
        <div className="kpi red">
          <div className="k-label">Estoque Crítico</div>
          <div className="k-value">{stats.critical}</div>
          <div className="k-sub">≤ 5 unidades</div>
        </div>
        <div className="kpi sage">
          <div className="k-label">Esgotados</div>
          <div className="k-value">{stats.out}</div>
          <div className="k-sub">Itens zerados</div>
        </div>
      </div>

      {/* Gráficos linha + pizza */}
      <div className="grid2">
        <div className="panel">
          <div className="p-head">Fluxo de Estoque (7d)</div>
          <div className="p-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={movementTrend}>
                <CartesianGrid stroke="rgba(194,130,102,0.08)" vertical={false} strokeDasharray="4 4" />
                <XAxis dataKey="date" tick={{ fill: "#A8978E", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#A8978E", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ color: "#7A6558", fontSize: 11 }} />
                <Line type="monotone" dataKey="entradas" stroke="#C28266" strokeWidth={2.4} dot={{ r: 4, fill: "#C28266" }} name="entradas" />
                <Line type="monotone" dataKey="saidas" stroke="#7AAF90" strokeWidth={2.4} dot={{ r: 4, fill: "#7AAF90" }} name="saidas" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="p-head">Distribuição por Categoria</div>
          <div className="p-body" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={valueByCategory} dataKey="value" nameKey="name" innerRadius={35} outerRadius={65} paddingAngle={2} cy="40%">
                  {valueByCategory.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ color: "#7A6558", fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Barras */}
      <div className="grid2b">
        <div className="panel">
          <div className="p-head">Valor por Categoria</div>
          <div className="p-body" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valueByCategory} layout="vertical">
                <CartesianGrid stroke="rgba(194,130,102,0.08)" horizontal={false} strokeDasharray="4 4" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fill: "#A8978E", fontSize: 10 }} width={120} />
                <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#C28266" barSize={14} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="p-head">Estoque por Categoria</div>
          <div className="p-body" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockByCategory}>
                <CartesianGrid stroke="rgba(194,130,102,0.08)" vertical={false} strokeDasharray="4 4" />
                <XAxis dataKey="name" tick={{ fill: "#A8978E", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#A8978E", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="quantidade" fill="#7AAF90" barSize={14} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Críticos + Top produtos */}
      <div className="grid2b">
        <div className="panel">
          <div className="p-head">Estoque Crítico</div>
          <div className="crit-list">
            {criticalList.length === 0 ? (
              <div className="empty">✅ Estoque saudável</div>
            ) : criticalList.map((p) => (
              <div key={p.id} className="crit-item">
                <div style={{ flex: 1 }}>
                  <div className="crit-name">{p.name}</div>
                  <div className="crit-brand">{p.brand}</div>
                </div>
                <span className="crit-stock" style={{ color: p.stock === 0 ? "#C0614F" : "#8A6830" }}>
                  {p.stock} un
                </span>
                <div className="crit-dot" style={{ background: p.stock === 0 ? "#C0614F" : "#D4A96A" }} />
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="p-head">Top Produtos por Volume</div>
          <div className="p-body top-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Produto</th>
                  <th>Estoque</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => {
                  const status = p.stock === 0 ? "ESGOTADO" : p.stock <= 5 ? "BAIXO" : "OK";
                  const color = p.stock === 0 ? "#C0614F" : p.stock <= 5 ? "#D4A96A" : "#7AAF90";
                  return (
                    <tr key={p.id}>
                      <td style={{ color: "#B0A090", fontWeight: 600 }}>{String(i + 1).padStart(2, "0")}</td>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td style={{ color: "#C28266", fontWeight: 700 }}>{p.stock}</td>
                      <td>
                        <span className="tag" style={{ borderColor: color, color }}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {loading && <div className="empty">Recarregando dados...</div>}
    </div>
  );
}