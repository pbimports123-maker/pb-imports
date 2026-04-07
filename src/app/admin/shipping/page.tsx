"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Rate = { id: string; service_type: string; region: string; price: number };
type Service = "PAC" | "SEDEX" | "Transportadora" | "Transportadoras" | "Fretes VIP";

const UF_NAMES: Record<string, string> = {
  SP:"São Paulo", RJ:"Rio de Janeiro", MG:"Minas Gerais", RS:"Rio Grande do Sul",
  PR:"Paraná", SC:"Santa Catarina", BA:"Bahia", GO:"Goiás", DF:"Distrito Federal",
  ES:"Espírito Santo", MS:"Mato Grosso do Sul", MT:"Mato Grosso", PA:"Pará",
  CE:"Ceará", PE:"Pernambuco", TO:"Tocantins", AM:"Amazonas", AP:"Amapá",
  MA:"Maranhão", PI:"Piauí", PB:"Paraíba", AL:"Alagoas", RN:"Rio Grande do Norte",
  SE:"Sergipe", RO:"Rondônia", RR:"Roraima", AC:"Acre"
};

const ICON: Record<string, string> = { PAC:"📦", SEDEX:"🚀", Transportadora:"🚚", Transportadoras:"🚚", "Fretes VIP":"⭐" };
const PER_PAGE = 12;

export default function AdminShippingPage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [svcFilter, setSvcFilter] = useState<string>("");
  const [sortKey, setSortKey] = useState<"serv"|"uf"|"preco"|null>(null);
  const [sortDir, setSortDir] = useState<1|-1>(1);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"table"|"map">("table");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Rate|null>(null);
  const [form, setForm] = useState({ service_type: "PAC", region: "", price: "" });

  useEffect(() => { fetchRates(); }, []);

  async function fetchRates() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("shipping_rates").select("id,service_type,region,price")
        .order("service_type").order("region");
      if (error) throw error;
      setRates((data as Rate[]) || []);
    } catch (e: any) {
      toast.error("Erro ao carregar fretes: " + e.message);
    } finally { setLoading(false); }
  }

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    let list = rates.filter(r => {
      const uf = getUF(r.region);
      const match = r.region.toLowerCase().includes(s) || uf.toLowerCase().includes(s) || (UF_NAMES[uf]?.toLowerCase() || "").includes(s);
      return match && (!svcFilter || r.service_type === svcFilter);
    });
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const av = sortKey === "serv" ? a.service_type : sortKey === "uf" ? getUF(a.region) : a.price;
        const bv = sortKey === "serv" ? b.service_type : sortKey === "uf" ? getUF(b.region) : b.price;
        if (typeof av === "string") return av.localeCompare(bv as string) * sortDir;
        return ((av as number) - (bv as number)) * sortDir;
      });
    }
    return list;
  }, [rates, search, svcFilter, sortKey, sortDir]);

  const paged = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  const maxPage = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  useEffect(() => setPage(1), [search, svcFilter, sortKey]);

  const kpiRegions = Object.keys(rates.reduce((a, r) => ({ ...a, [getUF(r.region)]: true }), {} as Record<string, boolean>)).length;
  const kpiMin = rates.length ? Math.min(...rates.map(r => r.price || 0)) : 0;
  const kpiModes = new Set(rates.map(r => r.service_type)).size;

  const stateGrid = useMemo(() => {
    const by: Record<string, Rate[]> = {};
    rates.forEach(r => {
      const parts = r.region.split(",").map(p => p.trim()).filter(Boolean);
      (parts.length ? parts : [""]).forEach(part => {
        const uf = getUF(part || r.region);
        by[uf] = by[uf] ? [...by[uf], r] : [r];
      });
    });
    return Object.keys(UF_NAMES).map(uf => {
      const list = by[uf] || [];
      return {
        uf,
        pac: list.find(r => normalizeService(r.service_type) === "PAC"),
        sedex: list.find(r => normalizeService(r.service_type) === "SEDEX"),
        transp: list.find(r => { const s = normalizeService(r.service_type); return s === "TRANSPORTADORA" || s === "TRANSPORTADORAS"; }),
      };
    });
  }, [rates]);

  const openModal = (r?: Rate) => {
    if (r) { setEditing(r); setForm({ service_type: r.service_type, region: r.region, price: r.price.toString() }); }
    else { setEditing(null); setForm({ service_type: "PAC", region: "", price: "" }); }
    setModal(true);
  };

  const saveRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { service_type: form.service_type, region: form.region, price: parseFloat(form.price || "0") };
    try {
      if (editing) {
        const { error } = await supabase.from("shipping_rates").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Frete atualizado!");
      } else {
        const { error } = await supabase.from("shipping_rates").insert([payload]);
        if (error) throw error;
        toast.success("Frete criado!");
      }
      setModal(false);
      fetchRates();
    } catch (err: any) { toast.error("Erro ao salvar: " + err.message); }
  };

  const del = async (id: string) => {
    if (!confirm("Excluir este frete?")) return;
    try {
      const { error } = await supabase.from("shipping_rates").delete().eq("id", id);
      if (error) throw error;
      toast.success("Frete excluído!");
      fetchRates();
    } catch (err: any) { toast.error("Erro ao excluir: " + err.message); }
  };

  const handleSort = (key: "serv"|"uf"|"preco") => {
    setSortKey(prev => {
      if (prev === key) { setSortDir(d => d === 1 ? -1 : 1); return prev; }
      setSortDir(1); return key;
    });
  };

  const svcClass = (type: string) => {
    const t = type.toLowerCase();
    if (t === "pac") return "svc-pac";
    if (t === "sedex") return "svc-sedex";
    if (t.includes("vip")) return "svc-vip";
    return "svc-transp";
  };

  return (
    <div className="content">
      <style jsx>{`
        /* Header */
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; }
        .page-title { font-family: "Raleway", sans-serif; font-size: 26px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--text-primary); }
        .page-title span { color: var(--accent-terra); }
        .page-sub { font-family: "DM Sans", sans-serif; font-size: 12px; color: var(--text-muted); margin-top: 6px; }
        .btn-new { display: flex; align-items: center; gap: 8px; padding: 12px 18px; background: var(--accent-terra); border: none; color: #fff; font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 700; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .btn-new:hover { background: var(--accent-terra-dark); transform: translateY(-1px); }

        /* KPIs */
        .kpi-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
        .kpi { background: #fff; border: 1px solid rgba(194,130,102,0.18); border-radius: 12px; padding: 18px 20px; position: relative; overflow: hidden; }
        .kpi::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 12px 12px 0 0; }
        .k1::before { background: var(--accent-terra); }
        .k2::before { background: #D4A96A; }
        .k3::before { background: #7AAF90; }
        .k-label { font-size: 11px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 8px; }
        .k-val { font-family: "Raleway", sans-serif; font-size: 24px; font-weight: 700; letter-spacing: 1px; color: var(--text-primary); }
        .k1 .k-val { color: var(--accent-terra-dark); }
        .k2 .k-val { color: #8A6830; }
        .k3 .k-val { color: #5A8F70; }
        .k-sub { font-size: 11px; color: var(--text-muted); margin-top: 4px; }

        /* Tabs */
        .tabs { display: flex; border-bottom: 1px solid rgba(194,130,102,0.15); margin-bottom: 14px; }
        .tab { padding: 12px 18px; font-family: "Raleway", sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab.active { color: var(--accent-terra); border-bottom-color: var(--accent-terra); }
        .tab-badge { font-size: 10px; padding: 2px 7px; border: 1px solid rgba(194,130,102,0.3); border-radius: 20px; margin-left: 8px; }
        .tab.active .tab-badge { border-color: var(--accent-terra); color: var(--accent-terra); background: rgba(194,130,102,0.08); }

        /* Toolbar */
        .toolbar { display: flex; gap: 10px; margin-bottom: 12px; }
        .search-wrap { flex: 1; position: relative; }
        .search-input { width: 100%; padding: 11px 16px 11px 38px; background: #fff; border: 1px solid rgba(194,130,102,0.25); border-radius: 8px; color: var(--text-primary); font-family: "DM Sans", sans-serif; font-size: 14px; outline: none; transition: all 0.2s; }
        .search-input::placeholder { color: var(--text-dim); }
        .search-input:focus { border-color: var(--accent-terra); box-shadow: 0 0 0 3px rgba(194,130,102,0.12); }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 15px; }
        .uf-select { padding: 11px 14px; background: #fff; border: 1px solid rgba(194,130,102,0.25); border-radius: 8px; color: var(--text-muted); font-family: "DM Sans", sans-serif; font-size: 13px; min-width: 160px; outline: none; }

        /* Tabela */
        .table-panel { background: #fff; border: 1px solid rgba(194,130,102,0.18); border-radius: 12px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        thead tr { border-bottom: 1px solid rgba(194,130,102,0.12); background: rgba(194,130,102,0.04); }
        th { padding: 13px 16px; font-family: "DM Sans", sans-serif; font-size: 11px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px; text-transform: uppercase; text-align: left; }
        th.sort { cursor: pointer; }
        th.sort:hover { color: var(--accent-terra); }
        td { padding: 13px 16px; font-size: 14px; }
        tbody tr { border-bottom: 1px solid rgba(194,130,102,0.07); transition: background 0.15s; }
        tbody tr:last-child { border-bottom: none; }
        tbody tr:hover { background: rgba(194,130,102,0.04); }

        /* Badges de serviço */
        .svc-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border: 1px solid; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.3px; }
        .svc-pac { border-color: rgba(138,175,200,0.5); color: #4A7A9B; background: rgba(138,175,200,0.1); }
        .svc-sedex { border-color: rgba(212,169,106,0.5); color: #8A6830; background: rgba(212,169,106,0.1); }
        .svc-transp { border-color: rgba(122,175,144,0.5); color: #5A8F70; background: rgba(122,175,144,0.1); }
        .svc-vip { border-color: rgba(194,130,102,0.5); color: var(--accent-terra-dark); background: rgba(194,130,102,0.08); }

        /* UF chip */
        .uf-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(194,130,102,0.06); border: 1px solid rgba(194,130,102,0.2); border-radius: 6px; font-size: 12px; font-weight: 600; color: var(--text-primary); }
        .region-tag { font-size: 11px; color: var(--text-muted); margin-top: 3px; }
        .price-val { font-family: "Raleway", sans-serif; font-size: 14px; font-weight: 700; }
        .price-low { color: #5A8F70; }
        .price-mid { color: #8A6830; }
        .price-high { color: #C0614F; }

        .actions { display: flex; gap: 6px; }
        .act-btn { width: 32px; height: 32px; border: 1px solid rgba(194,130,102,0.2); border-radius: 6px; background: var(--bg-card2); cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .act-btn:hover { border-color: var(--accent-terra); background: rgba(194,130,102,0.08); }
        .act-btn.del:hover { border-color: #C0614F; background: rgba(192,97,79,0.08); }

        /* Footer */
        .table-footer { display: flex; justify-content: space-between; align-items: center; padding: 13px 16px; border-top: 1px solid rgba(194,130,102,0.1); }
        .table-count { font-size: 12px; color: var(--text-muted); }
        .table-count span { color: var(--accent-terra); font-weight: 700; }
        .pagination { display: flex; gap: 4px; }
        .page-btn { width: 30px; height: 30px; border: 1px solid rgba(194,130,102,0.2); border-radius: 6px; background: transparent; font-size: 13px; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .page-btn:hover, .page-btn.active { border-color: var(--accent-terra); color: var(--accent-terra); background: rgba(194,130,102,0.08); }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Mapa */
        .br-map-wrap { background: #fff; border: 1px solid rgba(194,130,102,0.18); border-radius: 12px; padding: 20px; }
        .map-legend { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
        .legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); font-weight: 500; }
        .legend-dot { width: 10px; height: 10px; border-radius: 3px; }
        .l-pac { background: rgba(138,175,200,0.4); border: 1px solid #8AAFC2; }
        .l-sedex { background: rgba(212,169,106,0.4); border: 1px solid #D4A96A; }
        .l-transp { background: rgba(122,175,144,0.4); border: 1px solid #7AAF90; }
        .states-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
        .state-card { padding: 12px; background: #FAF8EF; border: 1px solid rgba(194,130,102,0.15); border-radius: 8px; }
        .s-uf { font-family: "Raleway", sans-serif; font-size: 15px; font-weight: 700; color: var(--text-primary); }
        .s-name { font-size: 10px; color: var(--text-muted); margin-bottom: 8px; }
        .s-price-row { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-bottom: 3px; }
        .s-val { font-weight: 700; color: var(--text-primary); }

        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(13,15,19,0.5); display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(6px); }
        .modal { background: #fff; border: 1px solid rgba(194,130,102,0.2); border-radius: 14px; width: 440px; max-width: 95vw; box-shadow: 0 20px 60px rgba(194,130,102,0.15); overflow: hidden; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; border-bottom: 1px solid rgba(194,130,102,0.1); }
        .modal-title { font-family: "Raleway", sans-serif; font-size: 16px; font-weight: 700; color: var(--accent-terra-dark); }
        .modal-close { width: 28px; height: 28px; border: 1px solid rgba(194,130,102,0.2); border-radius: 6px; background: transparent; color: var(--text-muted); cursor: pointer; font-size: 16px; display: flex; align-items: center; justify-content: center; }
        .modal-close:hover { border-color: #C0614F; color: #C0614F; }
        .modal-body { padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full { grid-column: 1/-1; }
        .form-label { font-size: 11px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.3px; text-transform: uppercase; }
        .form-input, .form-select { padding: 11px 14px; background: #FAF8EF; border: 1px solid rgba(194,130,102,0.25); border-radius: 8px; color: var(--text-primary); font-family: "DM Sans", sans-serif; font-size: 14px; outline: none; transition: all 0.2s; }
        .form-input:focus, .form-select:focus { border-color: var(--accent-terra); box-shadow: 0 0 0 3px rgba(194,130,102,0.12); }
        .modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 20px; border-top: 1px solid rgba(194,130,102,0.1); }
        .btn-cancel { padding: 10px 18px; border: 1px solid rgba(194,130,102,0.3); border-radius: 8px; background: transparent; color: var(--text-muted); font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-cancel:hover { border-color: var(--accent-terra); color: var(--accent-terra); }
        .btn-save { padding: 10px 20px; background: var(--accent-terra); border: none; border-radius: 8px; color: #fff; font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-save:hover { background: var(--accent-terra-dark); }

        @media (max-width: 900px) { .kpi-row { grid-template-columns: 1fr; } .form-row { grid-template-columns: 1fr; } }
      `}</style>

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Tabela de <span>Fretes</span></div>
          <div className="page-sub">Gerencie os valores de envio por região e serviço</div>
        </div>
        <button className="btn-new" onClick={() => openModal()}>+ Novo Frete</button>
      </div>

      {/* KPIs */}
      <div className="kpi-row">
        <div className="kpi k1">
          <div className="k-label">Regiões Atendidas</div>
          <div className="k-val">{kpiRegions}</div>
          <div className="k-sub">Cobertura por UF</div>
        </div>
        <div className="kpi k2">
          <div className="k-label">Menor Frete</div>
          <div className="k-val">{kpiMin > 0 ? `R$${kpiMin.toLocaleString("pt-BR")}` : "R$0"}</div>
          <div className="k-sub">Base cadastrada</div>
        </div>
        <div className="kpi k3">
          <div className="k-label">Modalidades</div>
          <div className="k-val">{kpiModes}</div>
          <div className="k-sub">PAC · SEDEX · Transportadora</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <div className={`tab ${view === "table" ? "active" : ""}`} onClick={() => setView("table")}>
          Tabela <span className="tab-badge">{rates.length}</span>
        </div>
        <div className={`tab ${view === "map" ? "active" : ""}`} onClick={() => setView("map")}>
          Mapa por Estado
        </div>
      </div>

      {/* Tabela */}
      {view === "table" && (
        <>
          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Buscar por estado ou UF..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="uf-select" value={svcFilter} onChange={e => setSvcFilter(e.target.value)}>
              <option value="">Todos os serviços</option>
              <option value="PAC">PAC</option>
              <option value="SEDEX">SEDEX</option>
              <option value="Transportadora">Transportadora</option>
              <option value="Transportadoras">Transportadoras</option>
              <option value="Fretes VIP">Fretes VIP</option>
            </select>
          </div>

          <div className="table-panel">
            <table>
              <thead>
                <tr>
                  <th className="sort" onClick={() => handleSort("serv")}>Serviço ⇅</th>
                  <th className="sort" onClick={() => handleSort("uf")}>Região / UF ⇅</th>
                  <th className="sort" onClick={() => handleSort("preco")}>Preço ⇅</th>
                  <th>Prazo Est.</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Carregando...</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>Nenhum registro encontrado</td></tr>
                ) : paged.map(r => {
                  const uf = getUF(r.region);
                  return (
                    <tr key={r.id}>
                      <td>
                        <span className={`svc-badge ${svcClass(r.service_type)}`}>
                          {ICON[r.service_type as Service] || "📦"} {r.service_type}
                        </span>
                      </td>
                      <td>
                        <div className="uf-chip">🏳️ {uf}</div>
                        <div className="region-tag">{UF_NAMES[uf] || r.region}</div>
                      </td>
                      <td>
                        <span className={`price-val ${r.price <= 48 ? "price-low" : r.price <= 90 ? "price-mid" : "price-high"}`}>
                          R$ {Number(r.price || 0).toLocaleString("pt-BR")}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)" }}>—</td>
                      <td>
                        <div className="actions">
                          <button className="act-btn" title="Editar" onClick={() => openModal(r)}>✏️</button>
                          <button className="act-btn del" title="Excluir" onClick={() => del(r.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="table-footer">
              <div className="table-count">
                Exibindo <span>{paged.length}</span> de <span>{filtered.length}</span> registros
              </div>
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                <button className="page-btn active">{page}</button>
                <button className="page-btn" onClick={() => setPage(p => Math.min(maxPage, p + 1))} disabled={page === maxPage}>›</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mapa */}
      {view === "map" && (
        <div className="br-map-wrap">
          <div className="map-legend">
            <div className="legend-item"><div className="legend-dot l-pac" /> PAC — Correios</div>
            <div className="legend-item"><div className="legend-dot l-sedex" /> SEDEX — Correios</div>
            <div className="legend-item"><div className="legend-dot l-transp" /> Transportadora</div>
          </div>
          <div className="states-grid">
            {stateGrid.map(({ uf, pac, sedex, transp }) => (
              <div key={uf} className="state-card">
                <div className="s-uf">{uf}</div>
                <div className="s-name">{UF_NAMES[uf]}</div>
                <div className="s-price-row"><span>PAC</span><span className="s-val">{pac ? `R$${pac.price.toLocaleString("pt-BR")}` : "N/D"}</span></div>
                <div className="s-price-row"><span>SEDEX</span><span className="s-val">{sedex ? `R$${sedex.price.toLocaleString("pt-BR")}` : "N/D"}</span></div>
                <div className="s-price-row"><span>TRANS</span><span className="s-val">{transp ? `R$${transp.price.toLocaleString("pt-BR")}` : "N/D"}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editing ? "Editar Frete" : "Novo Frete"}</span>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <form onSubmit={saveRate}>
              <div className="modal-body">
                <div className="form-group full">
                  <label className="form-label">Serviço</label>
                  <select className="form-select" value={form.service_type} onChange={e => setForm(f => ({ ...f, service_type: e.target.value }))}>
                    <option value="PAC">PAC — Correios</option>
                    <option value="SEDEX">SEDEX — Correios</option>
                    <option value="Transportadora">Transportadora</option>
                    <option value="Transportadoras">Transportadoras</option>
                    <option value="Fretes VIP">Fretes VIP</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Estado / Região</label>
                    <input className="form-input" value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} required placeholder="Ex: SP ou São Paulo" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preço (R$)</label>
                    <input className="form-input" type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
                <button type="submit" className="btn-save">Salvar Frete</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getUF(region: string) {
  const cleaned = region.trim();
  const m = cleaned.match(/^[A-Za-z]{2}/);
  if (m) return m[0].toUpperCase();
  const lower = cleaned.toLowerCase();
  const matchUF = Object.entries(UF_NAMES).find(([, name]) => lower.includes(name.toLowerCase()));
  if (matchUF) return matchUF[0];
  return cleaned.slice(0, 2).toUpperCase();
}

function normalizeService(s: string) { return s?.trim().toUpperCase(); }