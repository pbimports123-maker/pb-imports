"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import UsersTab from "./users-tab";
import SecurityTab from "./security-tab";

type StoreSettings = {
  id?: string;
  store_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  instagram_url: string;
  pix_key: string;
  pix_holder: string;
  pix_bank: string;
  whatsapp_number: string;
};

type TabKey = "store" | "payments" | "users" | "security";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>({
    store_name: "PB Imports",
    contact_email: "",
    contact_phone: "",
    address: "",
    instagram_url: "",
    pix_key: "",
    pix_holder: "",
    pix_bank: "",
    whatsapp_number: "",
  });
  const [tab, setTab] = useState<TabKey>("store");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("Nenhuma alteração salva");

  useEffect(() => { fetchSettings(); }, []);

  async function fetchSettings() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("store_settings").select("*").maybeSingle();
      if (error) throw error;
      if (data) setSettings({
        store_name: data.store_name ?? "",
        contact_email: data.contact_email ?? "",
        contact_phone: data.contact_phone ?? "",
        address: data.address ?? "",
        instagram_url: data.instagram_url ?? "",
        pix_key: data.pix_key ?? "",
        pix_holder: data.pix_holder ?? "",
        pix_bank: data.pix_bank ?? "",
        whatsapp_number: data.whatsapp_number ?? "",
        id: data.id,
      });
    } catch (err: any) {
      toast.error("Erro ao carregar configurações: " + err.message);
    } finally { setLoading(false); }
  }

  const filledPct = useMemo(() => {
    const filled = [settings.store_name, settings.contact_email, settings.contact_phone, settings.address, settings.instagram_url, settings.pix_key, settings.pix_holder, settings.whatsapp_number]
      .filter(v => v && v.trim().length > 0).length;
    const total = 8;
    return { filled, pct: Math.round((filled / total) * 100) };
  }, [settings]);

  async function handleSave() {
    try {
      setSaving(true);
      const payload = { ...settings } as any;
      if (!payload.id) delete payload.id;
      const { error } = await supabase.from("store_settings").upsert({ ...payload, updated_at: new Date().toISOString() });
      if (error) throw error;
      setLastSaved(`Salvo em ${new Date().toLocaleString("pt-BR")}`);
      toast.success("Configurações atualizadas!");
      fetchSettings();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally { setSaving(false); }
  }

  return (
    <div className="content">
      <style jsx>{`
        /* Header */
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .title { font-family: "Raleway", sans-serif; font-size: 26px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: var(--text-primary); }
        .title span { color: var(--accent-terra); }
        .sub { font-family: "DM Sans", sans-serif; font-size: 12px; color: var(--text-muted); margin-top: 6px; }
        .btn-main { display: flex; align-items: center; gap: 8px; padding: 12px 22px; background: var(--accent-terra); border: none; color: #fff; font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 700; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .btn-main:hover { background: var(--accent-terra-dark); transform: translateY(-1px); }
        .btn-main:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

        /* Progresso */
        .progress { display: flex; align-items: center; gap: 14px; background: #fff; border: 1px solid rgba(194,130,102,0.18); border-radius: 10px; padding: 14px 18px; margin-bottom: 16px; }
        .progress-label { font-size: 12px; color: var(--text-muted); font-weight: 500; white-space: nowrap; }
        .progress-track { flex: 1; height: 4px; background: rgba(194,130,102,0.12); border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent-terra), #7AAF90); border-radius: 4px; transition: width 0.4s ease; }
        .progress-val { font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 700; color: var(--accent-terra); white-space: nowrap; }

        /* Tabs */
        .tabs { display: flex; gap: 8px; margin-bottom: 18px; }
        .tab { padding: 10px 18px; font-family: "Raleway", sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.3px; text-transform: uppercase; border: 1px solid rgba(194,130,102,0.2); border-radius: 8px; color: var(--text-muted); background: #fff; cursor: pointer; transition: all 0.2s; }
        .tab:hover { border-color: var(--accent-terra); color: var(--accent-terra); }
        .tab.active { border-color: var(--accent-terra); color: var(--accent-terra); background: rgba(194,130,102,0.06); }

        /* Panel */
        .panel { background: #fff; border: 1px solid rgba(194,130,102,0.18); border-radius: 12px; padding: 24px; animation: fade 0.3s ease both; }
        .panel h3 { font-family: "Raleway", sans-serif; font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 5px; }
        .panel p { font-size: 13px; color: var(--text-muted); line-height: 1.5; }

        /* Grid de campos */
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin-top: 18px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .label { font-size: 11px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px; text-transform: uppercase; }
        .input { width: 100%; padding: 11px 14px; background: #FAF8EF; border: 1px solid rgba(194,130,102,0.25); border-radius: 8px; color: var(--text-primary); font-family: "DM Sans", sans-serif; font-size: 14px; outline: none; transition: all 0.2s; }
        .input::placeholder { color: #C8B8AE; }
        .input:focus { border-color: var(--accent-terra); box-shadow: 0 0 0 3px rgba(194,130,102,0.12); }

        /* Ações */
        .actions { margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px; align-items: center; }
        .btn-ghost { padding: 10px 18px; border: 1px solid rgba(194,130,102,0.25); border-radius: 8px; background: transparent; color: var(--text-muted); font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-ghost:hover { border-color: var(--accent-terra); color: var(--accent-terra); }
        .last-saved { font-size: 12px; color: var(--text-muted); margin-top: 10px; }

        /* Placeholder */
        .placeholder-box { margin-top: 16px; padding: 24px; border: 1.5px dashed rgba(194,130,102,0.25); border-radius: 10px; text-align: center; color: var(--text-muted); font-size: 13px; line-height: 1.6; }

        /* Aviso segurança */
        .warn-box { display: flex; gap: 12px; padding: 14px 16px; background: rgba(212,169,106,0.08); border: 1px solid rgba(212,169,106,0.3); border-radius: 10px; color: #8A6830; font-size: 13px; line-height: 1.5; margin-top: 16px; }
        .btn-danger { padding: 10px 18px; border: 1px solid rgba(192,97,79,0.3); border-radius: 8px; background: transparent; color: #C0614F; font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-danger:hover { background: rgba(192,97,79,0.06); border-color: #C0614F; }

        @keyframes fade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 900px) { .header { flex-direction: column; gap: 10px; } .btn-main { width: 100%; justify-content: center; } }
      `}</style>

      {/* Header */}
      <div className="header">
        <div>
          <div className="title">Configurações</div>
          <div className="sub">Gerencie informações da loja e acessos</div>
        </div>
        <button className="btn-main" onClick={handleSave} disabled={saving}>
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      {/* Progresso */}
      <div className="progress">
        <span className="progress-label">Campos preenchidos</span>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${filledPct.pct}%` }} />
        </div>
        <span className="progress-val">{filledPct.filled} / 8</span>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === "store" ? "active" : ""}`} onClick={() => setTab("store")}>Dados da Loja</button>
        <button className={`tab ${tab === "payments" ? "active" : ""}`} onClick={() => setTab("payments")}>Pagamentos</button>
        <button className={`tab ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>Usuários</button>
        <button className={`tab ${tab === "security" ? "active" : ""}`} onClick={() => setTab("security")}>Segurança</button>
      </div>

      {loading ? (
        <div className="panel" style={{ color: "var(--text-muted)", fontSize: 14 }}>Carregando...</div>
      ) : (
        <>
          {/* Dados da Loja */}
          {tab === "store" && (
            <div className="panel" key="store">
              <h3>Perfil da Loja</h3>
              <p>Estas informações aparecem no rodapé e páginas de contato.</p>
              <div className="grid">
                <div className="field">
                  <span className="label">Nome da Loja</span>
                  <input className="input" value={settings.store_name} onChange={e => setSettings({ ...settings, store_name: e.target.value })} />
                </div>
                <div className="field">
                  <span className="label">E-mail de Contato</span>
                  <input className="input" value={settings.contact_email} onChange={e => setSettings({ ...settings, contact_email: e.target.value })} placeholder="contato@pbimports.com" />
                </div>
                <div className="field">
                  <span className="label">Telefone / WhatsApp</span>
                  <input className="input" value={settings.contact_phone} onChange={e => setSettings({ ...settings, contact_phone: e.target.value })} placeholder="(11) 99999-9999" />
                </div>
                <div className="field">
                  <span className="label">Instagram (URL)</span>
                  <input className="input" value={settings.instagram_url} onChange={e => setSettings({ ...settings, instagram_url: e.target.value })} placeholder="https://instagram.com/sualoja" />
                </div>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <span className="label">Endereço Físico (Opcional)</span>
                  <input className="input" value={settings.address} onChange={e => setSettings({ ...settings, address: e.target.value })} placeholder="Rua, número, cidade" />
                </div>
              </div>
              <div className="actions">
                <button className="btn-ghost" onClick={fetchSettings}>Recarregar</button>
                <button className="btn-main" onClick={handleSave} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
              <div className="last-saved">{lastSaved}</div>
            </div>
          )}

          {/* Pagamentos */}
          {tab === "payments" && (
            <div className="panel" key="payments">
              <h3>Configurações de Pagamento</h3>
              <p>Configure a chave PIX e o WhatsApp para receber pedidos.</p>
              <div className="grid">
                <div className="field">
                  <span className="label">Chave PIX</span>
                  <input className="input" value={settings.pix_key} onChange={e => setSettings({ ...settings, pix_key: e.target.value })} placeholder="CNPJ, CPF, e-mail ou telefone" />
                </div>
                <div className="field">
                  <span className="label">Nome do Titular</span>
                  <input className="input" value={settings.pix_holder} onChange={e => setSettings({ ...settings, pix_holder: e.target.value })} placeholder="Nome completo ou razão social" />
                </div>
                <div className="field">
                  <span className="label">Banco</span>
                  <input className="input" value={settings.pix_bank} onChange={e => setSettings({ ...settings, pix_bank: e.target.value })} placeholder="Ex: Nubank, Itaú, Bradesco..." />
                </div>
                <div className="field">
                  <span className="label">WhatsApp do Admin</span>
                  <input className="input" value={settings.whatsapp_number} onChange={e => setSettings({ ...settings, whatsapp_number: e.target.value })} placeholder="5511999999999 (com código do país)" />
                </div>
              </div>
              <div className="actions">
                <button className="btn-ghost" onClick={fetchSettings}>Recarregar</button>
                <button className="btn-main" onClick={handleSave} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
              <div className="last-saved">{lastSaved}</div>
            </div>
          )}

          {/* Usuários */}
          {tab === "users" && (
            <div className="panel" key="users">
              <UsersTab />
            </div>
          )}

          {/* Segurança */}
          {tab === "security" && (
            <div className="panel" key="security">
              <SecurityTab />
            </div>
          )}
        </>
      )}
    </div>
  );
}
