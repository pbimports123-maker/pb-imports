"use client";

import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ChevronLeft, Share2 } from "lucide-react";

type Curiosity = {
  id: string;
  title: string;
  content: string;
  created_at?: string;
};

type CuriosityTag = "Peptídeo" | "Protocolo" | "Segurança" | "Geral";

type PeptideRow = { name: string; clinical: string; biological: string };

type FormattedContent = {
  lead?: string;
  dashItems: string[];
  body: string[];
  highlight?: string;
};

function maybeParsePeptide(content: string): PeptideRow[] {
  return content.split(/\n+/).map((line) => line.trim()).map((line) => {
    const match = line.match(/^(.*?):\s*cl[ií]nico\s*([^·-]+)[·-]?\s*biol[óo]gico\s*(.+)$/i);
    if (!match) return null;
    const [, name, clinical, biological] = match;
    return { name: name.trim(), clinical: clinical.trim(), biological: biological.trim() };
  }).filter((row): row is PeptideRow => !!row);
}

function inferTagFromText(text: string): CuriosityTag {
  const lower = text.toLowerCase();
  if (lower.includes("pept") || lower.includes("semaglutida") || lower.includes("tirzepatida") || lower.includes("ipamorelina") || lower.includes("ghk")) return "Peptídeo";
  if (lower.includes("protocolo") || lower.includes("dose") || lower.includes("pico")) return "Protocolo";
  if (lower.includes("segurança") || lower.includes("risco") || lower.includes("colateral")) return "Segurança";
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
  if (highlightMatch) result.highlight = highlightMatch[1].trim();
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
    bodyText.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÎÔÛÃÕ])/).map((s) => s.trim()).filter(Boolean).forEach((p) => result.body.push(p));
  }
  return result;
}

const TAG_COLORS: Record<CuriosityTag, { bg: string; text: string; border: string; icon: string }> = {
  Peptídeo: { bg: "rgba(122,175,144,0.12)", text: "#5A8F70", border: "rgba(122,175,144,0.3)", icon: "🧬" },
  Protocolo: { bg: "rgba(194,130,102,0.12)", text: "#9E6650", border: "rgba(194,130,102,0.3)", icon: "⏱" },
  Segurança: { bg: "rgba(192,97,79,0.12)", text: "#C0614F", border: "rgba(192,97,79,0.3)", icon: "🛡" },
  Geral: { bg: "rgba(138,175,194,0.12)", text: "#5A7F96", border: "rgba(138,175,194,0.3)", icon: "✦" },
};

export default function CuriosidadesPage() {
  const [items, setItems] = useState<Curiosity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<CuriosityTag | "">("");

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("curiosities").select("id,title,content,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("Erro ao carregar curiosidades", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  const decorated = useMemo(() =>
    items.map((item) => {
      const tag = inferTagFromText(`${item.title} ${item.content}`);
      const colors = TAG_COLORS[tag];
      const words = (item.content || "").trim().split(/\s+/).filter(Boolean).length;
      return { ...item, tag, colors, readTime: Math.max(1, Math.round(words / 150)), formatted: structureContent(item.content || "") };
    }), [items]);

  const filtered = useMemo(() =>
    decorated.filter((item) => {
      const text = `${item.title} ${item.content}`.toLowerCase();
      return (!activeTag || item.tag === activeTag) && (!search || text.includes(search.toLowerCase()));
    }), [decorated, activeTag, search]);

  const updatedLabel = useMemo(() => new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), []);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FAF8EF; font-family: "DM Sans", sans-serif; color: #0D0F13; }
        body::after { content:""; position:fixed; inset:0; background-image:linear-gradient(rgba(194,130,102,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(194,130,102,0.04) 1px,transparent 1px); background-size:40px 40px; pointer-events:none; z-index:0; }
        @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
        @keyframes cardIn { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
        @keyframes spin { to{transform:rotate(360deg);} }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>

      {/* Nav */}
      <nav style={{ position:"sticky", top:0, zIndex:50, height:56, background:"rgba(242,237,224,0.95)", borderBottom:"1px solid rgba(194,130,102,0.2)", backdropFilter:"blur(20px)", display:"flex", alignItems:"center", padding:"0 24px", gap:16 }}>
        <Link href="/" style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", background:"#fff", border:"1px solid rgba(194,130,102,0.25)", borderRadius:8, color:"#7A6558", fontSize:13, fontWeight:500, textDecoration:"none", transition:"all 0.2s" }}>
          <ChevronLeft size={16} /> Voltar
        </Link>

        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 14px", background:"rgba(194,130,102,0.08)", border:"1px solid rgba(194,130,102,0.2)", borderRadius:20 }}>
          <div style={{ width:6, height:6, background:"#C28266", borderRadius:"50%", animation:"blink 2s ease-in-out infinite" }} />
          <span style={{ fontFamily:"DM Sans", fontSize:11, color:"#9E6650", letterSpacing:2, textTransform:"uppercase" }}>Curiosidades</span>
        </div>

        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:12 }}>
          {/* Search */}
          <div style={{ position:"relative" }}>
            <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:12, color:"#A8978E" }}>🔍</span>
            <input
              type="text"
              value={search}
              placeholder="Buscar curiosidade..."
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding:"7px 14px 7px 32px", background:"#fff", border:"1px solid rgba(194,130,102,0.2)", borderRadius:8, fontSize:12, color:"#0D0F13", outline:"none", width:200 }}
            />
          </div>

          {/* Filtros */}
          <div style={{ display:"flex", gap:6 }}>
            {(["", "Peptídeo", "Protocolo", "Segurança"] as const).map((tag) => (
              <button key={tag} onClick={() => setActiveTag(tag as any)}
                style={{ padding:"5px 12px", background: activeTag === tag ? "rgba(194,130,102,0.12)" : "transparent", border: activeTag === tag ? "1px solid rgba(194,130,102,0.4)" : "1px solid rgba(194,130,102,0.15)", borderRadius:6, fontSize:11, color: activeTag === tag ? "#C28266" : "#A8978E", cursor:"pointer", fontWeight:500, transition:"all 0.2s" }}>
                {tag || "Todos"}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Page */}
      <div style={{ padding:"32px 32px 80px", maxWidth:1400, margin:"0 auto", position:"relative", zIndex:1 }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:32 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:52, height:52, background:"rgba(194,130,102,0.1)", border:"1px solid rgba(194,130,102,0.25)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>✦</div>
            <div>
              <div style={{ fontFamily:"Raleway", fontSize:26, fontWeight:700, color:"#0D0F13" }}>
                Curiosidades e <span style={{ color:"#C28266" }}>Dicas</span>
              </div>
              <div style={{ fontSize:12, color:"#A8978E", marginTop:6 }}>// Conteúdo rápido sobre produtos, prazos, segurança e boas práticas</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:20 }}>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"Raleway", fontSize:20, fontWeight:700, color:"#C28266" }}>{loading ? "…" : filtered.length}</div>
              <div style={{ fontSize:10, color:"#A8978E", letterSpacing:1, textTransform:"uppercase" }}>Publicações</div>
            </div>
            <div style={{ width:1, background:"rgba(194,130,102,0.15)" }} />
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"Raleway", fontSize:20, fontWeight:700, color:"#C28266" }}>{updatedLabel}</div>
              <div style={{ fontSize:10, color:"#A8978E", letterSpacing:1, textTransform:"uppercase" }}>Atualizado</div>
            </div>
          </div>
        </div>

        {/* Cards */}
        {loading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"60px 0", gap:12, color:"#A8978E" }}>
            <Loader2 size={24} style={{ color:"#C28266" }} className="animate-spin" />
            <span>Carregando curiosidades...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 0", color:"#A8978E", fontSize:14 }}>Nenhuma curiosidade encontrada.</div>
        ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(min(100%, 500px), 1fr))", gap:16 }}>
            {filtered.map((item, idx) => {
              const isPeptide = item.tag === "Peptídeo" && maybeParsePeptide(item.content).length >= 3;
              const peptideRows = isPeptide ? maybeParsePeptide(item.content) : [];

              return (
                <article key={item.id} style={{ background:"#fff", border:"1px solid rgba(194,130,102,0.18)", borderRadius:14, overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 4px 20px rgba(194,130,102,0.06)", animation:"cardIn 0.4s ease both", animationDelay:`${0.04*(idx+1)}s`, transition:"all 0.3s" }}>

                  {/* Card Header */}
                  <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"18px 20px 14px", gap:12, borderBottom:"1px solid rgba(194,130,102,0.08)" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", gap:12, flex:1 }}>
                      <div style={{ width:36, height:36, flexShrink:0, borderRadius:"50%", background:item.colors.bg, border:`1px solid ${item.colors.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
                        {item.colors.icon}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:"Raleway", fontSize:14, fontWeight:700, color:"#0D0F13", letterSpacing:0.5, lineHeight:1.3, textTransform:"uppercase" }}>{item.title}</div>
                        <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
                          <span style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:600, background:item.colors.bg, color:item.colors.text, border:`1px solid ${item.colors.border}` }}>{item.tag}</span>
                          {item.tag === "Peptídeo" && <span style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:600, background:"rgba(138,175,194,0.12)", color:"#5A7F96", border:"1px solid rgba(138,175,194,0.3)" }}>Referência</span>}
                          {item.tag === "Protocolo" && <span style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:600, background:"rgba(212,169,106,0.12)", color:"#9A7040", border:"1px solid rgba(212,169,106,0.3)" }}>Tempo</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0, color:"#A8978E" }}>
                      {item.created_at && <div style={{ fontSize:11 }}>{formatDate(item.created_at)}</div>}
                      <div style={{ fontSize:10 }}>~{item.readTime} min</div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding:"16px 20px 20px", flex:1 }}>
                    {isPeptide ? (
                      <div>
                        {/* Tabela de peptídeos */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, paddingBottom:8, marginBottom:8, borderBottom:"1px solid rgba(194,130,102,0.1)" }}>
                          <span style={{ fontSize:10, color:"#A8978E", letterSpacing:2, textTransform:"uppercase" }}>Peptídeo</span>
                          <span style={{ fontSize:10, color:"#A8978E", letterSpacing:2, textTransform:"uppercase", display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ width:5, height:5, borderRadius:"50%", background:"#D4A96A", boxShadow:"0 0 6px #D4A96A", display:"inline-block" }} />Clínico
                          </span>
                          <span style={{ fontSize:10, color:"#A8978E", letterSpacing:2, textTransform:"uppercase", display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ width:5, height:5, borderRadius:"50%", background:"#7AAF90", boxShadow:"0 0 6px #7AAF90", display:"inline-block" }} />Biológico
                          </span>
                        </div>
                        {peptideRows.map((row, rIdx) => (
                          <div key={rIdx} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, padding:"8px 0", borderBottom:"1px solid rgba(194,130,102,0.06)", alignItems:"center" }}>
                            <span style={{ fontFamily:"DM Sans", fontSize:12, color:"#C28266", fontWeight:600 }}>{row.name}</span>
                            <span style={{ fontSize:12, color:"#7A6558", display:"flex", alignItems:"center", gap:6 }}>
                              <span style={{ width:5, height:5, borderRadius:"50%", background:"#D4A96A", display:"inline-block", flexShrink:0 }} />{row.clinical}
                            </span>
                            <span style={{ fontSize:12, color:"#7A6558", display:"flex", alignItems:"center", gap:6 }}>
                              <span style={{ width:5, height:5, borderRadius:"50%", background:"#7AAF90", display:"inline-block", flexShrink:0 }} />{row.biological}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize:14, color:"#3A2E28", lineHeight:1.7 }}>
                        {item.formatted.lead && <p style={{ marginBottom:12, color:"#5A4A40" }}>{item.formatted.lead}</p>}
                        {item.formatted.dashItems.map((d, i) => (
                          <div key={i} style={{ display:"flex", gap:10, marginBottom:10, color:"#3A2E28" }}>
                            <span style={{ fontFamily:"DM Sans", fontSize:12, color:"#C28266", flexShrink:0, marginTop:2 }}>//</span>
                            <span>{d}</span>
                          </div>
                        ))}
                        {item.formatted.body.map((p, i) => <p key={i} style={{ marginBottom:10 }}>{p}</p>)}
                        {item.formatted.highlight && <p style={{ color:"#C28266", fontWeight:600 }}>{item.formatted.highlight}</p>}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div style={{ padding:"10px 20px", borderTop:"1px solid rgba(194,130,102,0.08)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(194,130,102,0.02)" }}>
                    <span style={{ fontSize:10, color:"#C2A090", letterSpacing:1 }}>// Base: conteúdo PB Imports</span>
                    <button onClick={() => navigator?.share?.({ text: item.content })}
                      style={{ background:"none", border:"none", fontSize:11, color:"#A8978E", cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
                      <Share2 size={12} /> Compartilhar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
