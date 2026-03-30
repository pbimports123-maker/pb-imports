"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  ChevronLeft, 
  ScrollText, 
  CreditCard, 
  Package, 
  Search, 
  Shield, 
  Video, 
  MapPin, 
  CheckCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RegrasPage() {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<any>(null);

  useEffect(() => {
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
      } catch (error) {
        console.error("Erro ao buscar regras:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchRules();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#fbbf24]" size={48} />
      </div>
    );
  }

  // Se não houver regras no banco, mostramos um aviso ou valores padrão
  if (!rules) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col items-center justify-center p-4">
        <p className="text-[#9ca3af] mb-4">Nenhuma regra cadastrada no momento.</p>
        <Link href="/">
          <Button variant="outline">Voltar para Início</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
      <header className="h-16 border-b border-[#404040] flex items-center px-4 sticky top-0 bg-[#1a1a1a] z-50">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-[#9ca3af] hover:text-white">
            <ChevronLeft size={24} />
          </Button>
        </Link>
        <div className="flex-grow flex justify-center pr-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#fbbf24] rounded flex items-center justify-center">
              <span className="text-black font-black text-xs">P</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-bold tracking-tighter">RESPECT</span>
              <span className="text-[10px] font-bold text-[#fbbf24] tracking-widest">PHARMA</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-[800px] flex flex-col gap-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg border border-[#d97706]/30 bg-[#d97706]/10 flex items-center justify-center">
            <ScrollText className="text-[#d97706]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Regras de Envio</h1>
            <p className="text-sm text-[#9ca3af]">Informações sobre como funciona o envio</p>
          </div>
        </div>

        {/* Pagamento */}
        <section className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#404040] bg-gradient-to-r from-[#10b981]/5 to-transparent flex items-center gap-2">
            <CreditCard className="text-[#10b981]" size={20} />
            <h2 className="text-[#10b981] font-bold">Formas de Pagamento</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-[#e5e7eb] whitespace-pre-wrap">{rules.pagamento}</p>
          </div>
        </section>

        {/* Postagem */}
        <section className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#404040] bg-gradient-to-r from-[#d97706]/5 to-transparent flex items-center gap-2">
            <Package className="text-[#d97706]" size={20} />
            <h2 className="text-[#d97706] font-bold">Postagem</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-[#e5e7eb] whitespace-pre-wrap">{rules.postagem}</p>
          </div>
        </section>

        {/* Rastreio */}
        <section className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#404040] bg-gradient-to-r from-[#3b82f6]/5 to-transparent flex items-center gap-2">
            <Search className="text-[#3b82f6]" size={20} />
            <h2 className="text-[#3b82f6] font-bold">Rastreio</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-[#e5e7eb] whitespace-pre-wrap">{rules.rastreio}</p>
          </div>
        </section>

        {/* Seguro */}
        <section className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#404040] bg-gradient-to-r from-[#fbbf24]/5 to-transparent flex items-center gap-2">
            <Shield className="text-[#fbbf24]" size={20} />
            <h2 className="text-[#fbbf24] font-bold">Seguro</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-[#e5e7eb] whitespace-pre-wrap">{rules.seguro}</p>
          </div>
        </section>

        {/* Recebimento */}
        <section className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#404040] bg-gradient-to-r from-[#d97706]/5 to-transparent flex items-center gap-2">
            <Video className="text-[#d97706]" size={20} />
            <h2 className="text-[#d97706] font-bold">Recebimento da Mercadoria</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-[#e5e7eb] whitespace-pre-wrap">{rules.recebimento}</p>
          </div>
        </section>

        {/* Endereço */}
        <section className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#404040] bg-gradient-to-r from-[#10b981]/5 to-transparent flex items-center gap-2">
            <MapPin className="text-[#10b981]" size={20} />
            <h2 className="text-[#10b981] font-bold">Endereço</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-[#e5e7eb] whitespace-pre-wrap">{rules.endereco}</p>
          </div>
        </section>

        {/* Credibilidade */}
        <section className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#404040] bg-gradient-to-r from-[#8b5cf6]/5 to-transparent flex items-center gap-2">
            <CheckCircle className="text-[#8b5cf6]" size={20} />
            <h2 className="text-[#8b5cf6] font-bold">Credibilidade e Confiança</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-[#e5e7eb] whitespace-pre-wrap">{rules.credibilidade}</p>
          </div>
        </section>

        <footer className="mt-12 py-8 text-center border-t border-[#404040]">
          <p className="text-xs text-[#6b7280]">Respect Pharma © 2026</p>
        </footer>
      </main>
    </div>
  );
}