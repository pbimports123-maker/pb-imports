"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Rate = { id: string; service_type: string; region: string; price: number };

type Service = "PAC" | "SEDEX" | "Transportadora" | "Transportadoras" | "Fretes VIP";

const UF_NAMES: Record<string, string> = { SP:"São Paulo", RJ:"Rio de Janeiro", MG:"Minas Gerais", RS:"Rio Grande do Sul", PR:"Paraná", SC:"Santa Catarina", BA:"Bahia", GO:"Goiás", DF:"Distrito Federal", ES:"Espírito Santo", MS:"Mato Grosso do Sul", MT:"Mato Grosso", PA:"Pará", CE:"Ceará", PE:"Pernambuco", TO:"Tocantins", AM:"Amazonas", AP:"Amapá", MA:"Maranhão", PI:"Piauí", PB:"Paraíba", AL:"Alagoas", RN:"Rio Grande do Norte", SE:"Sergipe", RO:"Rondônia", RR:"Roraima", AC:"Acre" };

const ICON: Record<string,string> = { PAC:"📦", SEDEX:"🚀", Transportadora:"🚚", Transportadoras:"🚚", "Fretes VIP":"⭐" };
const COLOR: Record<string,string> = { PAC:"svc-pac", SEDEX:"svc-sedex", Transportadora:"svc-transp", Transportadoras:"svc-transp", "Fretes VIP":"svc-transp" };
const PER_PAGE = 12;

export default function AdminShippingPage() {
  const [rates,setRates]=useState<Rate[]>([]);
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [svcFilter,setSvcFilter]=useState<string>("");
  const [sortKey,setSortKey]=useState<"serv"|"uf"|"preco"|null>(null);
  const [sortDir,setSortDir]=useState<1|-1>(1);
  const [page,setPage]=useState(1);
  const [view,setView]=useState<"table"|"map">("table");
  const [modal,setModal]=useState(false);
  const [editing,setEditing]=useState<Rate|null>(null);
  const [form,setForm]=useState({service_type:"PAC",region:"",price:""});

  useEffect(()=>{fetchRates();},[]);
  async function fetchRates(){
    try{
      setLoading(true);
      const {data,error}=await supabase.from("shipping_rates").select("id,service_type,region,price").order("service_type").order("region");
      if(error) throw error;
      setRates((data as Rate[])||[]);
    }catch(e:any){toast.error("Erro ao carregar fretes: "+e.message);}finally{setLoading(false);} }

  const filtered=useMemo(()=>{
    const s=search.toLowerCase();
    let list=rates.filter(r=>{
      const uf=getUF(r.region);
      const match=r.region.toLowerCase().includes(s)||uf.toLowerCase().includes(s)||(UF_NAMES[uf]?.toLowerCase()||"").includes(s);
      const svcOK=!svcFilter||r.service_type===svcFilter;
      return match&&svcOK;
    });
    if(sortKey){
      list=[...list].sort((a,b)=>{
        const av=sortKey==="serv"?a.service_type:sortKey==="uf"?getUF(a.region):a.price;
        const bv=sortKey==="serv"?b.service_type:sortKey==="uf"?getUF(b.region):b.price;
        if(typeof av==="string") return av.localeCompare(bv as string)*sortDir;
        return ((av as number)-(bv as number))*sortDir;
      });
    }
    return list;
  },[rates,search,svcFilter,sortKey,sortDir]);

  const paged=useMemo(()=>{const start=(page-1)*PER_PAGE;return filtered.slice(start,start+PER_PAGE);},[filtered,page]);
  const maxPage=Math.max(1,Math.ceil(filtered.length/PER_PAGE));
  useEffect(()=>setPage(1),[search,svcFilter,sortKey]);

  const kpiRegions=Object.keys(rates.reduce((a,r)=>({...a,[getUF(r.region)]:true}),{} as Record<string,boolean>)).length;
  const kpiMin=rates.length?Math.min(...rates.map(r=>r.price||0)):0;
  const kpiModes=new Set(rates.map(r=>r.service_type)).size;

  const stateGrid=useMemo(()=>{
    const by:Record<string,Rate[]>={};
    rates.forEach(r=>{
      // suporta regiões múltiplas separadas por vírgula
      const parts=r.region.split(",").map(p=>p.trim()).filter(Boolean);
      (parts.length?parts:[""]).forEach(part=>{
        const uf=getUF(part||r.region);
        by[uf]=by[uf]?[...by[uf],r]:[r];
      });
    });
    return Object.keys(UF_NAMES).map(uf=>{
      const list=by[uf]||[];
      return {
        uf,
        pac:list.find(r=>normalizeService(r.service_type)==="PAC"),
        sedex:list.find(r=>normalizeService(r.service_type)==="SEDEX"),
        transp:list.find(r=>{
          const s=normalizeService(r.service_type);
          return s==="TRANSPORTADORA"||s==="TRANSPORTADORAS";
        }),
      };
    });
  },[rates]);

  const openModal=(r?:Rate)=>{ if(r){setEditing(r);setForm({service_type:r.service_type,region:r.region,price:r.price.toString()});} else {setEditing(null);setForm({service_type:"PAC",region:"",price:""});} setModal(true); };
  const saveRate=async(e:React.FormEvent)=>{e.preventDefault(); const payload={service_type:form.service_type,region:form.region,price:parseFloat(form.price||"0")};
    try{ if(editing){const {error}=await supabase.from("shipping_rates").update(payload).eq("id",editing.id); if(error) throw error; toast.success("Frete atualizado!"); }
    else {const {error}=await supabase.from("shipping_rates").insert([payload]); if(error) throw error; toast.success("Frete criado!"); }
    setModal(false); fetchRates(); }catch(err:any){toast.error("Erro ao salvar: "+err.message);} };
  const del=async(id:string)=>{ if(!confirm("Excluir este frete?")) return; try{const {error}=await supabase.from("shipping_rates").delete().eq("id",id); if(error) throw error; toast.success("Frete excluído!"); fetchRates();}catch(err:any){toast.error("Erro ao excluir: "+err.message);} };

  return (
    <div className="content">
      <style jsx>{`
        .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;}
        .page-title{font-family:"Orbitron",monospace;font-size:26px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--text-primary);} .page-title span{color:var(--accent-cyan);} .page-sub{font-family:"Share Tech Mono",monospace;font-size:11px;color:var(--text-muted);letter-spacing:2px;margin-top:6px;}
        .btn-new{display:flex;align-items:center;gap:8px;padding:12px 18px;background:linear-gradient(135deg,var(--accent-cyan),var(--accent-blue));border:none;color:var(--bg-void);font-family:"Orbitron",monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;}
        .kpi-row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:16px;}
        .kpi{background:var(--bg-card);border:1px solid var(--border-dim);padding:16px 18px;} .kpi::before{content:"";display:block;height:1px;margin-bottom:10px;} .k1::before{background:linear-gradient(90deg,transparent,var(--accent-cyan),transparent);} .k2::before{background:linear-gradient(90deg,transparent,var(--accent-gold),transparent);} .k3::before{background:linear-gradient(90deg,transparent,var(--accent-purple),transparent);} .k-label{font-family:"Share Tech Mono",monospace;font-size:9px;color:var(--text-muted);letter-spacing:3px;text-transform:uppercase;} .k-val{font-family:"Orbitron",monospace;font-size:22px;font-weight:700;letter-spacing:2px;} .k-sub{font-family:"Share Tech Mono",monospace;font-size:9px;color:var(--text-muted);margin-top:4px;}
        .tabs{display:flex;border-bottom:1px solid var(--border-dim);margin-bottom:12px;} .tab{padding:12px 18px;font-family:"Share Tech Mono",monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--text-muted);cursor:pointer;border-bottom:2px solid transparent;} .tab.active{color:var(--accent-cyan);border-bottom-color:var(--accent-cyan);} .tab-badge{font-size:8px;padding:2px 6px;border:1px solid var(--text-dim);margin-left:8px;} .tab.active .tab-badge{border-color:var(--accent-cyan);color:var(--accent-cyan);background:rgba(0,229,255,0.1);}
        .toolbar{display:flex;gap:10px;margin-bottom:12px;} .search-wrap{flex:1;position:relative;} .search-input{width:100%;padding:11px 16px 11px 36px;background:var(--bg-card);border:1px solid var(--border-dim);color:var(--text-primary);font-family:"Share Tech Mono",monospace;font-size:12px;} .search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);} .uf-select{padding:11px 16px;background:var(--bg-card);border:1px solid var(--border-dim);color:var(--text-muted);font-family:"Share Tech Mono",monospace;font-size:11px;letter-spacing:2px;min-width:150px;}
        .table-panel{background:var(--bg-card);border:1px solid var(--border-dim);} table{width:100%;border-collapse:collapse;} thead tr{border-bottom:1px solid var(--border-glow);background:rgba(0,229,255,0.03);} th{padding:12px 16px;font-family:"Share Tech Mono",monospace;font-size:9px;color:var(--text-muted);letter-spacing:3px;text-transform:uppercase;text-align:left;} th.sort{cursor:pointer;} td{padding:12px 16px;font-size:14px;} tbody tr{border-bottom:1px solid var(--border-dim);} tbody tr:hover{background:rgba(0,229,255,0.04);} .svc-badge{display:inline-flex;align-items:center;gap:8px;padding:5px 10px;border:1px solid;font-family:"Share Tech Mono",monospace;font-size:9px;letter-spacing:2px;text-transform:uppercase;} .svc-pac{border-color:rgba(0,229,255,0.35);color:var(--accent-cyan);background:rgba(0,229,255,0.06);} .svc-sedex{border-color:rgba(255,214,0,0.35);color:var(--accent-gold);background:rgba(255,214,0,0.06);} .svc-transp{border-color:rgba(168,85,247,0.35);color:var(--accent-purple);background:rgba(168,85,247,0.06);} .uf-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;background:rgba(0,229,255,0.05);border:1px solid var(--border-dim);font-family:"Share Tech Mono",monospace;font-size:11px;} .region-tag{font-family:"Share Tech Mono",monospace;font-size:9px;color:var(--text-muted);letter-spacing:1px;margin-top:3px;} .price-val{font-family:"Orbitron",monospace;font-size:14px;font-weight:700;color:var(--accent-gold);} .price-low{color:var(--accent-green);} .price-high{color:var(--accent-red);} .actions{display:flex;gap:6px;} .act-btn{width:30px;height:30px;border:1px solid var(--border-dim);background:transparent;cursor:pointer;} .act-btn:hover{border-color:var(--accent-cyan);background:rgba(0,229,255,0.08);} .act-btn.del:hover{border-color:var(--accent-red);}
        .table-footer{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-top:1px solid var(--border-dim);background:rgba(0,229,255,0.02);} .table-count{font-family:"Share Tech Mono",monospace;font-size:10px;color:var(--text-muted);letter-spacing:2px;} .pagination{display:flex;gap:4px;} .page-btn{width:26px;height:26px;border:1px solid var(--border-dim);background:transparent;font-family:"Share Tech Mono",monospace;font-size:10px;color:var(--text-muted);cursor:pointer;} .page-btn:hover,.page-btn.active{border-color:var(--accent-cyan);color:var(--accent-cyan);background:rgba(0,229,255,0.1);} .map-view{display:${view==="map"?"block":"none"};}
        .br-map-wrap{background:var(--bg-card);border:1px solid var(--border-dim);padding:18px;} .map-legend{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:10px;} .legend-item{display:flex;align-items:center;gap:6px;font-family:"Share Tech Mono",monospace;font-size:9px;color:var(--text-muted);letter-spacing:2px;} .legend-dot{width:10px;height:10px;border:1px solid;} .l-pac{border-color:var(--accent-cyan);background:rgba(0,229,255,0.2);} .l-sedex{border-color:var(--accent-gold);background:rgba(255,214,0,0.2);} .l-transp{border-color:var(--accent-purple);background:rgba(168,85,247,0.2);} .states-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;} .state-card{padding:10px;background:var(--bg-card2);border:1px solid var(--border-dim);} .s-uf{font-family:"Orbitron",monospace;font-size:14px;font-weight:700;color:var(--text-primary);} .s-name{font-family:"Share Tech Mono",monospace;font-size:8px;color:var(--text-muted);letter-spacing:1px;margin-bottom:4px;} .s-price-row{display:flex;justify-content:space-between;font-family:"Share Tech Mono",monospace;font-size:9px;color:var(--text-muted);} .s-val{font-family:"Orbitron",monospace;font-size:10px;font-weight:700;}
        .modal-overlay{position:fixed;inset:0;background:rgba(2,4,8,0.85);display:${modal?"flex":"none"};align-items:center;justify-content:center;z-index:200;} .modal{background:var(--bg-card);border:1px solid var(--border-glow);width:420px;max-width:95vw;} .modal-header{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid var(--border-dim);} .modal-title{font-family:"Orbitron",monospace;font-size:13px;font-weight:700;color:var(--accent-cyan);letter-spacing:3px;} .modal-close{width:26px;height:26px;border:1px solid var(--border-dim);background:transparent;color:var(--text-muted);cursor:pointer;} .modal-body{padding:14px 16px;display:flex;flex-direction:column;gap:10px;} .form-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;} .form-group{display:flex;flex-direction:column;gap:6px;} .form-group.full{grid-column:1/-1;} .form-label{font-family:"Share Tech Mono",monospace;font-size:9px;color:var(--text-muted);letter-spacing:3px;text-transform:uppercase;} .form-input,.form-select{padding:10px 12px;background:var(--bg-card2);border:1px solid var(--border-dim);color:var(--text-primary);font-family:"Share Tech Mono",monospace;font-size:12px;} .modal-footer{display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid var(--border-dim);} .btn-cancel{padding:10px 14px;border:1px solid var(--border-dim);background:transparent;color:var(--text-muted);font-family:"Share Tech Mono",monospace;font-size:10px;letter-spacing:2px;cursor:pointer;} .btn-save{padding:10px 16px;background:linear-gradient(135deg,var(--accent-cyan),var(--accent-blue));border:none;color:var(--bg-void);font-family:"Orbitron",monospace;font-size:10px;letter-spacing:2px;cursor:pointer;}
        @media(max-width:900px){.kpi-row{grid-template-columns:1fr;} .form-row{grid-template-columns:1fr;}}
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title">Tabela de <span>Fretes</span></div>
          <div className="page-sub">// Gerencie os valores de envio por região e serviço</div>
        </div>
        <button className="btn-new" onClick={()=>openModal()}><span>+</span> Novo Frete</button>
      </div>

      <div className="kpi-row">
        <div className="kpi k1"><div className="k-label">Regiões Atendidas</div><div className="k-val">{kpiRegions}</div><div className="k-sub">Cobertura por UF</div></div>
        <div className="kpi k2"><div className="k-label">Menor Frete</div><div className="k-val">{kpiMin>0?`R$${kpiMin.toLocaleString("pt-BR")}`:"R$0"}</div><div className="k-sub">Base cadastrada</div></div>
        <div className="kpi k3"><div className="k-label">Modalidades</div><div className="k-val">{kpiModes}</div><div className="k-sub">PAC · SEDEX · Transportadora</div></div>
      </div>

      <div className="tabs">
        <div className={`tab ${view==="table"?"active":""}`} onClick={()=>setView("table")}>Tabela <span className="tab-badge">{rates.length}</span></div>
        <div className={`tab ${view==="map"?"active":""}`} onClick={()=>setView("map")}>Mapa por Estado</div>
      </div>

      {view==="table" && (
        <>
          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Buscar por estado ou UF..." value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
            <select className="uf-select" value={svcFilter} onChange={e=>setSvcFilter(e.target.value)}>
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
                  <th className="sort" onClick={()=>handleSort("serv")}>Serviço</th>
                  <th className="sort" onClick={()=>handleSort("uf")}>Região / UF</th>
                  <th className="sort" onClick={()=>handleSort("preco")}>Preço</th>
                  <th>Prazo Est.</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{textAlign:"center",padding:40}}> // CARREGANDO...</td></tr>
                ) : paged.length===0 ? (
                  <tr><td colSpan={5} style={{textAlign:"center",padding:40}}> // NENHUM REGISTRO ENCONTRADO</td></tr>
                ) : paged.map(r=>{
                  const uf=getUF(r.region);
                  return (
                    <tr key={r.id}>
                      <td><span className={`svc-badge ${COLOR[r.service_type as Service]||"svc-pac"}`}><span>{ICON[r.service_type as Service]||"📦"}</span>{r.service_type}</span></td>
                      <td><div className="uf-chip">🏳️ {uf}</div><div className="region-tag">{UF_NAMES[uf]||r.region}</div></td>
                      <td><span className={`price-val ${r.price<=48?"price-low":r.price<=90?"price-mid":"price-high"}`}>R${Number(r.price||0).toLocaleString("pt-BR")}</span></td>
                      <td style={{fontFamily:"Share Tech Mono, monospace",fontSize:"10px",color:"var(--text-muted)"}}>—</td>
                      <td><div className="actions"><button className="act-btn" title="Editar" onClick={()=>openModal(r)}>✏️</button><button className="act-btn del" title="Excluir" onClick={()=>del(r.id)}>🗑️</button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="table-footer">
              <div className="table-count">Exibindo <span>{paged.length}</span> de <span>{filtered.length}</span> registros</div>
              <div className="pagination">
                <button className="page-btn" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>—</button>
                <button className="page-btn active">{page}</button>
                <button className="page-btn" onClick={()=>setPage(p=>Math.min(maxPage,p+1))} disabled={page===maxPage}>—</button>
              </div>
            </div>
          </div>
        </>
      )}

      {view==="map" && (
        <div className="map-view">
          <div className="br-map-wrap">
            <div className="map-legend">
              <div className="legend-item"><div className="legend-dot l-pac"></div>PAC — Correios</div>
              <div className="legend-item"><div className="legend-dot l-sedex"></div>SEDEX — Correios</div>
              <div className="legend-item"><div className="legend-dot l-transp"></div>Transportadora</div>
            </div>
            <div className="states-grid">
              {stateGrid.map(({uf,pac,sedex,transp})=>(
                <div key={uf} className="state-card">
                  <div className="s-uf">{uf}</div>
                  <div className="s-name">{UF_NAMES[uf]}</div>
                  <div className="s-price-row"><span>PAC</span><span className="s-val">{pac?`R$${pac.price.toLocaleString("pt-BR")}`:"N/D"}</span></div>
                  <div className="s-price-row"><span>SEDEX</span><span className="s-val">{sedex?`R$${sedex.price.toLocaleString("pt-BR")}`:"N/D"}</span></div>
                  <div className="s-price-row"><span>TRANS</span><span className="s-val">{transp?`R$${transp.price.toLocaleString("pt-BR")}`:"N/D"}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setModal(false)}>
        <div className="modal">
          <div className="modal-header">
            <span className="modal-title">// Novo Frete</span>
            <button className="modal-close" onClick={()=>setModal(false)}>×</button>
          </div>
          <form onSubmit={saveRate}>
            <div className="modal-body">
              <div className="form-group full">
                <label className="form-label">serviço</label>
                <select className="form-select" value={form.service_type} onChange={e=>setForm(f=>({...f,service_type:e.target.value}))}>
                  <option value="PAC">PAC — Correios</option>
                  <option value="SEDEX">SEDEX — Correios</option>
                  <option value="Transportadora">Transportadora</option>
                  <option value="Transportadoras">Transportadoras</option>
                  <option value="Fretes VIP">Fretes VIP</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Estado / região</label>
                  <input className="form-input" value={form.region} onChange={e=>setForm(f=>({...f,region:e.target.value}))} required placeholder="Ex: SP ou São Paulo" />
                </div>
                <div className="form-group">
                  <label className="form-label">Preço (R$)</label>
                  <input className="form-input" type="number" step="0.01" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} required />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={()=>setModal(false)}>Cancelar</button>
              <button type="submit" className="btn-save">Salvar Frete</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function getUF(region:string){
  const cleaned=region.trim();
  const m=cleaned.match(/^[A-Za-z]{2}/);
  if(m) return m[0].toUpperCase();
  const lower=cleaned.toLowerCase();
  // tenta casar pelo nome completo da UF
  const matchUF = Object.entries(UF_NAMES).find(([,name])=>lower.includes(name.toLowerCase()));
  if(matchUF) return matchUF[0];
  return cleaned.slice(0,2).toUpperCase();
}

function normalizeService(s:string){
  return s?.trim().toUpperCase();
}







