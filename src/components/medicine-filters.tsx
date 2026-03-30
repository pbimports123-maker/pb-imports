"use client";

import { CATEGORIES } from "@/lib/mock-data";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface FiltersProps {
  selectedCategories: string[];
  setSelectedCategories: (cats: string[]) => void;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  onlyInStock: boolean;
  setOnlyInStock: (val: boolean) => void;
  onReset: () => void;
}

export function MedicineFilters({
  selectedCategories,
  setSelectedCategories,
  priceRange,
  setPriceRange,
  onlyInStock,
  setOnlyInStock,
  onReset
}: FiltersProps) {
  
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="font-bold mb-4">Categorias</h3>
        <div className="space-y-3">
          {CATEGORIES.map((cat) => (
            <div key={cat} className="flex items-center space-x-2">
              <Checkbox 
                id={`cat-${cat}`} 
                checked={selectedCategories.includes(cat)}
                onCheckedChange={() => toggleCategory(cat)}
              />
              <Label htmlFor={`cat-${cat}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {cat}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Preço Máximo</h3>
          <span className="text-sm font-bold text-primary">R$ {priceRange[1]}</span>
        </div>
        <Slider
          defaultValue={[100]}
          max={200}
          step={5}
          value={[priceRange[1]]}
          onValueChange={(val) => setPriceRange([0, val[0]])}
        />
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>R$ 0</span>
          <span>R$ 200+</span>
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <Label htmlFor="stock-filter" className="font-bold">Apenas em estoque</Label>
        <Switch 
          id="stock-filter" 
          checked={onlyInStock}
          onCheckedChange={setOnlyInStock}
        />
      </div>

      <Button variant="outline" className="w-full mt-4" onClick={onReset}>
        Limpar Filtros
      </Button>
    </div>
  );
}