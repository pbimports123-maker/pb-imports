"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, Truck, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FretesPage() {
  const [shippingData, setShippingData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShipping() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('shipping_rates')
          .select('*')
          .eq('is_active', true)
          .order('region', { ascending: true });

        if (error) throw error;

        // Agrupar por tipo de serviço
        const grouped = data.reduce((acc: any, rate: any) => {
          const type = rate.service_type;
          if (!acc[type]) {
            acc[type] = {
              title: type,
              subtitle: type === 'PAC' ? 'Correios — PAC' : 
                        type === 'SEDEX' ? 'Correios — SEDEX' : 
                        type === 'Transportadoras' ? 'Envio por transportadora' : 
                        'Entrega especial — Demais regiões sob consulta!',
              rows: []
            };
          }
          acc[type].rows.push({
            region: rate.region,
            price: Number(rate.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
          });
          return acc;
        }, {});

        setShippingData(Object.values(grouped));
      } catch (error) {
        console.error("Erro ao buscar fretes:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchShipping();
  }, []);

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

      <main className="container mx-auto px-4 py-8 max-w-[800px]">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-lg border border-[#fbbf24]/30 bg-[#fbbf24]/10 flex items-center justify-center">
            <Truck className="text-[#fbbf24]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Tabela de Fretes</h1>
            <p className="text-sm text-[#9ca3af]">Valores de envio por região</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-[#fbbf24] animate-spin" />
            <p className="text-[#9ca3af]">Carregando tabela de fretes...</p>
          </div>
        ) : shippingData.length === 0 ? (
          <div className="text-center py-20 bg-[#2d2d2d] rounded-xl border border-dashed border-[#404040]">
            <p className="text-[#9ca3af]">Nenhum frete cadastrado no momento.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {shippingData.map((section, idx) => (
              <div key={idx} className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#404040] bg-gradient-to-r from-[#fbbf24]/5 to-transparent">
                  <h2 className="text-[#fbbf24] font-bold text-lg">{section.title}</h2>
                  <p className="text-xs text-[#9ca3af]">{section.subtitle}</p>
                </div>
                
                <div className="p-0">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-[#6b7280] border-b border-[#404040]">
                        <th className="text-left p-4 font-medium">Região</th>
                        <th className="text-right p-4 font-medium">Preço</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#404040]">
                      {section.rows.map((row: any, rowIdx: number) => (
                        <tr key={rowIdx} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 text-[#e5e7eb]">{row.region}</td>
                          <td className="p-4 text-right font-bold text-[#fbbf24]">
                            {row.price}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-12 py-8 text-center border-t border-[#404040]">
          <p className="text-xs text-[#6b7280]">Respect Pharma © 2026</p>
        </footer>
      </main>
    </div>
  );
}