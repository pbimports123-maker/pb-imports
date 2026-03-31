"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield } from "lucide-react";

type StoreSettings = {
  id?: string;
  store_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  instagram_url: string;
};

type TabKey = "store" | "users" | "security";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: "PB Imports",
    contact_email: "",
    contact_phone: "",
    address: "",
    instagram_url: "",
  });
  const [tab, setTab] = useState<TabKey>("store");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("// Nenhuma alteração salva");

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("store_settings").select("*").maybeSingle();
      if (error) throw error;
      if (data) setSettings(data as StoreSettings);
    } catch (err: any) {
      toast.error("Erro ao carregar configurações: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const filledPct = useMemo(() => {
    const total = 5; // fields we track
    const filled = [settings.store_name, settings.contact_email, settings.contact_phone, settings.address, settings.instagram_url].filter(
      (v) => v && v.trim().length > 0
    ).length;
    return { filled, pct: Math.round((filled / total) * 100) };
  }, [settings]);

  async function handleSave() {
    try {
      setSaving(true);
      const payload = { ...settings } as any;
      if (!payload.id) delete payload.id;
      const { error } = await supabase.from("store_settings").upsert({
        ...payload,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      const stamp = new Date().toLocaleString("pt-BR");
      setLastSaved(`// Salvo em ${stamp}`);
      toast.success("Configurações atualizadas!");
      fetchSettings();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="content">
      <style jsx>{`
        .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
        .title { font-family:"Orbitron",monospace; font-size:26px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:var(--text-primary); }
        .title span { color:var(--accent-cyan); }
        .sub { font-family:"Share Tech Mono",monospace; font-size:11px; color:var(--text-muted); letter-spacing:2px; margin-top:6px; }
        .btn-main { display:flex; align-items:center; gap:8px; padding:12px 20px; background:linear-gradient(135deg,var(--accent-cyan),var(--accent-blue)); border:none; color:var(--bg-void); font-family:"Orbitron",monospace; font-size:11px; letter-spacing:2px; text-transform:uppercase; cursor:pointer; }
        .tabs { display:flex; gap:8px; margin-bottom:16px; }
        .tab { padding:10px 16px; font-family:"Share Tech Mono",monospace; font-size:10px; letter-spacing:2px; text-transform:uppercase; border:1px solid var(--border-dim); color:var(--text-muted); background:var(--bg-card); cursor:pointer; }
        .tab.active { border-color:var(--accent-cyan); color:var(--accent-cyan); background:rgba(0,229,255,0.06); }
        .panel { background:var(--bg-card); border:1px solid var(--border-dim); padding:18px 20px; animation:fade 0.3s ease both; }
        .panel h3 { font-family:"Orbitron",monospace; font-size:14px; letter-spacing:2px; text-transform:uppercase; color:var(--accent-cyan); margin-bottom:6px; }
        .panel p { font-family:"Share Tech Mono",monospace; font-size:10px; color:var(--text-muted); letter-spacing:1px; }
        .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:12px; margin-top:14px; }
        .field { background:var(--bg-card2); border:1px solid var(--border-dim); padding:12px; display:flex; flex-direction:column; gap:6px; }
        .label { font-family:"Share Tech Mono",monospace; font-size:9px; color:var(--text-muted); letter-spacing:2px; text-transform:uppercase; }
        .input { width:100%; padding:10px 12px; background:rgba(0,0,0,0.15); border:1px solid var(--border-dim); color:var(--text-primary); font-family:"Rajdhani",sans-serif; font-size:14px; outline:none; }
        .input:focus { border-color:var(--accent-cyan); box-shadow:0 0 10px rgba(0,229,255,0.15); }
        .row { display:flex; flex-direction:column; gap:8px; }
        .actions { margin-top:14px; display:flex; justify-content:flex-end; gap:10px; }
        .btn-ghost { padding:10px 14px; border:1px solid var(--border-dim); background:transparent; color:var(--text-muted); font-family:"Share Tech Mono",monospace; font-size:10px; letter-spacing:2px; text-transform:uppercase; cursor:pointer; }
        .btn-ghost:hover { border-color:var(--accent-cyan); color:var(--accent-cyan); }
        .progress { display:flex; align-items:center; gap:14px; background:var(--bg-card); border:1px solid var(--border-dim); padding:12px 14px; margin-bottom:12px; }
        .progress-track { flex:1; height:3px; background:rgba(255,255,255,0.05); }
        .progress-fill { height:100%; background:linear-gradient(90deg,var(--accent-cyan),var(--accent-green)); box-shadow:0 0 10px var(--accent-cyan); }
        .progress-label { font-family:"Share Tech Mono",monospace; font-size:9px; color:var(--text-muted); letter-spacing:3px; }
        .progress-val { font-family:"Orbitron",monospace; font-size:11px; color:var(--accent-cyan); letter-spacing:1px; }
        .placeholder-box { padding:20px; border:1px dashed var(--border-dim); text-align:center; color:var(--text-muted); font-family:"Share Tech Mono",monospace; font-size:11px; letter-spacing:2px; }
        .warn-box { display:flex; gap:10px; padding:12px; background:rgba(255,214,0,0.07); border:1px solid rgba(255,214,0,0.4); color:var(--accent-gold); font-family:"Share Tech Mono",monospace; font-size:10px; letter-spacing:1px; }
        @keyframes fade { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:translateY(0);} }
        @media(max-width:900px){ .header{flex-direction:column;gap:10px;} .btn-main{width:100%;justify-content:center;} }
      `}</style>

      <div className="header">
        <div>
          <div className="title">Configurações</div>
          <div className="sub">// Gerencie informações da loja e acessos</div>
        </div>
        <button className="btn-main" onClick={handleSave} disabled={saving}>
          {saving ? "SALVANDO..." : "SALVAR"}
        </button>
      </div>

      <div className="progress">
        <span className="progress-label">Campos preenchidos</span>
        <div className="progress-track"><div className="progress-fill" style={{width:`${filledPct.pct}%`}}></div></div>
        <span className="progress-val">{filledPct.filled} / 5</span>
      </div>

      <div className="tabs">
        <button className={`tab ${tab==="store"?"active":""}`} onClick={()=>setTab("store")}>Dados da Loja</button>
        <button className={`tab ${tab==="users"?"active":""}`} onClick={()=>setTab("users")}>Usuários</button>
        <button className={`tab ${tab==="security"?"active":""}`} onClick={()=>setTab("security")}>Segurança</button>
      </div>

      {loading ? (
        <div className="panel">Carregando...</div>
      ) : (
        <>
          {tab === "store" && (
            <div className="panel" key="store">
              <h3>Perfil da Loja</h3>
              <p>Estas informações aparecem no rodapé e páginas de contato.</p>
              <div className="grid" style={{marginTop:12}}>
                <div className="field">
                  <span className="label">Nome da Loja</span>
                  <input className="input" value={settings.store_name} onChange={(e)=>setSettings({...settings, store_name:e.target.value})} />
                </div>
                <div className="field">
                  <span className="label">E-mail de Contato</span>
                  <input className="input" value={settings.contact_email} onChange={(e)=>setSettings({...settings, contact_email:e.target.value})} placeholder="contato@pbimports.com" />
                </div>
                <div className="field">
                  <span className="label">Telefone / WhatsApp</span>
                  <input className="input" value={settings.contact_phone} onChange={(e)=>setSettings({...settings, contact_phone:e.target.value})} placeholder="(11) 99999-9999" />
                </div>
                <div className="field">
                  <span className="label">Instagram (URL)</span>
                  <input className="input" value={settings.instagram_url} onChange={(e)=>setSettings({...settings, instagram_url:e.target.value})} placeholder="https://instagram.com/sualoja" />
                </div>
                <div className="field" style={{gridColumn:"1 / -1"}}>
                  <span className="label">Endereço Físico (Opcional)</span>
                  <input className="input" value={settings.address} onChange={(e)=>setSettings({...settings, address:e.target.value})} placeholder="Rua, número, cidade" />
                </div>
              </div>
              <div className="actions">
                <button className="btn-ghost" onClick={fetchSettings}>Recarregar</button>
                <button className="btn-main" onClick={handleSave} disabled={saving}>{saving?"Salvando...":"Salvar Alterações"}</button>
              </div>
              <div className="sub" style={{marginTop:8}}>{lastSaved}</div>
            </div>
          )}

          {tab === "users" && (
            <div className="panel" key="users">
              <h3>Gestão de Usuários</h3>
              <p>Módulo de convites e permissões será habilitado em breve.</p>
              <div className="placeholder-box" style={{marginTop:12}}>
                // Em breve: convites por e-mail e papéis de acesso
              </div>
            </div>
          )}

          {tab === "security" && (
            <div className="panel" key="security">
              <h3>Segurança da Conta</h3>
              <p>Gerencie sessões e redefinição de senha.</p>
              <div className="warn-box" style={{marginTop:12}}>
                <Shield size={16} />
                Para maior segurança, altere a senha via fluxo "Esqueci minha senha" na tela de login.
              </div>
              <div className="actions" style={{justifyContent:"flex-start"}}>
                <button className="btn-ghost" style={{color:"var(--accent-red)",borderColor:"var(--border-dim)"}} onClick={()=>toast.info("Encerramento de sessões será implementado.")}>
                  Encerrar todas as sessões
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
