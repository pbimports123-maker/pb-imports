"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PALETTE = ["#00e5ff","#1565ff","#ffd600","#00ff9d","#ff2d5f","#a855f7","#6366f1","#8b5cf6","#b45309","#06b6d4","#f97316","#64748b"];

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
      const { data, error } = await supabase.from("categories").select("id,name,acronym,color,sort_order").order("sort_order", { ascending: true });
      if (error) throw error;
      setCategories((data as Category[]) || []);
    } catch (err: any) {
      toast.error("Erro ao carregar categorias: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.acronym.toLowerCase().includes(search.toLowerCase())), [categories, search]);

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
        .header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px;}
        .title{font-family:"Orbitron",monospace;font-size:26px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--text-primary);} .sub{font-family:"Share Tech Mono",monospace;font-size:11px;color:var(--text-muted);letter-spacing:2px;margin-top:6px;}
        .btn-main{display:flex;align-items:center;gap:8px;padding:12px 20px;background:linear-gradient(135deg,var(--accent-cyan),var(--accent-blue));border:none;color:var(--bg-void);font-family:"Orbitron",monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;}
        .search{margin-bottom:14px;} .search input{width:100%;max-width:420px;padding:11px 14px;background:var(--bg-card);border:1px solid var(--border-dim);color:var(--text-primary);font-family:"Share Tech Mono",monospace;font-size:12px;} .search input:focus{outline:none;border-color:var(--accent-cyan);box-shadow:0 0 14px rgba(0,229,255,0.2);} 
        .panel{background:var(--bg-card);border:1px solid var(--border-dim);} table{width:100%;border-collapse:collapse;} thead tr{border-bottom:1px solid var(--border-dim);background:rgba(0,229,255,0.04);} th{padding:12px 16px;font-family:"Share Tech Mono",monospace;font-size:10px;color:var(--text-muted);letter-spacing:2px;text-transform:uppercase;text-align:left;} td{padding:12px 16px;font-size:14px;} tbody tr{border-bottom:1px solid var(--border-dim);} tbody tr:hover{background:rgba(0,229,255,0.04);} .color-dot{width:24px;height:24px;border-radius:4px;border:1px solid var(--border-glow);box-shadow:0 0 10px currentColor;}
        .acronym{font-family:"Orbitron",monospace;font-weight:700;color:var(--accent-cyan);} .order{font-family:"Orbitron",monospace;font-weight:700;color:var(--accent-gold);} .actions{display:flex;gap:8px;} .btn-ghost{width:32px;height:32px;border:1px solid var(--border-dim);background:transparent;color:var(--text-muted);cursor:pointer;} .btn-ghost:hover{border-color:var(--accent-cyan);color:var(--accent-cyan);} .btn-del:hover{border-color:var(--accent-red);color:var(--accent-red);}
        .empty{padding:48px;text-align:center;font-family:"Share Tech Mono",monospace;color:var(--text-muted);letter-spacing:2px;}
        .modal-overlay{position:fixed;inset:0;background:rgba(2,4,8,0.85);backdrop-filter:blur(6px);display:${modalOpen?"flex":"none"};align-items:center;justify-content:center;z-index:200;} .modal{background:var(--bg-card);border:1px solid var(--border-glow);width:420px;max-width:95vw;padding:18px;} .modal-title{font-family:"Orbitron",monospace;font-size:14px;color:var(--accent-cyan);letter-spacing:3px;margin-bottom:12px;} .form{display:flex;flex-direction:column;gap:10px;} .label{font-family:"Share Tech Mono",monospace;font-size:9px;color:var(--text-muted);letter-spacing:2px;text-transform:uppercase;} .input{padding:10px 12px;background:var(--bg-card2);border:1px solid var(--border-dim);color:var(--text-primary);font-family:"Rajdhani",sans-serif;font-size:13px;} .input:focus{outline:none;border-color:var(--accent-cyan);} .palette{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;} .swatch{width:100%;aspect-ratio:1;border:2px solid var(--border-dim);cursor:pointer;} .swatch.selected{border-color:var(--accent-cyan);box-shadow:0 0 12px currentColor;} .modal-actions{display:flex;gap:8px;margin-top:6px;} .btn-cancel{flex:1;padding:10px;border:1px solid var(--border-dim);background:transparent;color:var(--text-muted);font-family:"Share Tech Mono",monospace;font-size:10px;letter-spacing:2px;cursor:pointer;} .btn-save{flex:1;padding:10px;background:linear-gradient(135deg,var(--accent-cyan),var(--accent-blue));border:none;color:var(--bg-void);font-family:"Orbitron",monospace;font-size:10px;letter-spacing:2px;cursor:pointer;}
        @media(max-width:900px){.header{flex-direction:column;gap:10px;} .btn-main{width:100%;justify-content:center;} }
      `}</style>

      <div className="header">
        <div>
          <div className="title">Categorias</div>
          <div className="sub">// Organize seus produtos em grupos lógicos.</div>
        </div>
        <button className="btn-main" onClick={()=>openModal()}>+ Nova Categoria</button>
      </div>

      <div className="search">
        <input placeholder="Buscar categoria..." value={search} onChange={(e)=>setSearch(e.target.value)} />
      </div>

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
              <tr><td colSpan={5} className="empty">// CARREGANDO...</td></tr>
            ) : filtered.length===0 ? (
              <tr><td colSpan={5} className="empty">// NENHUMA CATEGORIA</td></tr>
            ) : (
              filtered.map((cat)=>(
                <tr key={cat.id}>
                  <td><div className="color-dot" style={{backgroundColor:cat.color,boxShadow:`0 0 10px ${cat.color}`}}></div></td>
                  <td>{cat.name}</td>
                  <td className="acronym">{cat.acronym}</td>
                  <td className="order">{cat.sort_order}</td>
                  <td>
                    <div className="actions">
                      <button className="btn-ghost" onClick={()=>openModal(cat)}>?</button>
                      <button className="btn-ghost btn-del" onClick={()=>deleteCategory(cat.id)}>?</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="modal-overlay" onClick={(e)=>e.target===e.currentTarget&&setModalOpen(false)}>
        <div className="modal">
          <div className="modal-title">{editing?"Editar Categoria":"Nova Categoria"}</div>
          <form className="form" onSubmit={saveCategory}>
            <div>
              <div className="label">Nome</div>
              <input className="input" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} required />
            </div>
            <div>
              <div className="label">Acrônimo (2-4)</div>
              <input className="input" value={form.acronym} maxLength={4} onChange={(e)=>setForm({...form,acronym:e.target.value.toUpperCase()})} required />
            </div>
            <div>
              <div className="label">Ordem</div>
              <input className="input" type="number" value={form.sort_order} onChange={(e)=>setForm({...form,sort_order:Number(e.target.value)})} required />
            </div>
            <div>
              <div className="label">Cor</div>
              <div className="palette">
                {PALETTE.map((c)=>(
                  <div key={c} className={`swatch ${form.color===c?"selected":""}`} style={{backgroundColor:c}} onClick={()=>setForm({...form,color:c})}></div>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={()=>setModalOpen(false)}>Cancelar</button>
              <button type="submit" className="btn-save">{editing?"Salvar":"Criar"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
