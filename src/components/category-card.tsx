"use client";

import { useState } from "react";
import { CategoryWithStats } from "@/types/product";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: CategoryWithStats;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-[#2d2d2d] border border-[#404040] rounded-lg overflow-hidden transition-all hover:bg-[#3a3a3a]">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer min-h-[60px]"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-md flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: category.cor }}
          >
            {category.acronimo}
          </div>
          <div className="flex flex-col">
            <h3 className="text-white font-semibold uppercase text-sm tracking-wide">
              {category.nome}
            </h3>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#9ca3af]">{category.totalMarcas} marcas</span>
              <span className="text-[#6b7280]">·</span>
              <span className="text-[#ef4444] font-semibold">{category.totalEmFalta} em falta</span>
            </div>
          </div>
        </div>
        
        <ChevronDown 
          className={cn("text-[#9ca3af] transition-transform duration-300", isExpanded && "rotate-180")} 
          size={20} 
        />
      </div>

      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="p-4 pt-0 flex flex-col gap-2">
          <div className="h-[1px] bg-[#404040] mb-2" />
          {category.produtos.map((product) => (
            <div 
              key={product.id}
              className="flex items-center justify-between p-3 rounded-md bg-black/30 hover:bg-black/50 transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-[#e5e7eb] font-medium text-sm">{product.nome}</span>
                <span className="text-[#6b7280] text-xs">{product.marca}</span>
              </div>
              <span className={cn(
                "text-xs font-semibold",
                product.emFalta ? "text-[#ef4444]" : "text-[#10b981]"
              )}>
                {product.emFalta ? "Em falta" : "Disponível"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}