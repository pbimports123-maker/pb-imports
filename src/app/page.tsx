"use client";

import { useState, useMemo } from "react";
import { CATEGORIES, PRODUCTS } from "@/lib/mock-data";
import { Navbar } from "@/components/navbar";
import { StatusBadge } from "@/components/status-badge";
import { HelperCard } from "@/components/helper-card";
import { CategoryCard } from "@/components/category-card";
import { Input } from "@/components/ui/input";
import { Search, Bell, Lightbulb, Truck, ScrollText, X } from "lucide-react";
import { CategoryWithStats } from "@/types/product";
import { MadeWithDyad } from "@/components/made-with-dyad";

export default function Home() {
  const [search, setSearch] = useState("");
  const [showAlert, setShowAlert] = useState(true);

  // Lógica de Agrupamento e Estatísticas
  const categoriesWithStats = useMemo(() => {
    return CATEGORIES.map(cat => {
      const catProducts = PRODUCTS.filter(p => p.categoriaId === cat.id);
      const filteredProducts = catProducts.filter(p => 
        p.nome.toLowerCase().includes(search.toLowerCase()) || 
        p.marca.toLowerCase().includes(search.toLowerCase())
      );
      
      const marcas = new Set(catProducts.map(p => p.marca));
      const emFalta = catProducts.filter(p => p.emFalta).length;

      return {
        ...cat,
        totalMarcas: marcas.size,
        totalEmFalta: emFalta,
        produtos: filteredProducts
      } as CategoryWithStats;
    }).filter(cat => cat.produtos.length > 0 || search === "");
  }, [search]);

  const totalAvailable = PRODUCTS.filter(p => !p.emFalta).length;
  const totalOutOfStock = PRODUCTS.filter(p => p.emFalta).length;

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-10 max-w-[1200px] flex-grow">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-6">Lista de Disponibilidade</h1>
          
          <div className="flex flex-wrap gap-3 mb-8">
            <StatusBadge type="available" count={totalAvailable} />
            <StatusBadge type="outOfStock" count={totalOutOfStock} />
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
            <Input 
              placeholder="Buscar produto ou marca..." 
              className="h-12 pl-12 bg-[#2d2d2d] border-[#404040] text-white placeholder:text-[#6b7280] focus-visible:ring-[#10b981]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Alert Box */}
          {showAlert && (
            <div className="bg-[#2d2d2d] border-l-4 border-[#fbbf24] p-4 rounded-r-md flex gap-4 relative mb-6">
              <Bell className="text-[#fbbf24] shrink-0" size={20} />
              <div className="flex-grow">
                <h4 className="font-bold text-sm">52 atualizações desde sua última visita</h4>
                <p className="text-xs text-[#9ca3af]">Toque para ver o que mudou</p>
              </div>
              <button onClick={() => setShowAlert(false)} className="text-[#6b7280] hover:text-white">
                <X size={18} />
              </button>
            </div>
          )}

          {/* Helper Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <HelperCard 
              title="Tabela de Fretes"
              subtitle="Valores de entrega"
              icon={Truck}
              color="#10b981"
              bgColor="#1a5f5f"
              borderColor="#0d7a7a"
              subtitleColor="#a8d9d9"
            />
            <HelperCard 
              title="Regras de Envio"
              subtitle="Como funciona"
              icon={ScrollText}
              color="#d97706"
              bgColor="#4d3319"
              borderColor="#6b4423"
              subtitleColor="#d9b09d"
            />
          </div>

          {/* Info Box */}
          <div className="bg-[#2d2d2d] border-l-4 border-[#fbbf24] p-4 rounded-r-md flex gap-4">
            <Lightbulb className="text-[#fbbf24] shrink-0" size={20} />
            <p className="text-sm text-[#e5e7eb]">
              Esta lista mostra <span className="font-bold text-white">todos os produtos</span> da PB Imports. 
              Produtos <span className="font-bold text-[#ef4444]">em falta</span> estão destacados em vermelho e serão repostos em breve.
            </p>
          </div>
        </div>

        {/* Categories List */}
        <div className="flex flex-col gap-3">
          {categoriesWithStats.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
          
          {categoriesWithStats.length === 0 && (
            <div className="text-center py-20 bg-[#2d2d2d] rounded-lg border border-dashed border-[#404040]">
              <Search className="w-12 h-12 mx-auto text-[#6b7280] opacity-20 mb-4" />
              <h3 className="text-xl font-medium">Nenhum produto encontrado</h3>
              <p className="text-[#9ca3af] mt-2">Tente ajustar sua busca.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-[#404040] py-8 mt-10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-[#6b7280] uppercase tracking-widest mb-4">
            PB IMPORTS · {PRODUCTS.length} produtos
          </p>
          <MadeWithDyad />
        </div>
      </footer>
    </div>
  );
}