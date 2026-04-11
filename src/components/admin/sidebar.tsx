"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type MenuItem = { label: string; href: string; icon: string };

const MENU_ITEMS: MenuItem[] = [
  { label: "Dashboard", href: "/admin", icon: "◈" },
  { label: "Produtos", href: "/admin/products", icon: "◉" },
  { label: "Cupons", href: "/admin/coupons", icon: "⌁" },
  { label: "Fretes", href: "/admin/shipping", icon: "⟁" },
  { label: "Regras", href: "/admin/rules", icon: "⊛" },
  { label: "Curiosidades", href: "/admin/curiosidades", icon: "✦" },
  { label: "Categorias", href: "/admin/categories", icon: "⊞" },
  { label: "Pedidos", href: "/admin/orders", icon: "🛍" },
  { label: "Relatórios", href: "/admin/reports", icon: "⌬" },
  { label: "Configurações", href: "/admin/settings", icon: "⚙" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Sessão encerrada com sucesso!");
    } catch (error) {
      toast.error("Erro ao sair do sistema.");
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-badge">
          <div className="logo-hex">
            <span>PB</span>
          </div>
          <div className="logo-text">
            <span className="logo-name">PB+</span>
            <span className="logo-sub">Admin Panel</span>
          </div>
        </div>
      </div>

      <nav className="nav-section">
        <div className="nav-label">// Sistema</div>
        {MENU_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn("nav-item", active && "active")}>
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="nav-bottom">
        <button className="user-exit" onClick={handleLogout}>
          <div className="user-avatar">{user?.email?.[0]?.toUpperCase() || "A"}</div>
          <div className="user-info">
            <span className="user-name">{user?.email || "admin"}</span>
            <span className="user-role">Super Admin</span>
          </div>
          <span className="exit-icon">
            <LogOut size={16} />
          </span>
        </button>
      </div>
    </aside>
  );
}
