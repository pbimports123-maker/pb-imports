"use client";

import { Medicine } from "@/types/medicine";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";

interface MedicineDetailModalProps {
  medicine: Medicine;
  isOpen: boolean;
  onClose: () => void;
}

export function MedicineDetailModal({ medicine, isOpen, onClose }: MedicineDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const isOutOfStock = medicine.estoque === 0;

  const handleAddToCart = () => {
    addToCart(medicine, quantity);
    onClose();
    setQuantity(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge>{medicine.categoria}</Badge>
            {isOutOfStock && <Badge variant="destructive">Sem estoque</Badge>}
          </div>
          <DialogTitle className="text-2xl">{medicine.nome}</DialogTitle>
          <DialogDescription>
            Princípio Ativo: {medicine.principioAtivo}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <img
              src={medicine.imagem}
              alt={medicine.nome}
              className="object-cover w-full h-full"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h4 className="font-semibold text-sm uppercase text-muted-foreground mb-1">Descrição</h4>
              <p className="text-sm">{medicine.descricao}</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase text-muted-foreground mb-1">Modo de Uso</h4>
              <p className="text-sm">{medicine.modoUso}</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm uppercase text-muted-foreground mb-1">Contraindicações</h4>
              <p className="text-sm text-destructive">{medicine.contraindicacoes}</p>
            </div>

            <div className="mt-auto pt-4 border-t">
              <div className="text-3xl font-bold text-primary mb-4">
                R$ {medicine.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>

              {!isOutOfStock && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Label htmlFor="quantity">Quantidade:</Label>
                    <div className="flex items-center border rounded-md">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-10 text-center font-medium">{quantity}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setQuantity(Math.min(medicine.estoque, quantity + 1))}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {medicine.estoque} disponíveis
                    </span>
                  </div>

                  <Button className="w-full" onClick={handleAddToCart}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Adicionar ao Carrinho
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}