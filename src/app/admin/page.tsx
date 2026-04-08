"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ─── Tipos ─────────────────────────────────────────── */
type Activity = {
  type: "entry" | "exit";
  name: string;
  brand: string;
  meta: string;
  qty: string;
};

type DayBar = {
  label: string;
  entries: number;
  exits: number;
};

type TickerItem = {
  name: string;
  val: string;
  change: string;
  up: boolean;
};

type ChartPeriod = "7D" | "1M" | "3M";

/* ─── Helpers ────────────────────────────────────────── */
const DAYS_PT = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

function periodDays(period: ChartPeriod): number {
  return period === "7D" ? 7 : period === "1M" ? 30 : 90;
}

function buildDayLabels(days: number): { iso: string; label: string }[] {
  const result: { iso: string; label: string }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    result.push({
      iso: d.toISOString().slice(0, 10),
      label: days === 7 ? DAYS_PT[d.getDay()] : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
    });
  }
  return result;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Agora";
  if (diff < 3600) return `Há ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `Há ${Math.floor(diff / 3600)}h`;
  return `Há ${Math.floor(diff / 86400)}d`;
}

/* ─── Componente ─────────────────────────────────────── */
export default function AdminDashboard() {
  const [kpi, setKpi] = useState({ total: 0, emEstoque: 0, emFalta: 0, valor: 0 });
  const [displayKpi, setDisplayKpi] = useState({ total: 0, emEstoque: 0, emFalta: 0, valor: 0 });
  const [loadingKpi, setLoadingKpi] = useState(true);

  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("7D");
  const [chartData, setChartData] = useState<DayBar[]>([]);
  const [loadingChart, setLoadingChart] = useState(true);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const [ticker, setTicker] = useState<TickerItem[]>([]);

  const rafRef = useRef<number | null>(null);

  /* ── Relógio ── */
  useEffect(() => {
    const clockEl = document.getElementById("clock");
    const dateEl = document.getElementById("date-display");
    const update = () => {
      const now = new Date();
      if (clockEl) clockEl.textContent = now.toTimeString().slice(0, 8);
      if (dateEl)
        dateEl.textContent = now
          .toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
          .toUpperCase();
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  /* ── KPIs ── */
  useEffect(() => {
    async function load() {
      try {
        setLoadingKpi(true);
        const { data, error } = await supabase
          .from("products")
          .select("price, stock, is_out_of_stock")
          .eq("is_active", true);
        if (error) throw error;
        const total = data.length;
        const emFalta = data.filter((p) => p.is_out_of_stock || (p.stock ?? 0) <= 0).length;
        const emEstoque = total - emFalta;
        const valor = data.reduce((sum, p) => sum + (Number(p.price) || 0) * (p.stock || 0), 0);
        setKpi({ total, emEstoque, emFalta, valor });
      } catch (err: any) {
        console.error("KPI error:", err.message);
      } finally {
        setLoadingKpi(false);
      }
    }
    load();
  }, []);

  /* ── Animação KPI ── */
  useEffect(() => {
    if (loadingKpi) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = { ...displayKpi };
    const to = { ...kpi };
    const duration = 600;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayKpi({
        total: Math.round(from.total + (to.total - from.total) * ease),
        emEstoque: Math.round(from.emEstoque + (to.emEstoque - from.emEstoque) * ease),
        emFalta: Math.round(from.emFalta + (to.emFalta - from.emFalta) * ease),
        valor: Math.round(from.valor + (to.valor - from.valor) * ease),
      });
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [kpi, loadingKpi]);

  /* ── Gráfico ── */
  const loadChart = useCallback(async (period: ChartPeriod) => {
    try {
      setLoadingChart(true);
      const days = periodDays(period);
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data, error } = await supabase
        .from("stock_movements")
        .select("type, quantity, created_at")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;

      const labels = buildDayLabels(days);
      const map: Record<string, { entries: number; exits: number }> = {};
      labels.forEach(({ iso }) => { map[iso] = { entries: 0, exits: 0 }; });

      (data || []).forEach((row) => {
        const iso = row.created_at.slice(0, 10);
        if (!map[iso]) return;
        const qty = Math.abs(row.quantity || 0);
        if (row.type === "IN") map[iso].entries += qty;
        else if (row.type === "OUT") map[iso].exits += qty;
      });

      // Para períodos longos, agrupar em semanas/blocos de 7 para não sobrecarregar o gráfico
      const MAX_BARS = 7;
      if (labels.length <= MAX_BARS) {
        setChartData(labels.map(({ iso, label }) => ({ label, ...map[iso] })));
      } else {
        const step = Math.ceil(labels.length / MAX_BARS);
        const grouped: DayBar[] = [];
        for (let i = 0; i < labels.length; i += step) {
          const chunk = labels.slice(i, i + step);
          const entries = chunk.reduce((s, { iso }) => s + (map[iso]?.entries || 0), 0);
          const exits = chunk.reduce((s, { iso }) => s + (map[iso]?.exits || 0), 0);
          grouped.push({ label: chunk[0].label, entries, exits });
        }
        setChartData(grouped);
      }
    } catch (err: any) {
      console.error("Chart error:", err.message);
    } finally {
      setLoadingChart(false);
    }
  }, []);

  useEffect(() => { loadChart(chartPeriod); }, [chartPeriod, loadChart]);

  /* ── Atividades ── */
  useEffect(() => {
    async function load() {
      try {
        setLoadingActivities(true);
        const { data, error } = await supabase
          .from("stock_movements")
          .select("type, quantity, created_at, products(name, brand)")
          .order("created_at", { ascending: false })
          .limit(8);

        if (error) throw error;

        const list: Activity[] = (data || []).map((row: any) => {
          const isEntry = row.type === "IN";
          const qty = Math.abs(row.quantity || 0);
          return {
            type: isEntry ? "entry" : "exit",
            name: row.products?.name || "Produto",
            brand: row.products?.brand || "",
            meta: `${timeAgo(row.created_at)} · Admin PB`,
            qty: isEntry ? `+${qty}` : `-${qty}`,
          };
        });
        setActivities(list);
      } catch (err: any) {
        console.error("Activities error:", err.message);
      } finally {
        setLoadingActivities(false);
      }
    }
    load();
  }, []);

  /* ── Ticker (preços reais) ── */
  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("name, price, old_price")
          .eq("is_active", true)
          .order("price", { ascending: false })
          .limit(8);

        if (error) throw error;

        const items: TickerItem[] = (data || []).map((p) => {
          const price = Number(p.price) || 0;
          const old = Number(p.old_price) || price;
          const diff = old > 0 ? ((price - old) / old) * 100 : 0;
          const up = diff >= 0;
          const shortName = p.name.length > 14 ? p.name.slice(0, 14).toUpperCase() : p.name.toUpperCase();
          return {
            name: shortName,
            val: `R$${price.toLocaleString("pt-BR")}`,
            change: `${up ? "+" : ""}${diff.toFixed(1)}%`,
            up,
          };
        });
        setTicker(items.length > 0 ? items : []);
      } catch (err: any) {
        console.error("Ticker error:", err.message);
      }
    }
    load();
  }, []);

  /* ── Renderização do gráfico SVG ── */
  const renderChart = () => {
    if (loadingChart) {
      return (
        <text x="340" y="110" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="13" fill="#A8978E">
          Carregando...
        </text>
      );
    }
    if (!chartData.length) {
      return (
        <text x="340" y="110" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="13" fill="#A8978E">
          Sem movimentações no período
        </text>
      );
    }

    const H = 210; // altura útil das barras
    const maxVal = Math.max(...chartData.flatMap((d) => [d.entries, d.exits]), 1);
    const totalBars = chartData.length;
    const slotW = 680 / totalBars;
    const barW = Math.min(22, slotW * 0.35);

    const gridVals = [maxVal, maxVal * 0.75, maxVal * 0.5, maxVal * 0.25, 0];

    return (
      <>
        {/* Grid lines + Y labels */}
        {gridVals.map((v, i) => {
          const y = i * (H / 4);
          return (
            <g key={i}>
              <line x1="28" y1={y} x2="680" y2={y} stroke="rgba(194,130,102,0.1)" strokeWidth="1" strokeDasharray="4 4" />
              <text x="0" y={y + 4} fontFamily="DM Sans, sans-serif" fontSize="9" fill="#B0A090">
                {Math.round(v)}
              </text>
            </g>
          );
        })}

        {/* Barras */}
        {chartData.map((d, i) => {
          const cx = 30 + i * slotW + slotW / 2;
          const entryH = Math.max(d.entries > 0 ? 4 : 0, (d.entries / maxVal) * H);
          const exitH = Math.max(d.exits > 0 ? 4 : 0, (d.exits / maxVal) * H);
          const entryY = H - entryH;
          const exitY = H - exitH;

          return (
            <g key={i}>
              {/* Entrada */}
              <rect x={cx - barW - 2} y={entryY} width={barW} height={entryH} fill="#C28266" rx="3" opacity="0.85">
                <animate attributeName="y" from={H} to={entryY} dur="0.7s" fill="freeze" begin={`${i * 0.05}s`} />
                <animate attributeName="height" from="0" to={entryH} dur="0.7s" fill="freeze" begin={`${i * 0.05}s`} />
              </rect>
              {/* Saída */}
              <rect x={cx + 2} y={exitY} width={barW} height={exitH} fill="#7AAF90" rx="3" opacity="0.8">
                <animate attributeName="y" from={H} to={exitY} dur="0.7s" fill="freeze" begin={`${i * 0.05 + 0.05}s`} />
                <animate attributeName="height" from="0" to={exitH} dur="0.7s" fill="freeze" begin={`${i * 0.05 + 0.05}s`} />
              </rect>
              {/* X label */}
              <text
                x={cx}
                y={H + 14}
                fontFamily="DM Sans, sans-serif"
                fontSize="9"
                fill="#A8978E"
                textAnchor="middle"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </>
    );
  };

  /* ── JSX ─────────────────────────────────────────────── */
  return (
    <div className="page">

      {/* ── Cabeçalho ── */}
      <div className="page-header">
        <div>
          <div className="page-title">Visão <span>Geral</span></div>
          <div className="page-sub">Bem-vindo ao painel de controle da PB Imports</div>
        </div>
        <div className="time-display">
          <span className="time-val" id="clock">00:00:00</span>
          <span id="date-display" style={{ fontSize: "11px", letterSpacing: "1px" }}></span>
        </div>
      </div>

      {/* ── Ticker ── */}
      {ticker.length > 0 && (
        <div className="ticker">
          <div className="ticker-inner">
            {[...ticker, ...ticker].map((t, idx) => (
              <span className="ticker-item" key={`${t.name}-${idx}`}>
                <span className="t-name">{t.name}</span>
                <span className="t-val">{t.val}</span>
                <span className={t.up ? "t-up" : "t-down"}>{t.change}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="kpi-grid">
        <div className="kpi-card terra">
          <div className="kpi-header">
            <div className="kpi-icon">📦</div>
          </div>
          <div className="kpi-label">Total de Produtos</div>
          <div className="kpi-value">{loadingKpi ? "..." : displayKpi.total}</div>
          <div className="kpi-bar"><div className="kpi-bar-fill" style={{ width: "100%" }}></div></div>
        </div>

        <div className="kpi-card sage">
          <div className="kpi-header"><div className="kpi-icon">✅</div></div>
          <div className="kpi-label">Em Estoque</div>
          <div className="kpi-value">{loadingKpi ? "..." : displayKpi.emEstoque}</div>
          <div className="kpi-bar">
            <div className="kpi-bar-fill" style={{ width: `${Math.min(100, kpi.total ? (kpi.emEstoque / kpi.total) * 100 : 0)}%` }}></div>
          </div>
        </div>

        <div className="kpi-card red">
          <div className="kpi-header">
            <div className="kpi-icon">⚠️</div>
          </div>
          <div className="kpi-label">Produtos em Falta</div>
          <div className="kpi-value">{loadingKpi ? "..." : displayKpi.emFalta}</div>
          <div className="kpi-bar">
            <div className="kpi-bar-fill" style={{ width: `${Math.min(100, kpi.total ? (kpi.emFalta / kpi.total) * 100 : 0)}%` }}></div>
          </div>
        </div>

        <div className="kpi-card amber">
          <div className="kpi-header"><div className="kpi-icon">📈</div></div>
          <div className="kpi-label">Valor em Inventário</div>
          <div className="kpi-value" style={{ fontSize: "22px", letterSpacing: "1px" }}>
            {loadingKpi ? "..." : `R$ ${displayKpi.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          </div>
          <div className="kpi-bar"><div className="kpi-bar-fill" style={{ width: "85%" }}></div></div>
        </div>
      </div>

      {/* ── Grid inferior ── */}
      <div className="bottom-grid">

        {/* Gráfico */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Movimentações de Estoque</span>
            <div className="panel-controls">
              {(["7D", "1M", "3M"] as ChartPeriod[]).map((p) => (
                <button
                  key={p}
                  className={`ctrl-btn ${chartPeriod === p ? "active" : ""}`}
                  onClick={() => setChartPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-area">
            <svg className="chart-svg" viewBox="0 0 680 230" preserveAspectRatio="none">
              {renderChart()}
            </svg>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-dot" style={{ background: "#C28266" }}></div>
              Entradas de Estoque
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: "#7AAF90" }}></div>
              Saídas de Estoque
            </div>
          </div>
        </div>

        {/* Atividades */}
        <div className="panel activity-panel">
          <div className="panel-header">
            <span className="panel-title">Atividades Recentes</span>
          </div>
          <div className="activity-list">
            {loadingActivities ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#A8978E", fontSize: 13 }}>
                Carregando...
              </div>
            ) : activities.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#A8978E", fontSize: 13 }}>
                Nenhuma atividade recente
              </div>
            ) : (
              activities.map((a, i) => (
                <div className="activity-item" key={i}>
                  <div className={`activity-icon ${a.type}`}>{a.type === "entry" ? "↑" : "↓"}</div>
                  <div className="activity-info">
                    <div className="activity-name">{a.name}{a.brand ? ` – ${a.brand}` : ""}</div>
                    <div className="activity-meta">{a.meta}</div>
                  </div>
                  <div className={`activity-qty ${a.type === "exit" ? "out" : ""}`}>{a.qty}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .page { position: relative; z-index: 2; max-width: 1220px; margin: 0 auto; padding: 16px; }

        /* Header */
        .page-header { margin-bottom: 24px; display: flex; align-items: flex-end; justify-content: space-between; }
        .page-title { font-family: "Raleway", sans-serif; font-size: 28px; font-weight: 700; color: #0D0F13; letter-spacing: 1px; text-transform: uppercase; line-height: 1; }
        .page-title span { color: #C28266; }
        .page-sub { font-family: "DM Sans", sans-serif; font-size: 12px; color: #A8978E; letter-spacing: 1px; text-transform: uppercase; margin-top: 6px; }
        .time-display { font-family: "DM Sans", sans-serif; font-size: 11px; color: #A8978E; text-align: right; }
        .time-val { font-size: 22px; color: #C28266; font-family: "Raleway", sans-serif; font-weight: 700; display: block; letter-spacing: 2px; }

        /* Ticker */
        .ticker { background: #F2EDE0; border-top: 1px solid rgba(194,130,102,0.15); border-bottom: 1px solid rgba(194,130,102,0.15); padding: 8px 0; overflow: hidden; margin-bottom: 24px; border-radius: 8px; }
        .ticker-inner { display: flex; gap: 48px; animation: ticker 30s linear infinite; white-space: nowrap; }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ticker-item { display: flex; align-items: center; gap: 8px; font-family: "DM Sans", sans-serif; font-size: 11px; letter-spacing: 1px; color: #A8978E; text-transform: uppercase; }
        .t-name { color: #C28266; font-weight: 600; }
        .t-val { color: #0D0F13; font-weight: 500; }
        .t-up { color: #7AAF90; font-weight: 600; }
        .t-down { color: #C0614F; font-weight: 600; }

        /* KPIs */
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
        .kpi-card { background: #FFFFFF; border: 1px solid rgba(194,130,102,0.18); border-radius: 12px; padding: 22px; position: relative; overflow: hidden; transition: all 0.25s; }
        .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(194,130,102,0.14); }
        .kpi-card::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 12px 12px 0 0; }
        .kpi-card.terra::before { background: #C28266; }
        .kpi-card.sage::before { background: #7AAF90; }
        .kpi-card.red::before { background: #C0614F; }
        .kpi-card.amber::before { background: #D4A96A; }

        .kpi-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
        .kpi-icon { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; font-size: 18px; border-radius: 8px; }
        .kpi-card.terra .kpi-icon { background: rgba(194,130,102,0.1); border: 1px solid rgba(194,130,102,0.25); }
        .kpi-card.sage .kpi-icon { background: rgba(122,175,144,0.1); border: 1px solid rgba(122,175,144,0.25); }
        .kpi-card.red .kpi-icon { background: rgba(192,97,79,0.1); border: 1px solid rgba(192,97,79,0.25); }
        .kpi-card.amber .kpi-icon { background: rgba(212,169,106,0.1); border: 1px solid rgba(212,169,106,0.25); }

        .kpi-label { font-family: "DM Sans", sans-serif; font-size: 11px; color: #A8978E; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; }
        .kpi-value { font-family: "Raleway", sans-serif; font-size: 34px; font-weight: 700; line-height: 1; }
        .kpi-card.terra .kpi-value { color: #C28266; }
        .kpi-card.sage .kpi-value { color: #5A8F70; }
        .kpi-card.red .kpi-value { color: #C0614F; }
        .kpi-card.amber .kpi-value { color: #D4A96A; }

        .kpi-bar { margin-top: 14px; height: 3px; background: rgba(194,130,102,0.1); border-radius: 4px; overflow: hidden; }
        .kpi-bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
        .kpi-card.terra .kpi-bar-fill { background: #C28266; }
        .kpi-card.sage .kpi-bar-fill { background: #7AAF90; }
        .kpi-card.red .kpi-bar-fill { background: #C0614F; }
        .kpi-card.amber .kpi-bar-fill { background: #D4A96A; }

        /* Bottom grid */
        .bottom-grid { display: grid; grid-template-columns: 1fr 340px; gap: 14px; }
        .panel { background: #FFFFFF; border: 1px solid rgba(194,130,102,0.18); border-radius: 12px; overflow: hidden; }

        .panel-header { padding: 18px 22px 14px; border-bottom: 1px solid rgba(194,130,102,0.1); display: flex; align-items: center; justify-content: space-between; }
        .panel-title { font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 700; color: #0D0F13; letter-spacing: 1px; text-transform: uppercase; }
        .panel-controls { display: flex; gap: 6px; }
        .ctrl-btn { padding: 5px 12px; font-family: "DM Sans", sans-serif; font-size: 11px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; cursor: pointer; border: 1px solid rgba(194,130,102,0.25); border-radius: 6px; background: transparent; color: #A8978E; transition: all 0.2s; }
        .ctrl-btn.active, .ctrl-btn:hover { border-color: #C28266; color: #C28266; background: rgba(194,130,102,0.08); }

        /* Chart */
        .chart-area { padding: 20px 20px 8px; height: 270px; }
        .chart-svg { width: 100%; height: 100%; }
        .chart-legend { display: flex; gap: 20px; padding: 0 22px 18px; }
        .legend-item { display: flex; align-items: center; gap: 8px; font-family: "DM Sans", sans-serif; font-size: 11px; color: #A8978E; letter-spacing: 0.5px; }
        .legend-dot { width: 10px; height: 10px; border-radius: 3px; }

        /* Activities */
        .activity-list { padding: 8px 0; max-height: 340px; overflow-y: auto; }
        .activity-list::-webkit-scrollbar { width: 3px; }
        .activity-list::-webkit-scrollbar-track { background: #F2EDE0; }
        .activity-list::-webkit-scrollbar-thumb { background: rgba(194,130,102,0.4); border-radius: 4px; }
        .activity-item { display: flex; align-items: center; gap: 12px; padding: 11px 18px; border-bottom: 1px solid rgba(194,130,102,0.08); transition: background 0.2s; cursor: pointer; }
        .activity-item:hover { background: rgba(194,130,102,0.04); }
        .activity-icon { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 12px; border-radius: 6px; }
        .activity-icon.entry { background: rgba(122,175,144,0.1); border: 1px solid rgba(122,175,144,0.3); color: #5A8F70; }
        .activity-icon.exit { background: rgba(192,97,79,0.1); border: 1px solid rgba(192,97,79,0.3); color: #C0614F; }
        .activity-info { flex: 1; min-width: 0; }
        .activity-name { font-size: 13px; font-weight: 600; color: #0D0F13; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .activity-meta { font-size: 11px; color: #A8978E; margin-top: 2px; }
        .activity-qty { font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 700; color: #5A8F70; }
        .activity-qty.out { color: #C0614F; }

        /* Responsivo */
        @media (max-width: 1100px) {
          .page { padding: 12px; }
          .page-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .bottom-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 700px) {
          .page { padding: 10px; }
          .page-title { font-size: 22px; }
          .ticker-inner { animation-duration: 20s; gap: 28px; }
          .kpi-grid { grid-template-columns: 1fr; }
          .panel-header { flex-direction: column; align-items: flex-start; gap: 10px; }
          .chart-area { padding: 14px; }
        }
      `}</style>
    </div>
  );
}