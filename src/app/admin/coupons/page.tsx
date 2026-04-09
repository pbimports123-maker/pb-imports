"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Tag,
  ToggleLeft,
  ToggleRight,
  Copy,
} from "lucide-react";

type Coupon = {
  id: string;
  code: string;
  type: "free_shipping" | "percentage";
  value: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: "",
    type: "free_shipping" as "free_shipping" | "percentage",
    value: "",
    max_uses: "",
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    setLoading(true);
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    setCoupons(data || []);
    setLoading(false);
  }

  async function saveCoupon() {
    if (!form.code.trim()) {
      toast.error("Digite o codigo do cupom");
      return;
    }
    if (
      form.type === "percentage" &&
      (!form.value || Number(form.value) <= 0 || Number(form.value) > 100)
    ) {
      toast.error("Porcentagem deve ser entre 1 e 100");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("coupons").insert({
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: form.type === "percentage" ? Number(form.value) : 0,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        used_count: 0,
        is_active: true,
      });

      if (error) {
        if (error.code === "23505") toast.error("Codigo ja existe!");
        else throw error;
        return;
      }

      toast.success("Cupom criado!");
      setForm({ code: "", type: "free_shipping", value: "", max_uses: "" });
      setShowForm(false);
      loadCoupons();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleCoupon(coupon: Coupon) {
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: !coupon.is_active })
      .eq("id", coupon.id);
    if (error) {
      toast.error("Erro ao atualizar");
      return;
    }
    toast.success(coupon.is_active ? "Cupom desativado" : "Cupom ativado");
    loadCoupons();
  }

  async function deleteCoupon(id: string) {
    if (!confirm("Excluir este cupom?")) return;
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    toast.success("Cupom excluido");
    loadCoupons();
  }

  function copyCoupon(code: string) {
    navigator.clipboard.writeText(code);
    toast.success("Codigo copiado!");
  }

  function generateCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const code = Array.from(
      { length: 8 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("");
    setForm((prev) => ({ ...prev, code }));
  }

  return (
    <div>
      <style jsx>{`
        .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
        .page-title { font-family: "Raleway", sans-serif; font-size: 22px; font-weight: 700; color: #0D0F13; }
        .page-title span { color: #C28266; }
        .page-sub { font-size: 13px; color: #A8978E; margin-top: 4px; }

        .btn-add { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: #C28266; color: #fff; border: none; border-radius: 10px; font-family: "Raleway", sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-add:hover { background: #9E6650; }

        .form-card { background: #fff; border: 1px solid rgba(194,130,102,0.25); border-radius: 14px; padding: 24px; margin-bottom: 24px; }
        .form-title { font-family: "Raleway", sans-serif; font-size: 15px; font-weight: 700; color: #0D0F13; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label { font-size: 12px; font-weight: 600; color: #7A6558; text-transform: uppercase; letter-spacing: 0.3px; }
        .field input, .field select { padding: 10px 14px; background: #FAF8EF; border: 1px solid rgba(194,130,102,0.25); border-radius: 8px; font-family: "DM Sans", sans-serif; font-size: 14px; color: #0D0F13; outline: none; transition: all 0.2s; }
        .field input:focus, .field select:focus { border-color: #C28266; box-shadow: 0 0 0 3px rgba(194,130,102,0.1); }
        .code-wrap { display: flex; gap: 8px; }
        .code-wrap input { flex: 1; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; }
        .gen-btn { padding: 10px 14px; background: rgba(194,130,102,0.1); border: 1px solid rgba(194,130,102,0.25); border-radius: 8px; font-size: 12px; color: #C28266; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
        .gen-btn:hover { background: rgba(194,130,102,0.18); }
        .form-actions { display: flex; gap: 10px; margin-top: 20px; }
        .btn-save { padding: 11px 24px; background: #C28266; color: #fff; border: none; border-radius: 8px; font-family: "Raleway", sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-save:hover { background: #9E6650; }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-cancel { padding: 11px 20px; background: transparent; border: 1px solid rgba(194,130,102,0.3); border-radius: 8px; font-size: 14px; color: #7A6558; cursor: pointer; transition: all 0.2s; }
        .btn-cancel:hover { border-color: #C28266; color: #C28266; }

        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: #fff; border: 1px solid rgba(194,130,102,0.18); border-radius: 12px; padding: 16px 20px; }
        .stat-label { font-size: 11px; color: #A8978E; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .stat-value { font-family: "Raleway", sans-serif; font-size: 24px; font-weight: 700; color: #C28266; }

        .table-card { background: #fff; border: 1px solid rgba(194,130,102,0.18); border-radius: 14px; overflow: hidden; }
        .table-head { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 80px 100px; gap: 12px; padding: 12px 20px; background: rgba(194,130,102,0.06); border-bottom: 1px solid rgba(194,130,102,0.12); }
        .th { font-size: 10px; font-weight: 700; color: #A8978E; text-transform: uppercase; letter-spacing: 0.5px; }
        .table-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 80px 100px; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(194,130,102,0.08); align-items: center; transition: background 0.15s; }
        .table-row:last-child { border-bottom: none; }
        .table-row:hover { background: rgba(194,130,102,0.03); }
        .coupon-code { display: flex; align-items: center; gap: 8px; }
        .code-badge { font-family: "Raleway", sans-serif; font-size: 14px; font-weight: 700; color: #0D0F13; letter-spacing: 1px; }
        .copy-btn { background: none; border: none; color: #A8978E; cursor: pointer; padding: 4px; border-radius: 4px; transition: all 0.15s; }
        .copy-btn:hover { color: #C28266; background: rgba(194,130,102,0.1); }
        .type-badge { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .type-free { background: rgba(122,175,144,0.12); color: #5A8F70; border: 1px solid rgba(122,175,144,0.3); }
        .type-pct { background: rgba(194,130,102,0.12); color: #9E6650; border: 1px solid rgba(194,130,102,0.3); }
        .td { font-size: 13px; color: #3A2E28; }
        .status-badge { display: inline-flex; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .status-active { background: rgba(122,175,144,0.12); color: #5A8F70; }
        .status-inactive { background: rgba(192,97,79,0.1); color: #C0614F; }
        .actions { display: flex; gap: 6px; align-items: center; }
        .toggle-btn { background: none; border: none; cursor: pointer; color: #A8978E; padding: 4px; border-radius: 4px; transition: all 0.15s; display: flex; align-items: center; }
        .toggle-btn:hover { color: #C28266; }
        .delete-btn { background: none; border: none; cursor: pointer; color: #A8978E; padding: 4px; border-radius: 4px; transition: all 0.15s; display: flex; align-items: center; }
        .delete-btn:hover { color: #C0614F; background: rgba(192,97,79,0.08); }
        .empty { padding: 48px; text-align: center; color: #A8978E; font-size: 14px; }
        .loading { padding: 48px; text-align: center; color: #A8978E; }
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title">
            Cupons de <span>Desconto</span>
          </div>
          <div className="page-sub">
            Gerencie cupons de frete gratis e porcentagem
          </div>
        </div>
        <button className="btn-add" onClick={() => setShowForm((v) => !v)}>
          <Plus size={16} /> Novo Cupom
        </button>
      </div>

      <div className="stats">
        <div className="stat-card">
          <div className="stat-label">Total de cupons</div>
          <div className="stat-value">{coupons.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cupons ativos</div>
          <div className="stat-value">
            {coupons.filter((c) => c.is_active).length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total de usos</div>
          <div className="stat-value">
            {coupons.reduce((sum, c) => sum + c.used_count, 0)}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="form-card">
          <div className="form-title">
            <Tag size={16} color="#C28266" /> Criar novo cupom
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Codigo do cupom *</label>
              <div className="code-wrap">
                <input
                  placeholder="EX: FRETEFREE"
                  value={form.code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  maxLength={20}
                />
                <button className="gen-btn" onClick={generateCode}>
                  Gerar
                </button>
              </div>
            </div>
            <div className="field">
              <label>Tipo de desconto *</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    type: e.target.value as "free_shipping" | "percentage",
                    value: "",
                  }))
                }
              >
                <option value="free_shipping">Frete gratis</option>
                <option value="percentage">Porcentagem de desconto</option>
              </select>
            </div>
            {form.type === "percentage" && (
              <div className="field">
                <label>Porcentagem de desconto *</label>
                <input
                  type="number"
                  placeholder="Ex: 10"
                  min={1}
                  max={100}
                  value={form.value}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, value: e.target.value }))
                  }
                />
              </div>
            )}
            <div className="field">
              <label>Limite de usos (deixe vazio para ilimitado)</label>
              <input
                type="number"
                placeholder="Ex: 50"
                min={1}
                value={form.max_uses}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, max_uses: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn-save" onClick={saveCoupon} disabled={saving}>
              {saving ? "Salvando..." : "Criar cupom"}
            </button>
            <button className="btn-cancel" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="table-card">
        <div className="table-head">
          <div className="th">Codigo</div>
          <div className="th">Tipo</div>
          <div className="th">Desconto</div>
          <div className="th">Usos</div>
          <div className="th">Status</div>
          <div className="th">Acoes</div>
        </div>

        {loading ? (
          <div className="loading">Carregando cupons...</div>
        ) : coupons.length === 0 ? (
          <div className="empty">
            Nenhum cupom criado ainda.
            <br />
            Clique em "Novo Cupom" para comecar!
          </div>
        ) : (
          coupons.map((coupon) => (
            <div className="table-row" key={coupon.id}>
              <div className="coupon-code">
                <span className="code-badge">{coupon.code}</span>
                <button
                  className="copy-btn"
                  onClick={() => copyCoupon(coupon.code)}
                >
                  <Copy size={13} />
                </button>
              </div>
              <div>
                <span
                  className={`type-badge ${coupon.type === "free_shipping" ? "type-free" : "type-pct"}`}
                >
                  {coupon.type === "free_shipping"
                    ? "Frete gratis"
                    : "% Desconto"}
                </span>
              </div>
              <div className="td">
                {coupon.type === "free_shipping"
                  ? "Frete gratis"
                  : `${coupon.value}%`}
              </div>
              <div className="td">
                {coupon.used_count}
                {coupon.max_uses !== null ? ` / ${coupon.max_uses}` : " / ∞"}
              </div>
              <div>
                <span
                  className={`status-badge ${coupon.is_active ? "status-active" : "status-inactive"}`}
                >
                  {coupon.is_active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="actions">
                <button
                  className="toggle-btn"
                  onClick={() => toggleCoupon(coupon)}
                  title={coupon.is_active ? "Desativar" : "Ativar"}
                >
                  {coupon.is_active ? (
                    <ToggleRight size={20} color="#5A8F70" />
                  ) : (
                    <ToggleLeft size={20} />
                  )}
                </button>
                <button
                  className="delete-btn"
                  onClick={() => deleteCoupon(coupon.id)}
                  title="Excluir"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
