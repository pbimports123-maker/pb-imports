"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, LogOut, KeyRound, Clock, Monitor, Smartphone, Globe } from "lucide-react";

type AccessLog = {
  id: string;
  user_agent: string;
  ip: string;
  created_at: string;
  action: string;
};

function detectDevice(ua: string) {
  if (/mobile|android|iphone|ipad/i.test(ua)) return "mobile";
  if (/tablet/i.test(ua)) return "tablet";
  return "desktop";
}

function formatUA(ua: string) {
  if (/chrome/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/edge/i.test(ua)) return "Edge";
  return "Navegador desconhecido";
}

function formatOS(ua: string) {
  if (/windows/i.test(ua)) return "Windows";
  if (/mac/i.test(ua)) return "macOS";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad/i.test(ua)) return "iOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Sistema desconhecido";
}

export default function SecurityTab() {
  const [changingPass, setChangingPass] = useState(false);
  const [passForm, setPassForm] = useState({ current: "", newPass: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  useEffect(() => { fetchLogs(); logAccess(); }, []);

  async function fetchLogs() {
    try {
      setLogsLoading(true);
      const { data, error } = await supabase
        .from("access_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      setLogs(data || []);
    } catch {
      // Tabela pode não existir ainda — silencioso
      setLogs([]);
    } finally { setLogsLoading(false); }
  }

  async function logAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("access_logs").insert([{
        user_id: user.id,
        user_agent: navigator.userAgent,
        ip: "—",
        action: "login_view",
      }]);
    } catch { /* silencioso */ }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passForm.newPass !== passForm.confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (passForm.newPass.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    try {
      setChangingPass(true);
      const { error } = await supabase.auth.updateUser({ password: passForm.newPass });
      if (error) throw error;
      toast.success("Senha alterada com sucesso!");
      setPassForm({ current: "", newPass: "", confirm: "" });
    } catch (err: any) {
      toast.error("Erro ao alterar senha: " + err.message);
    } finally { setChangingPass(false); }
  }

  async function handleSignOutAll() {
    if (!confirm("Encerrar todas as sessões ativas? Você precisará fazer login novamente.")) return;
    try {
      setSigningOut(true);
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      toast.success("Todas as sessões foram encerradas.");
      window.location.href = "/login";
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally { setSigningOut(false); }
  }

  const passStrength = (pass: string) => {
    if (!pass) return { label: "", color: "", pct: 0 };
    if (pass.length < 6) return { label: "Fraca", color: "#C0614F", pct: 25 };
    if (pass.length < 10) return { label: "Média", color: "#D4A96A", pct: 60 };
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass) && /[^a-zA-Z0-9]/.test(pass))
      return { label: "Forte", color: "#7AAF90", pct: 100 };
    return { label: "Boa", color: "#7AAF90", pct: 80 };
  };

  const strength = passStrength(passForm.newPass);

  return (
    <div className="sec-tab">
      <style jsx>{`
        .sec-tab { display: flex; flex-direction: column; gap: 20px; }

        /* Section card */
        .sec-card { background: #FAF8EF; border: 1px solid rgba(194,130,102,0.15); border-radius: 12px; padding: 20px; }
        .sec-card-head { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
        .sec-card-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .icon-terra { background: rgba(194,130,102,0.12); color: var(--accent-terra-dark); }
        .icon-red { background: rgba(192,97,79,0.1); color: #C0614F; }
        .icon-blue { background: rgba(138,175,200,0.12); color: #4A7A9B; }
        .sec-card-title { font-family: "Raleway", sans-serif; font-size: 15px; font-weight: 700; color: var(--text-primary); }
        .sec-card-sub { font-size: 12px; color: var(--text-muted); margin-bottom: 16px; margin-left: 44px; }

        /* Form senha */
        .pass-form { display: flex; flex-direction: column; gap: 12px; }
        .field { display: flex; flex-direction: column; gap: 5px; }
        .field label { font-size: 11px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.3px; text-transform: uppercase; }
        .pass-wrap { position: relative; }
        .field input { width: 100%; padding: 11px 40px 11px 14px; background: #fff; border: 1px solid rgba(194,130,102,0.25); border-radius: 8px; color: var(--text-primary); font-family: "DM Sans", sans-serif; font-size: 14px; outline: none; transition: all 0.2s; }
        .field input:focus { border-color: var(--accent-terra); box-shadow: 0 0 0 3px rgba(194,130,102,0.12); }
        .field input::placeholder { color: #C8B8AE; }
        .toggle-pass { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); font-size: 13px; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        /* Força da senha */
        .strength-bar { height: 3px; background: rgba(194,130,102,0.1); border-radius: 4px; overflow: hidden; margin-top: 4px; }
        .strength-fill { height: 100%; border-radius: 4px; transition: all 0.3s; }
        .strength-label { font-size: 11px; margin-top: 3px; font-weight: 600; }

        /* Botão salvar senha */
        .btn-save-pass { align-self: flex-end; padding: 11px 22px; background: var(--accent-terra); border: none; border-radius: 8px; color: #fff; font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .btn-save-pass:hover { background: var(--accent-terra-dark); }
        .btn-save-pass:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Encerrar sessões */
        .signout-content { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-left: 44px; }
        .signout-desc { font-size: 13px; color: var(--text-muted); line-height: 1.5; flex: 1; }
        .btn-danger { display: flex; align-items: center; gap: 8px; padding: 11px 20px; background: transparent; border: 1.5px solid rgba(192,97,79,0.4); border-radius: 8px; color: #C0614F; font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .btn-danger:hover { background: rgba(192,97,79,0.08); border-color: #C0614F; }
        .btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Histórico */
        .logs-list { display: flex; flex-direction: column; gap: 8px; margin-left: 44px; }
        .log-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: #fff; border: 1px solid rgba(194,130,102,0.12); border-radius: 8px; }
        .log-device { width: 32px; height: 32px; border-radius: 6px; background: rgba(194,130,102,0.08); border: 1px solid rgba(194,130,102,0.15); display: flex; align-items: center; justify-content: center; color: var(--accent-terra); flex-shrink: 0; }
        .log-info { flex: 1; min-width: 0; }
        .log-browser { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .log-os { font-size: 11px; color: var(--text-muted); margin-top: 1px; }
        .log-time { font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; white-space: nowrap; flex-shrink: 0; }
        .log-action { font-size: 10px; padding: 2px 8px; border-radius: 20px; border: 1px solid rgba(122,175,144,0.4); color: #5A8F70; background: rgba(122,175,144,0.08); font-weight: 600; }
        .empty-logs { text-align: center; padding: 20px; color: var(--text-muted); font-size: 13px; margin-left: 44px; }

        @media (max-width: 640px) {
          .grid2 { grid-template-columns: 1fr; }
          .signout-content { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      {/* Alterar Senha */}
      <div className="sec-card">
        <div className="sec-card-head">
          <div className="sec-card-icon icon-terra"><KeyRound size={16} /></div>
          <div className="sec-card-title">Alterar Senha</div>
        </div>
        <div className="sec-card-sub">Escolha uma senha forte com letras, números e símbolos.</div>

        <form className="pass-form" onSubmit={handleChangePassword}>
          <div className="grid2">
            <div className="field">
              <label>Nova senha *</label>
              <div className="pass-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  value={passForm.newPass}
                  onChange={e => setPassForm({ ...passForm, newPass: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
                <button type="button" className="toggle-pass" onClick={() => setShowPass(v => !v)}>
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
              {passForm.newPass && (
                <>
                  <div className="strength-bar">
                    <div className="strength-fill" style={{ width: `${strength.pct}%`, background: strength.color }} />
                  </div>
                  <div className="strength-label" style={{ color: strength.color }}>{strength.label}</div>
                </>
              )}
            </div>
            <div className="field">
              <label>Confirmar nova senha *</label>
              <div className="pass-wrap">
                <input
                  type={showPass ? "text" : "password"}
                  value={passForm.confirm}
                  onChange={e => setPassForm({ ...passForm, confirm: e.target.value })}
                  placeholder="Repita a nova senha"
                  required
                />
              </div>
              {passForm.confirm && passForm.newPass !== passForm.confirm && (
                <div style={{ fontSize: 11, color: "#C0614F", marginTop: 3 }}>As senhas não coincidem</div>
              )}
              {passForm.confirm && passForm.newPass === passForm.confirm && passForm.confirm.length >= 6 && (
                <div style={{ fontSize: 11, color: "#5A8F70", marginTop: 3 }}>✓ Senhas coincidem</div>
              )}
            </div>
          </div>
          <button type="submit" className="btn-save-pass" disabled={changingPass}>
            {changingPass ? "Alterando..." : "Alterar Senha"}
          </button>
        </form>
      </div>

      {/* Encerrar Sessões */}
      <div className="sec-card">
        <div className="sec-card-head">
          <div className="sec-card-icon icon-red"><LogOut size={16} /></div>
          <div className="sec-card-title">Encerrar Sessões</div>
        </div>
        <div className="signout-content">
          <div className="signout-desc">
            Encerra todas as sessões ativas em todos os dispositivos. Você será redirecionado para a tela de login.
          </div>
          <button className="btn-danger" onClick={handleSignOutAll} disabled={signingOut}>
            <LogOut size={14} />
            {signingOut ? "Encerrando..." : "Encerrar todas as sessões"}
          </button>
        </div>
      </div>

      {/* Histórico de Acessos */}
      <div className="sec-card">
        <div className="sec-card-head">
          <div className="sec-card-icon icon-blue"><Clock size={16} /></div>
          <div className="sec-card-title">Histórico de Acessos</div>
        </div>
        <div className="sec-card-sub">Últimos 10 acessos registrados no sistema.</div>

        {logsLoading ? (
          <div className="empty-logs">Carregando histórico...</div>
        ) : logs.length === 0 ? (
          <div className="empty-logs">Nenhum acesso registrado ainda.</div>
        ) : (
          <div className="logs-list">
            {logs.map((log) => {
              const device = detectDevice(log.user_agent);
              return (
                <div key={log.id} className="log-item">
                  <div className="log-device">
                    {device === "mobile" ? <Smartphone size={15} /> : device === "tablet" ? <Monitor size={15} /> : <Globe size={15} />}
                  </div>
                  <div className="log-info">
                    <div className="log-browser">{formatUA(log.user_agent)}</div>
                    <div className="log-os">{formatOS(log.user_agent)}</div>
                  </div>
                  <span className="log-action">acesso</span>
                  <div className="log-time">
                    <Clock size={11} />
                    {new Date(log.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
