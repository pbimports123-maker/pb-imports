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

  useEffect(() => {
    fetchItems();
  }, []);

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
      const { error } = await supabase.from("curiosities").insert([
        {
          title: title.trim(),
          content: content.trim(),
        },
      ]);
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
      setItems(prev); // rollback
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0f17] text-white p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#111826] border border-[#1f2937] flex items-center justify-center">
              <Sparkles className="text-[#22d3ee]" size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Curiosidades</h1>
              <p className="text-sm text-[#9ca3af]">Publique dicas rápidas que aparecerão na área pública.</p>
            </div>
          </div>
        </header>

        <div className="grid gap-4 bg-[#0f131c] border border-[#1f2937] rounded-2xl p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Título</label>
              <input
                className="w-full bg-[#0b1018] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#22d3ee]"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Como escolher o frete certo"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Conteúdo</label>
              <textarea
                className="w-full bg-[#0b1018] border border-[#1f2937] rounded-lg px-3 py-2 text-sm text-white h-28 resize-vertical focus:outline-none focus:border-[#22d3ee]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Texto curto, pode usar quebras de linha"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#22d3ee] to-[#8b5cf6] text-[#0b0f15] font-semibold text-sm disabled:opacity-60"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <PlusCircle size={16} />}
              Salvar curiosidade
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Publicadas</div>
          {loading ? (
            <div className="flex items-center gap-2 text-[#9ca3af]">
              <Loader2 className="animate-spin" size={18} />
              Carregando...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-[#1f2937] bg-[#0f131c] p-4 text-sm text-[#9ca3af]">
              Nenhuma curiosidade cadastrada ainda.
            </div>
          ) : (
            <div className="grid gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#1f2937] bg-[#0f131c] p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold">{item.title}</div>
                      {item.created_at && (
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[#9ca3af]">
                          {new Date(item.created_at).toLocaleString("pt-BR")}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-[#f87171] hover:text-red-400 transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <p className="text-sm text-[#dfe4ea] whitespace-pre-wrap">{item.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
