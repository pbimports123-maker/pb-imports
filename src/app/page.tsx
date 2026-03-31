"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Bell, Truck, ScrollText, Lightbulb } from "lucide-react";
import { Product, Category, CategoryWithStats } from "@/types/product";

export default function Home() {
  const [search, setSearch] = useState("");
  const [showAlert, setShowAlert] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: catData, error: catError } = await supabase
          .from("categories")
          .select("*")
          .order("sort_order", { ascending: true });
        if (catError) throw catError;
        setCategories(catData || []);

        const { data: prodData, error: prodError } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("name", { ascending: true });
        if (prodError) throw prodError;
        setProducts(prodData || []);
      } catch (err: any) {
        toast.error("Erro ao carregar dados: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const categoriesWithStats = useMemo(() => {
    return categories
      .map((cat) => {
        const catProducts = products.filter((p) => p.category_id === cat.id);
        const filteredProducts = catProducts.filter(
          (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.brand.toLowerCase().includes(search.toLowerCase())
        );
        const marcas = new Set(catProducts.map((p) => p.brand));
        const emFalta = catProducts.filter((p) => p.is_out_of_stock).length;
        return {
          ...cat,
          totalMarcas: marcas.size,
          totalEmFalta: emFalta,
          produtos: filteredProducts,
        } as CategoryWithStats;
      })
      .filter((cat) => cat.produtos.length > 0 || search === "");
  }, [categories, products, search]);

  const totalAvailable = products.filter((p) => !p.is_out_of_stock).length;
  const totalOutOfStock = products.filter((p) => p.is_out_of_stock).length;

  return (
    <div className="page-shell">
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
          --text-primary: #e8f4ff;
          --text-muted: #4a7090;
          --text-dim: #2a4060;
          --border-dim: rgba(0, 229, 255, 0.08);
        }
        body { background: var(--bg-void); color: var(--text-primary); font-family: "Rajdhani", sans-serif; }
        .page-shell { min-height: 100vh; background: var(--bg-void); color: var(--text-primary); }
        .top { display:flex; align-items:center; justify-content:space-between; padding:18px 20px 10px; max-width:1180px; margin:0 auto; }
        .brand { display:flex; align-items:center; gap:10px; }
        .brand-mark { width:42px; height:42px; background:linear-gradient(135deg,var(--accent-cyan),var(--accent-blue)); clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%); display:flex; align-items:center; justify-content:center; font-family:"Orbitron",monospace; font-weight:900; color:var(--bg-void); }
        .brand-text { display:flex; flex-direction:column; line-height:1.1; }
        .brand-name { font-family:"Orbitron",monospace; letter-spacing:2px; font-size:14px; color:var(--accent-cyan); text-transform:uppercase; }
        .brand-sub { font-family:"Share Tech Mono",monospace; font-size:9px; color:var(--text-muted); letter-spacing:3px; text-transform:uppercase; }
        .hero { max-width: 1180px; margin: 0 auto; padding: 10px 20px 20px; }
        .title { font-family: "Orbitron", monospace; font-size: 32px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; }
        .badge-row { display: flex; gap: 10px; flex-wrap: wrap; margin: 14px 0 18px; }
        .stat { display:flex; align-items:center; gap:8px; padding:8px 12px; border:1px solid var(--border-dim); background: var(--bg-card); font-family:"Share Tech Mono", monospace; font-size:12px; letter-spacing:1px; text-transform:uppercase; }
        .stat.green { border-color: rgba(0,255,157,0.3); color: var(--accent-green); }
        .stat.red { border-color: rgba(255,45,95,0.3); color: var(--accent-red); }
        .search-box { position: relative; margin: 14px 0 18px; }
        .search-input { width: 100%; padding: 14px 48px; background: var(--bg-card); border:1px solid var(--border-dim); color: var(--text-primary); font-size:15px; letter-spacing:0.5px; outline:none; }
        .search-input::placeholder { color: var(--text-muted); }
        .search-input:focus { border-color: var(--accent-cyan); box-shadow: 0 0 12px rgba(0,229,255,0.15); }
        .search-icon { position:absolute; left:16px; top:50%; transform:translateY(-50%); color: var(--text-muted); }
        .alert { display:flex; gap:14px; align-items:center; background: var(--bg-card); border:1px solid rgba(255,214,0,0.25); padding:14px 16px; margin-bottom:16px; box-shadow:0 0 24px rgba(255,214,0,0.08); }
        .alert h4 { font-weight:700; letter-spacing:0.5px; }
        .cta-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(260px,1fr)); gap:12px; margin-bottom:16px; }
        .cta { padding:18px; border:1px solid var(--border-dim); background: var(--bg-card); display:flex; flex-direction:column; gap:6px; transition:all 0.2s; }
        .cta:hover { border-color: var(--accent-cyan); box-shadow:0 0 20px rgba(0,229,255,0.08); }
        .cta-title { font-family:"Orbitron", monospace; letter-spacing:1px; font-size:15px; }
        .info { display:flex; gap:12px; background:var(--bg-card); border:1px solid rgba(255,214,0,0.25); padding:12px 14px; margin-bottom:18px; }
        .cat-list { display:flex; flex-direction:column; gap:14px; }
        .cat-card { border:1px solid var(--border-dim); background:var(--bg-card2); padding:14px 16px; }
        .cat-head { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
        .cat-name { font-family:"Orbitron", monospace; font-size:16px; letter-spacing:1px; }
        .cat-stats { display:flex; gap:10px; font-family:"Share Tech Mono", monospace; font-size:10px; color: var(--text-muted); }
        .prod-grid { margin-top:12px; display:grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap:10px; }
        .prod { padding:12px; border:1px solid var(--border-dim); background:var(--bg-card); display:flex; flex-direction:column; gap:6px; }
        .prod-name { font-weight:700; letter-spacing:0.3px; }
        .prod-brand { font-family:"Share Tech Mono", monospace; font-size:10px; color: var(--text-muted); letter-spacing:1px; text-transform:uppercase; }
        .prod-status { align-self:flex-start; padding:3px 8px; border:1px solid; font-family:"Share Tech Mono", monospace; font-size:9px; letter-spacing:1px; }
        .ok { border-color: rgba(0,255,157,0.4); color: var(--accent-green); background: rgba(0,255,157,0.07); }
        .out { border-color: rgba(255,45,95,0.4); color: var(--accent-red); background: rgba(255,45,95,0.07); }
        .empty { text-align:center; padding:40px; border:1px dashed var(--border-dim); background:var(--bg-card); color:var(--text-muted); }
        footer { border-top:1px solid var(--border-dim); margin-top:28px; padding:18px; text-align:center; font-family:"Share Tech Mono", monospace; font-size:10px; color: var(--text-muted); letter-spacing:2px; }
      `}</style>

      <div className="top">
        <div className="brand">
          <div className="brand-mark">PB</div>
          <div className="brand-text">
            <div className="brand-name">PB IMPORTS</div>
            <div className="brand-sub">DISPONIBILIDADE</div>
          </div>
        </div>
      </div>

      <div className="hero">
        <div className="title">Lista de <span style={{color:"var(--accent-cyan)"}}>Disponibilidade</span></div>
        <div className="badge-row">
          <div className="stat green">{totalAvailable} disponíveis</div>
          <div className="stat red">{totalOutOfStock} em falta</div>
        </div>

        <div className="search-box">
          <Search className="search-icon" size={18} />
          <input
            className="search-input"
            placeholder="Buscar produto ou marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {showAlert && (
          <div className="alert">
            <div style={{background:"rgba(255,214,0,0.08)", padding:10, borderRadius:8}}>
              <Bell color="#ffd600" size={18} />
            </div>
            <div style={{flex:1}}>
              <h4>52 atualizações desde sua última visita</h4>
              <p style={{color:"var(--text-muted)", fontSize:12}}>Toque para ver o que mudou</p>
            </div>
            <button onClick={()=>setShowAlert(false)} style={{color:"var(--text-muted)", background:"transparent", border:"none", cursor:"pointer"}}>✕</button>
          </div>
        )}

        <div className="cta-grid">
          <Link href="/fretes" className="cta" style={{borderColor:"rgba(0,255,157,0.25)", boxShadow:"0 0 12px rgba(0,255,157,0.08)"}}>
            <div className="cta-title" style={{color:"var(--accent-green)"}}>Tabela de Fretes</div>
            <div style={{color:"var(--text-muted)", fontSize:12, letterSpacing:1}}>Valores de entrega</div>
          </Link>
          <Link href="/regras" className="cta" style={{borderColor:"rgba(255,214,0,0.25)", boxShadow:"0 0 12px rgba(255,214,0,0.08)"}}>
            <div className="cta-title" style={{color:"var(--accent-gold)"}}>Regras de Envio</div>
            <div style={{color:"var(--text-muted)", fontSize:12, letterSpacing:1}}>Como funciona</div>
          </Link>
        </div>

        <Link href="/curiosidades" className="cta" style={{borderColor:"rgba(139,92,246,0.25)", boxShadow:"0 0 12px rgba(139,92,246,0.08)", marginTop:16, marginBottom:16}}>
          <div className="cta-title" style={{color:"var(--accent-purple)"}}>Curiosidades</div>
          <div style={{color:"var(--text-muted)", fontSize:12, letterSpacing:1}}>Dicas e fatos rápidos</div>
        </Link>

        <div className="info">
          <Lightbulb color="#ffd600" size={18} />
          <p className="text-sm">
            Esta lista mostra <span style={{color:"var(--accent-cyan)", fontWeight:700}}>todos os produtos</span> da PB Imports. Produtos <span style={{color:"var(--accent-red)", fontWeight:700}}>em falta</span> serão repostos em breve.
          </p>
        </div>

        <div className="cat-list">
          {loading ? (
            <div className="empty">Carregando lista...</div>
          ) : categoriesWithStats.length === 0 ? (
            <div className="empty">
              <Search size={22} style={{opacity:0.4, marginBottom:8}} />
              Nenhum produto encontrado. Ajuste sua busca.
            </div>
          ) : (
            categoriesWithStats.map((cat) => (
              <div className="cat-card" key={cat.id}>
                <div className="cat-head">
                  <div>
                    <div className="cat-name">{cat.name}</div>
                    <div className="cat-stats">
                      <span>{cat.totalMarcas} marcas</span>
                      <span>{cat.produtos.length} itens</span>
                      <span style={{color: cat.totalEmFalta ? "var(--accent-red)" : "var(--text-muted)"}}>{cat.totalEmFalta} em falta</span>
                    </div>
                  </div>
                </div>
                <div className="prod-grid">
                  {cat.produtos.map((p) => (
                    <div className="prod" key={p.id}>
                      <div className="prod-name">{p.name}</div>
                      <div className="prod-brand">{p.brand}</div>
                      <span className={`prod-status ${p.is_out_of_stock ? "out" : "ok"}`}>
                        {p.is_out_of_stock ? "Em falta" : "Disponível"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <footer>
        PB IMPORTS · {products.length} PRODUTOS — Made with Dyad
      </footer>
    </div>
  );
}
