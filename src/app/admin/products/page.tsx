"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Product = {
  id: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  image_url?: string | null;
  is_out_of_stock?: boolean;
  categories?: { name?: string | null } | null;
};

type Status = "Ativo" | "Baixo" | "Falta";

const PER_PAGE = 10;
const DEFAULT_MAX = 50;

const CAT_CLASS: Record<string, string> = {
  tirzepatida: "cat-tirz",
  semaglutida: "cat-sema",
  retatrutida: "cat-reta",
  "peptídeo": "cat-pept",
  peptideo: "cat-pept",
  anabolizante: "cat-anab",
  farmácia: "cat-farm",
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

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(
          `
            id, name, brand, price, stock, image_url, is_out_of_stock,
            categories (name)
          `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts((data as Product[]) || []);
    } catch (err: any) {
      toast.error("Erro ao carregar produtos: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    const cat = chipFilter || filterCat;
    const maxPrice = filterPrice === "" ? Infinity : Number(filterPrice);

    let list = products.filter((p) => {
      const s = search.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(s) || p.brand?.toLowerCase().includes(s);
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

  useEffect(() => {
    setPage(1);
  }, [search, chipFilter, filterCat, filterStatus, filterPrice, sortKey]);

  const handleSort = (key: "nome" | "categoria" | "preco") => {
    if (sortKey === key) {
      setSortDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  const getCatClass = (cat?: string | null) => {
    if (!cat) return "cat-badge";
    const normalized = cat.toLowerCase();
    return `cat-badge ${CAT_CLASS[normalized] || ""}`;
  };

  const barInfo = (stock: number) => {
    const pct = Math.min(100, Math.round((stock / DEFAULT_MAX) * 100));
    if (stock <= 0) return { pct, cls: "fill-out", text: `${stock} / ${DEFAULT_MAX} un` };
    if (stock <= 5) return { pct: Math.max(pct, 8), cls: "fill-low", text: `${stock} / ${DEFAULT_MAX} un` };
    return { pct: Math.max(pct, 12), cls: "fill-ok", text: `${stock} / ${DEFAULT_MAX} un` };
  };

  return (
    <div className="content">
      <style jsx>{`
        .page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .page-title {
          font-family: "Orbitron", monospace;
          font-size: 26px;
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
          margin-top: 8px;
        }
        .btn-new {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-blue));
          border: none;
          cursor: pointer;
          font-family: "Orbitron", monospace;
          font-size: 11px;
          font-weight: 700;
          color: var(--bg-void);
          letter-spacing: 2px;
          text-transform: uppercase;
          transition: all 0.2s;
          clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%);
        }
        .btn-new:hover {
          box-shadow: 0 0 24px rgba(0, 229, 255, 0.4);
        }
        .toolbar {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }
        .search-wrap {
          flex: 1;
          position: relative;
        }
        .search-input {
          width: 100%;
          padding: 12px 16px 12px 40px;
          background: var(--bg-card);
          border: 1px solid var(--border-dim);
          color: var(--text-primary);
          font-family: "Share Tech Mono", monospace;
          font-size: 12px;
          letter-spacing: 1px;
          outline: none;
        }
        .search-input::placeholder {
          color: var(--text-dim);
        }
        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }
        .filter-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          background: var(--bg-card);
          border: 1px solid var(--border-dim);
          color: var(--text-muted);
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
        }
        .filter-btn.active,
        .filter-btn:hover {
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
          background: rgba(0, 229, 255, 0.06);
        }
        .filter-panel {
          display: none;
          background: var(--bg-card);
          border: 1px solid var(--border-dim);
          padding: 16px;
          margin-bottom: 12px;
          flex-direction: column;
          gap: 12px;
        }
        .filter-panel.open {
          display: flex;
        }
        .filter-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .filter-group {
          flex: 1;
          min-width: 140px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-family: "Share Tech Mono", monospace;
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 3px;
          text-transform: uppercase;
        }
        .form-input,
        .form-select {
          padding: 10px 12px;
          background: var(--bg-card2);
          border: 1px solid var(--border-dim);
          color: var(--text-primary);
          font-family: "Share Tech Mono", monospace;
          font-size: 12px;
        }
        .filter-chips {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .chip {
          padding: 5px 12px;
          border: 1px solid var(--border-dim);
          color: var(--text-muted);
          font-family: "Share Tech Mono", monospace;
          font-size: 9px;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
        }
        .chip.active,
        .chip:hover {
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
          background: rgba(0, 229, 255, 0.08);
        }
        .table-wrap {
          background: var(--bg-card);
          border: 1px solid var(--border-dim);
          position: relative;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        thead tr {
          border-bottom: 1px solid var(--border-glow);
          background: rgba(0, 229, 255, 0.03);
        }
        th {
          padding: 14px 18px;
          font-family: "Share Tech Mono", monospace;
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 3px;
          text-transform: uppercase;
          text-align: left;
        }
        th.sortable {
          cursor: pointer;
        }
        th.sortable:hover {
          color: var(--accent-cyan);
        }
        td {
          padding: 14px 18px;
          font-size: 14px;
        }
        tbody tr {
          border-bottom: 1px solid var(--border-dim);
        }
        tbody tr:hover {
          background: rgba(0, 229, 255, 0.04);
        }
        .prod-img {
          width: 40px;
          height: 40px;
          background: rgba(0, 229, 255, 0.06);
          border: 1px solid var(--border-dim);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          overflow: hidden;
        }
        .prod-name {
          color: var(--text-primary);
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .prod-brand {
          font-family: "Share Tech Mono", monospace;
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 2px;
        }
        .cat-badge {
          padding: 3px 10px;
          border: 1px solid var(--border-dim);
          font-family: "Share Tech Mono", monospace;
          font-size: 9px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .cat-tirz {
          border-color: rgba(0, 229, 255, 0.4);
          color: var(--accent-cyan);
          background: rgba(0, 229, 255, 0.06);
        }
        .cat-sema {
          border-color: rgba(0, 255, 157, 0.4);
          color: var(--accent-green);
          background: rgba(0, 255, 157, 0.06);
        }
        .cat-reta {
          border-color: rgba(255, 214, 0, 0.4);
          color: var(--accent-gold);
          background: rgba(255, 214, 0, 0.06);
        }
        .cat-pept {
          border-color: rgba(21, 101, 255, 0.4);
          color: #6ea8ff;
          background: rgba(21, 101, 255, 0.08);
        }
        .cat-anab {
          border-color: rgba(255, 45, 95, 0.4);
          color: var(--accent-red);
          background: rgba(255, 45, 95, 0.06);
        }
        .cat-farm {
          border-color: rgba(160, 90, 255, 0.4);
          color: #c084ff;
          background: rgba(160, 90, 255, 0.06);
        }
        .price-val {
          font-family: "Orbitron", monospace;
          font-size: 13px;
          font-weight: 700;
          color: var(--accent-gold);
          letter-spacing: 1px;
        }
        .estoque-wrap {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .estoque-bar {
          height: 2px;
          background: rgba(255, 255, 255, 0.05);
          width: 80px;
        }
        .estoque-fill {
          height: 100%;
          transition: width 0.6s ease;
        }
        .fill-ok {
          background: var(--accent-green);
          box-shadow: 0 0 6px var(--accent-green);
        }
        .fill-low {
          background: var(--accent-gold);
          box-shadow: 0 0 6px var(--accent-gold);
        }
        .fill-out {
          background: var(--accent-red);
          box-shadow: 0 0 6px var(--accent-red);
        }
        .estoque-num {
          font-family: "Share Tech Mono", monospace;
          font-size: 10px;
          color: var(--text-muted);
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border: 1px solid;
          font-family: "Share Tech Mono", monospace;
          font-size: 9px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .status-dot-s {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }
        .status-active {
          border-color: rgba(0, 255, 157, 0.4);
          color: var(--accent-green);
        }
        .status-active .status-dot-s {
          background: var(--accent-green);
          box-shadow: 0 0 6px var(--accent-green);
        }
        .status-low {
          border-color: rgba(255, 214, 0, 0.4);
          color: var(--accent-gold);
        }
        .status-low .status-dot-s {
          background: var(--accent-gold);
          box-shadow: 0 0 6px var(--accent-gold);
        }
        .status-out {
          border-color: rgba(255, 45, 95, 0.4);
          color: var(--accent-red);
        }
        .status-out .status-dot-s {
          background: var(--accent-red);
          box-shadow: 0 0 6px var(--accent-red);
        }
        .actions {
          display: flex;
          gap: 6px;
        }
        .act-btn {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid var(--border-dim);
          cursor: pointer;
          font-size: 13px;
        }
        .act-btn:hover {
          border-color: var(--accent-cyan);
          background: rgba(0, 229, 255, 0.08);
        }
        .act-btn.del:hover {
          border-color: var(--accent-red);
          background: rgba(255, 45, 95, 0.08);
        }
        .table-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-top: 1px solid var(--border-dim);
          background: rgba(0, 229, 255, 0.02);
        }
        .table-count {
          font-family: "Share Tech Mono", monospace;
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 2px;
        }
        .table-count span {
          color: var(--accent-cyan);
        }
        .pagination {
          display: flex;
          gap: 4px;
        }
        .page-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid var(--border-dim);
          font-family: "Share Tech Mono", monospace;
          font-size: 10px;
          color: var(--text-muted);
          cursor: pointer;
        }
        .page-btn:hover,
        .page-btn.active {
          border-color: var(--accent-cyan);
          color: var(--accent-cyan);
          background: rgba(0, 229, 255, 0.1);
        }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title">
            Pro<span>dutos</span>
          </div>
          <div className="page-sub">// Gerencie o catálogo de produtos da PB Imports</div>
        </div>
        <Link href="/admin/products/new">
          <button className="btn-new">
            <span>＋</span> Novo Produto
          </button>
        </Link>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="BUSCAR POR NOME OU MARCA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`filter-btn ${filterCat || filterStatus || filterPrice !== "" ? "active" : ""}`}
          onClick={() =>
            document.getElementById("filterPanel")?.classList.toggle("open")
          }
        >
          ⚙ Filtros
        </button>
      </div>

      <div className="filter-panel" id="filterPanel">
        <div className="filter-row">
          <div className="filter-group">
            <label className="form-label">Categoria</label>
            <select
              className="form-select"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="Tirzepatida">Tirzepatida</option>
              <option value="Semaglutida">Semaglutida</option>
              <option value="Retatrutida">Retatrutida</option>
              <option value="Peptídeo">Peptídeo</option>
              <option value="Anabolizante">Anabolizante</option>
              <option value="Farmácia">Farmácia</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as Status | "")}
            >
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
              onChange={(e) =>
                setFilterPrice(e.target.value === "" ? "" : Number(e.target.value))
              }
            />
          </div>
        </div>
      </div>

      <div className="filter-chips">
        {[
          { label: "Todos", val: "" },
          { label: "Tirzepatida", val: "Tirzepatida" },
          { label: "Semaglutida", val: "Semaglutida" },
          { label: "Retatrutida", val: "Retatrutida" },
          { label: "Peptídeos", val: "Peptídeo" },
          { label: "Anabolizantes", val: "Anabolizante" },
          { label: "Farmácia", val: "Farmácia" },
        ].map((c) => (
          <div
            key={c.label}
            className={`chip ${chipFilter === c.val ? "active" : ""}`}
            onClick={() => {
              setChipFilter(c.val);
              setFilterCat(c.val);
            }}
          >
            {c.label}
          </div>
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Imagem</th>
              <th className="sortable" onClick={() => handleSort("nome")}>
                Produto ⇅
              </th>
              <th className="sortable" onClick={() => handleSort("categoria")}>
                Categoria ⇅
              </th>
              <th className="sortable" onClick={() => handleSort("preco")}>
                Preço ⇅
              </th>
              <th>Estoque</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 40 }}>
                  <span style={{ fontFamily: "Share Tech Mono, monospace", color: "var(--text-muted)" }}>
                    // CARREGANDO PRODUTOS...
                  </span>
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: 40 }}>
                  <span style={{ fontFamily: "Share Tech Mono, monospace", color: "var(--text-muted)" }}>
                    // NENHUM PRODUTO ENCONTRADO
                  </span>
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
                          <img
                            src={p.image_url}
                            alt={p.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          "📦"
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="prod-name">{p.name}</div>
                      <div className="prod-brand">{p.brand}</div>
                    </td>
                    <td>
                      <span className={getCatClass(catName)}>{catName}</span>
                    </td>
                    <td>
                      <span className="price-val">
                        R$
                        {Number(p.price || 0).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td>
                      <div className="estoque-wrap">
                        <div className="estoque-bar">
                          <div
                            className={`estoque-fill ${bar.cls}`}
                            style={{ width: `${bar.pct}%` }}
                          />
                        </div>
                        <div className="estoque-num">{bar.text}</div>
                      </div>
                    </td>
                    <td>
                      {stat === "Ativo" && (
                        <span className="status-pill status-active">
                          <span className="status-dot-s" /> Ativo
                        </span>
                      )}
                      {stat === "Baixo" && (
                        <span className="status-pill status-low">
                          <span className="status-dot-s" /> Baixo
                        </span>
                      )}
                      {stat === "Falta" && (
                        <span className="status-pill status-out">
                          <span className="status-dot-s" /> Em Falta
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="actions">
                        <button className="act-btn" title="Visualizar">
                          👁
                        </button>
                        <button className="act-btn" title="Editar">
                          ✏️
                        </button>
                        <button className="act-btn del" title="Excluir">
                          🗑
                        </button>
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
            <button
              className="page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ‹
            </button>
            <button className="page-btn active">{page}</button>
            <button
              className="page-btn"
              onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
              disabled={page === maxPage}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
