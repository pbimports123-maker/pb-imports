"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ImportExcelModal from "../products/import-excel-modal";

type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  image_url?: string | null;
  is_out_of_stock?: boolean;
  presentation?: string | null;
  dosage?: string | null;
  categories?: { name?: string | null } | null;
};

type Status = "Ativo" | "Baixo" | "Falta";

const PER_PAGE = 10;

const CAT_CLASS: Record<string, string> = {
  tirzepatida: "cat-tirz",
  semaglutida: "cat-sema",
  retatrutida: "cat-reta",
  "peptídeo": "cat-pept",
  peptideo: "cat-pept",
  anabolizante: "cat-anab",
  "farmácia": "cat-farm",
  farmacia: "cat-farm",
};

function statusFromStock(stock: number, isOut?: boolean): Status {
  if (isOut || stock <= 0) return "Falta";
  if (stock <= 5) return "Baixo";
  return "Ativo";
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "">("");
  const [filterPrice, setFilterPrice] = useState<number | "">("");
  const [chipFilter, setChipFilter] = useState("");
  const [sortKey, setSortKey] = useState<"nome" | "categoria" | "preco" | null>(null);
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [page, setPage] = useState(1);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("id, name, brand, price, stock, image_url, is_out_of_stock, presentation, dosage, categories (name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProducts((data as Product[]) || []);
    } catch (err: any) {
      toast.error("Erro ao carregar produtos: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Máximo dinâmico baseado no maior estoque real ──
  const maxStock = useMemo(
    () => Math.max(...products.map((p) => p.stock), 1),
    [products]
  );

  const filtered = useMemo(() => {
    const cat = chipFilter || filterCat;
    const maxPrice = filterPrice === "" ? Infinity : Number(filterPrice);
    let list = products.filter((p) => {
      const s = search.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(s) || p.brand?.toLowerCase().includes(s);
      const catName = (p.categories?.name || "").trim();
      const matchCat = !cat || catName.toLowerCase() === cat.toLowerCase();
      const stat = statusFromStock(p.stock, p.is_out_of_stock);
      const matchStatus = !filterStatus || stat === filterStatus;
      const matchPrice = (p.price || 0) <= maxPrice;
      return matchSearch && matchCat && matchStatus && matchPrice;
    });
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const av = sortKey === "nome" ? a.name : sortKey === "categoria" ? a.categories?.name || "" : a.price;
        const bv = sortKey === "nome" ? b.name : sortKey === "categoria" ? b.categories?.name || "" : b.price;
        if (typeof av === "string") return av.localeCompare(bv as string) * sortDir;
        return ((av as number) - (bv as number)) * sortDir;
      });
    }
    return list;
  }, [products, search, chipFilter, filterCat, filterStatus, filterPrice, sortKey, sortDir]);

  const paged = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  const maxPage = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  useEffect(() => { setPage(1); }, [search, chipFilter, filterCat, filterStatus, filterPrice, sortKey]);

  const handleSort = (key: "nome" | "categoria" | "preco") => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(1); }
  };

  const getCatClass = (cat?: string | null) => {
    if (!cat) return "cat-badge";
    return `cat-badge ${CAT_CLASS[cat.toLowerCase()] || ""}`;
  };

  // ── barInfo agora usa maxStock dinâmico ──
  const barInfo = (stock: number) => {
    const pct = Math.min(100, Math.round((stock / maxStock) * 100));
    if (stock <= 0) return { pct, cls: "fill-out", text: `0 un` };
    if (stock <= 5) return { pct: Math.max(pct, 8), cls: "fill-low", text: `${stock} un` };
    return { pct: Math.max(pct, 12), cls: "fill-ok", text: `${stock} un` };
  };

  async function handleDelete(id: string) {
    if (deleting) return;
    const confirm = window.confirm("Remover este produto?");
    if (!confirm) return;
    try {
      setDeleting(true);
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast.success("Produto removido.");
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      toast.error("Erro ao remover: " + err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleSaveEdit() {
    if (!editProduct) return;
    try {
      setSaving(true);
      const payload = {
        name: editProduct.name,
        brand: editProduct.brand,
        price: editProduct.price,
        stock: editProduct.stock,
        image_url: editProduct.image_url,
        is_out_of_stock: editProduct.is_out_of_stock,
      };
      const { error } = await supabase.from("products").update(payload).eq("id", editProduct.id);
      if (error) throw error;
      toast.success("Produto atualizado.");
      setProducts((prev) => prev.map((p) => (p.id === editProduct.id ? { ...p, ...payload } : p)));
      setEditProduct(null);
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(file: File) {
    if (!editProduct) return;
    try {
      setUploading(true);
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${editProduct.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
      setEditProduct((prev) => (prev ? { ...prev, image_url: data.publicUrl } : prev));
      toast.success("Imagem carregada. Salve para aplicar.");
    } catch (err: any) {
      toast.error("Falha ao enviar imagem: " + err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="content">
      <style jsx>{`
        /* ── Header ── */
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
        .page-title { font-family: "Raleway", sans-serif; font-size: 26px; font-weight: 700; color: var(--text-primary); letter-spacing: 1px; text-transform: uppercase; line-height: 1; }
        .page-title span { color: var(--accent-terra); }
        .page-sub { font-family: "DM Sans", sans-serif; font-size: 12px; color: var(--text-muted); margin-top: 6px; }
        .btn-new { display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: var(--accent-terra); border: none; cursor: pointer; font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 700; color: #fff; letter-spacing: 0.5px; border-radius: 8px; transition: all 0.2s; }
        .btn-new:hover { background: var(--accent-terra-dark); transform: translateY(-1px); }
        .btn-import { display: flex; align-items: center; gap: 8px; padding: 12px 18px; background: transparent; border: 1.5px solid rgba(194,130,102,0.4); border-radius: 8px; color: var(--accent-terra); font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-import:hover { background: rgba(194,130,102,0.08); }

        /* ── Toolbar ── */
        .toolbar { display: flex; gap: 12px; margin-bottom: 12px; }
        .search-wrap { flex: 1; position: relative; }
        .search-input { width: 100%; padding: 12px 16px 12px 40px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 8px; color: var(--text-primary); font-family: "DM Sans", sans-serif; font-size: 14px; outline: none; transition: all 0.2s; }
        .search-input::placeholder { color: var(--text-dim); }
        .search-input:focus { border-color: var(--accent-terra); box-shadow: 0 0 0 3px rgba(194,130,102,0.12); }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 15px; }
        .filter-btn { display: flex; align-items: center; gap: 8px; padding: 12px 18px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 8px; color: var(--text-muted); cursor: pointer; font-family: "DM Sans", sans-serif; font-size: 13px; font-weight: 500; transition: all 0.2s; }
        .filter-btn.active, .filter-btn:hover { border-color: var(--accent-terra); color: var(--accent-terra); background: rgba(194,130,102,0.06); }

        /* ── Filtros ── */
        .filter-panel { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 10px; padding: 16px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 12px; }
        .filter-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .filter-group { flex: 1; min-width: 140px; display: flex; flex-direction: column; gap: 6px; }
        .form-label { font-size: 11px; font-weight: 600; color: var(--text-muted); letter-spacing: 0.5px; text-transform: uppercase; }
        .form-input, .form-select { padding: 10px 12px; background: var(--bg-card2); border: 1px solid var(--border-main); border-radius: 6px; color: var(--text-primary); font-family: "DM Sans", sans-serif; font-size: 13px; outline: none; }
        .form-select:focus, .form-input:focus { border-color: var(--accent-terra); }

        /* ── Chips ── */
        .filter-chips { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .chip { padding: 6px 14px; border: 1px solid var(--border-main); border-radius: 20px; color: var(--text-muted); font-family: "DM Sans", sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .chip.active, .chip:hover { border-color: var(--accent-terra); color: var(--accent-terra); background: rgba(194,130,102,0.08); }

        /* ── Tabela ── */
        .table-wrap { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 12px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        thead tr { border-bottom: 1px solid var(--border-main); background: rgba(194,130,102,0.04); }
        th { padding: 14px 18px; font-family: "DM Sans", sans-serif; font-size: 11px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px; text-transform: uppercase; text-align: left; }
        th.sortable { cursor: pointer; }
        th.sortable:hover { color: var(--accent-terra); }
        td { padding: 14px 18px; font-size: 14px; }
        tbody tr { border-bottom: 1px solid var(--border-dim); transition: background 0.15s; }
        tbody tr:last-child { border-bottom: none; }
        tbody tr:hover { background: rgba(194,130,102,0.04); }

        /* Imagem */
        .prod-img { width: 42px; height: 42px; background: rgba(194,130,102,0.08); border: 1px solid var(--border-main); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; overflow: hidden; }

        /* Nome */
        .prod-name { color: var(--text-primary); font-weight: 600; }
        .prod-brand { font-size: 11px; color: var(--text-muted); margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }

        /* Categorias */
        .cat-badge { padding: 3px 10px; border: 1px solid var(--border-main); border-radius: 20px; font-size: 10px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
        .cat-tirz { border-color: rgba(194,130,102,0.4); color: var(--accent-terra-dark); background: rgba(194,130,102,0.08); }
        .cat-sema { border-color: rgba(122,175,144,0.4); color: #5A8F70; background: rgba(122,175,144,0.08); }
        .cat-reta { border-color: rgba(212,169,106,0.4); color: #8A6830; background: rgba(212,169,106,0.08); }
        .cat-pept { border-color: rgba(138,175,200,0.4); color: #4A7A9B; background: rgba(138,175,200,0.08); }
        .cat-anab { border-color: rgba(192,97,79,0.4); color: var(--accent-red); background: rgba(192,97,79,0.08); }
        .cat-farm { border-color: rgba(160,120,200,0.4); color: #8A60B0; background: rgba(160,120,200,0.08); }

        /* Preço */
        .price-val { font-family: "Raleway", sans-serif; font-size: 14px; font-weight: 700; color: var(--accent-terra-dark); }

        /* Estoque */
        .estoque-wrap { display: flex; flex-direction: column; gap: 4px; }
        .estoque-bar { height: 3px; background: rgba(194,130,102,0.1); border-radius: 4px; width: 80px; }
        .estoque-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
        .fill-ok { background: #7AAF90; }
        .fill-low { background: #D4A96A; }
        .fill-out { background: #C0614F; }
        .estoque-num { font-size: 11px; color: var(--text-muted); }

        /* Status */
        .status-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border: 1px solid; border-radius: 20px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .status-dot-s { width: 5px; height: 5px; border-radius: 50%; }
        .status-active { border-color: rgba(122,175,144,0.5); color: #5A8F70; }
        .status-active .status-dot-s { background: #7AAF90; }
        .status-low { border-color: rgba(212,169,106,0.5); color: #8A6830; }
        .status-low .status-dot-s { background: #D4A96A; }
        .status-out { border-color: rgba(192,97,79,0.4); color: #C0614F; }
        .status-out .status-dot-s { background: #C0614F; }

        /* Ações */
        .actions { display: flex; gap: 6px; }
        .act-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: var(--bg-card2); border: 1px solid var(--border-dim); border-radius: 6px; cursor: pointer; font-size: 14px; transition: all 0.2s; }
        .act-btn:hover { border-color: var(--accent-terra); background: rgba(194,130,102,0.08); }
        .act-btn.del:hover { border-color: #C0614F; background: rgba(192,97,79,0.08); }

        /* Footer tabela */
        .table-footer { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-top: 1px solid var(--border-dim); background: rgba(194,130,102,0.02); }
        .table-count { font-size: 12px; color: var(--text-muted); }
        .table-count span { color: var(--accent-terra); font-weight: 700; }
        .pagination { display: flex; gap: 4px; }
        .page-btn { width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; background: transparent; border: 1px solid var(--border-main); border-radius: 6px; font-size: 13px; color: var(--text-muted); cursor: pointer; transition: all 0.2s; }
        .page-btn:hover, .page-btn.active { border-color: var(--accent-terra); color: var(--accent-terra); background: rgba(194,130,102,0.08); }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Modal */
        .modal-backdrop { position: fixed; inset: 0; background: rgba(13,15,19,0.5); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 200; }
        .modal { width: 520px; max-width: 92vw; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 14px; box-shadow: 0 20px 60px rgba(194,130,102,0.15); padding: 24px; display: flex; flex-direction: column; gap: 14px; }
        .modal h3 { font-family: "Raleway", sans-serif; font-size: 18px; font-weight: 700; letter-spacing: 0.5px; color: var(--accent-terra-dark); }
        .modal-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .modal label { font-size: 11px; font-weight: 600; color: var(--text-muted); letter-spacing: 0.3px; text-transform: uppercase; display: block; margin-bottom: 5px; }
        .modal input { width: 100%; padding: 10px 12px; background: var(--bg-card2); border: 1px solid var(--border-main); border-radius: 8px; color: var(--text-primary); font-family: "DM Sans", sans-serif; font-size: 14px; outline: none; }
        .modal input:focus { border-color: var(--accent-terra); }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }
        .btn { padding: 10px 18px; border: 1px solid var(--border-main); border-radius: 8px; background: transparent; color: var(--text-muted); cursor: pointer; font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 600; transition: all 0.2s; }
        .btn:hover { border-color: var(--accent-terra); color: var(--accent-terra); }
        .btn.primary { border-color: var(--accent-terra); background: var(--accent-terra); color: #fff; }
        .btn.primary:hover { background: var(--accent-terra-dark); }
      `}</style>

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <div className="page-title">Pro<span>dutos</span></div>
          <div className="page-sub">Gerencie o catálogo de produtos da PB Imports</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-import" onClick={() => setImportOpen(true)}>
            📊 Importar Excel
          </button>
          <Link href="/admin/products/new">
            <button className="btn-new">+ Novo Produto</button>
          </Link>
        </div>
      </div>

      {importOpen && (
        <ImportExcelModal
          onClose={() => setImportOpen(false)}
          onDone={() => fetchProducts()}
        />
      )}

      {/* ── Toolbar ── */}
      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Buscar por nome ou marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`filter-btn ${filterCat || filterStatus || filterPrice !== "" ? "active" : ""}`}
          onClick={() => setShowFilters((v) => !v)}
        >
          ⚙ Filtros
        </button>
      </div>

      {/* ── Painel de filtros ── */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label className="form-label">Categoria</label>
              <select className="form-select" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
                <option value="">Todas</option>
                <option value="Tirzepatida">Tirzepatida</option>
                <option value="Semaglutida">Semaglutida</option>
                <option value="Retatrutida">Retatrutida</option>
                <option value="peptídeo">Peptídeos</option>
                <option value="Anabolizante">Anabolizante</option>
                <option value="farmácia">Farmácia</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as Status | "")}>
                <option value="">Todos</option>
                <option value="Ativo">Ativo</option>
                <option value="Baixo">Baixo Estoque</option>
                <option value="Falta">Em Falta</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="form-label">Preço Máx (R$)</label>
              <input
                className="form-input"
                type="number"
                placeholder="Ex: 1000"
                value={filterPrice}
                onChange={(e) => setFilterPrice(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Chips de categoria ── */}
      <div className="filter-chips">
        {[
          { label: "Todos", val: "" },
          { label: "Tirzepatida", val: "Tirzepatida" },
          { label: "Semaglutida", val: "Semaglutida" },
          { label: "Retatrutida", val: "Retatrutida" },
          { label: "Peptídeos", val: "peptídeo" },
          { label: "Anabolizantes", val: "Anabolizante" },
          { label: "Farmácia", val: "farmácia" },
        ].map((c) => (
          <div
            key={c.label}
            className={`chip ${chipFilter === c.val ? "active" : ""}`}
            onClick={() => { setChipFilter(c.val); setFilterCat(c.val); }}
          >
            {c.label}
          </div>
        ))}
      </div>

      {/* ── Tabela ── */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Imagem</th>
              <th className="sortable" onClick={() => handleSort("nome")}>Produto ⇅</th>
              <th>Apresentação</th>
              <th className="sortable" onClick={() => handleSort("categoria")}>Categoria ⇅</th>
              <th className="sortable" onClick={() => handleSort("preco")}>Preço ⇅</th>
              <th>Estoque</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 14 }}>
                  Carregando produtos...
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 40, color: "var(--text-muted)", fontSize: 14 }}>
                  Nenhum produto encontrado
                </td>
              </tr>
            ) : (
              paged.map((p) => {
                const catName = p.categories?.name || "Sem categoria";
                const stat = statusFromStock(p.stock, p.is_out_of_stock);
                const bar = barInfo(p.stock);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="prod-img">
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : "📦"}
                      </div>
                    </td>
                    <td>
                      <div className="prod-name">{p.name}</div>
                      <div className="prod-brand">{p.brand}</div>
                    </td>
                    <td>
                      {p.presentation ? (
                        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{p.presentation}</div>
                      ) : null}
                      {p.dosage ? (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{p.dosage}</div>
                      ) : (
                        !p.presentation && <span style={{ fontSize: 12, color: "var(--text-dim)" }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={getCatClass(catName)}>{catName}</span>
                    </td>
                    <td>
                      <span className="price-val">
                        R$ {Number(p.price || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      <div className="estoque-wrap">
                        <div className="estoque-bar">
                          <div className={`estoque-fill ${bar.cls}`} style={{ width: `${bar.pct}%` }} />
                        </div>
                        <div className="estoque-num">{bar.text}</div>
                      </div>
                    </td>
                    <td>
                      {stat === "Ativo" && (
                        <span className="status-pill status-active"><span className="status-dot-s" /> Ativo</span>
                      )}
                      {stat === "Baixo" && (
                        <span className="status-pill status-low"><span className="status-dot-s" /> Baixo</span>
                      )}
                      {stat === "Falta" && (
                        <span className="status-pill status-out"><span className="status-dot-s" /> Em Falta</span>
                      )}
                    </td>
                    <td>
                      <div className="actions">
                        <button className="act-btn" title="Visualizar" onClick={() => setViewProduct(p)}>👁</button>
                        <button className="act-btn" title="Editar" onClick={() => setEditProduct(p)}>✏️</button>
                        <button className="act-btn del" title="Excluir" onClick={() => handleDelete(p.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="table-footer">
          <div className="table-count">
            Exibindo <span>{paged.length}</span> de <span>{filtered.length}</span> produtos
          </div>
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
            <button className="page-btn active">{page}</button>
            <button className="page-btn" onClick={() => setPage((p) => Math.min(maxPage, p + 1))} disabled={page === maxPage}>›</button>
          </div>
        </div>
      </div>

      {/* ── Modal visualizar / editar ── */}
      {(viewProduct || editProduct) && (
        <div className="modal-backdrop" onClick={() => { setViewProduct(null); setEditProduct(null); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{viewProduct ? "Visualizar Produto" : "Editar Produto"}</h3>
            <div className="modal-row">
              <div>
                <label>Nome</label>
                <input
                  readOnly={!!viewProduct}
                  value={(viewProduct || editProduct)?.name || ""}
                  onChange={(e) => editProduct && setEditProduct({ ...editProduct, name: e.target.value })}
                />
              </div>
              <div>
                <label>Marca</label>
                <input
                  readOnly={!!viewProduct}
                  value={(viewProduct || editProduct)?.brand || ""}
                  onChange={(e) => editProduct && setEditProduct({ ...editProduct, brand: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-row">
              <div>
                <label>Preço (R$)</label>
                <input
                  type="number"
                  readOnly={!!viewProduct}
                  value={(viewProduct || editProduct)?.price || 0}
                  onChange={(e) => editProduct && setEditProduct({ ...editProduct, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <label>Estoque</label>
                <input
                  type="number"
                  readOnly={!!viewProduct}
                  value={(viewProduct || editProduct)?.stock || 0}
                  onChange={(e) => editProduct && setEditProduct({ ...editProduct, stock: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label>Imagem (URL)</label>
              <input
                readOnly={!!viewProduct}
                value={(viewProduct || editProduct)?.image_url || ""}
                onChange={(e) => editProduct && setEditProduct({ ...editProduct, image_url: e.target.value })}
                placeholder="https://..."
              />
              {!viewProduct && (
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleUpload(file); }}
                    disabled={uploading}
                  />
                  {uploading && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Enviando...</span>}
                </div>
              )}
            </div>
            <div>
              <label>Status</label>
              <input
                readOnly
                value={(viewProduct || editProduct)?.is_out_of_stock ? "Em falta" : "Disponível"}
                style={{ cursor: "not-allowed", color: "var(--text-muted)" }}
              />
            </div>
            <div className="modal-actions">
              {editProduct && (
                <button className="btn primary" onClick={handleSaveEdit} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </button>
              )}
              <button className="btn" onClick={() => { setViewProduct(null); setEditProduct(null); }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}