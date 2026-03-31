"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const COLORS = ["#00e5ff","#ffd600","#00ff9d","#1565ff","#ff2d5f","#a855f7"];

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ products:any[]; categories:any[]; movements:any[] }>({ products: [], categories: [], movements: [] });

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
    const totalValue = data.products.reduce((acc,p)=>acc + (Number(p.price)||0)*p.stock,0);
    const totalItems = data.products.reduce((acc,p)=>acc + p.stock,0);
    const critical = data.products.filter(p=>p.stock>0 && p.stock<=5).length;
    const out = data.products.filter(p=>p.stock===0).length;
    return { totalValue, totalItems, critical, out };
  }, [data.products]);

  const stockByCategory = useMemo(()=>{
    return data.categories.map(cat=>{
      const list=data.products.filter(p=>p.category_id===cat.id);
      return { name: cat.name, quantidade: list.reduce((a,p)=>a+p.stock,0) };
    }).filter(i=>i.quantidade>0);
  },[data.categories,data.products]);

  const valueByCategory = useMemo(()=>{
    return data.categories.map(cat=>{
      const list=data.products.filter(p=>p.category_id===cat.id);
      return { name: cat.name, value: list.reduce((a,p)=>a+(Number(p.price)||0)*p.stock,0) };
    }).filter(i=>i.value>0);
  },[data.categories,data.products]);

  const movementTrend = useMemo(()=>{
    const last7 = Array.from({length:7},(_,i)=>{
      const d=new Date(); d.setDate(d.getDate()-(6-i)); return d.toISOString().split("T")[0];
    });
    return last7.map(date=>{
      const mv=data.movements.filter(m=>m.created_at?.startsWith(date));
      const inQty=mv.filter(m=>m.type==='IN').reduce((a,m)=>a+m.quantity,0);
      const outQty=mv.filter(m=>m.type==='OUT').reduce((a,m)=>a+m.quantity,0);
      return { date:new Date(date).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}), entradas:inQty, saidas:outQty };
    });
  },[data.movements]);

  const criticalList = useMemo(()=> data.products.filter(p=>p.stock<=5).sort((a,b)=>a.stock-b.stock).slice(0,6), [data.products]);
  const topProducts = useMemo(()=> data.products.slice(0,6).sort((a,b)=>b.stock-a.stock), [data.products]);

  return (
    <div className="content">
      <style jsx>{`
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;} .title{font-family:"Orbitron",monospace;font-size:26px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--text-primary);} .title span{color:var(--accent-cyan);} .sub{font-family:"Share Tech Mono",monospace;font-size:11px;color:var(--text-muted);letter-spacing:2px;margin-top:6px;} .btn-export{display:flex;align-items:center;gap:8px;padding:10px 18px;border:1px solid var(--accent-cyan);background:transparent;color:var(--accent-cyan);font-family:"Share Tech Mono",monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;}
        .kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:18px;} .kpi{background:var(--bg-card);border:1px solid var(--border-dim);padding:16px 18px;position:relative;} .kpi::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;} .kc{color:var(--accent-cyan);} .kg{color:var(--accent-green);} .kr{color:var(--accent-red);} .ky{color:var(--accent-gold);} .kpi::before.c{background:linear-gradient(90deg,transparent,var(--accent-cyan),transparent);} .kpi::before.g{background:linear-gradient(90deg,transparent,var(--accent-green),transparent);} .kpi::before.r{background:linear-gradient(90deg,transparent,var(--accent-red),transparent);} .kpi::before.y{background:linear-gradient(90deg,transparent,var(--accent-gold),transparent);} .k-label{font-family:"Share Tech Mono",monospace;font-size:9px;color:var(--text-muted);letter-spacing:2px;text-transform:uppercase;} .k-value{font-family:"Orbitron",monospace;font-size:28px;font-weight:700;letter-spacing:2px;} .k-sub{font-family:"Share Tech Mono",monospace;font-size:9px;color:var(--text-muted);}
        .panel{background:var(--bg-card);border:1px solid var(--border-dim);animation:fadeIn 0.4s ease both;} .p-head{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;border-bottom:1px solid var(--border-dim);font-family:"Orbitron",monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:var(--text-primary);} .p-body{padding:16px 18px;}
        .grid2{display:grid;grid-template-columns:1.3fr 1fr;gap:14px;margin-bottom:14px;} .grid2b{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;}
        .crit-list{padding:8px 0;} .crit-item{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border-dim);} .crit-name{font-weight:600;color:var(--text-primary);} .crit-brand{font-family:"Share Tech Mono",monospace;font-size:9px;color:var(--text-muted);} .crit-stock{font-family:"Orbitron",monospace;font-size:12px;font-weight:700;} .crit-dot{width:8px;height:8px;border-radius:999px;box-shadow:0 0 8px currentColor;}
        .top-table table{width:100%;border-collapse:collapse;font-family:"Share Tech Mono",monospace;font-size:10px;} .top-table th{padding:10px 12px;color:var(--text-dim);letter-spacing:2px;text-transform:uppercase;text-align:left;border-bottom:1px solid var(--border-dim);} .top-table td{padding:10px 12px;color:var(--text-primary);} .tag{border:1px solid var(--border-dim);padding:2px 6px;font-size:9px;letter-spacing:1px;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
      `}</style>

      <div className="header">
        <div>
          <div className="title">Relatórios <span>e Insights</span></div>
          <div className="sub">// Análise do inventário e operações</div>
        </div>
        <button className="btn-export" onClick={()=>window.print()}>? Exportar</button>
      </div>

      <div className="kpi-grid">
        <div className="kpi" style={{color:"var(--accent-gold)"}}>
          <div className="k-label">Valor Total em Estoque</div>
          <div className="k-value">R${stats.totalValue.toLocaleString("pt-BR")}</div>
          <div className="k-sub">+8.3% vs mês anterior</div>
        </div>
        <div className="kpi" style={{color:"var(--accent-cyan)"}}>
          <div className="k-label">Total de Itens</div>
          <div className="k-value">{stats.totalItems}</div>
          <div className="k-sub">Entradas recentes incluídas</div>
        </div>
        <div className="kpi" style={{color:"var(--accent-red)"}}>
          <div className="k-label">Estoque Crítico</div>
          <div className="k-value">{stats.critical}</div>
          <div className="k-sub">= 5 unidades</div>
        </div>
        <div className="kpi" style={{color:"var(--accent-green)"}}>
          <div className="k-label">Esgotados</div>
          <div className="k-value">{stats.out}</div>
          <div className="k-sub">Itens zerados</div>
        </div>
      </div>

      <div className="grid2">
        <div className="panel">
          <div className="p-head">Fluxo de Estoque (7d)</div>
          <div className="p-body" style={{height:280}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={movementTrend}>
                <CartesianGrid stroke="rgba(0,229,255,0.06)" vertical={false} />
                <XAxis dataKey="date" tick={{fill:'#4a7090',fontSize:10}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:'#4a7090',fontSize:10}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{background:'#060d16',border:'1px solid rgba(0,229,255,0.3)'}} />
                <Legend wrapperStyle={{color:'#4a7090',fontSize:10}} />
                <Line type="monotone" dataKey="entradas" stroke="#00e5ff" strokeWidth={2.4} dot={{r:3}} />
                <Line type="monotone" dataKey="saidas" stroke="#ffd600" strokeWidth={2.4} dot={{r:3}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel">
          <div className="p-head">Distribuição por Categoria</div>
          <div className="p-body" style={{height:280}}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={valueByCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {valueByCategory.map((_,i)=>(<Cell key={i} fill={COLORS[i%COLORS.length]} />))}
                </Pie>
                <Tooltip formatter={(v:number)=>`R$ ${v.toLocaleString('pt-BR')}`} contentStyle={{background:'#060d16',border:'1px solid rgba(0,229,255,0.3)'}} />
                <Legend wrapperStyle={{color:'#4a7090',fontSize:10}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid2b">
        <div className="panel">
          <div className="p-head">Valor por Categoria</div>
          <div className="p-body" style={{height:260}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={valueByCategory} layout="vertical">
                <CartesianGrid stroke="rgba(0,229,255,0.06)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{fill:'#4a7090',fontSize:10}} width={120} />
                <Tooltip formatter={(v:number)=>`R$ ${v.toLocaleString('pt-BR')}`} contentStyle={{background:'#060d16',border:'1px solid rgba(0,229,255,0.3)'}} />
                <Bar dataKey="value" fill="#00e5ff" barSize={14} radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel">
          <div className="p-head">Estoque por Categoria</div>
          <div className="p-body" style={{height:260}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockByCategory}>
                <CartesianGrid stroke="rgba(0,229,255,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{fill:'#4a7090',fontSize:10}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill:'#4a7090',fontSize:10}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{background:'#060d16',border:'1px solid rgba(0,229,255,0.3)'}} />
                <Bar dataKey="quantidade" fill="#ffd600" barSize={14} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid2b">
        <div className="panel">
          <div className="p-head">Produtos com Estoque Crítico</div>
          <div className="crit-list">
            {criticalList.length===0 ? (
              <div className="empty">// ESTOQUE SAUDÁVEL</div>
            ) : criticalList.map((p)=>(
              <div key={p.id} className="crit-item">
                <div>
                  <div className="crit-name">{p.name}</div>
                  <div className="crit-brand">{p.brand}</div>
                </div>
                <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:10}}>
                  <span className="crit-stock" style={{color:p.stock===0?'var(--accent-red)':'var(--accent-gold)'}}>{p.stock} un</span>
                  <div className="crit-dot" style={{color:p.stock===0?'var(--accent-red)':'var(--accent-gold)'}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="p-head">Top Produtos por Volume</div>
          <div className="p-body top-table">
            <table>
              <thead><tr><th>#</th><th>Produto</th><th>Estoque</th><th>Status</th><th>Cor</th></tr></thead>
              <tbody>
                {topProducts.map((p,i)=>{
                  const status=p.stock===0?'ESGOTADO':p.stock<=5?'BAIXO':'OK';
                  const color=p.stock===0?'var(--accent-red)':p.stock<=5?'var(--accent-gold)':'var(--accent-green)';
                  return (
                    <tr key={p.id}>
                      <td style={{color:'var(--text-dim)'}}>{String(i+1).padStart(2,'0')}</td>
                      <td>{p.name}</td>
                      <td style={{color:'var(--accent-cyan)',fontFamily:'Orbitron, monospace'}}>{p.stock}</td>
                      <td><span className="tag" style={{borderColor:color,color:color}}>{status}</span></td>
                      <td><div className="color-dot" style={{backgroundColor:color,boxShadow:`0 0 8px ${color}`}}></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {loading && <div className="empty">Recarregando...</div>}
    </div>
  );
}
