"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Save, ScrollText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminRulesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState({
    pagamento: "",
    postagem: "",
    rastreio: "",
    seguro: "",
    recebimento: "",
    endereco: "",
    credibilidade: ""
  });

  useEffect(() => {
    fetchRules();
  }, []);

  async function fetchRules() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shipping_rules')
        .select('content')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.content) {
        setRules(JSON.parse(data.content));
      }
    } catch (error: any) {
      console.error("Erro ao carregar regras:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('shipping_rules')
        .insert([{ content: JSON.stringify(rules) }]);

      if (error) throw error;
      toast.success("Regras atualizadas com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#1e3a5f]" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Regras de Envio</h1>
          <p className="text-sm text-gray-500">Edite os textos informativos que aparecem para os clientes.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#1e3a5f] hover:bg-[#162a45] gap-2">
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Salvar Alterações
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="space-y-2">
            <Label className="font-bold">Formas de Pagamento</Label>
            <Textarea 
              value={rules.pagamento} 
              onChange={(e) => setRules({...rules, pagamento: e.target.value})}
              placeholder="Descreva as formas de pagamento e avisos importantes..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-bold">Postagem</Label>
            <Textarea 
              value={rules.postagem} 
              onChange={(e) => setRules({...rules, postagem: e.target.value})}
              placeholder="Informações sobre prazos de postagem..."
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-bold">Rastreio</Label>
            <Textarea 
              value={rules.rastreio} 
              onChange={(e) => setRules({...rules, rastreio: e.target.value})}
              placeholder="Como e quando o cliente recebe o rastreio..."
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-bold">Seguro</Label>
            <Textarea 
              value={rules.seguro} 
              onChange={(e) => setRules({...rules, seguro: e.target.value})}
              placeholder="Explicação sobre o seguro opcional..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-bold">Recebimento da Mercadoria</Label>
            <Textarea 
              value={rules.recebimento} 
              onChange={(e) => setRules({...rules, recebimento: e.target.value})}
              placeholder="Instruções sobre filmagem e conferência..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-bold">Endereço</Label>
            <Textarea 
              value={rules.endereco} 
              onChange={(e) => setRules({...rules, endereco: e.target.value})}
              placeholder="Avisos sobre endereços incorretos..."
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-bold">Credibilidade e Confiança</Label>
            <Textarea 
              value={rules.credibilidade} 
              onChange={(e) => setRules({...rules, credibilidade: e.target.value})}
              placeholder="Informações sobre parcerias e atletas..."
              className="min-h-[100px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}