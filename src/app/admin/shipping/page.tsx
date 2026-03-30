"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Truck, 
  Edit2, 
  Trash2, 
  Save,
  X,
  MapPin
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const SERVICE_TYPES = ["PAC", "SEDEX", "Transportadoras", "Fretes VIP"];

export default function AdminShippingPage() {
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    region: "",
    price: "",
    service_type: "PAC",
    is_active: true
  });

  useEffect(() => {
    fetchRates();
  }, []);

  async function fetchRates() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shipping_rates')
        .select('*')
        .order('service_type', { ascending: true })
        .order('region', { ascending: true });

      if (error) throw error;
      setRates(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar fretes: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (rate: any = null) => {
    if (rate) {
      setEditingRate(rate);
      setFormData({
        region: rate.region,
        price: rate.price.toString(),
        service_type: rate.service_type,
        is_active: rate.is_active
      });
    } else {
      setEditingRate(null);
      setFormData({
        region: "",
        price: "",
        service_type: "PAC",
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price)
      };

      if (editingRate) {
        const { error } = await supabase
          .from('shipping_rates')
          .update(payload)
          .eq('id', editingRate.id);
        if (error) throw error;
        toast.success("Frete atualizado!");
      } else {
        const { error } = await supabase
          .from('shipping_rates')
          .insert([payload]);
        if (error) throw error;
        toast.success("Frete criado!");
      }
      setIsModalOpen(false);
      fetchRates();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este frete?")) return;
    try {
      const { error } = await supabase.from('shipping_rates').delete().eq('id', id);
      if (error) throw error;
      toast.success("Frete excluído!");
      fetchRates();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tabela de Fretes</h1>
          <p className="text-sm text-gray-500">Gerencie os valores de envio por região e serviço.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-[#1e3a5f] hover:bg-[#162a45] gap-2">
          <Plus size={18} />
          Novo Frete
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Serviço</TableHead>
              <TableHead>Região / UF</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-gray-500">Carregando...</TableCell>
              </TableRow>
            ) : rates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-gray-500">Nenhum frete cadastrado.</TableCell>
              </TableRow>
            ) : (
              rates.map((rate) => (
                <TableRow key={rate.id} className="hover:bg-gray-50">
                  <TableCell>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                      {rate.service_type}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">{rate.region}</TableCell>
                  <TableCell className="font-bold text-[#1e3a5f]">
                    R$ {Number(rate.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenModal(rate)}>
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(rate.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingRate ? "Editar Frete" : "Novo Frete"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Serviço</Label>
              <Select 
                value={formData.service_type} 
                onValueChange={(val) => setFormData({...formData, service_type: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Região / UF</Label>
              <Input 
                value={formData.region} 
                onChange={(e) => setFormData({...formData, region: e.target.value})}
                placeholder="Ex: SP ou São Paulo (capital)"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Preço (R$)</Label>
              <Input 
                type="number" 
                step="0.01"
                value={formData.price} 
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="0.00"
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#1e3a5f] hover:bg-[#162a45]">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}