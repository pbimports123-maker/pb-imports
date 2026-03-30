"use client";

import { Medicine } from "@/types/medicine";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ShoppingCart, Info } from "lucide-react";
import Image from "next/image";
import { MedicineDetailModal } from "./medicine-detail-modal";
import { useState } from "react";

interface MedicineCardProps {
  medicine: Medicine;
}

export function MedicineCard({ medicine }: MedicineCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isOutOfStock = medicine.estoque === 0;

  return (
    <>
      <Card className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow">
        <div className="relative h-48 w-full bg-muted">
          <img
            src={medicine.imagem}
            alt={medicine.nome}
            className={`object-cover w-full h-full ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
          />
          {isOutOfStock && (
            <Badge variant="destructive" className="absolute top-2 right-2">
              Fora de Estoque
            </Badge>
          )}
          <Badge variant="secondary" className="absolute top-2 left-2">
            {medicine.categoria}
          </Badge>
        </div>
        
        <CardHeader className="p-4 pb-0">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg line-clamp-1">{medicine.nome}</h3>
            <div className="flex items-center text-yellow-500 text-sm">
              <Star className="w-4 h-4 fill-current mr-1" />
              {medicine.rating}
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 h-10">
            {medicine.descricao}
          </p>
        </CardHeader>

        <CardContent className="p-4 pt-2 flex-grow">
          <div className="text-2xl font-bold text-primary">
            R$ {medicine.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Princípio ativo: {medicine.principioAtivo}
          </p>
        </CardContent>

        <CardFooter className="p-4 pt-0 gap-2">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={() => setIsModalOpen(true)}
          >
            <Info className="w-4 h-4 mr-2" />
            Detalhes
          </Button>
          <Button 
            className="flex-1" 
            disabled={isOutOfStock}
            onClick={() => setIsModalOpen(true)} // Abre o modal para escolher quantidade
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Comprar
          </Button>
        </CardFooter>
      </Card>

      <MedicineDetailModal 
        medicine={medicine} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}