"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  DollarSign,
  Loader2,
  Download
} from "lucide-react";
import { StatsCard } from "@/components/admin/stats-card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const COLORS = ['#1e3a5f', '#fbbf24', '#10b981', '#ef4444', '#8b5cf6', '#f97316'];

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    products: any[];
    categories: any[];
    movements: any[];
  }>({ products: [], categories: [], movements: [] });

  useEffect(() => {
    fetchReportData();
  }, []);

  async function fetchReportData() {
    try {
      setLoading(true);
      
      const [prodRes, catRes, movRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('stock_movements').select('*').order('created_at', { ascending: true })
      ]);

      if (prodRes.error) throw prodRes.error;
      if (catRes.error) throw catRes.error;
      if (movRes.error) throw movRes.error;

      setData({
        products: prodRes.data || [],
        categories: catRes.data || [],
        movements: movRes.data || []
      });
    } catch (error: any) {
      toast.error("Erro ao carregar relatórios: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  // Cálculos para os KPIs
  const stats = useMemo(() => {
    const totalValue = data.products.reduce((acc, p) => acc + (Number(p.price) * p.stock), 0);
    const totalItems = data.products.reduce((acc, p) => acc + p.stock, 0);
    const lowStockCount = data.products.filter(p => p.stock > 0 && p.stock <= 5).length;
    const outOfStockCount = data.products.filter(p => p.stock === 0).length;

    return { totalValue, totalItems, lowStockCount, outOfStockCount };
  }, [data.products]);

  // Dados para o gráfico de Estoque por Categoria
  const stockByCategoryData = useMemo(() => {
    return data.categories.map(cat => {
      const catProducts = data.products.filter(p => p.category_id === cat.id);
      const totalStock = catProducts.reduce((acc, p) => acc + p.stock, 0);
      return {
        name: cat.name,
        quantidade: totalStock
      };
    }).filter(item => item.quantidade > 0);
  }, [data.categories, data.products]);

  // Dados para o gráfico de Valor por Categoria
  const valueByCategoryData = useMemo(() => {
    return data.categories.map(cat => {
      const catProducts = data.products.filter(p => p.category_id === cat.id);
      const totalValue = catProducts.reduce((acc, p) => acc + (Number(p.price) * p.stock), 0);
      return {
        name: cat.name,
        value: totalValue
      };
    }).filter(item => item.value > 0);
  }, [data.categories, data.products]);

  // Dados para o gráfico de Movimentações (últimos 7 dias)
  const movementsTrendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayMovements = data.movements.filter(m => m.created_at.startsWith(date));
      const entries = dayMovements.filter(m => m.type === 'IN').reduce((acc, m) => acc + m.quantity, 0);
      const exits = dayMovements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.quantity, 0);
      
      return {
        date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        entradas: entries,
        saidas: exits
      };
    });
  }, [data.movements]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader2 className="animate-spin text-[#1e3a5f]" size={48} />
        <p className="text-gray-500 font-medium">Gerando relatórios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios e Insights</h1>
          <p className="text-sm text-gray-500">Análise detalhada do seu inventário e operações.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => window.print()}>
          <Download size={18} />
          Exportar PDF
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Valor Total em Estoque" 
          value={`R$ ${stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={DollarSign} 
          colorClass="bg-[#1e3a5f]"
        />
        <StatsCard 
          title="Total de Itens" 
          value={stats.totalItems} 
          icon={Package} 
          colorClass="bg-green-600"
        />
        <StatsCard 
          title="Itens com Estoque Baixo" 
          value={stats.lowStockCount} 
          icon={AlertTriangle} 
          colorClass="bg-amber-500"
        />
        <StatsCard 
          title="Produtos Esgotados" 
          value={stats.outOfStockCount} 
          icon={TrendingUp} 
          colorClass="bg-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Tendência de Movimentação */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Fluxo de Estoque (Últimos 7 dias)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={movementsTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Estoque por Categoria */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Distribuição de Itens por Categoria</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockByCategoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" axisLine={false} tickLine={false} hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#4b5563'}} width={100} />
                <Tooltip cursor={{fill: '#f9fafb'}} />
                <Bar dataKey="quantidade" fill="#1e3a5f" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Valor por Categoria (Pizza) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Valor Financeiro por Categoria</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={valueByCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {valueByCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lista de Produtos Críticos */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Produtos com Estoque Crítico</h3>
          <div className="space-y-4">
            {data.products
              .filter(p => p.stock <= 5)
              .sort((a, b) => a.stock - b.stock)
              .slice(0, 6)
              .map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">{product.name}</span>
                    <span className="text-xs text-gray-500">{product.brand}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-black ${product.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                      {product.stock} un
                    </span>
                    <div className={`w-2 h-2 rounded-full ${product.stock === 0 ? 'bg-red-600' : 'bg-amber-600'} animate-pulse`} />
                  </div>
                </div>
              ))}
            {data.products.filter(p => p.stock <= 5).length === 0 && (
              <div className="text-center py-10 text-gray-500 text-sm">
                Todos os produtos estão com estoque saudável! 🎉
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}