
"use client";

import { AdminSidebar } from "@/components/admin/sidebar";
import { Bell, User, Loader2 } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center bg-[#020408]">
        <Loader2 className="animate-spin text-[#00e5ff]" size={48} />
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
        @import url("https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Share+Tech+Mono&family=Rajdhani:wght@300;400;500;600;700&display=swap");

        :root {
          --bg-void: #020408;
          --bg-panel: #060d16;
          --bg-card: #0a1628;
          --bg-card2: #081220;
          --accent-cyan: #00e5ff;
          --accent-blue: #1565ff;
          --accent-gold: #ffd600;
          --accent-green: #00ff9d;
          --accent-red: #ff2d5f;
          --text-primary: #e8f4ff;
          --text-muted: #4a7090;
          --text-dim: #2a4060;
          --border-glow: rgba(0, 229, 255, 0.15);
          --border-dim: rgba(0, 229, 255, 0.06);
          --grid-line: rgba(0, 229, 255, 0.04);
        }

        * {
          box-sizing: border-box;
        }

        body {
          background: var(--bg-void);
          font-family: "Rajdhani", sans-serif;
          color: var(--text-primary);
          min-height: 100vh;
          overflow-x: hidden;
          margin: 0;
        }

        /* Scanline overlay */
        body::before {
          content: "";
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 229, 255, 0.012) 2px,
              rgba(0, 229, 255, 0.012) 4px
            );
          pointer-events: none;
          z-index: 9999;
        }

        /* Grid */
        body::after {
          content: "";
          position: fixed;
          inset: 0;
          background-image: linear-gradient(var(--grid-line) 1px, transparent 1px),
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
          background: rgba(6, 13, 22, 0.95);
          border-bottom: 1px solid var(--border-glow);
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
          font-family: "Share Tech Mono", monospace;
          font-size: 11px;
        }

        .breadcrumb-root {
          color: var(--text-muted);
        }

        .breadcrumb-sep {
          color: var(--text-dim);
        }

        .breadcrumb-current {
          color: var(--accent-cyan);
          text-transform: uppercase;
          letter-spacing: 2px;
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
          font-family: "Share Tech Mono", monospace;
          font-size: 9px;
          color: var(--accent-green);
          letter-spacing: 2px;
        }

        .dot {
          width: 6px;
          height: 6px;
          background: var(--accent-green);
          border-radius: 50%;
          animation: blink 2s ease-in-out infinite;
          box-shadow: 0 0 8px var(--accent-green);
        }

        @keyframes blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }

        .notif-btn {
          width: 36px;
          height: 36px;
          background: var(--bg-card2);
          border: 1px solid var(--border-dim);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          position: relative;
          transition: all 0.2s;
          color: var(--text-primary);
        }

        .notif-btn:hover {
          border-color: var(--accent-cyan);
        }

        .notif-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 8px;
          height: 8px;
          background: var(--accent-red);
          border-radius: 50%;
          box-shadow: 0 0 8px var(--accent-red);
          animation: blink 1.5s ease-in-out infinite;
        }

        .user-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: var(--bg-card2);
          border: 1px solid var(--border-dim);
          font-family: "Share Tech Mono", monospace;
          font-size: 10px;
          color: var(--accent-cyan);
        }

        .content {
          padding: 32px;
          flex: 1;
        }

        /* Sidebar */
        .sidebar {
          width: 240px;
          min-height: 100vh;
          background: var(--bg-panel);
          border-right: 1px solid var(--border-glow);
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 100;
          box-shadow: 4px 0 40px rgba(0, 229, 255, 0.05);
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
          background: linear-gradient(135deg, var(--accent-cyan), var(--accent-blue));
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse-logo 3s ease-in-out infinite;
        }
        .logo-hex span {
          font-family: "Orbitron", monospace;
          font-size: 14px;
          font-weight: 900;
          color: var(--bg-void);
        }
        @keyframes pulse-logo {
          0%,
          100% {
            filter: brightness(1) drop-shadow(0 0 6px var(--accent-cyan));
          }
          50% {
            filter: brightness(1.3) drop-shadow(0 0 16px var(--accent-cyan));
          }
        }
        .logo-text {
          display: flex;
          flex-direction: column;
        }
        .logo-name {
          font-family: "Orbitron", monospace;
          font-size: 13px;
          font-weight: 700;
          color: var(--accent-cyan);
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .logo-sub {
          font-family: "Share Tech Mono", monospace;
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 3px;
          text-transform: uppercase;
          margin-top: 2px;
        }
        .nav-section {
          padding: 20px 0;
          flex: 1;
        }
        .nav-label {
          font-family: "Share Tech Mono", monospace;
          font-size: 9px;
          color: var(--text-dim);
          letter-spacing: 3px;
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
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .nav-item:hover {
          color: var(--accent-cyan);
          background: rgba(0, 229, 255, 0.04);
        }
        .nav-item.active {
          color: var(--accent-cyan);
          background: rgba(0, 229, 255, 0.08);
        }
        .nav-item.active::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: var(--accent-cyan);
          box-shadow: 0 0 12px var(--accent-cyan);
        }
        .nav-item.active::after {
          content: "";
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 1px;
          background: rgba(0, 229, 255, 0.3);
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
          padding: 8px;
          border: 1px solid var(--border-dim);
          background: var(--bg-card2);
          transition: all 0.2s;
        }
        .user-exit:hover {
          border-color: var(--accent-red);
          background: rgba(255, 45, 95, 0.08);
        }
        .user-avatar {
          width: 32px;
          height: 32px;
          background: rgba(0, 229, 255, 0.15);
          border: 1px solid var(--accent-cyan);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: "Orbitron", monospace;
          font-size: 12px;
          font-weight: 700;
          color: var(--accent-cyan);
        }
        .user-info {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .user-name {
          font-family: "Share Tech Mono", monospace;
          font-size: 10px;
          color: var(--text-primary);
        }
        .user-role {
          font-size: 9px;
          color: var(--accent-red);
          letter-spacing: 2px;
          text-transform: uppercase;
          font-family: "Share Tech Mono", monospace;
        }
        .exit-icon {
          font-size: 14px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
