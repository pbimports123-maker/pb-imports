"use client";

import { 
  Package, 
  Boxes, 
  AlertTriangle, 
  TrendingUp, 
  History,
  ArrowUpRight
} from "lucide-react";
import { StatsCard } from "@/components/admin/stats-card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";

const MOCK_CHART_DATA = [
  { name: "Seg", entradas: 40, saidas: 24 },
  { name: "Ter", entradas: 30, saidas: 13 },
  { name: "Qua", entradas: 20, saidas: 98 },
  { name: "Qui", entradas: 27, saidas: 39 },
  { name: "Sex", entradas: 18, saidas: 48 },
  { name: "Sab", entradas: 23, saidas: 38 },
  { name: "Dom", entradas: 34, saidas: 43 },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
        <p className="text-gray-500 text-sm">Bem-vindo ao painel de controle da PB Imports.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total de Produtos" 
          value="722" 
          icon={Package} 
          colorClass="bg-[#1e3a5f]"
          trend={{ value: "12 novos", isPositive: true }}
        />
        <StatsCard 
          title="Em Estoque" 
          value="533" 
          icon={Boxes} 
          colorClass="bg-green-600"
        />
        <StatsCard 
          title="Produtos em Falta" 
          value="189" 
          icon={AlertTriangle} 
          colorClass="bg-red-600"
          trend={{ value: "5% aumento", isPositive: false }}
        />
        <StatsCard 
          title="Valor em Inventário" 
          value="R$ 142.500" 
          icon={TrendingUp} 
          colorClass="bg-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Movimentações */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Movimentações de Estoque</h3>
            <select className="text-xs border-gray-200 rounded-md bg-gray-50 p-1">
              <option>Últimos 7 dias</option>
              <option>Últimos 30 dias</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="entradas" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Atividades Recentes */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Atividades Recentes</h3>
            <History size={18} className="text-gray-400" />
          </div>
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <ArrowUpRight size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Entrada de iPhone 15 Pro</p>
                  <p className="text-xs text-gray-500">Há 2 horas por Admin PB</p>
                </div>
                <div className="ml-auto text-xs font-bold text-green-600">+10</div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm font-medium text-[#1e3a5f] hover:bg-blue-50 rounded-lg transition-colors">
            Ver todo o histórico
          </button>
        </div>
      </div>
    </div>
  );
}