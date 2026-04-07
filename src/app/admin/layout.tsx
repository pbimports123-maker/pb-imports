"use client";

import { AdminSidebar } from "@/components/admin/sidebar";
import { Bell, Loader2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [session, loading, router]);

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
            <button className="notif-btn">
              <Bell size={16} />
              <div className="notif-badge"></div>
            </button>
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
          /* Fundos */
          --bg-void: #FAF8EF;
          --bg-panel: #F2EDE0;
          --bg-card: #FFFFFF;
          --bg-card2: #EDE8DA;

          /* Cor predominante — Terracota */
          --accent-terra: #C28266;
          --accent-terra-light: #D9A890;
          --accent-terra-dark: #9E6650;

          /* Cores de suporte pastel */
          --accent-rose: #E8C4B2;       /* rosé — destaques suaves */
          --accent-sage: #A8C4B0;       /* sage — indicadores positivos/estoque ok */
          --accent-amber: #D4A96A;      /* âmbar — alertas e avisos */
          --accent-red: #C0614F;        /* vermelho — erros e itens em falta */
          --accent-blue: #8AAFC2;       /* azul acinzentado — informativo */

          /* Texto */
          --text-primary: #0D0F13;
          --text-muted: #6B5C52;
          --text-dim: #A8978E;

          /* Bordas */
          --border-main: rgba(194, 130, 102, 0.25);
          --border-dim: rgba(194, 130, 102, 0.12);
          --grid-line: rgba(194, 130, 102, 0.06);
        }

        * {
          box-sizing: border-box;
        }

        body {
          background: var(--bg-void);
          font-family: "DM Sans", "Raleway", sans-serif;
          color: var(--text-primary);
          min-height: 100vh;
          overflow-x: hidden;
          margin: 0;
        }

        /* Textura sutil de fundo */
        body::after {
          content: "";
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(var(--grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }

        .admin-shell {
          display: flex;
          min-height: 100vh;
          position: relative;
          z-index: 1;
        }

        .main {
          margin-left: 240px;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          position: relative;
          z-index: 1;
        }

        .topbar {
          height: 64px;
          background: rgba(242, 237, 224, 0.95);
          border-bottom: 1px solid var(--border-main);
          display: flex;
          align-items: center;
          padding: 0 32px;
          gap: 16px;
          backdrop-filter: blur(20px);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: "DM Sans", sans-serif;
          font-size: 13px;
        }

        .breadcrumb-root {
          color: var(--text-muted);
        }

        .breadcrumb-sep {
          color: var(--text-dim);
        }

        .breadcrumb-current {
          color: var(--accent-terra);
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .topbar-right {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .status-dot {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: "DM Sans", sans-serif;
          font-size: 12px;
          color: var(--accent-sage);
          font-weight: 500;
        }

        .dot {
          width: 7px;
          height: 7px;
          background: var(--accent-sage);
          border-radius: 50%;
          animation: blink 2s ease-in-out infinite;
          box-shadow: 0 0 6px var(--accent-sage);
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }

        .notif-btn {
          width: 36px;
          height: 36px;
          background: var(--bg-card);
          border: 1px solid var(--border-main);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          position: relative;
          transition: all 0.2s;
          color: var(--text-muted);
        }

        .notif-btn:hover {
          border-color: var(--accent-terra);
          color: var(--accent-terra);
        }

        .notif-badge {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 7px;
          height: 7px;
          background: var(--accent-red);
          border-radius: 50%;
          animation: blink 1.5s ease-in-out infinite;
        }

        .user-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: var(--bg-card);
          border: 1px solid var(--border-main);
          border-radius: 8px;
          font-family: "DM Sans", sans-serif;
          font-size: 12px;
          color: var(--accent-terra);
          font-weight: 500;
        }

        .content {
          padding: 32px;
          flex: 1;
        }

        /* ── Sidebar ── */
        .sidebar {
          width: 240px;
          min-height: 100vh;
          background: var(--bg-panel);
          border-right: 1px solid var(--border-main);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 100;
          box-shadow: 4px 0 24px rgba(194, 130, 102, 0.08);
        }

        .sidebar-logo {
          padding: 28px 24px 20px;
          border-bottom: 1px solid var(--border-dim);
        }

        .logo-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .logo-hex {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, var(--accent-terra), var(--accent-terra-dark));
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse-logo 3s ease-in-out infinite;
        }

        .logo-hex span {
          font-family: "Raleway", sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
        }

        @keyframes pulse-logo {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 4px rgba(194,130,102,0.4)); }
          50% { filter: brightness(1.15) drop-shadow(0 0 12px rgba(194,130,102,0.6)); }
        }

        .logo-text {
          display: flex;
          flex-direction: column;
        }

        .logo-name {
          font-family: "Raleway", sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: var(--accent-terra-dark);
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }

        .logo-sub {
          font-family: "DM Sans", sans-serif;
          font-size: 9px;
          color: var(--text-dim);
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .nav-section {
          padding: 20px 0;
          flex: 1;
        }

        .nav-label {
          font-family: "DM Sans", sans-serif;
          font-size: 9px;
          color: var(--text-dim);
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 0 24px;
          margin-bottom: 8px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 24px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-muted);
          letter-spacing: 0.3px;
        }

        .nav-item:hover {
          color: var(--accent-terra);
          background: rgba(194, 130, 102, 0.07);
        }

        .nav-item.active {
          color: var(--accent-terra-dark);
          background: rgba(194, 130, 102, 0.12);
        }

        .nav-item.active::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--accent-terra);
          border-radius: 0 2px 2px 0;
        }

        .nav-icon {
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }

        .nav-bottom {
          padding: 20px 24px;
          border-top: 1px solid var(--border-dim);
        }

        .user-exit {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 8px 10px;
          border: 1px solid var(--border-dim);
          border-radius: 8px;
          background: var(--bg-card);
          transition: all 0.2s;
        }

        .user-exit:hover {
          border-color: var(--accent-red);
          background: rgba(192, 97, 79, 0.06);
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          background: rgba(194, 130, 102, 0.15);
          border: 1px solid var(--accent-terra-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: "Raleway", sans-serif;
          font-size: 12px;
          font-weight: 700;
          color: var(--accent-terra-dark);
        }

        .user-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-family: "DM Sans", sans-serif;
          font-size: 11px;
          color: var(--text-primary);
          font-weight: 500;
        }

        .user-role {
          font-size: 9px;
          color: var(--accent-terra);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          font-family: "DM Sans", sans-serif;
        }

        .exit-icon {
          font-size: 14px;
          color: var(--text-dim);
        }
      `}</style>
    </div>
  );
}