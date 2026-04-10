"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, Plus, Minus, X } from "lucide-react";
import { Product, Category } from "@/types/product";

type BrandGroup = { name: string; products: Product[] };
type CategoryGroup = {
  id: string;
  name: string;
  abbr: string;
  brands: BrandGroup[];
};
type CartItem = { cart_item_id: string; product: Product; quantity: number };

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem("pb_session_id");
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem("pb_session_id", sid);
  }
  return sid;
}

const LAST_VISIT_KEY = "pb_last_visit";
function getLastVisit(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_VISIT_KEY);
}
function saveLastVisit(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [updatesCount, setUpdatesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: catData, error: catErr } = await supabase
          .from("categories")
          .select("*")
          .order("sort_order", { ascending: true });
        if (catErr) throw catErr;
        setCategories(catData || []);

        const { data: prodData, error: prodErr } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("name", { ascending: true });
        if (prodErr) throw prodErr;

        const allProducts: Product[] = prodData || [];
        setProducts(allProducts);

        const lastVisit = getLastVisit();
        if (lastVisit) {
          const count = allProducts.filter((p) => {
            const updated = p.updated_at ? new Date(p.updated_at).getTime() : 0;
            const last = new Date(lastVisit).getTime();
            return updated > last;
          }).length;
          if (count > 0) {
            setUpdatesCount(count);
            setShowBanner(true);
          }
        }
        saveLastVisit();
      } catch (err: any) {
        toast.error("Erro ao carregar produtos: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCloseBanner = () => {
    setShowBanner(false);
  };

  const loadCart = useCallback(async () => {
    const sid = getSessionId();
    if (!sid) return;
    try {
      let { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("session_id", sid)
        .single();
      if (!cart) {
        const { data: newCart, error } = await supabase
          .from("carts")
          .insert({ session_id: sid })
          .select("id")
          .single();
        if (error) throw error;
        cart = newCart;
      }
      const { data: items, error: itemsErr } = await supabase
        .from("cart_items")
        .select("id, quantity, product:products(*)")
        .eq("cart_id", cart.id);
      if (itemsErr) throw itemsErr;
      setCartItems(
        (items || []).map((i: any) => ({
          cart_item_id: i.id,
          product: i.product,
          quantity: i.quantity,
        })),
      );
    } catch (err: any) {
      console.error("Erro ao carregar carrinho:", err);
    }
  }, []);

  useEffect(() => {
    if (mounted) loadCart();
  }, [mounted, loadCart]);

  const addToCart = async (product: Product) => {
    if (product.is_out_of_stock || (product.stock ?? 0) <= 0) return;
    const sid = getSessionId();
    setAddingId(product.id);
    try {
      let { data: cart } = await supabase
        .from("carts")
        .select("id")
        .eq("session_id", sid)
        .single();
      if (!cart) {
        const { data: newCart, error } = await supabase
          .from("carts")
          .insert({ session_id: sid })
          .select("id")
          .single();
        if (error) throw error;
        cart = newCart;
      }
      const existing = cartItems.find((i) => i.product.id === product.id);
      if (existing) {
        await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + 1 })
          .eq("id", existing.cart_item_id);
      } else {
        await supabase
          .from("cart_items")
          .insert({ cart_id: cart.id, product_id: product.id, quantity: 1 });
      }
      await loadCart();
      toast.success(`${product.name} adicionado ao carrinho!`);
      setCartOpen(true);
    } catch (err: any) {
      toast.error("Erro ao adicionar: " + err.message);
    } finally {
      setAddingId(null);
    }
  };

  const updateQty = async (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    setCartLoading(true);
    try {
      if (newQty <= 0) {
        await supabase.from("cart_items").delete().eq("id", item.cart_item_id);
      } else {
        await supabase
          .from("cart_items")
          .update({ quantity: newQty })
          .eq("id", item.cart_item_id);
      }
      await loadCart();
    } catch (err: any) {
      toast.error("Erro ao atualizar carrinho");
    } finally {
      setCartLoading(false);
    }
  };

  const removeItem = async (item: CartItem) => {
    setCartLoading(true);
    try {
      await supabase.from("cart_items").delete().eq("id", item.cart_item_id);
      await loadCart();
    } catch (err: any) {
      toast.error("Erro ao remover item");
    } finally {
      setCartLoading(false);
    }
  };

  const cartTotal = cartItems.reduce(
    (sum, i) => sum + (Number(i.product.price) || 0) * i.quantity,
    0,
  );
  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const highlight = (text: string | null | undefined) => {
    const safeText = text || "";
    if (!search.trim()) return safeText;
    try {
      const re = new RegExp(
        `(${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
        "gi",
      );
      return safeText.replace(re, "<mark>$1</mark>");
    } catch {
      return safeText;
    }
  };

  const groups: CategoryGroup[] = useMemo(() => {
    const normalized = categories.map((cat) => {
      const catProducts = products.filter((p) => p.category_id === cat.id);
      const filtered = catProducts.filter((p) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
          (p.name || "").toLowerCase().includes(s) ||
          (p.brand || "").toLowerCase().includes(s) ||
          (cat.name || "").toLowerCase().includes(s)
        );
      });

      const groupMap = new Map<string, Product[]>();
      filtered.forEach((p) => {
        const key = p.brand || "Outros";
        groupMap.set(key, [...(groupMap.get(key) || []), p]);
      });

      const brands: BrandGroup[] = Array.from(groupMap.entries()).map(
        ([name, products]) => ({ name, products }),
      );
      return {
        id: cat.id,
        name: cat.name || "Sem Categoria",
        abbr: (cat.name || "??").slice(0, 2).toUpperCase(),
        brands,
      };
    });
    return normalized.filter((c) => c.brands.length > 0);
  }, [categories, products, search]);

  const totalAvailable = useMemo(
    () =>
      products.filter((p) => !(p.is_out_of_stock || (p.stock ?? 0) <= 0))
        .length,
    [products],
  );
  const totalOut = useMemo(
    () =>
      products.filter((p) => p.is_out_of_stock || (p.stock ?? 0) <= 0).length,
    [products],
  );

  if (!mounted) return null;

  return (
    <div className="wrapper">
      <style jsx global>{`
        :root {
          --bg-void: #faf8ef;
          --bg-panel: #f2ede0;
          --bg-card: #ffffff;
          --bg-card2: #ede8da;
          --accent-terra: #c28266;
          --accent-terra-light: #d9a890;
          --accent-terra-dark: #9e6650;
          --accent-sage: #7aaf90;
          --accent-amber: #d4a96a;
          --accent-red: #c0614f;
          --text-primary: #0d0f13;
          --text-muted: #7a6558;
          --text-dim: #b0a090;
          --border-main: rgba(194, 130, 102, 0.22);
          --border-dim: rgba(194, 130, 102, 0.12);
          --grid-line: rgba(194, 130, 102, 0.06);
        }
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          background: var(--bg-void);
          font-family: "DM Sans", "Raleway", system-ui, sans-serif;
          color: var(--text-primary);
          min-height: 100vh;
          overflow-x: hidden;
        }
        body::after {
          content: "";
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(var(--grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }
        mark {
          background: rgba(194, 130, 102, 0.2);
          color: var(--accent-terra-dark);
          border-radius: 2px;
          padding: 0 2px;
        }
      `}</style>

      <style jsx>{`
        .wrapper {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px 24px 80px;
          position: relative;
          z-index: 1;
        }
        @media (max-width: 960px) {
          .wrapper {
            padding: 20px 16px 64px;
          }
          .page-title {
            font-size: 26px;
          }
        }
        .top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 36px;
        }
        .top-logo {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .logo-hex {
          width: 46px;
          height: 46px;
          background: linear-gradient(
            135deg,
            var(--accent-terra),
            var(--accent-terra-dark)
          );
          clip-path: polygon(
            50% 0%,
            100% 25%,
            100% 75%,
            50% 100%,
            0% 75%,
            0% 25%
          );
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse-logo 3s ease-in-out infinite;
          flex-shrink: 0;
        }
        @keyframes pulse-logo {
          0%,
          100% {
            filter: brightness(1) drop-shadow(0 0 5px rgba(194, 130, 102, 0.45));
          }
          50% {
            filter: brightness(1.15)
              drop-shadow(0 0 14px rgba(194, 130, 102, 0.65));
          }
        }
        .logo-hex span {
          font-family: "Raleway", sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
        }
        .logo-text .logo-name {
          font-family: "Raleway", sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: var(--accent-terra-dark);
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .logo-text .logo-sub {
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 2px;
          display: block;
        }
        .cart-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          background: var(--accent-terra);
          color: #fff;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-family: "Raleway", sans-serif;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }
        .cart-btn:hover {
          background: var(--accent-terra-dark);
          transform: translateY(-1px);
        }
        .cart-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 20px;
          height: 20px;
          background: #c0614f;
          color: #fff;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .page-title {
          font-family: "Raleway", sans-serif;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 24px;
          color: var(--text-primary);
        }
        .page-title span {
          color: var(--accent-terra);
        }
        .badges {
          display: flex;
          gap: 12px;
          margin-bottom: 28px;
          flex-wrap: nowrap;
        }
        .badge {
          padding: 8px 20px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          border: 1px solid;
          border-radius: 8px;
          white-space: nowrap;
        }
        .badge.green {
          border-color: var(--accent-sage);
          color: var(--accent-sage);
          background: rgba(122, 175, 144, 0.1);
        }
        .badge.red {
          border-color: var(--accent-red);
          color: var(--accent-red);
          background: rgba(192, 97, 79, 0.08);
        }
        .search-wrap {
          position: relative;
          margin-bottom: 20px;
        }
        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          font-size: 16px;
          z-index: 1;
        }
        .search-input {
          width: 100%;
          padding: 14px 16px 14px 46px;
          background: var(--bg-card);
          border: 1px solid var(--border-main);
          border-radius: 10px;
          color: var(--text-primary);
          font-family: "DM Sans", sans-serif;
          font-size: 16px;
          outline: none;
          transition: all 0.2s;
        }
        .search-input::placeholder {
          color: var(--text-dim);
        }
        .search-input:focus {
          border-color: var(--accent-terra);
          box-shadow: 0 0 0 3px rgba(194, 130, 102, 0.12);
        }
        .notif-banner {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-main);
          border-radius: 10px;
          margin-bottom: 16px;
          transition: all 0.2s;
          animation: slideIn 0.5s ease both;
        }
        .notif-icon {
          width: 36px;
          height: 36px;
          background: rgba(194, 130, 102, 0.1);
          border: 1px solid var(--border-main);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .notif-text strong {
          display: block;
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .notif-text span {
          font-size: 12px;
          color: var(--text-muted);
        }
        .notif-close {
          margin-left: auto;
          color: var(--text-dim);
          font-size: 18px;
          cursor: pointer;
          padding: 4px;
        }
        .quick-links {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .quick-banner-icon {
          width: 32px;
          height: 32px;
          background: rgba(194, 130, 102, 0.1);
          border: 1px solid var(--border-main);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }
        @media (max-width: 480px) {
          .quick-banner-icon {
            width: 28px;
            height: 28px;
            font-size: 13px;
          }
        }
        .quick-banner-text strong {
          display: block;
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .quick-banner-text span {
          font-size: 12px;
          color: var(--text-muted);
        }
        .info-strip {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 18px;
          background: var(--bg-card2);
          border: 1px solid var(--border-dim);
          border-left: 3px solid var(--accent-terra);
          border-radius: 0 8px 8px 0;
          margin-bottom: 28px;
          font-size: 14px;
          line-height: 1.6;
          animation: slideIn 0.5s ease 0.2s both;
        }
        .info-strip .i-icon {
          font-size: 16px;
          margin-top: 2px;
          flex-shrink: 0;
        }
        .info-strip .cyan {
          color: var(--accent-terra);
          font-weight: 600;
        }
        .info-strip .red {
          color: var(--accent-red);
          font-weight: 600;
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

        /* Categoria */
        .cat-block {
          margin-bottom: 10px;
          border: 1px solid var(--border-main);
          border-radius: 12px;
          background: var(--bg-card);
          overflow: hidden;
          animation: slideIn 0.5s ease both;
          transition: box-shadow 0.2s;
        }
        .cat-block:hover {
          box-shadow: 0 4px 20px rgba(194, 130, 102, 0.1);
        }
        .cat-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 24px;
          cursor: pointer;
          transition: background 0.2s;
          user-select: none;
        }
        .cat-header:hover {
          background: rgba(194, 130, 102, 0.04);
        }
        .cat-icon {
          width: 38px;
          height: 38px;
          background: rgba(194, 130, 102, 0.1);
          border: 1px solid var(--border-main);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: "Raleway", sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: var(--accent-terra-dark);
          flex-shrink: 0;
        }
        .cat-info {
          flex: 1;
        }
        .cat-name {
          font-family: "Raleway", sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .cat-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 4px;
          flex-wrap: wrap;
        }
        .cat-meta-item {
          font-size: 12px;
          color: var(--text-muted);
        }
        .cat-meta-item .val {
          color: var(--text-primary);
          font-weight: 600;
        }
        .cat-meta-item .val.out {
          color: var(--accent-red);
        }
        .cat-meta-sep {
          color: var(--text-dim);
          font-size: 12px;
        }
        .cat-arrow {
          font-size: 12px;
          color: var(--accent-terra);
          transition: transform 0.3s;
          flex-shrink: 0;
        }
        .cat-block.open .cat-arrow {
          transform: rotate(180deg);
        }
        .cat-body {
          display: none;
          border-top: 1px solid var(--border-dim);
          padding: 12px 16px 16px;
        }
        .cat-block.open .cat-body {
          display: block;
        }

        /* Marca/Grupo */
        .brand-block {
          margin-bottom: 8px;
          border: 1px solid var(--border-dim);
          border-radius: 8px;
          background: var(--bg-card2);
        }
        .brand-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 18px;
          cursor: pointer;
          transition: background 0.2s;
          user-select: none;
          border-radius: 8px;
        }
        .brand-header:hover {
          background: rgba(194, 130, 102, 0.06);
        }
        .brand-dot {
          width: 6px;
          height: 6px;
          background: var(--accent-terra-light);
          border-radius: 50%;
          flex-shrink: 0;
        }
        .brand-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: 0.5px;
          text-transform: uppercase;
          flex: 1;
        }
        .brand-count {
          font-size: 11px;
          color: var(--text-muted);
          padding: 3px 10px;
          border: 1px solid var(--border-dim);
          border-radius: 20px;
          background: var(--bg-card);
        }
        .brand-arrow {
          font-size: 10px;
          color: var(--text-muted);
          transition: transform 0.3s;
          margin-left: 8px;
        }
        .brand-block.open .brand-arrow {
          transform: rotate(180deg);
        }
        .brand-block.open .brand-body {
          display: block;
        }
        .brand-body {
          display: none;
          border-top: 1px solid var(--border-dim);
          padding: 8px 0;
        }

        /* Produto em card horizontal */
        .product-card-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: #fff;
          border: 1px solid rgba(194, 130, 102, 0.18);
          border-radius: 12px;
          margin-bottom: 8px;
          transition: all 0.2s;
        }
        .product-card-row:hover {
          border-color: var(--accent-terra-light);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(194, 130, 102, 0.12);
        }
        .product-card-row.out {
          opacity: 0.65;
        }
        .pc-img {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid rgba(194, 130, 102, 0.2);
        }
        .pc-placeholder {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          background: linear-gradient(135deg, #c28266, #9e6650);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          font-family: "Raleway", sans-serif;
        }
        .pc-info {
          flex: 1;
          min-width: 0;
        }
        .pc-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.3;
          margin-bottom: 2px;
        }
        .pc-brand {
          font-size: 11px;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }
        .pc-price {
          font-family: "Raleway", sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: var(--accent-terra-dark);
          white-space: nowrap;
        }
        .pc-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          border: 1px solid;
          border-radius: 20px;
          white-space: nowrap;
        }
        .pc-status.available {
          border-color: rgba(122, 175, 144, 0.5);
          color: var(--accent-sage);
          background: rgba(122, 175, 144, 0.1);
        }
        .pc-status.available::before {
          content: "";
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent-sage);
        }
        .pc-status.unavailable {
          border-color: rgba(192, 97, 79, 0.4);
          color: var(--accent-red);
          background: rgba(192, 97, 79, 0.08);
        }
        .pc-status.unavailable::before {
          content: "";
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent-red);
        }
        .pc-add-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 14px;
          background: var(--accent-terra);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
          font-family: "Raleway", sans-serif;
        }
        .pc-add-btn:hover {
          background: var(--accent-terra-dark);
          transform: translateY(-1px);
        }
        .pc-add-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* Carrinho */
        .cart-overlay {
          position: fixed;
          inset: 0;
          background: rgba(13, 15, 19, 0.4);
          z-index: 100;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease;
        }
        .cart-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 420px;
          max-width: 95vw;
          background: var(--bg-card);
          border-left: 1px solid var(--border-main);
          z-index: 101;
          display: flex;
          flex-direction: column;
          animation: slideRight 0.3s ease;
          box-shadow: -8px 0 40px rgba(194, 130, 102, 0.15);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .cart-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-dim);
        }
        .cart-head h2 {
          font-family: "Raleway", sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .cart-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-card2);
          border: 1px solid var(--border-dim);
          border-radius: 8px;
          cursor: pointer;
          color: var(--text-muted);
          transition: all 0.2s;
        }
        .cart-close:hover {
          border-color: var(--accent-red);
          color: var(--accent-red);
        }
        .cart-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px 24px;
        }
        .cart-empty {
          text-align: center;
          padding: 48px 0;
          color: var(--text-muted);
          font-size: 14px;
        }
        .cart-item-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid var(--border-dim);
        }
        .cart-item-info {
          flex: 1;
          min-width: 0;
        }
        .cart-item-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.3;
          margin-bottom: 3px;
        }
        .cart-item-price {
          font-size: 13px;
          color: var(--accent-terra-dark);
          font-weight: 600;
        }
        .cart-item-qty {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }
        .qty-btn {
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-card2);
          border: 1px solid var(--border-main);
          border-radius: 6px;
          cursor: pointer;
          color: var(--text-primary);
          transition: all 0.2s;
        }
        .qty-btn:hover {
          border-color: var(--accent-terra);
          color: var(--accent-terra);
        }
        .qty-val {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          min-width: 20px;
          text-align: center;
        }
        .cart-remove {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--text-dim);
          transition: color 0.2s;
          flex-shrink: 0;
        }
        .cart-remove:hover {
          color: var(--accent-red);
        }
        .cart-foot {
          padding: 20px 24px;
          border-top: 1px solid var(--border-dim);
          background: var(--bg-card);
        }
        .cart-subtotal {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .cart-subtotal span {
          font-size: 14px;
          color: var(--text-muted);
        }
        .cart-subtotal strong {
          font-family: "Raleway", sans-serif;
          font-size: 20px;
          font-weight: 700;
          color: var(--accent-terra-dark);
        }
        .checkout-btn {
          width: 100%;
          padding: 14px;
          background: var(--accent-terra);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: "Raleway", sans-serif;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.5px;
        }
        .checkout-btn:hover {
          background: var(--accent-terra-dark);
          transform: translateY(-1px);
        }
        .empty-state {
          text-align: center;
          padding: 48px 24px;
          font-size: 13px;
          color: var(--text-muted);
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .results-count {
          font-size: 12px;
          color: var(--text-muted);
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .results-count span {
          color: var(--accent-terra);
          font-weight: 700;
        }

        /* Selos + Rodapé */
        .selos-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 32px;
        }
        @media (max-width: 640px) {
          .selos-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        .selo-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 12px;
          background: #fff;
          border: 1px solid rgba(194, 130, 102, 0.18);
          border-radius: 12px;
          text-align: center;
        }
        .selo-icon {
          font-size: 26px;
        }
        .selo-title {
          font-family: "Raleway", sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: #0d0f13;
        }
        .selo-desc {
          font-size: 11px;
          color: #a8978e;
          line-height: 1.4;
        }
        .footer-wrap {
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-bottom: 16px;
        }
        .footer-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-bottom: 4px;
        }
        .footer-hex {
          width: 30px;
          height: 30px;
          background: linear-gradient(135deg, #c28266, #9e6650);
          clip-path: polygon(
            50% 0%,
            100% 25%,
            100% 75%,
            50% 100%,
            0% 75%,
            0% 25%
          );
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .footer-hex span {
          font-family: "Raleway", sans-serif;
          font-size: 9px;
          font-weight: 700;
          color: #fff;
        }
        .footer-name {
          font-family: "Raleway", sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #9e6650;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .footer-copy {
          font-size: 12px;
          color: #a8978e;
        }
        .footer-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-top: 8px;
        }
        .footer-link {
          font-size: 11px;
          color: #b0a090;
          text-decoration: none;
        }
        .footer-link:hover {
          color: #c28266;
        }
        .footer-sep {
          color: #d4c4b8;
          font-size: 10px;
        }
      `}</style>

      {/* Top bar */}
      <div className="top-bar">
        <div className="top-logo">
          <div className="logo-hex">
            <span>PB</span>
          </div>
          <div className="logo-text">
            <span className="logo-name">PB Imports</span>
            <span className="logo-sub">Disponibilidade</span>
          </div>
        </div>
        <button className="cart-btn" onClick={() => setCartOpen(true)}>
          <ShoppingCart size={18} />
          Carrinho
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
      </div>

      <div className="page-title">
        Lista de <span>Disponibilidade</span>
      </div>

      <div className="badges">
        <div className="badge green">⬡ {totalAvailable} Disponíveis</div>
        <div className="badge red">◈ {totalOut} Em Falta</div>
      </div>

      {/* Busca com autocomplete */}
      <div className="search-wrap">
        <span className="search-icon">⌕</span>
        <input
          type="text"
          className="search-input"
          placeholder="Buscar produto ou marca..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowSuggestions(true);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onFocus={() => search.length >= 2 && setShowSuggestions(true)}
          autoComplete="off"
        />
        {showSuggestions &&
          search.length >= 1 &&
          (() => {
            const normalize = (str: string) =>
              str
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");
            const suggestions = products
              .filter(
                (p) =>
                  normalize(p.name || "").includes(normalize(search)) ||
                  normalize(p.brand || "").includes(normalize(search)),
              )
              .slice(0, 8);
            return suggestions.length > 0 ? (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "#fff",
                  border: "1px solid rgba(194,130,102,0.25)",
                  borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(194,130,102,0.15)",
                  zIndex: 50,
                  marginTop: 4,
                  overflow: "hidden",
                }}
              >
                {suggestions.map((p) => (
                  <div
                    key={p.id}
                    onMouseDown={() => {
                      setSearch(p.name || "");
                      setShowSuggestions(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 16px",
                      cursor: "pointer",
                      fontSize: 14,
                      color: "#0D0F13",
                      borderBottom: "1px solid rgba(194,130,102,0.08)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(194,130,102,0.06)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "#7A6558" }}>
                        {p.brand}
                      </div>
                    </div>
                    {p.price && (
                      <div
                        style={{
                          fontWeight: 700,
                          color: "#9E6650",
                          whiteSpace: "nowrap",
                          marginLeft: 12,
                        }}
                      >
                        R${" "}
                        {Number(p.price).toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : null;
          })()}
      </div>

      {showBanner && updatesCount > 0 && (
        <div className="notif-banner">
          <div className="notif-icon">🔔</div>
          <div className="notif-text">
            <strong>
              {updatesCount}{" "}
              {updatesCount === 1 ? "atualização" : "atualizações"} desde sua
              última visita
            </strong>
            <span>
              {updatesCount === 1
                ? "1 produto foi atualizado"
                : `${updatesCount} produtos foram atualizados`}
            </span>
          </div>
          <span className="notif-close" onClick={handleCloseBanner}>
            ✕
          </span>
        </div>
      )}

      <div className="quick-links">
        <Link
          href="/fretes"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "16px 20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-main)",
            borderRadius: "10px",
            textDecoration: "none",
            color: "inherit",
            minWidth: 0,
          }}
        >
          <div className="quick-banner-icon">🚚</div>
          <div className="quick-banner-text">
            <strong>Tabela de Fretes</strong>
            <span>Valores de entrega</span>
          </div>
        </Link>
        <Link
          href="/regras"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "16px 20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-main)",
            borderRadius: "10px",
            textDecoration: "none",
            color: "inherit",
            minWidth: 0,
          }}
        >
          <div className="quick-banner-icon">📋</div>
          <div className="quick-banner-text">
            <strong>Regras de Envio</strong>
            <span>Como funciona</span>
          </div>
        </Link>
      </div>

      <Link
        href="/curiosidades"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          padding: "16px 20px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-main)",
          borderRadius: "10px",
          textDecoration: "none",
          color: "inherit",
          marginBottom: "12px",
        }}
      >
        <div className="quick-banner-icon">💡</div>
        <div className="quick-banner-text">
          <strong>Curiosidades</strong>
          <span>Dicas e fatos rápidos</span>
        </div>
      </Link>

      <div className="info-strip">
        <span className="i-icon">💡</span>
        <span>
          Esta lista mostra <span className="cyan">todos os produtos</span> da
          PB Imports. Produtos <span className="red">em falta</span> serão
          repostos em breve.
        </span>
      </div>

      <div className="results-count">
        Exibindo <span>{groups.length}</span> categorias ·{" "}
        <span>{products.length}</span> produtos
      </div>

      {/* Catálogo */}
      <div id="catalog">
        {loading ? (
          <div className="empty-state">Carregando...</div>
        ) : groups.length === 0 ? (
          <div className="empty-state">Nenhum produto encontrado</div>
        ) : (
          groups.map((cat, ci) => {
            const totalProds = cat.brands.reduce(
              (a, b) => a + b.products.length,
              0,
            );
            const outProds = cat.brands.reduce(
              (a, b) =>
                a +
                b.products.filter(
                  (p) => p.is_out_of_stock || (p.stock ?? 0) <= 0,
                ).length,
              0,
            );
            return (
              <div
                className={`cat-block ${openCat === cat.id ? "open" : ""}`}
                key={cat.id}
                style={{ animationDelay: `${ci * 0.07}s` }}
              >
                <div
                  className="cat-header"
                  onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)}
                >
                  <div className="cat-icon">{cat.abbr}</div>
                  <div className="cat-info">
                    <div
                      className="cat-name"
                      dangerouslySetInnerHTML={{ __html: highlight(cat.name) }}
                    />
                    <div className="cat-meta">
                      <span className="cat-meta-item">
                        <span className="val">{cat.brands.length}</span> grupo
                        {cat.brands.length !== 1 ? "s" : ""}
                      </span>
                      <span className="cat-meta-sep">·</span>
                      <span className="cat-meta-item">
                        <span className="val">{totalProds}</span> iten
                        {totalProds !== 1 ? "s" : ""}
                      </span>
                      {outProds > 0 && (
                        <>
                          <span className="cat-meta-sep">·</span>
                          <span className="cat-meta-item">
                            <span className="val out">{outProds} em falta</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="cat-arrow">▼</span>
                </div>
                <div className="cat-body">
                  {cat.brands.map((brand, bi) => (
                    <div
                      className={`brand-block ${search ? "open" : ""}`}
                      key={bi}
                    >
                      <div
                        className="brand-header"
                        onClick={(e) => {
                          e.stopPropagation();
                          (
                            e.currentTarget.parentElement as HTMLElement
                          )?.classList.toggle("open");
                        }}
                      >
                        <div className="brand-dot"></div>
                        <span
                          className="brand-name"
                          dangerouslySetInnerHTML={{
                            __html: highlight(brand.name),
                          }}
                        />
                        <span className="brand-count">
                          {brand.products.length} produto
                          {brand.products.length !== 1 ? "s" : ""}
                        </span>
                        <span className="brand-arrow">▼</span>
                      </div>
                      <div
                        className="brand-body"
                        style={{ padding: "12px 16px 14px" }}
                      >
                        {brand.products.map((p) => {
                          const outOfStock =
                            p.is_out_of_stock || (p.stock ?? 0) <= 0;
                          return (
                            <div
                              className={`product-card-row ${outOfStock ? "out" : ""}`}
                              key={p.id}
                            >
                              {(p as any).image_url ? (
                                <img
                                  src={(p as any).image_url}
                                  alt={p.name}
                                  className="pc-img"
                                />
                              ) : (
                                <div className="pc-placeholder">
                                  {(p.name || "").slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div
                                className="pc-info"
                                style={{ flex: 1, minWidth: 0 }}
                              >
                                <div
                                  className="pc-name"
                                  dangerouslySetInnerHTML={{
                                    __html: highlight(p.name),
                                  }}
                                />
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginTop: 4,
                                  }}
                                >
                                  <div className="pc-brand">
                                    {(p as any).dosage || ""}
                                  </div>
                                  <div style={{ flexShrink: 0 }}>
                                    {outOfStock ? (
                                      <span className="pc-status unavailable">
                                        Indisponível
                                      </span>
                                    ) : (
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "8px",
                                        }}
                                      >
                                        <div className="pc-price">
                                          {p.price
                                            ? `R$ ${Number(p.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                                            : "—"}
                                        </div>
                                        <button
                                          className="pc-add-btn"
                                          onClick={() => addToCart(p)}
                                          disabled={addingId === p.id}
                                        >
                                          <ShoppingCart size={14} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div
                                  className="pc-brand"
                                  style={{ marginTop: 2 }}
                                >
                                  {(p as any).presentation || ""}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selos + Rodapé */}
      <div
        style={{
          marginTop: 48,
          borderTop: "1px solid rgba(194,130,102,0.15)",
          paddingTop: 32,
        }}
      >
        <div className="selos-grid">
          {[
            {
              icon: "🔒",
              title: "SSL Certificado",
              desc: "Conexão segura e criptografada",
            },
            {
              icon: "💳",
              title: "Pagamento via Pix",
              desc: "Aprovação imediata e segura",
            },
            {
              icon: "🛡️",
              title: "Dados Protegidos",
              desc: "Sua privacidade é prioridade",
            },
            {
              icon: "✅",
              title: "Compra Segura",
              desc: "Satisfação garantida",
            },
          ].map((selo, i) => (
            <div className="selo-card" key={i}>
              <span className="selo-icon">{selo.icon}</span>
              <span className="selo-title">{selo.title}</span>
              <span className="selo-desc">{selo.desc}</span>
            </div>
          ))}
        </div>
        <div className="footer-wrap">
          <div className="footer-logo">
            <div className="footer-hex">
              <span>PB</span>
            </div>
            <span className="footer-name">PB Imports</span>
          </div>
          <p className="footer-copy">
            © {new Date().getFullYear()} PB Imports — Todos os direitos
            reservados.
          </p>
        </div>
      </div>

      {/* Drawer do carrinho */}
      {cartOpen && (
        <>
          <div className="cart-overlay" onClick={() => setCartOpen(false)} />
          <div className="cart-drawer">
            <div className="cart-head">
              <h2>🛒 Meu Carrinho {cartCount > 0 && `(${cartCount})`}</h2>
              <button className="cart-close" onClick={() => setCartOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="cart-body">
              {cartItems.length === 0 ? (
                <div className="cart-empty">
                  <p style={{ fontSize: 32, marginBottom: 12 }}>🛍️</p>
                  <p>Seu carrinho está vazio</p>
                  <p
                    style={{
                      fontSize: 12,
                      marginTop: 6,
                      color: "var(--text-dim)",
                    }}
                  >
                    Adicione produtos do catálogo
                  </p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div className="cart-item-row" key={item.cart_item_id}>
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.product.name}</div>
                      <div className="cart-item-price">
                        R${" "}
                        {(
                          Number(item.product.price) * item.quantity
                        ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        {item.quantity > 1 && (
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--text-muted)",
                              marginLeft: 6,
                              fontWeight: 400,
                            }}
                          >
                            (R${" "}
                            {Number(item.product.price).toLocaleString(
                              "pt-BR",
                              { minimumFractionDigits: 2 },
                            )}{" "}
                            cada)
                          </span>
                        )}
                      </div>
                      <div className="cart-item-qty">
                        <button
                          className="qty-btn"
                          onClick={() => updateQty(item, -1)}
                          disabled={cartLoading}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="qty-val">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQty(item, +1)}
                          disabled={cartLoading}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                    <button
                      className="cart-remove"
                      onClick={() => removeItem(item)}
                      disabled={cartLoading}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="cart-foot">
                <button
                  onClick={() => setCartOpen(false)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "transparent",
                    border: "1.5px solid rgba(194,130,102,0.3)",
                    borderRadius: 8,
                    color: "#C28266",
                    fontFamily: "Raleway, sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    marginBottom: 12,
                  }}
                >
                  ← Continuar comprando
                </button>
                <div className="cart-subtotal">
                  <span>Subtotal dos produtos</span>
                  <strong>
                    R${" "}
                    {cartTotal.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </strong>
                </div>
                <Link href="/checkout" style={{ textDecoration: "none" }}>
                  <button
                    className="checkout-btn"
                    onClick={() => setCartOpen(false)}
                  >
                    Finalizar Pedido →
                  </button>
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
