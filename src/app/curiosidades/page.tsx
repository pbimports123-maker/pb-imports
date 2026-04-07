"use client";

import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

type Curiosity = {
  id: string;
  title: string;
  content: string;
  created_at?: string;
};

type CuriosityTag = "Peptídeo" | "Protocolo" | "Segurança" | "Geral";

type DecoratedCuriosity = Curiosity & {
  tag: CuriosityTag;
  accent: string;
  tagClass: string;
  readTime: number;
  icon: string;
  formatted: FormattedContent;
};

type PeptideRow = { name: string; clinical: string; biological: string };

type FormattedContent = {
  lead?: string;
  dashItems: string[];
  body: string[];
  highlight?: string;
};

function maybeParsePeptide(content: string): PeptideRow[] {
  return content
    .split(/\n+/)
    .map((line) => line.trim())
    .map((line) => {
      const match = line.match(/^(.*?):\s*cl[ií]nico\s*([^·-]+)[·-]?\s*biol[óo]gico\s*(.+)$/i);
      if (!match) return null;
      const [, name, clinical, biological] = match;
      return {
        name: name.trim(),
        clinical: clinical.trim(),
        biological: biological.trim(),
      };
    })
    .filter((row): row is PeptideRow => !!row);
}

const TAG_META: Record<CuriosityTag, { accent: string; tagClass: string; icon: string }> = {
  Peptídeo: { accent: "var(--accent-green)", tagClass: "tag-green", icon: "🧬" },
  Protocolo: { accent: "var(--accent-cyan)", tagClass: "tag-cyan", icon: "⏱" },
  Segurança: { accent: "var(--accent-red)", tagClass: "tag-red", icon: "🛡" },
  Geral: { accent: "var(--accent-purple)", tagClass: "tag-purple", icon: "✦" },
};

function inferTagFromText(text: string): CuriosityTag {
  const lower = text.toLowerCase();
  if (
    lower.includes("pept") ||
    lower.includes("semaglutida") ||
    lower.includes("tirzepatida") ||
    lower.includes("ipamorelina") ||
    lower.includes("ghk")
  ) {
    return "Peptídeo";
  }
  if (lower.includes("protocolo") || lower.includes("dose") || lower.includes("doses") || lower.includes("pico")) {
    return "Protocolo";
  }
  if (lower.includes("segurança") || lower.includes("risco") || lower.includes("cuidad") || lower.includes("colateral")) {
    return "Segurança";
  }
  return "Geral";
}

function formatDate(date?: string) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("pt-BR");
}

function structureContent(raw: string): FormattedContent {
  const text = raw.trim().replace(/\s+/g, " ");
  const result: FormattedContent = { lead: undefined, dashItems: [], body: [], highlight: undefined };

  const highlightMatch = text.match(/(Ciência exige.*)$/i);
  if (highlightMatch) {
    result.highlight = highlightMatch[1].trim();
  }
  const withoutHighlight = result.highlight ? text.replace(result.highlight, "").trim() : text;

  const clinicalMatch = withoutHighlight.match(/pico clínico:\s*(.*?)(?=pico biológico:|$)/i);
  const biologicalMatch = withoutHighlight.match(/pico biológico:\s*(.*)$/i);

  if (clinicalMatch) result.dashItems.push(`Pico clínico: ${clinicalMatch[1].trim()}`);
  if (biologicalMatch) result.dashItems.push(`Pico biológico: ${biologicalMatch[1].trim()}`);

  const beforeClinical = clinicalMatch ? withoutHighlight.split(clinicalMatch[0])[0].trim() : "";
  if (beforeClinical) result.lead = beforeClinical;

  const afterBio = biologicalMatch ? withoutHighlight.split(biologicalMatch[0])[1]?.trim() : "";
  const bodyText = afterBio || (!clinicalMatch && !biologicalMatch ? withoutHighlight : "");
  if (bodyText) {
    bodyText
      .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÎÔÛÃÕ])/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((p) => result.body.push(p));
  }

  return result;
}

export default function CuriosidadesPage() {
  const [items, setItems] = useState<Curiosity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<CuriosityTag | "">("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("curiosities")
        .select("id,title,content,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("Erro ao carregar curiosidades", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  const decorated: DecoratedCuriosity[] = useMemo(
    () =>
      (items || []).map((item) => {
        const joined = `${item.title ?? ""} ${item.content ?? ""}`;
        const tag = inferTagFromText(joined);
        const meta = TAG_META[tag];
        const words = (item.content || "").trim().split(/\s+/).filter(Boolean).length;
        const readTime = Math.max(1, Math.round(words / 150));
        return {
          ...item,
          tag,
          accent: meta.accent,
          tagClass: meta.tagClass,
          readTime,
          icon: meta.icon,
          formatted: structureContent(item.content || ""),
        };
      }),
    [items]
  );

  const filtered = useMemo(
    () =>
      decorated.filter((item) => {
        const text = `${item.title} ${item.content}`.toLowerCase();
        const matchTag = !activeTag || item.tag === activeTag;
        const matchSearch = !search || text.includes(search.toLowerCase());
        return matchTag && matchSearch;
      }),
    [decorated, activeTag, search]
  );

  const updatedLabel = useMemo(
    () => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    []
  );

  return (
    <>
      <Head>
        <title>PB Imports — Curiosidades e Dicas</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Share+Tech+Mono&family=Rajdhani:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="ambient ambient-1" />
      <div className="ambient ambient-2" />

      <nav className="top-nav">
        <Link href="/" className="btn-back">
          ← Voltar
        </Link>
        <div className="nav-pill">
          <div className="nav-dot" />
          Curiosidades
        </div>
        <div className="nav-right">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              type="text"
              value={search}
              placeholder="BUSCAR CURIOSIDADE..."
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="tag-filter">
            <button className={`tag-btn ${activeTag === "" ? "active" : ""}`} onClick={() => setActiveTag("")}>
              Todos
            </button>
            <button className={`tag-btn ${activeTag === "Peptídeo" ? "active" : ""}`} onClick={() => setActiveTag("Peptídeo")}>
              Peptídeos
            </button>
            <button className={`tag-btn ${activeTag === "Protocolo" ? "active" : ""}`} onClick={() => setActiveTag("Protocolo")}>
              Protocolo
            </button>
            <button className={`tag-btn ${activeTag === "Segurança" ? "active" : ""}`} onClick={() => setActiveTag("Segurança")}>
              Segurança
            </button>
          </div>
        </div>
      </nav>

      <div className="page">
        <div className="page-header">
          <div className="header-left">
            <div className="header-icon">✦</div>
            <div className="header-text">
              <div className="page-title">
                Curiosidades e <span>Dicas</span>
              </div>
              <div className="page-sub">// Conteúdo rápido sobre produtos, prazos, segurança e boas práticas</div>
            </div>
          </div>
          <div className="header-stats">
            <div className="hstat">
              <div className="hstat-val">{loading ? "…" : filtered.length}</div>
              <div className="hstat-label">Publicações</div>
            </div>
            <div className="hstat-div" />
            <div className="hstat">
              <div className="hstat-val">{updatedLabel}</div>
              <div className="hstat-label">Atualizado</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="curiosidade-card wide" style={{ border: "1px solid var(--border-dim)" }}>
            <div className="c-body" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Loader2 className="animate-spin" size={18} />
              <span className="c-text">Carregando curiosidades...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="cards-grid">
            <div className="empty-state">
              <div className="empty-icon">◈</div>
              <div className="empty-text">// Nenhuma curiosidade encontrada</div>
            </div>
          </div>
        ) : (
          <div className="cards-grid" id="cardsGrid">
            {filtered.map((item, idx) => (
              <article
                key={item.id}
                className="curiosidade-card"
                data-tags={item.tag}
                style={{ ["--card-accent" as any]: item.accent, animationDelay: `${0.04 * (idx + 1)}s` }}
              >
                <div className="c-header">
                  <div className="c-header-left">
                    <div className="c-icon" style={{ borderColor: "rgba(0,229,255,0.2)", background: "rgba(0,229,255,0.06)" }}>
                      {item.icon}
                    </div>
                    <div className="c-titles">
                      <div className="c-title">{item.title}</div>
                      <div className="c-tags c-tags-under">
                        {item.tag === "Peptídeo" ? (
                          <>
                            <span className="c-tag tag-green">Peptídeo</span>
                            <span className="c-tag tag-blue">Referência</span>
                          </>
                        ) : (
                          <>
                            <span className="c-tag tag-cyan">Protocolo</span>
                            <span className="c-tag tag-gold">Tempo</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="c-meta">
                    {item.created_at && <div className="c-date">{formatDate(item.created_at)}</div>}
                    <div className="c-read-time">~{item.readTime} min</div>
                  </div>
                </div>
                <div className="c-body">
                  {item.tag === "Peptídeo" && maybeParsePeptide(item.content).length >= 3 ? (
                    <div className="peptide-block">
                      <div className="peptide-header">
                        <div className="ph-label">Peptídeo</div>
                        <div className="ph-label">
                          <span className="p-dot clinico" />
                          Clínico
                        </div>
                        <div className="ph-label">
                          <span className="p-dot bio" />
                          Biológico
                        </div>
                      </div>
                      <div className="peptide-table">
                        {maybeParsePeptide(item.content).map((row, rIdx) => (
                          <div className="peptide-row" key={rIdx}>
                            <span className="p-name">{row.name}</span>
                            <span className="p-clinico">
                              <span className="p-dot clinico" />
                              {row.clinical}
                            </span>
                            <span className="p-bio">
                              <span className="p-dot bio" />
                              {row.biological}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="c-text">
                      {item.formatted.lead && <p className="c-text-lead">{item.formatted.lead}</p>}
                      {item.formatted.dashItems.map((d, idx) => (
                        <div className="dash-item" key={`dash-${idx}`}>
                          <span>{d}</span>
                        </div>
                      ))}
                      {item.formatted.body.map((p, idx) => (
                        <p key={`body-${idx}`} className="c-text-body">
                          {p}
                        </p>
                      ))}
                      {item.formatted.highlight && <p className="accent-line">{item.formatted.highlight}</p>}
                    </div>
                  )}
                </div>
                <div className="c-footer">
                  <span className="c-source">// Base: conteúdo PB Imports</span>
                  <button className="c-expand" type="button" onClick={() => navigator?.share?.({ text: item.content })}>
                    Compartilhar ↗
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        :root {
          --bg-void: #020408;
          --bg-panel: #060d16;
          --bg-card: #0a1628;
          --bg-card2: #081220;
          --accent-cyan: #00e5ff;
          --accent-blue: #1565ff;
          --accent-gold: #ffd600;
          --accent-green: #00ff9d;
          --accent-red: #ff2d5f;
          --accent-purple: #a855f7;
          --text-primary: #e8f4ff;
          --text-muted: #4a7090;
          --text-dim: #2a4060;
          --border-glow: rgba(0, 229, 255, 0.15);
          --border-dim: rgba(0, 229, 255, 0.06);
          --grid-line: rgba(0, 229, 255, 0.04);
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          background: var(--bg-void);
          font-family: "Rajdhani", sans-serif;
          color: var(--text-primary);
          min-height: 100vh;
          overflow-x: hidden;
        }

        body::before {
          content: "";
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 229, 255, 0.012) 2px,
              rgba(0, 229, 255, 0.012) 4px
            );
          pointer-events: none;
          z-index: 9999;
        }

        body::after {
          content: "";
          position: fixed;
          inset: 0;
          background-image: linear-gradient(var(--grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }

        .ambient {
          position: fixed;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.06;
        }
        .ambient-1 {
          background: var(--accent-cyan);
          top: -200px;
          right: -100px;
        }
        .ambient-2 {
          background: var(--accent-purple);
          bottom: -200px;
          left: -100px;
        }

        .top-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          height: 56px;
          background: rgba(6, 13, 22, 0.95);
          border-bottom: 1px solid var(--border-dim);
          backdrop-filter: blur(20px);
          display: flex;
          align-items: center;
          padding: 0 32px;
          gap: 16px;
        }

        .btn-back {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          background: transparent;
          border: 1px solid var(--border-dim);
          cursor: pointer;
          font-family: "Share Tech Mono", monospace;
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 2px;
          text-transform: uppercase;
          transition: all 0.2s;
        }
        .btn-back:hover {
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
        }

        .nav-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 5px 14px;
          border: 1px solid var(--border-glow);
          background: rgba(0, 229, 255, 0.05);
          font-family: "Share Tech Mono", monospace;
          font-size: 9px;
          color: var(--accent-cyan);
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        .nav-dot {
          width: 6px;
          height: 6px;
          background: var(--accent-cyan);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--accent-cyan);
          animation: blink 2s ease-in-out infinite;
        }
        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }

        .nav-right {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .search-wrap {
          position: relative;
        }
        .search-input {
          padding: 7px 14px 7px 34px;
          background: var(--bg-card2);
          border: 1px solid var(--border-dim);
          color: var(--text-primary);
          font-family: "Share Tech Mono", monospace;
          font-size: 10px;
          letter-spacing: 1px;
          outline: none;
          transition: all 0.2s;
          width: 220px;
        }
        .search-input::placeholder {
          color: var(--text-dim);
        }
        .search-input:focus {
          border-color: var(--accent-cyan);
          box-shadow: 0 0 16px rgba(0, 229, 255, 0.08);
        }
        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 12px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .tag-filter {
          display: flex;
          gap: 6px;
        }
        .tag-btn {
          padding: 5px 12px;
          background: transparent;
          border: 1px solid var(--border-dim);
          cursor: pointer;
          font-family: "Share Tech Mono", monospace;
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 2px;
          text-transform: uppercase;
          transition: all 0.2s;
        }
        .tag-btn:hover {
          border-color: rgba(0, 229, 255, 0.3);
          color: var(--text-primary);
        }
        .tag-btn.active {
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
          background: rgba(0, 229, 255, 0.08);
        }

        .page {
          padding: 36px 40px;
          position: relative;
          z-index: 1;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 36px;
          animation: slideIn 0.4s ease both;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .header-icon {
          width: 56px;
          height: 56px;
          flex-shrink: 0;
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(21, 101, 255, 0.15));
          border: 1px solid var(--border-glow);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          position: relative;
          overflow: hidden;
          animation: pulse-icon 3s ease-in-out infinite;
        }
        @keyframes pulse-icon {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(0, 229, 255, 0);
          }
          50% {
            box-shadow: 0 0 20px 4px rgba(0, 229, 255, 0.12);
          }
        }

        .page-title {
          font-family: "Orbitron", monospace;
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: 2px;
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
          margin-top: 8px;
        }

        .header-stats {
          display: flex;
          gap: 20px;
        }
        .hstat {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }
        .hstat-val {
          font-family: "Orbitron", monospace;
          font-size: 20px;
          font-weight: 700;
          color: var(--accent-cyan);
          letter-spacing: 2px;
        }
        .hstat-label {
          font-family: "Share Tech Mono", monospace;
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .hstat-div {
          width: 1px;
          background: var(--border-dim);
          align-self: stretch;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .curiosidade-card {
          background: linear-gradient(180deg, #0a1528 0%, #0b162c 100%);
          border: 1px solid #0f243f;
          position: relative;
          overflow: hidden;
          transition: all 0.3s;
          animation: cardIn 0.5s ease both;
          display: flex;
          flex-direction: column;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02), 0 25px 60px rgba(0, 0, 0, 0.35);
        }

        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .curiosidade-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--card-accent, var(--accent-cyan)), transparent);
          opacity: 0.45;
        }

        .curiosidade-card::after {
          content: "";
          position: absolute;
          bottom: -60px;
          right: -60px;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: var(--card-accent, var(--accent-cyan));
          opacity: 0.03;
          pointer-events: none;
        }

        .curiosidade-card:hover {
          border-color: rgba(0, 229, 255, 0.2);
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3), 0 0 30px rgba(0, 229, 255, 0.06);
        }

        .curiosidade-card.wide {
          grid-column: 1 / -1;
        }

        .c-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 20px 22px 14px;
          gap: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .c-header-left {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .c-icon {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          border-radius: 50%;
          border: 1px solid rgba(0, 229, 255, 0.35);
          background: rgba(0, 229, 255, 0.05);
        }

        .c-titles {
          flex: 1;
          min-width: 0;
        }
        .c-title {
          font-family: "Orbitron", monospace;
          font-size: 15px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          line-height: 1.3;
        }
        .c-tags {
          display: flex;
          gap: 6px;
          margin-top: 6px;
          flex-wrap: wrap;
        }
        .c-tags-under {
          margin-top: 10px;
        }

        .c-tag {
          padding: 2px 8px;
          border: 1px solid;
          font-family: "Share Tech Mono", monospace;
          font-size: 8px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .tag-cyan {
          border-color: rgba(0, 229, 255, 0.35);
          color: var(--accent-cyan);
        }
        .tag-gold {
          border-color: rgba(255, 214, 0, 0.35);
          color: var(--accent-gold);
        }
        .tag-green {
          border-color: rgba(0, 255, 157, 0.35);
          color: var(--accent-green);
        }
        .tag-purple {
          border-color: rgba(168, 85, 247, 0.35);
          color: var(--accent-purple);
        }
        .tag-red {
          border-color: rgba(255, 45, 95, 0.35);
          color: var(--accent-red);
        }
        .tag-blue {
          border-color: rgba(21, 101, 255, 0.4);
          color: #6ea8ff;
        }

        .c-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          flex-shrink: 0;
          color: #7f8ca5;
        }
        .c-date {
          font-family: "Share Tech Mono", monospace;
          font-size: 9px;
          letter-spacing: 1px;
          white-space: nowrap;
        }
        .c-read-time {
          font-family: "Share Tech Mono", monospace;
          font-size: 8px;
          opacity: 0.8;
        }

        .c-body {
          padding: 18px 22px 22px;
          flex: 1;
        }
        .c-text {
          font-size: 16px;
          font-weight: 500;
          color: #d3d9e5;
          line-height: 1.7;
          letter-spacing: 0.1px;
        }
        .c-text-body {
          color: #d3d9e5;
        }
        .c-text p {
          margin-bottom: 10px;
        }
        .c-text p:last-child {
          margin-bottom: 0;
        }
        .c-text strong {
          color: var(--text-primary);
          font-weight: 600;
        }
        .c-text em {
          color: var(--accent-cyan);
          font-style: normal;
        }

        .c-text-lead {
          margin-bottom: 16px;
          font-size: 15px;
          color: #dce4f5;
        }

        .dash-item {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
          color: #d2d8e6;
        }
        .dash-item::before {
          content: "//";
          font-family: "Share Tech Mono", monospace;
          font-size: 12px;
          color: var(--accent-cyan);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .accent-line {
          color: #2fc4ff;
          font-weight: 600;
          text-decoration: none;
        }

        .c-footer {
          padding: 10px 22px;
          border-top: 1px solid var(--border-dim);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(0, 229, 255, 0.02);
        }
        .c-source {
          font-family: "Share Tech Mono", monospace;
          font-size: 9px;
          color: var(--text-dim);
          letter-spacing: 2px;
        }
        .c-expand {
          font-family: "Share Tech Mono", monospace;
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 2px;
          cursor: pointer;
          transition: color 0.2s;
          background: none;
          border: none;
          text-transform: uppercase;
        }
        .c-expand:hover {
          color: var(--accent-cyan);
        }

        .peptide-block {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .peptide-header {
          display: grid;
          grid-template-columns: 160px 1fr 1fr;
          padding: 0 0 6px;
          gap: 12px;
          margin-bottom: 4px;
          border-bottom: 1px solid var(--border-glow);
        }
        .ph-label {
          font-family: "Share Tech Mono", monospace;
          font-size: 9px;
          color: var(--text-dim);
          letter-spacing: 3px;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .peptide-table {
          width: 100%;
        }
        .peptide-row {
          display: grid;
          grid-template-columns: 160px 1fr 1fr;
          padding: 8px 0;
          border-bottom: 1px solid var(--border-dim);
          align-items: center;
          gap: 12px;
          transition: background 0.2s;
        }
        .peptide-row:last-child {
          border-bottom: none;
        }
        .peptide-row:hover {
          background: rgba(0, 229, 255, 0.03);
          margin: 0 -8px;
          padding: 8px;
        }
        .p-name {
          font-family: "Share Tech Mono", monospace;
          font-size: 11px;
          color: var(--accent-cyan);
          font-weight: 600;
          letter-spacing: 1px;
        }
        .p-clinico,
        .p-bio {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-muted);
        }
        .p-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .p-dot.clinico {
          background: var(--accent-gold);
          box-shadow: 0 0 6px var(--accent-gold);
        }
        .p-dot.bio {
          background: var(--accent-green);
          box-shadow: 0 0 6px var(--accent-green);
        }

        .empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          gap: 16px;
          background: var(--bg-card);
          border: 1px solid var(--border-dim);
        }
        .empty-icon {
          font-size: 40px;
          opacity: 0.3;
        }
        .empty-text {
          font-family: "Share Tech Mono", monospace;
          font-size: 11px;
          color: var(--text-dim);
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        @media (max-width: 960px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }
          .page {
            padding: 28px 20px;
          }
          .top-nav {
            padding: 0 16px;
          }
          .nav-right {
            flex-wrap: wrap;
            justify-content: flex-end;
          }
          .search-input {
            width: 180px;
          }
        }
      `}</style>
    </>
  );
}
