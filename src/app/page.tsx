"use client";

import { useState, useMemo } from "react";
import { MEDICINES } from "@/lib/mock-data";
import { Navbar } from "@/components/navbar";
import { MedicineCard } from "@/components/medicine-card";
import { MedicineFilters } from "@/components/medicine-filters";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, Filter, LayoutGrid, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MadeWithDyad } from "@/components/made-with-dyad";

export default function Home() {
  // Estados de Filtro
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState("name-asc");

  // Lógica de Filtragem e Ordenação
  const filteredMedicines = useMemo(() => {
    return MEDICINES
      .filter(m => {
        const matchesSearch = m.nome.toLowerCase().includes(search.toLowerCase()) || 
                             m.principioAtivo.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(m.categoria);
        const matchesPrice = m.preco <= priceRange[1];
        const matchesStock = !onlyInStock || m.estoque > 0;
        
        return matchesSearch && matchesCategory && matchesPrice && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === "name-asc") return a.nome.localeCompare(b.nome);
        if (sortBy === "price-asc") return a.preco - b.preco;
        if (sortBy === "price-desc") return b.preco - a.preco;
        return 0;
      });
  }, [search, selectedCategories, priceRange, onlyInStock, sortBy]);

  const resetFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setPriceRange([0, 200]);
    setOnlyInStock(false);
    setSortBy("name-asc");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar de Filtros (Desktop) */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <MedicineFilters 
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                onlyInStock={onlyInStock}
                setOnlyInStock={setOnlyInStock}
                onReset={resetFilters}
              />
            </div>
          </aside>

          {/* Conteúdo Principal */}
          <div className="flex-grow">
            {/* Barra de Ferramentas Superior */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <LayoutGrid className="w-6 h-6 text-primary" />
                  Medicamentos
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({filteredMedicines.length} encontrados)
                  </span>
                </h1>

                <div className="flex items-center gap-2">
                  {/* Filtros Mobile */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="md:hidden">
                        <Filter className="w-4 h-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                      <div className="py-4">
                        <MedicineFilters 
                          selectedCategories={selectedCategories}
                          setSelectedCategories={setSelectedCategories}
                          priceRange={priceRange}
                          setPriceRange={setPriceRange}
                          onlyInStock={onlyInStock}
                          setOnlyInStock={setOnlyInStock}
                          onReset={resetFilters}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                      <SelectItem value="price-asc">Menor Preço</SelectItem>
                      <SelectItem value="price-desc">Maior Preço</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="relative md:hidden">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome ou princípio ativo..." 
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome ou princípio ativo..." 
                  className="pl-10 h-12 text-lg"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Grid de Produtos */}
            {filteredMedicines.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMedicines.map((medicine) => (
                  <MedicineCard key={medicine.id} medicine={medicine} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/30 rounded-xl border-2 border-dashed">
                <Search className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                <h3 className="text-xl font-medium">Nenhum medicamento encontrado</h3>
                <p className="text-muted-foreground mt-2">Tente ajustar seus filtros ou busca.</p>
                <Button variant="link" onClick={resetFilters} className="mt-4">
                  Limpar todos os filtros
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-bold text-primary">
            <Pill className="w-5 h-5" />
            Respect Pharma
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Respect Pharma. Todos os direitos reservados.
          </p>
          <MadeWithDyad />
        </div>
      </footer>
    </div>
  );
}