"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Boxes, 
  Search, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  History,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminStockPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [movementType, setMovementType] = useState<"IN" | "OUT">("IN");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, brand, stock, is_out_of_stock')
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar estoque: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (product: any, type: "IN" | "OUT") => {
    setSelectedProduct(product);
    setMovementType(type);
    setQuantity(1);
    setReason(type === "IN" ? "Reposição de estoque" : "Venda / Saída");
    setIsModalOpen(true);
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      setSubmitting(true);
      const prevStock = selectedProduct.stock;
      const change = movementType === "IN" ? quantity : -quantity;
      const newStock = prevStock + change;

      if (newStock < 0) {
        toast.error("O estoque não pode ficar negativo!");
        return;
      }

      // 1. Atualizar o produto
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          stock: newStock,
          is_out_of_stock: newStock <= 0
        })
        .eq('id', selectedProduct.id);

      if (updateError) throw updateError;

      // 2. Registrar a movimentação
      const { error: logError } = await supabase
        .from('stock_movements')
        .insert([{
          product_id: selectedProduct.id,
          type: movementType,
          quantity: quantity,
          prev_stock: prevStock,
          current_stock: newStock,
          reason: reason
        }]);

      if (logError) throw logError;

      toast.success(`Estoque de ${selectedProduct.name} atualizado!`);
      setIsModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      toast.error("Erro ao processar: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Estoque</h1>
          <p className="text-sm text-gray-500">Controle as entradas e saídas de produtos.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <History size={18} />
          Ver Histórico Completo
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Buscar produto..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Produto</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead className="text-center">Estoque Atual</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações Rápidas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                  <Loader2 className="animate-spin mx-auto mb-2" />
                  Carregando estoque...
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                  Nenhum produto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-900">{product.name}</TableCell>
                  <TableCell className="text-gray-500">{product.brand}</TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "text-lg font-bold",
                      product.stock <= 5 ? "text-red-600" : "text-gray-900"
                    )}>
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    {product.is_out_of_stock ? (
                      <Badge variant="destructive">Em falta</Badge>
                    ) : product.stock <= 5 ? (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">Estoque Baixo</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">OK</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-green-600 border-green-200 hover:bg-green-50 gap-1"
                        onClick={() => handleOpenModal(product, "IN")}
                      >
                        <ArrowUpCircle size={16} />
                        Entrada
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                        onClick={() => handleOpenModal(product, "OUT")}
                        disabled={product.stock <= 0}
                      >
                        <ArrowDownCircle size={16} />
                        Saída
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Movimentação */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {movementType === "IN" ? (
                <ArrowUpCircle className="text-green-600" />
              ) : (
                <ArrowDownCircle className="text-red-600" />
              )}
              {movementType === "IN" ? "Entrada de Estoque" : "Saída de Estoque"}
            </DialogTitle>
            <DialogDescription>
              Produto: <span className="font-bold text-gray-900">{selectedProduct?.name}</span>
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleMovement} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input 
                id="quantity" 
                type="number" 
                min="1" 
                value={quantity} 
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo / Observação</Label>
              <Textarea 
                id="reason" 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Reposição mensal, Venda balcão, Produto danificado..."
                className="resize-none"
                required
              />
            </div>

            {movementType === "OUT" && selectedProduct?.stock < quantity && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-xs">
                <AlertCircle size={16} />
                Atenção: Quantidade superior ao estoque atual!
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className={cn(
                  movementType === "IN" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700",
                  "min-w-[120px]"
                )}
                disabled={submitting || (movementType === "OUT" && selectedProduct?.stock < quantity)}
              >
                {submitting ? "Processando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function for class names
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}