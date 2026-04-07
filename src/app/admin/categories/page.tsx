"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PALETTE = [
  "#C28266","#9E6650","#D4A96A","#7AAF90","#C0614F","#8AAFC2",
  "#a855f7","#6366f1","#06b6d4","#f97316","#64748b","#b45309"
];

type Category = { id: string; name: string; acronym: string; color: string; sort_order: number };
type FormState = { name: string; acronym: string; color: string; sort_order: number };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", acronym: "", color: PALETTE[0], sort_order: 1 });

  useEffect(() => { fetchCategories(); }, []);

  async function fetchCategories() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,acronym,color,sort_order")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      setCategories((data as Category[]) || []);
    } catch (err: any) {
      toast.error("Erro ao carregar categorias: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() =>
    categories.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.acronym.toLowerCase().includes(search.toLowerCase())
    ), [categories, search]);

  const openModal = (cat?: Category) => {
    if (cat) {
      setEditing(cat);
      setForm({ name: cat.name, acronym: cat.acronym, color: cat.color, sort_order: cat.sort_order });
    } else {
      setEditing(null);
      setForm({ name: "", acronym: "", color: PALETTE[0], sort_order: categories.length + 1 });
    }
    setModalOpen(true);
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!form.name || !form.acronym) throw new Error("Preencha nome e acrônimo");
      if (editing) {
        const { error } = await supabase.from("categories").update(form).eq("id", editing.id);
        if (error) throw error;
        toast.success("Categoria atualizada!");
      } else {
        const { error } = await supabase.from("categories").insert([form]);
        if (error) throw error;
        toast.success("Categoria criada!");
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Excluir esta categoria? Produtos vinculados podem ficar sem categoria.")) return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      toast.success("Categoria excluída!");
      fetchCategories();
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    }
  };

  return (
    <div className="content">
      <style jsx>{`
        /* Header */
        .header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
        .title { font-family: "Raleway", sans-serif; font-size: 26px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--text-primary); }
        .sub { font-family: "DM Sans", sans-serif; font-size: 12px; color: var(--text-muted); margin-top: 6px; }
        .btn-main { display: flex; align-items: center; gap: 8px; padding: 12px 20px; background: var(--accent-terra); border: none; color: #fff; font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 700; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .btn-main:hover { background: var(--accent-terra-dark); transform: translateY(-1px); }

        /* Search */
        .search { margin-bottom: 16px; }
        .search input { width: 100%; max-width: 420px; padding: 11px 14px; background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 8px; color: var(--text-primary); font-family: "DM Sans", sans-serif; font-size: 14px; outline: none; transition: all 0.2s; }
        .search input::placeholder { color: var(--text-dim); }
        .search input:focus { border-color: var(--accent-terra); box-shadow: 0 0 0 3px rgba(194,130,102,0.12); }

        /* Tabela */
        .panel { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 12px; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        thead tr { border-bottom: 1px solid var(--border-main); background: rgba(194,130,102,0.04); }
        th { padding: 13px 18px; font-family: "DM Sans", sans-serif; font-size: 11px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px; text-transform: uppercase; text-align: left; }
        td { padding: 13px 18px; font-size: 14px; }
        tbody tr { border-bottom: 1px solid var(--border-dim); transition: background 0.15s; }
        tbody tr:last-child { border-bottom: none; }
        tbody tr:hover { background: rgba(194,130,102,0.04); }

        .color-dot { width: 26px; height: 26px; border-radius: 6px; border: 2px solid rgba(255,255,255,0.3); box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        .acronym { font-family: "Raleway", sans-serif; font-weight: 700; color: var(--accent-terra-dark); font-size: 13px; letter-spacing: 1px; }
        .order { font-family: "Raleway", sans-serif; font-weight: 700; color: var(--accent-amber); }

        .actions { display: flex; gap: 8px; }
        .btn-ghost { width: 32px; height: 32px; border: 1px solid var(--border-dim); border-radius: 6px; background: var(--bg-card2); color: var(--text-muted); cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .btn-ghost:hover { border-color: var(--accent-terra); color: var(--accent-terra); }
        .btn-del:hover { border-color: var(--accent-red); color: var(--accent-red); background: rgba(192,97,79,0.08); }

        .empty { padding: 48px; text-align: center; font-size: 14px; color: var(--text-muted); }

        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(13,15,19,0.5); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 200; }
        .modal { background: var(--bg-card); border: 1px solid var(--border-main); border-radius: 14px; width: 440px; max-width: 95vw; padding: 24px; box-shadow: 0 20px 60px rgba(194,130,102,0.15); }
        .modal-title { font-family: "Raleway", sans-serif; font-size: 18px; font-weight: 700; color: var(--accent-terra-dark); margin-bottom: 20px; }
        .form { display: flex; flex-direction: column; gap: 14px; }
        .label { font-size: 11px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.3px; text-transform: uppercase; margin-bottom: 5px; display: block; }
        .input { width: 100%; padding: 11px 14px; background: #FAF8EF; border: 1px solid rgba(194,130,102,0.25); border-radius: 8px; color: var(--text-primary); font-family: "DM Sans", sans-serif; font-size: 14px; outline: none; transition: all 0.2s; }
        .input:focus { border-color: var(--accent-terra); box-shadow: 0 0 0 3px rgba(194,130,102,0.12); }

        /* Paleta */
        .palette { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
        .swatch { width: 100%; aspect-ratio: 1; border-radius: 6px; border: 2px solid transparent; cursor: pointer; transition: all 0.2s; }
        .swatch:hover { transform: scale(1.1); }
        .swatch.selected { border-color: var(--text-primary); box-shadow: 0 0 0 2px rgba(13,15,19,0.3); transform: scale(1.1); }

        /* Botões modal */
        .modal-actions { display: flex; gap: 10px; margin-top: 6px; }
        .btn-cancel { flex: 1; padding: 11px; border: 1px solid var(--border-main); border-radius: 8px; background: transparent; color: var(--text-muted); font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-cancel:hover { border-color: var(--accent-terra); color: var(--accent-terra); }
        .btn-save { flex: 1; padding: 11px; background: var(--accent-terra); border: none; border-radius: 8px; color: #fff; font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-save:hover { background: var(--accent-terra-dark); }

        @media (max-width: 900px) {
          .header { flex-direction: column; gap: 10px; }
          .btn-main { width: 100%; justify-content: center; }
        }
      `}</style>

      {/* Header */}
      <div className="header">
        <div>
          <div className="title">Categorias</div>
          <div className="sub">Organize seus produtos em grupos lógicos.</div>
        </div>
        <button className="btn-main" onClick={() => openModal()}>+ Nova Categoria</button>
      </div>

      {/* Search */}
      <div className="search">
        <input
          placeholder="Buscar categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabela */}
      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Cor</th>
              <th>Nome</th>
              <th>Acrônimo</th>
              <th>Ordem</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="empty">Carregando...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="empty">Nenhuma categoria encontrada</td></tr>
            ) : (
              filtered.map((cat) => (
                <tr key={cat.id}>
                  <td>
                    <div className="color-dot" style={{ backgroundColor: cat.color }} />
                  </td>
                  <td>{cat.name}</td>
                  <td><span className="acronym">{cat.acronym}</span></td>
                  <td><span className="order">{cat.sort_order}</span></td>
                  <td>
                    <div className="actions">
                      <button className="btn-ghost" onClick={() => openModal(cat)} title="Editar">✏️</button>
                      <button className="btn-ghost btn-del" onClick={() => deleteCategory(cat.id)} title="Excluir">🗑</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal">
            <div className="modal-title">{editing ? "Editar Categoria" : "Nova Categoria"}</div>
            <form className="form" onSubmit={saveCategory}>
              <div>
                <label className="label">Nome</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="label">Acrônimo (2–4 letras)</label>
                <input className="input" value={form.acronym} maxLength={4} onChange={(e) => setForm({ ...form, acronym: e.target.value.toUpperCase() })} required />
              </div>
              <div>
                <label className="label">Ordem</label>
                <input className="input" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} required />
              </div>
              <div>
                <label className="label">Cor</label>
                <div className="palette">
                  {PALETTE.map((c) => (
                    <div
                      key={c}
                      className={`swatch ${form.color === c ? "selected" : ""}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setForm({ ...form, color: c })}
                    />
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-save">{editing ? "Salvar" : "Criar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}