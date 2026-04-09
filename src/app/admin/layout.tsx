"use client";

import { AdminSidebar } from "@/components/admin/sidebar";
import { Bell, Loader2, ShoppingBag, CheckCircle, X } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type Notification = {
  id: string;
  type: "new_order" | "paid_order";
  title: string;
  message: string;
  time: string;
  read: boolean;
  orderId: string;
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, loading, user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [session, loading, router]);

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Carrega notificações iniciais
  useEffect(() => {
    if (!session) return;
    loadRecentOrders();
  }, [session]);

  // Realtime
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel("admin-notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "orders",
      }, (payload) => {
        const order = payload.new as any;
        addNotification({
          id: `new-${order.id}`,
          type: "new_order",
          title: "Novo pedido!",
          message: `${order.customer_name} • R$ ${Number(order.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          time: "Agora",
          read: false,
          orderId: order.id,
        });
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
      }, (payload) => {
        const order = payload.new as any;
        if (order.payment_status === "paid") {
          addNotification({
            id: `paid-${order.id}`,
            type: "paid_order",
            title: "Pagamento confirmado! 🎉",
            message: `${order.customer_name} • R$ ${Number(order.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            time: "Agora",
            read: false,
            orderId: order.id,
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session]);

  async function loadRecentOrders() {
    const { data } = await supabase
      .from("orders")
      .select("id, customer_name, total, payment_status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (!data) return;

    const notifs: Notification[] = data.map((order) => ({
      id: order.payment_status === "paid" ? `paid-${order.id}` : `new-${order.id}`,
      type: order.payment_status === "paid" ? "paid_order" : "new_order",
      title: order.payment_status === "paid" ? "Pagamento confirmado!" : "Novo pedido!",
      message: `${order.customer_name} • R$ ${Number(order.total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      time: formatTime(order.created_at),
      read: true,
      orderId: order.id,
    }));

    setNotifications(notifs);
  }

  function addNotification(notif: Notification) {
    setNotifications((prev) => {
      if (prev.find(n => n.id === notif.id)) return prev;
      return [notif, ...prev].slice(0, 20);
    });
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "Agora";
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return date.toLocaleDateString("pt-BR");
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  function removeNotif(id: string) {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8EF]">
        <Loader2 className="animate-spin text-[#C28266]" size={48} />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="admin-shell">
      <AdminSidebar />

      <div className="main">
        <header className="topbar">
          <div className="breadcrumb">
            <span className="breadcrumb-root">PB Imports</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">Dashboard</span>
          </div>
          <div className="topbar-right">
            <div className="status-dot">
              <div className="dot"></div>
              Sistema Online
            </div>

            {/* Sininho */}
            <div className="notif-wrap" ref={notifRef}>
              <button className="notif-btn" onClick={() => { setShowNotif(v => !v); if (!showNotif) markAllRead(); }}>
                <Bell size={16} />
                {unreadCount > 0 && (
                  <div className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</div>
                )}
              </button>

              {showNotif && (
                <div className="notif-panel">
                  <div className="notif-header">
                    <span className="notif-title">Notificações</span>
                    {notifications.length > 0 && (
                      <button className="notif-clear" onClick={() => setNotifications([])}>Limpar tudo</button>
                    )}
                  </div>
                  <div className="notif-list">
                    {notifications.length === 0 ? (
                      <div className="notif-empty">Nenhuma notificação</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`notif-item ${!n.read ? "unread" : ""}`}>
                          <div className={`notif-icon ${n.type === "paid_order" ? "paid" : "new"}`}>
                            {n.type === "paid_order" ? <CheckCircle size={14} /> : <ShoppingBag size={14} />}
                          </div>
                          <div className="notif-content">
                            <div className="notif-item-title">{n.title}</div>
                            <div className="notif-item-msg">{n.message}</div>
                            <div className="notif-item-time">{n.time}</div>
                          </div>
                          <button className="notif-remove" onClick={() => removeNotif(n.id)}>
                            <X size={12} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="user-chip">
              ⬡ {user?.email || "bia.pbimports"}
            </div>
          </div>
        </header>

        <div className="content">{children}</div>
      </div>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;700&family=Raleway:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap");

        :root {
          --bg-void: #FAF8EF; --bg-panel: #F2EDE0; --bg-card: #FFFFFF; --bg-card2: #EDE8DA;
          --accent-terra: #C28266; --accent-terra-light: #D9A890; --accent-terra-dark: #9E6650;
          --accent-rose: #E8C4B2; --accent-sage: #A8C4B0; --accent-amber: #D4A96A;
          --accent-red: #C0614F; --accent-blue: #8AAFC2;
          --text-primary: #0D0F13; --text-muted: #6B5C52; --text-dim: #A8978E;
          --border-main: rgba(194,130,102,0.25); --border-dim: rgba(194,130,102,0.12);
          --grid-line: rgba(194,130,102,0.06);
        }
        * { box-sizing: border-box; }
        body { background: var(--bg-void); font-family: "DM Sans","Raleway",sans-serif; color: var(--text-primary); min-height: 100vh; overflow-x: hidden; margin: 0; }
        body::after { content:""; position:fixed; inset:0; background-image:linear-gradient(var(--grid-line) 1px,transparent 1px),linear-gradient(90deg,var(--grid-line) 1px,transparent 1px); background-size:40px 40px; pointer-events:none; z-index:0; }
        .admin-shell { display:flex; min-height:100vh; position:relative; z-index:1; }
        .main { margin-left:240px; flex:1; display:flex; flex-direction:column; min-height:100vh; position:relative; z-index:1; }
        .topbar { height:64px; background:rgba(242,237,224,0.95); border-bottom:1px solid var(--border-main); display:flex; align-items:center; padding:0 32px; gap:16px; backdrop-filter:blur(20px); position:sticky; top:0; z-index:50; }
        .breadcrumb { display:flex; align-items:center; gap:8px; font-family:"DM Sans",sans-serif; font-size:13px; }
        .breadcrumb-root { color:var(--text-muted); }
        .breadcrumb-sep { color:var(--text-dim); }
        .breadcrumb-current { color:var(--accent-terra); font-weight:600; letter-spacing:0.5px; }
        .topbar-right { margin-left:auto; display:flex; align-items:center; gap:20px; }
        .status-dot { display:flex; align-items:center; gap:6px; font-family:"DM Sans",sans-serif; font-size:12px; color:var(--accent-sage); font-weight:500; }
        .dot { width:7px; height:7px; background:var(--accent-sage); border-radius:50%; animation:blink 2s ease-in-out infinite; box-shadow:0 0 6px var(--accent-sage); }
        @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0.35;} }

        .notif-wrap { position:relative; }
        .notif-btn { width:36px; height:36px; background:var(--bg-card); border:1px solid var(--border-main); border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; position:relative; transition:all 0.2s; color:var(--text-muted); }
        .notif-btn:hover { border-color:var(--accent-terra); color:var(--accent-terra); }
        .notif-badge { position:absolute; top:-6px; right:-6px; min-width:18px; height:18px; background:var(--accent-red); border-radius:20px; border:2px solid var(--bg-void); display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; color:#fff; padding:0 3px; animation:blink 1.5s ease-in-out infinite; }

        .notif-panel { position:absolute; top:calc(100% + 10px); right:0; width:320px; background:#fff; border:1px solid var(--border-main); border-radius:14px; box-shadow:0 12px 40px rgba(194,130,102,0.18); z-index:200; overflow:hidden; animation:fadeDown 0.2s ease; }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-8px);} to{opacity:1;transform:translateY(0);} }
        .notif-header { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid var(--border-dim); }
        .notif-title { font-family:"Raleway",sans-serif; font-size:14px; font-weight:700; color:var(--text-primary); }
        .notif-clear { background:none; border:none; font-size:12px; color:var(--text-muted); cursor:pointer; }
        .notif-clear:hover { color:var(--accent-red); }
        .notif-list { max-height:360px; overflow-y:auto; }
        .notif-list::-webkit-scrollbar { width:4px; }
        .notif-list::-webkit-scrollbar-thumb { background:var(--border-main); border-radius:4px; }
        .notif-empty { padding:32px 16px; text-align:center; color:var(--text-dim); font-size:13px; }
        .notif-item { display:flex; align-items:flex-start; gap:12px; padding:12px 16px; border-bottom:1px solid var(--border-dim); transition:background 0.15s; position:relative; }
        .notif-item:last-child { border-bottom:none; }
        .notif-item:hover { background:rgba(194,130,102,0.04); }
        .notif-item.unread { background:rgba(194,130,102,0.06); }
        .notif-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .notif-icon.paid { background:rgba(122,175,144,0.12); color:#5A8F70; }
        .notif-icon.new { background:rgba(194,130,102,0.12); color:var(--accent-terra); }
        .notif-content { flex:1; min-width:0; }
        .notif-item-title { font-size:13px; font-weight:600; color:var(--text-primary); margin-bottom:2px; }
        .notif-item-msg { font-size:12px; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .notif-item-time { font-size:11px; color:var(--text-dim); margin-top:3px; }
        .notif-remove { background:none; border:none; cursor:pointer; color:var(--text-dim); padding:2px; border-radius:4px; flex-shrink:0; opacity:0; transition:opacity 0.2s; }
        .notif-item:hover .notif-remove { opacity:1; }
        .notif-remove:hover { color:var(--accent-red); }

        .user-chip { display:flex; align-items:center; gap:8px; padding:6px 14px; background:var(--bg-card); border:1px solid var(--border-main); border-radius:8px; font-family:"DM Sans",sans-serif; font-size:12px; color:var(--accent-terra); font-weight:500; }
        .content { padding:32px; flex:1; }

        .sidebar { width:240px; min-height:100vh; background:var(--bg-panel); border-right:1px solid var(--border-main); display:flex; flex-direction:column; position:fixed; top:0; left:0; bottom:0; z-index:100; box-shadow:4px 0 24px rgba(194,130,102,0.08); }
        .sidebar-logo { padding:28px 24px 20px; border-bottom:1px solid var(--border-dim); }
        .logo-badge { display:inline-flex; align-items:center; gap:10px; }
        .logo-hex { width:42px; height:42px; background:linear-gradient(135deg,var(--accent-terra),var(--accent-terra-dark)); clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%); display:flex; align-items:center; justify-content:center; animation:pulse-logo 3s ease-in-out infinite; }
        .logo-hex span { font-family:"Raleway",sans-serif; font-size:14px; font-weight:700; color:#fff; }
        @keyframes pulse-logo { 0%,100%{filter:brightness(1) drop-shadow(0 0 4px rgba(194,130,102,0.4));} 50%{filter:brightness(1.15) drop-shadow(0 0 12px rgba(194,130,102,0.6));} }
        .logo-text { display:flex; flex-direction:column; }
        .logo-name { font-family:"Raleway",sans-serif; font-size:14px; font-weight:700; color:var(--accent-terra-dark); letter-spacing:1.5px; text-transform:uppercase; }
        .logo-sub { font-family:"DM Sans",sans-serif; font-size:9px; color:var(--text-dim); letter-spacing:2px; text-transform:uppercase; margin-top:2px; }
        .nav-section { padding:20px 0; flex:1; }
        .nav-label { font-family:"DM Sans",sans-serif; font-size:9px; color:var(--text-dim); letter-spacing:2px; text-transform:uppercase; padding:0 24px; margin-bottom:8px; }
        .nav-item { display:flex; align-items:center; gap:12px; padding:11px 24px; cursor:pointer; position:relative; transition:all 0.2s; font-size:14px; font-weight:500; color:var(--text-muted); letter-spacing:0.3px; }
        .nav-item:hover { color:var(--accent-terra); background:rgba(194,130,102,0.07); }
        .nav-item.active { color:var(--accent-terra-dark); background:rgba(194,130,102,0.12); }
        .nav-item.active::before { content:""; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--accent-terra); border-radius:0 2px 2px 0; }
        .nav-icon { width:18px; height:18px; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; }
        .nav-bottom { padding:20px 24px; border-top:1px solid var(--border-dim); }
        .user-exit { display:flex; align-items:center; gap:10px; cursor:pointer; padding:8px 10px; border:1px solid var(--border-dim); border-radius:8px; background:var(--bg-card); transition:all 0.2s; }
        .user-exit:hover { border-color:var(--accent-red); background:rgba(192,97,79,0.06); }
        .user-avatar { width:32px; height:32px; background:rgba(194,130,102,0.15); border:1px solid var(--accent-terra-light); border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:"Raleway",sans-serif; font-size:12px; font-weight:700; color:var(--accent-terra-dark); }
        .user-info { flex:1; display:flex; flex-direction:column; }
        .user-name { font-family:"DM Sans",sans-serif; font-size:11px; color:var(--text-primary); font-weight:500; }
        .user-role { font-size:9px; color:var(--accent-terra); letter-spacing:1.5px; text-transform:uppercase; font-family:"DM Sans",sans-serif; }
        .exit-icon { font-size:14px; color:var(--text-dim); }
      `}</style>
    </div>
  );
}