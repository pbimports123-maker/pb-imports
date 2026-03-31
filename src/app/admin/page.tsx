
"use client";

import { useEffect } from "react";

type TickerItem = { name: string; val: string; change: string; up: boolean };
type Activity = { type: "entry" | "exit"; name: string; meta: string; qty: string };

const TICKER_DATA: TickerItem[] = [
  { name: "TIRZEP-5MG", val: "R$330", change: "+2.1%", up: true },
  { name: "SEMAGL-10MG", val: "R$420", change: "+0.8%", up: true },
  { name: "RETATR-20MG", val: "R$1.200", change: "-1.2%", up: false },
  { name: "BPC157-10MG", val: "R$450", change: "+3.4%", up: true },
  { name: "IPAMORL-5MG", val: "R$360", change: "+0.5%", up: true },
  { name: "NAD+-500MG", val: "R$570", change: "-0.3%", up: false },
  { name: "TB500-10MG", val: "R$490", change: "+1.1%", up: true },
  { name: "EPITHAL-50MG", val: "R$1.200", change: "+4.2%", up: true },
];

const ACTIVITIES: Activity[] = [
  { type: "entry", name: "Tirzepatida 60mg - Gen", meta: "Há 2h · Admin PB", qty: "+10" },
  { type: "entry", name: "BPC-157 10mg - Neuroceptix", meta: "Há 2h · Admin PB", qty: "+10" },
  { type: "entry", name: "Retatrutida 40mg - HP", meta: "Há 3h · Admin PB", qty: "+10" },
  { type: "exit", name: "Semaglutida 5mg - ZPHCD", meta: "Há 4h · Admin PB", qty: "-5" },
  { type: "entry", name: "Ipamorelin 10mg - Neuroceptix", meta: "Há 5h · Admin PB", qty: "+10" },
  { type: "exit", name: "PT-141 10mg - Atlas", meta: "Há 6h · Admin PB", qty: "-3" },
  { type: "entry", name: "NAD+ 500mg - ZPHC", meta: "Há 7h · Admin PB", qty: "+20" },
  { type: "entry", name: "Epithalon 50mg - Neuroceptix", meta: "Há 8h · Admin PB", qty: "+5" },
];

export default function AdminDashboard() {
  useEffect(() => {
    // clock
    const clockEl = document.getElementById("clock");
    const dateEl = document.getElementById("date-display");
    const updateClock = () => {
      const now = new Date();
      if (clockEl) clockEl.textContent = now.toTimeString().slice(0, 8);
      if (dateEl)
        dateEl.textContent = now
          .toLocaleDateString("pt-BR", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          .toUpperCase();
    };
    updateClock();
    const clockTimer = setInterval(updateClock, 1000);

    // counters
    document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
      const target = parseInt(el.dataset.target || "0", 10);
      let current = 0;
      const step = Math.max(1, target / 60);
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = Math.floor(current).toString();
        if (current >= target) clearInterval(timer);
      }, 16);
    });

    return () => {
      clearInterval(clockTimer);
    };
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">
            Visão <span>Geral</span>
          </div>
          <div className="page-sub">// Bem-vindo ao painel de controle da PB Imports</div>
        </div>
        <div className="time-display">
          <span className="time-val" id="clock">
            00:00:00
          </span>
          <span id="date-display" style={{ fontSize: "10px", letterSpacing: "2px" }}></span>
        </div>
      </div>

      <div className="ticker">
        <div className="ticker-inner">
          {[...TICKER_DATA, ...TICKER_DATA].map((t, idx) => (
            <span className="ticker-item" key={`${t.name}-${idx}`}>
              <span className="t-name">{t.name}</span>
              <span className="t-val">{t.val}</span>
              <span className={t.up ? "t-up" : "t-down"}>{t.change}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card cyan">
          <div className="kpi-header">
            <div className="kpi-icon">📦</div>
            <span className="kpi-badge badge-new">+12 novos</span>
          </div>
          <div className="kpi-label">Total de Produtos</div>
          <div className="kpi-value" data-count data-target="722">
            0
          </div>
          <div className="kpi-bar">
            <div className="kpi-bar-fill" style={{ width: "73%" }}></div>
          </div>
        </div>

        <div className="kpi-card green">
          <div className="kpi-header">
            <div className="kpi-icon">✅</div>
          </div>
          <div className="kpi-label">Em Estoque</div>
          <div className="kpi-value" data-count data-target="533">
            0
          </div>
          <div className="kpi-bar">
            <div className="kpi-bar-fill" style={{ width: "74%" }}></div>
          </div>
        </div>

        <div className="kpi-card red">
          <div className="kpi-header">
            <div className="kpi-icon">⚠️</div>
            <span className="kpi-badge badge-warn">5% aumento</span>
          </div>
          <div className="kpi-label">Produtos em Falta</div>
          <div className="kpi-value" data-count data-target="189">
            0
          </div>
          <div className="kpi-bar">
            <div className="kpi-bar-fill" style={{ width: "26%" }}></div>
          </div>
        </div>

        <div className="kpi-card gold">
          <div className="kpi-header">
            <div className="kpi-icon">📈</div>
          </div>
          <div className="kpi-label">Valor em Inventário</div>
          <div className="kpi-value" style={{ fontSize: "22px", letterSpacing: "1px" }}>
            R$142.500
          </div>
          <div className="kpi-bar">
            <div className="kpi-bar-fill" style={{ width: "85%" }}></div>
          </div>
        </div>
      </div>

      <div className="bottom-grid">
        <div className="panel">
          <div className="panel-corner tl"></div>
          <div className="panel-corner tr"></div>
          <div className="panel-corner bl"></div>
          <div className="panel-corner br"></div>
          <div className="panel-header">
            <span className="panel-title">Movimentações de Estoque</span>
            <div className="panel-controls">
              <button className="ctrl-btn active">7D</button>
              <button className="ctrl-btn">1M</button>
              <button className="ctrl-btn">3M</button>
            </div>
          </div>
          <div className="chart-area">
            <svg className="chart-svg" viewBox="0 0 680 220" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="680" y2="0" stroke="rgba(0,229,255,0.06)" strokeWidth="1" />
              <line x1="0" y1="55" x2="680" y2="55" stroke="rgba(0,229,255,0.06)" strokeWidth="1" />
              <line x1="0" y1="110" x2="680" y2="110" stroke="rgba(0,229,255,0.06)" strokeWidth="1" />
              <line x1="0" y1="165" x2="680" y2="165" stroke="rgba(0,229,255,0.06)" strokeWidth="1" />
              <line x1="0" y1="220" x2="680" y2="220" stroke="rgba(0,229,255,0.06)" strokeWidth="1" />

              {/* Y labels */}
              {[
                { y: 8, label: "100" },
                { y: 63, label: "75" },
                { y: 118, label: "50" },
                { y: 173, label: "25" },
                { y: 220, label: "0" },
              ].map((t, i) => (
                <text
                  key={i}
                  x="0"
                  y={t.y}
                  fontFamily="Share Tech Mono"
                  fontSize="8"
                  fill="#2a4060"
                >
                  {t.label}
                </text>
              ))}

              {/* Entradas (cyan) */}
              {[
                { x: 30, y: 132, h: 88, d: 0 },
                { x: 118, y: 148, h: 72, d: 0.1 },
                { x: 206, y: 110, h: 110, d: 0.15 },
                { x: 294, y: 0, h: 220, d: 0.2 },
                { x: 382, y: 148, h: 72, d: 0.25 },
                { x: 470, y: 110, h: 110, d: 0.3 },
                { x: 558, y: 132, h: 88, d: 0.35 },
              ].map((b, i) => (
                <rect key={`c${i}`} x={b.x} y={b.y} width="26" height={b.h} fill="rgba(0,229,255,0.7)" rx="0">
                  <animate attributeName="y" from="220" to={b.y} dur="1s" fill="freeze" begin={`${b.d}s`} />
                  <animate attributeName="height" from="0" to={b.h} dur="1s" fill="freeze" begin={`${b.d}s`} />
                </rect>
              ))}

              {/* Saídas (gold) */}
              {[
                { x: 58, y: 165, h: 55, d: 0.05 },
                { x: 146, y: 187, h: 33, d: 0.12 },
                { x: 234, y: 155, h: 65, d: 0.17 },
                { x: 322, y: 110, h: 110, d: 0.22 },
                { x: 410, y: 99, h: 121, d: 0.27 },
                { x: 498, y: 99, h: 121, d: 0.32 },
                { x: 586, y: 132, h: 88, d: 0.37 },
              ].map((b, i) => (
                <rect key={`g${i}`} x={b.x} y={b.y} width="26" height={b.h} fill="rgba(255,214,0,0.7)" rx="0">
                  <animate attributeName="y" from="220" to={b.y} dur="1s" fill="freeze" begin={`${b.d}s`} />
                  <animate attributeName="height" from="0" to={b.h} dur="1s" fill="freeze" begin={`${b.d}s`} />
                </rect>
              ))}

              {/* X labels */}
              {["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"].map((d, i) => (
                <text
                  key={d}
                  x={43 + i * 88}
                  y="215"
                  fontFamily="Share Tech Mono"
                  fontSize="9"
                  fill="#4a7090"
                  textAnchor="middle"
                >
                  {d}
                </text>
              ))}
            </svg>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-dot" style={{ background: "var(--accent-cyan)" }}></div>
              Entradas de Estoque
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: "var(--accent-gold)" }}></div>
              Saídas de Estoque
            </div>
          </div>
        </div>

        <div className="panel activity-panel">
          <div className="panel-corner tl"></div>
          <div className="panel-corner tr"></div>
          <div className="panel-corner bl"></div>
          <div className="panel-corner br"></div>
          <div className="panel-header">
            <span className="panel-title">Atividades Recentes</span>
            <button className="ctrl-btn">Ver Tudo</button>
          </div>
          <div className="activity-list">
            {ACTIVITIES.map((a, i) => (
              <div className="activity-item" key={`${a.name}-${i}`}>
                <div className={`activity-icon ${a.type}`}>{a.type === "entry" ? "↑" : "↓"}</div>
                <div className="activity-info">
                  <div className="activity-name">{a.name}</div>
                  <div className="activity-meta">{a.meta}</div>
                </div>
                <div className={`activity-qty ${a.type === "exit" ? "out" : ""}`}>{a.qty}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pulse-ring"></div>

      <style jsx global>{`
        .text-gray-900 {
          color: var(--text-primary) !important;
        }
        .text-gray-500 {
          color: var(--text-muted) !important;
        }
        .text-blue-600 {
          color: var(--accent-cyan) !important;
        }
        .text-green-600 {
          color: var(--accent-green) !important;
        }
        .bg-blue-50 {
          background: rgba(0, 229, 255, 0.12) !important;
        }
        .bg-white {
          background: var(--bg-card) !important;
          border: 1px solid var(--border-dim) !important;
        }
        .border-gray-200 {
          border-color: var(--border-dim) !important;
        }
        .shadow-sm {
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45) !important;
        }
        .rounded-xl {
          border-radius: 14px !important;
        }
        .bg-gray-50 {
          background: rgba(255, 255, 255, 0.04) !important;
          color: var(--text-primary) !important;
        }
        .bg-green-600 {
          background: linear-gradient(135deg, #0b8f5f, #00ff9d) !important;
        }
        .bg-red-600 {
          background: linear-gradient(135deg, #a11f3a, #ff2d5f) !important;
        }
        .bg-amber-500 {
          background: linear-gradient(135deg, #b88a00, #ffd600) !important;
          color: #05070c !important;
        }
        .bg-[#1e3a5f] {
          background: linear-gradient(135deg, #0a2b4f, #00e5ff) !important;
        }
      `}</style>

      <style jsx>{`
        .page {
          position: relative;
          z-index: 2;
        }
        .page-header {
          margin-bottom: 28px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }
        .page-title {
          font-family: "Orbitron", monospace;
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: 3px;
          text-transform: uppercase;
          line-height: 1;
        }
        .page-title span {
          color: var(--accent-cyan);
        }
        .page-sub {
          font-family: "Share Tech Mono", monospace;
          font-size: 11px;
          color: var(--text-muted);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 8px;
        }
        .time-display {
          font-family: "Share Tech Mono", monospace;
          font-size: 11px;
          color: var(--text-muted);
          text-align: right;
        }
        .time-val {
          font-size: 22px;
          color: var(--accent-cyan);
          font-family: "Orbitron", monospace;
          font-weight: 500;
          display: block;
          letter-spacing: 3px;
        }

        .ticker {
          background: var(--bg-panel);
          border-top: 1px solid var(--border-dim);
          border-bottom: 1px solid var(--border-dim);
          padding: 8px 0;
          overflow: hidden;
          margin-bottom: 28px;
        }
        .ticker-inner {
          display: flex;
          gap: 48px;
          animation: ticker 30s linear infinite;
          white-space: nowrap;
        }
        @keyframes ticker {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .ticker-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: "Share Tech Mono", monospace;
          font-size: 10px;
          letter-spacing: 2px;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .t-name {
          color: var(--accent-cyan);
        }
        .t-val {
          color: var(--text-primary);
        }
        .t-up {
          color: var(--accent-green);
        }
        .t-down {
          color: var(--accent-red);
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 28px;
        }
        .kpi-card {
          background: var(--bg-card);
          border: 1px solid var(--border-dim);
          padding: 24px;
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
        }
        .kpi-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
        }
        .kpi-card.cyan::before {
          background: linear-gradient(90deg, transparent, var(--accent-cyan), transparent);
        }
        .kpi-card.green::before {
          background: linear-gradient(90deg, transparent, var(--accent-green), transparent);
        }
        .kpi-card.red::before {
          background: linear-gradient(90deg, transparent, var(--accent-red), transparent);
        }
        .kpi-card.gold::before {
          background: linear-gradient(90deg, transparent, var(--accent-gold), transparent);
        }
        .kpi-card::after {
          content: "";
          position: absolute;
          bottom: -30px;
          right: -30px;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          opacity: 0.04;
        }
        .kpi-card.cyan::after {
          background: var(--accent-cyan);
        }
        .kpi-card.green::after {
          background: var(--accent-green);
        }
        .kpi-card.red::after {
          background: var(--accent-red);
        }
        .kpi-card.gold::after {
          background: var(--accent-gold);
        }
        .kpi-card:hover {
          border-color: rgba(0, 229, 255, 0.25);
          transform: translateY(-2px);
          box-shadow: 0 8px 40px rgba(0, 229, 255, 0.08);
        }
        .kpi-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .kpi-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          position: relative;
        }
        .kpi-card.cyan .kpi-icon {
          background: rgba(0, 229, 255, 0.1);
          border: 1px solid rgba(0, 229, 255, 0.3);
        }
        .kpi-card.green .kpi-icon {
          background: rgba(0, 255, 157, 0.1);
          border: 1px solid rgba(0, 255, 157, 0.3);
        }
        .kpi-card.red .kpi-icon {
          background: rgba(255, 45, 95, 0.1);
          border: 1px solid rgba(255, 45, 95, 0.3);
        }
        .kpi-card.gold .kpi-icon {
          background: rgba(255, 214, 0, 0.1);
          border: 1px solid rgba(255, 214, 0, 0.3);
        }
        .kpi-badge {
          font-family: "Share Tech Mono", monospace;
          font-size: 9px;
          padding: 3px 8px;
          border: 1px solid;
          letter-spacing: 1px;
        }
        .badge-new {
          border-color: var(--accent-green);
          color: var(--accent-green);
          background: rgba(0, 255, 157, 0.08);
        }
        .badge-warn {
          border-color: var(--accent-red);
          color: var(--accent-red);
          background: rgba(255, 45, 95, 0.08);
        }
        .kpi-label {
          font-family: "Share Tech Mono", monospace;
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .kpi-value {
          font-family: "Orbitron", monospace;
          font-size: 34px;
          font-weight: 700;
          line-height: 1;
          letter-spacing: 2px;
        }
        .kpi-card.cyan .kpi-value {
          color: var(--accent-cyan);
        }
        .kpi-card.green .kpi-value {
          color: var(--accent-green);
        }
        .kpi-card.red .kpi-value {
          color: var(--accent-red);
        }
        .kpi-card.gold .kpi-value {
          color: var(--accent-gold);
        }
        .kpi-bar {
          margin-top: 16px;
          height: 2px;
          background: rgba(255, 255, 255, 0.05);
          position: relative;
        }
        .kpi-bar-fill {
          height: 100%;
          position: relative;
        }

        .bottom-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 16px;
        }
        .panel {
          background: var(--bg-card);
          border: 1px solid var(--border-dim);
          position: relative;
          overflow: hidden;
        }
        .panel-corner {
          position: absolute;
          width: 16px;
          height: 16px;
        }
        .panel-corner.tl {
          top: 0;
          left: 0;
          border-top: 2px solid var(--accent-cyan);
          border-left: 2px solid var(--accent-cyan);
        }
        .panel-corner.tr {
          top: 0;
          right: 0;
          border-top: 2px solid var(--accent-cyan);
          border-right: 2px solid var(--accent-cyan);
        }
        .panel-corner.bl {
          bottom: 0;
          left: 0;
          border-bottom: 2px solid var(--accent-cyan);
          border-left: 2px solid var(--accent-cyan);
        }
        .panel-corner.br {
          bottom: 0;
          right: 0;
          border-bottom: 2px solid var(--accent-cyan);
          border-right: 2px solid var(--accent-cyan);
        }
        .panel-header {
          padding: 20px 24px 16px;
          border-bottom: 1px solid var(--border-dim);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .panel-title {
          font-family: "Orbitron", monospace;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: 3px;
          text-transform: uppercase;
        }
        .panel-controls {
          display: flex;
          gap: 8px;
        }
        .ctrl-btn {
          padding: 4px 10px;
          font-family: "Share Tech Mono", monospace;
          font-size: 9px;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          border: 1px solid var(--border-dim);
          background: transparent;
          color: var(--text-muted);
          transition: all 0.2s;
        }
        .ctrl-btn.active,
        .ctrl-btn:hover {
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
          background: rgba(0, 229, 255, 0.06);
        }
        .chart-area {
          padding: 24px;
          height: 280px;
          position: relative;
        }
        .chart-svg {
          width: 100%;
          height: 100%;
        }
        .chart-legend {
          display: flex;
          gap: 20px;
          padding: 0 24px 20px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: "Share Tech Mono", monospace;
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .legend-dot {
          width: 8px;
          height: 2px;
        }
        .activity-panel .activity-list {
          max-height: 320px;
          overflow-y: auto;
        }
        .activity-list {
          padding: 12px 0;
          max-height: 320px;
          overflow-y: auto;
        }
        .activity-list::-webkit-scrollbar {
          width: 3px;
        }
        .activity-list::-webkit-scrollbar-track {
          background: var(--bg-card2);
        }
        .activity-list::-webkit-scrollbar-thumb {
          background: var(--accent-cyan);
          opacity: 0.3;
        }
        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          border-bottom: 1px solid var(--border-dim);
          transition: background 0.2s;
          cursor: pointer;
        }
        .activity-item:hover {
          background: rgba(0, 229, 255, 0.04);
        }
        .activity-icon {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 11px;
        }
        .activity-icon.entry {
          background: rgba(0, 255, 157, 0.1);
          border: 1px solid rgba(0, 255, 157, 0.3);
          color: var(--accent-green);
        }
        .activity-icon.exit {
          background: rgba(255, 45, 95, 0.1);
          border: 1px solid rgba(255, 45, 95, 0.3);
          color: var(--accent-red);
        }
        .activity-info {
          flex: 1;
          min-width: 0;
        }
        .activity-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: 0.5px;
        }
        .activity-meta {
          font-family: "Share Tech Mono", monospace;
          font-size: 9px;
          color: var(--text-muted);
          margin-top: 2px;
          letter-spacing: 1px;
        }
        .activity-qty {
          font-family: "Orbitron", monospace;
          font-size: 12px;
          font-weight: 700;
          color: var(--accent-green);
        }
        .activity-qty.out {
          color: var(--accent-red);
        }
        .pulse-ring {
          position: fixed;
          bottom: 40px;
          right: 40px;
          width: 80px;
          height: 80px;
          pointer-events: none;
          z-index: 5;
        }
        .pulse-ring::before,
        .pulse-ring::after {
          content: "";
          position: absolute;
          inset: 0;
          border: 1px solid var(--accent-cyan);
          border-radius: 50%;
          opacity: 0;
          animation: ringPulse 3s ease-out infinite;
        }
        .pulse-ring::after {
          animation-delay: 1.5s;
        }
        @keyframes ringPulse {
          0% {
            transform: scale(0.5);
            opacity: 0.6;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
