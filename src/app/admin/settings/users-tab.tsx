"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus, Trash2, ShieldCheck, Eye, Edit3, ToggleLeft, ToggleRight } from "lucide-react";

type Role = "admin" | "editor" | "visualizador";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
};

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  editor: "Editor",
  visualizador: "Visualizador",
};

const ROLE_DESC: Record<Role, string> = {
  admin: "Acesso total ao sistema",
  editor: "Pode editar produtos e categorias",
  visualizador: "Somente leitura",
};

const ROLE_COLOR: Record<Role, string> = {
  admin: "role-admin",
  editor: "role-editor",
  visualizador: "role-viewer",
};

export default function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "visualizador" as Role });

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("admin_users")
        .select("id,name,email,role,is_active,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setUsers((data as AdminUser[]) || []);
    } catch (err: any) {
      toast.error("Erro ao carregar usuários: " + err.message);
    } finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    try {
      setSaving(true);

      // 1. Cria o usuário no Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.admin
        ? await (supabase as any).auth.admin.createUser({
            email: form.email,
            password: form.password,
            email_confirm: true,
          })
        : { data: null, error: new Error("Admin API não disponível") };

      // Fallback: usa signUp normal se admin API não disponível
      let userId = authData?.user?.id;
      if (authErr || !userId) {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
        });
        if (signUpErr) throw signUpErr;
        userId = signUpData.user?.id;
      }

      // 2. Salva na tabela admin_users
      const { error: dbErr } = await supabase.from("admin_users").insert([{
        id: userId,
        name: form.name,
        email: form.email,
        password_hash: "supabase_auth", // senha gerenciada pelo Supabase Auth
        role: form.role,
        is_active: true,
      }]);
      if (dbErr) throw dbErr;

      toast.success(`Usuário ${form.name} criado com sucesso!`);
      setModalOpen(false);
      setForm({ name: "", email: "", password: "", role: "visualizador" });
      fetchUsers();
    } catch (err: any) {
      toast.error("Erro ao criar usuário: " + err.message);
    } finally { setSaving(false); }
  }

  async function toggleActive(user: AdminUser) {
    try {
      const { error } = await supabase
        .from("admin_users")
        .update({ is_active: !user.is_active })
        .eq("id", user.id);
      if (error) throw error;
      toast.success(`Usuário ${user.is_active ? "desativado" : "ativado"}!`);
      fetchUsers();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  }

  async function changeRole(user: AdminUser, role: Role) {
    try {
      const { error } = await supabase
        .from("admin_users")
        .update({ role })
        .eq("id", user.id);
      if (error) throw error;
      toast.success(`Perfil alterado para ${ROLE_LABEL[role]}!`);
      fetchUsers();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  }

  async function deleteUser(user: AdminUser) {
    if (!confirm(`Remover o usuário ${user.name}? Esta ação não pode ser desfeita.`)) return;
    try {
      const { error } = await supabase.from("admin_users").delete().eq("id", user.id);
      if (error) throw error;
      toast.success("Usuário removido.");
      fetchUsers();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  }

  return (
    <div className="users-tab">
      <style jsx>{`
        .users-tab { }

        /* Header da aba */
        .ut-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .ut-title { font-family: "Raleway", sans-serif; font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
        .ut-sub { font-size: 13px; color: var(--text-muted); }
        .btn-new { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: var(--accent-terra); border: none; color: #fff; font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 700; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .btn-new:hover { background: var(--accent-terra-dark); transform: translateY(-1px); }

        /* Roles info */
        .roles-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
        .role-card { padding: 12px 14px; border-radius: 10px; border: 1px solid; }
        .role-card.role-admin { background: rgba(194,130,102,0.06); border-color: rgba(194,130,102,0.3); }
        .role-card.role-editor { background: rgba(138,175,200,0.06); border-color: rgba(138,175,200,0.3); }
        .role-card.role-viewer { background: rgba(122,175,144,0.06); border-color: rgba(122,175,144,0.3); }
        .role-name { font-size: 12px; font-weight: 700; margin-bottom: 3px; }
        .role-admin .role-name { color: var(--accent-terra-dark); }
        .role-editor .role-name { color: #4A7A9B; }
        .role-viewer .role-name { color: #5A8F70; }
        .role-desc { font-size: 11px; color: var(--text-muted); }

        /* Lista */
        .users-list { display: flex; flex-direction: column; gap: 10px; }
        .user-card { background: #FAF8EF; border: 1px solid rgba(194,130,102,0.15); border-radius: 10px; padding: 14px 16px; display: flex; align-items: center; gap: 14px; transition: box-shadow 0.2s; }
        .user-card:hover { box-shadow: 0 3px 16px rgba(194,130,102,0.1); }
        .user-card.inactive { opacity: 0.55; }

        /* Avatar */
        .avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: "Raleway", sans-serif; font-size: 15px; font-weight: 700; flex-shrink: 0; }
        .avatar.role-admin { background: rgba(194,130,102,0.15); color: var(--accent-terra-dark); border: 1.5px solid rgba(194,130,102,0.3); }
        .avatar.role-editor { background: rgba(138,175,200,0.15); color: #4A7A9B; border: 1.5px solid rgba(138,175,200,0.3); }
        .avatar.role-viewer { background: rgba(122,175,144,0.15); color: #5A8F70; border: 1.5px solid rgba(122,175,144,0.3); }

        /* Info */
        .user-info { flex: 1; min-width: 0; }
        .user-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
        .user-email { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        .user-meta { display: flex; align-items: center; gap: 8px; margin-top: 5px; }

        /* Badges */
        .badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; border: 1px solid; }
        .badge.role-admin { border-color: rgba(194,130,102,0.4); color: var(--accent-terra-dark); background: rgba(194,130,102,0.08); }
        .badge.role-editor { border-color: rgba(138,175,200,0.4); color: #4A7A9B; background: rgba(138,175,200,0.08); }
        .badge.role-viewer { border-color: rgba(122,175,144,0.4); color: #5A8F70; background: rgba(122,175,144,0.08); }
        .badge.active { border-color: rgba(122,175,144,0.4); color: #5A8F70; background: rgba(122,175,144,0.06); }
        .badge.inactive { border-color: rgba(192,97,79,0.3); color: #C0614F; background: rgba(192,97,79,0.06); }

        /* Ações */
        .user-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .role-select { padding: 5px 10px; background: #fff; border: 1px solid rgba(194,130,102,0.2); border-radius: 6px; font-family: "DM Sans", sans-serif; font-size: 12px; color: var(--text-primary); outline: none; cursor: pointer; }
        .role-select:focus { border-color: var(--accent-terra); }
        .icon-btn { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: #fff; border: 1px solid rgba(194,130,102,0.2); border-radius: 6px; cursor: pointer; transition: all 0.2s; color: var(--text-muted); }
        .icon-btn:hover { border-color: var(--accent-terra); color: var(--accent-terra); }
        .icon-btn.danger:hover { border-color: #C0614F; color: #C0614F; background: rgba(192,97,79,0.06); }
        .icon-btn.toggle-on { color: #5A8F70; border-color: rgba(122,175,144,0.4); }
        .icon-btn.toggle-off { color: #C0614F; border-color: rgba(192,97,79,0.3); }

        /* Empty */
        .empty { text-align: center; padding: 32px; color: var(--text-muted); font-size: 14px; border: 1.5px dashed rgba(194,130,102,0.2); border-radius: 10px; }

        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(13,15,19,0.5); display: flex; align-items: center; justify-content: center; z-index: 300; backdrop-filter: blur(6px); }
        .modal { background: #fff; border: 1px solid rgba(194,130,102,0.2); border-radius: 14px; width: 460px; max-width: 95vw; box-shadow: 0 20px 60px rgba(194,130,102,0.15); }
        .modal-head { display: flex; justify-content: space-between; align-items: center; padding: 20px 22px; border-bottom: 1px solid rgba(194,130,102,0.1); }
        .modal-title { font-family: "Raleway", sans-serif; font-size: 17px; font-weight: 700; color: var(--accent-terra-dark); }
        .modal-close { width: 30px; height: 30px; border: 1px solid rgba(194,130,102,0.2); border-radius: 6px; background: transparent; font-size: 16px; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; }
        .modal-close:hover { border-color: #C0614F; color: #C0614F; }
        .modal-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 14px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label { font-size: 11px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.3px; text-transform: uppercase; }
        .field input, .field select { padding: 11px 14px; background: #FAF8EF; border: 1px solid rgba(194,130,102,0.25); border-radius: 8px; color: var(--text-primary); font-family: "DM Sans", sans-serif; font-size: 14px; outline: none; transition: all 0.2s; }
        .field input:focus, .field select:focus { border-color: var(--accent-terra); box-shadow: 0 0 0 3px rgba(194,130,102,0.12); }
        .field input::placeholder { color: #C8B8AE; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .role-hint { font-size: 11px; color: var(--text-muted); margin-top: 3px; }
        .modal-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 14px 22px; border-top: 1px solid rgba(194,130,102,0.1); }
        .btn-cancel { padding: 10px 18px; border: 1px solid rgba(194,130,102,0.25); border-radius: 8px; background: transparent; color: var(--text-muted); font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; }
        .btn-cancel:hover { border-color: var(--accent-terra); color: var(--accent-terra); }
        .btn-save { padding: 10px 22px; background: var(--accent-terra); border: none; border-radius: 8px; color: #fff; font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-save:hover { background: var(--accent-terra-dark); }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

        @media (max-width: 640px) {
          .roles-info { grid-template-columns: 1fr; }
          .grid2 { grid-template-columns: 1fr; }
          .user-actions { flex-wrap: wrap; }
        }
      `}</style>

      {/* Header */}
      <div className="ut-header">
        <div>
          <div className="ut-title">Gestão de Usuários</div>
          <div className="ut-sub">Crie e gerencie acessos ao painel administrativo.</div>
        </div>
        <button className="btn-new" onClick={() => setModalOpen(true)}>
          <UserPlus size={15} /> Novo Usuário
        </button>
      </div>

      {/* Info de perfis */}
      <div className="roles-info">
        {(Object.keys(ROLE_LABEL) as Role[]).map((role) => (
          <div key={role} className={`role-card ${ROLE_COLOR[role]}`}>
            <div className="role-name">
              {role === "admin" && <ShieldCheck size={12} style={{ display: "inline", marginRight: 4 }} />}
              {role === "editor" && <Edit3 size={12} style={{ display: "inline", marginRight: 4 }} />}
              {role === "visualizador" && <Eye size={12} style={{ display: "inline", marginRight: 4 }} />}
              {ROLE_LABEL[role]}
            </div>
            <div className="role-desc">{ROLE_DESC[role]}</div>
          </div>
        ))}
      </div>

      {/* Lista de usuários */}
      {loading ? (
        <div className="empty">Carregando usuários...</div>
      ) : users.length === 0 ? (
        <div className="empty">
          <p style={{ fontSize: 28, marginBottom: 8 }}>👥</p>
          <p>Nenhum usuário cadastrado ainda.</p>
          <p style={{ fontSize: 12, marginTop: 4 }}>Clique em "Novo Usuário" para começar.</p>
        </div>
      ) : (
        <div className="users-list">
          {users.map((user) => (
            <div key={user.id} className={`user-card ${!user.is_active ? "inactive" : ""}`}>
              <div className={`avatar ${ROLE_COLOR[user.role]}`}>
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
                <div className="user-meta">
                  <span className={`badge ${ROLE_COLOR[user.role]}`}>
                    {ROLE_LABEL[user.role]}
                  </span>
                  <span className={`badge ${user.is_active ? "active" : "inactive"}`}>
                    {user.is_active ? "Ativo" : "Inativo"}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
                    desde {new Date(user.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
              <div className="user-actions">
                <select
                  className="role-select"
                  value={user.role}
                  onChange={(e) => changeRole(user, e.target.value as Role)}
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="visualizador">Visualizador</option>
                </select>
                <button
                  className={`icon-btn ${user.is_active ? "toggle-on" : "toggle-off"}`}
                  title={user.is_active ? "Desativar" : "Ativar"}
                  onClick={() => toggleActive(user)}
                >
                  {user.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
                <button
                  className="icon-btn danger"
                  title="Remover usuário"
                  onClick={() => deleteUser(user)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar usuário */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal">
            <div className="modal-head">
              <span className="modal-title">Novo Usuário</span>
              <button className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="grid2">
                  <div className="field">
                    <label>Nome *</label>
                    <input
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                  <div className="field">
                    <label>E-mail *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="email@exemplo.com"
                      required
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Senha *</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>
                <div className="field">
                  <label>Nível de Acesso</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as Role })}>
                    <option value="visualizador">Visualizador — somente leitura</option>
                    <option value="editor">Editor — pode editar produtos e categorias</option>
                    <option value="admin">Admin — acesso total</option>
                  </select>
                  <div className="role-hint">{ROLE_DESC[form.role]}</div>
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? "Criando..." : "Criar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
