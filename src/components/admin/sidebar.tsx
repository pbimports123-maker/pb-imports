"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  Truck, 
  Tags, 
  BarChart3, 
  Settings, 
  LogOut,
  Sparkles,
  ScrollText
} from "lucide-react";
import { cn } from "@/lib/utils";

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Package, label: "Produtos", href: "/admin/products" },
  { icon: Boxes, label: "Estoque", href: "/admin/stock" },
  { icon: Truck, label: "Fretes", href: "/admin/shipping" },
  { icon: ScrollText, label: "Regras", href: "/admin/rules" },
  { icon: Tags, label: "Categorias", href: "/admin/categories" },
  { icon: BarChart3, label: "Relatórios", href: "/admin/reports" },
  { icon: Settings, label: "Configurações", href: "/admin/settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#1f2937] text-white flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-gray-700">
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black text-white tracking-tighter">PB</span>
            <Sparkles className="w-4 h-4 text-[#fbbf24] fill-[#fbbf24]" />
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">admin panel</span>
        </div>
      </div>

      <nav className="flex-grow p-4 space-y-1">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium",
                isActive 
                  ? "bg-[#1e3a5f] text-white" 
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-400 hover:text-red-400 transition-colors text-sm font-medium">
          <LogOut size={20} />
          Sair do Painel
        </button>
      </div>
    </aside>
  );
}