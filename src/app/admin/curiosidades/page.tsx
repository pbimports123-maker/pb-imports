"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Trash2, PlusCircle } from "lucide-react";

type Curiosity = {
  id: string;
  title: string;
  content: string;
  created_at?: string;
};

export default function AdminCuriosidadesPage() {
  const [items, setItems] = useState<Curiosity[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("curiosities")
        .select("id,title,content,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar curiosidades: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) {
      toast.error("Preencha título e conteúdo.");
      return;
    }
    try {
      setSaving(true);
      const { error } = await supabase.from("curiosities").insert([{ title: title.trim(), content: content.trim() }]);
      if (error) throw error;
      toast.success("Curiosidade adicionada!");
      setTitle("");
      setContent("");
      fetchItems();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta curiosidade?")) return;
    const prev = items;
    setItems((current) => current.filter((i) => i.id !== id));
    try {
      const { error } = await supabase.from("curiosities").delete().eq("id", id);
      if (error) throw error;
      toast.success("Curiosidade removida.");
    } catch (err: any) {
      toast.error("Erro ao remover: " + err.message);
      setItems(prev);
    }
  }

  return (
    <div className="cur-root">
      <style jsx>{`
        .cur-root { padding: 0; }

        /* Header */
        .cur-header { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
        .cur-icon { width: 46px; height: 46px; border-radius: 12px; background: rgba(194,130,102,0.1); border: 1px solid rgba(194,130,102,0.25); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .cur-title { font-family: "Raleway", sans-serif; font-size: 24px; font-weight: 700; color: var(--text-primary); letter-spacing: 0.5px; }
        .cur-sub { font-size: 13px; color: var(--text-muted); margin-top: 3px; }

        /* Form card */
        .form-card { background: #fff; border: 1px solid rgba(194,130,102,0.18); border-radius: 14px; padding: 24px; margin-bottom: 28px; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label { font-size: 11px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px; text-transform: uppercase; }
        .field input, .field textarea {
          width: 100%; padding: 11px 14px;
          background: #FAF8EF; border: 1px solid rgba(194,130,102,0.25);
          border-radius: 8px; color: var(--text-primary);
          font-family: "DM Sans", sans-serif; font-size: 14px;
          outline: none; transition: all 0.2s;
          resize: vertical;
        }
        .field input::placeholder, .field textarea::placeholder { color: #C8B8AE; }
        .field input:focus, .field textarea:focus { border-color: #C28266; box-shadow: 0 0 0 3px rgba(194,130,102,0.12); }
        .field textarea { min-height: 112px; }
        .form-footer { display: flex; justify-content: flex-end; }
        .save-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; background: #C28266; color: #fff; border: none; border-radius: 8px; font-family: "Raleway", sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .save-btn:hover { background: #9E6650; transform: translateY(-1px); }
        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        /* Lista */
        .list-label { font-size: 11px; font-weight: 700; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 14px; }
        .loading-state { display: flex; align-items: center; gap: 8px; color: var(--text-muted); font-size: 14px; }
        .empty-state { background: #fff; border: 1px solid rgba(194,130,102,0.15); border-radius: 12px; padding: 24px; font-size: 14px; color: var(--text-muted); text-align: center; }
        .items-grid { display: flex; flex-direction: column; gap: 12px; }

        /* Item card */
        .item-card { background: #fff; border: 1px solid rgba(194,130,102,0.18); border-radius: 12px; padding: 18px 20px; transition: box-shadow 0.2s; }
        .item-card:hover { box-shadow: 0 4px 20px rgba(194,130,102,0.1); }
        .item-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
        .item-title { font-family: "Raleway", sans-serif; font-size: 16px; font-weight: 700; color: var(--text-primary); }
        .item-date { font-size: 11px; color: var(--text-muted); margin-top: 3px; letter-spacing: 0.3px; }
        .delete-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: transparent; border: 1px solid rgba(192,97,79,0.25); border-radius: 8px; cursor: pointer; color: #C0614F; transition: all 0.2s; flex-shrink: 0; }
        .delete-btn:hover { background: rgba(192,97,79,0.08); border-color: #C0614F; }
        .item-content { font-size: 14px; color: var(--text-muted); line-height: 1.6; white-space: pre-wrap; }
      `}</style>

      {/* Header */}
      <div className="cur-header">
        <div className="cur-icon">
          <Sparkles size={22} color="#C28266" />
        </div>
        <div>
          <div className="cur-title">Curiosidades</div>
          <div className="cur-sub">Publique dicas rápidas que aparecerão na área pública.</div>
        </div>
      </div>

      {/* Formulário */}
      <div className="form-card">
        <div className="form-grid">
          <div className="field">
            <label>Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Como escolher o frete certo"
            />
          </div>
          <div className="field">
            <label>Conteúdo</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Texto curto, pode usar quebras de linha"
            />
          </div>
        </div>
        <div className="form-footer">
          <button className="save-btn" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" size={16} /> : <PlusCircle size={16} />}
            Salvar curiosidade
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="list-label">Publicadas</div>
      {loading ? (
        <div className="loading-state">
          <Loader2 className="animate-spin" size={18} />
          Carregando...
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">Nenhuma curiosidade cadastrada ainda.</div>
      ) : (
        <div className="items-grid">
          {items.map((item) => (
            <div key={item.id} className="item-card">
              <div className="item-top">
                <div>
                  <div className="item-title">{item.title}</div>
                  {item.created_at && (
                    <div className="item-date">
                      {new Date(item.created_at).toLocaleString("pt-BR")}
                    </div>
                  )}
                </div>
                <button className="delete-btn" onClick={() => handleDelete(item.id)} title="Remover">
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="item-content">{item.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}