"use client";

import { ChevronLeft, Truck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const SHIPPING_DATA = [
  {
    title: "PAC",
    subtitle: "Correios — PAC",
    rows: [
      { region: "SP", price: "32.00" },
      { region: "RJ, DF, ES, GO, RS", price: "45.00" },
      { region: "MG, MS, PR, SC", price: "45.00" },
      { region: "BA, MT", price: "58.00" },
      { region: "CE", price: "72.50" },
      { region: "PA, PE, TO", price: "87.00" },
      { region: "AM, AP, MA, PI, PB, AL", price: "100.00" },
      { region: "RN, SE, RO", price: "100.00" },
      { region: "RR, AC", price: "130.00" },
    ]
  },
  {
    title: "SEDEX",
    subtitle: "Correios — SEDEX",
    rows: [
      { region: "SP", price: "40.00" },
      { region: "DF, PR", price: "60.00" },
      { region: "ES, GO, MG, RJ, RS, SC", price: "70.00" },
      { region: "MS", price: "85.00" },
      { region: "BA, MT", price: "90.00" },
      { region: "CE, PA, TO", price: "105.00" },
      { region: "AC, RO", price: "110.00" },
      { region: "PE", price: "115.00" },
      { region: "AL, AM, AP, MA", price: "125.00" },
      { region: "PB, PI, RN, SE", price: "125.00" },
    ]
  },
  {
    title: "Transportadoras",
    subtitle: "Envio por transportadora",
    rows: [
      { region: "SP", price: "48.00" },
      { region: "RJ, ES, MG, PR, SC", price: "70.00" },
      { region: "DF", price: "72.00" },
      { region: "MT", price: "75.00" },
      { region: "GO", price: "76.00" },
      { region: "BA, CE, MS", price: "80.00" },
      { region: "MA", price: "90.00" },
      { region: "PB, RN, RS", price: "100.00" },
      { region: "PA, PI, TO", price: "110.00" },
      { region: "AL, PE, SE", price: "120.00" },
      { region: "AP, AM, RR", price: "120.00" },
      { region: "RO", price: "170.00" },
    ]
  },
  {
    title: "Fretes VIP",
    subtitle: "Entrega especial — Demais regiões sob consulta!",
    rows: [
      { region: "São Paulo (capital)", price: "150.00" },
      { region: "Alphaville / Barueri", price: "160.00" },
      { region: "Carapicuíba", price: "160.00" },
      { region: "Guarulhos", price: "170.00" },
      { region: "Campinas", price: "170.00" },
      { region: "São Bernardo do Campo", price: "170.00" },
      { region: "Mauá", price: "170.00" },
      { region: "Jundiaí", price: "190.00" },
      { region: "Indaiatuba", price: "190.00" },
      { region: "Santos", price: "240.00" },
      { region: "Praia Grande", price: "290.00" },
    ]
  }
];

export default function FretesPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white flex flex-col">
      {/* Header */}
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
        {/* Page Title */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-lg border border-[#fbbf24]/30 bg-[#fbbf24]/10 flex items-center justify-center">
            <Truck className="text-[#fbbf24]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Tabela de Fretes</h1>
            <p className="text-sm text-[#9ca3af]">Valores de envio por região</p>
          </div>
        </div>

        {/* Shipping Cards */}
        <div className="flex flex-col gap-6">
          {SHIPPING_DATA.map((section, idx) => (
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
                    {section.rows.map((row, rowIdx) => (
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

        <footer className="mt-12 py-8 text-center border-t border-[#404040]">
          <p className="text-xs text-[#6b7280]">Respect Pharma © 2026</p>
        </footer>
      </main>
    </div>
  );
}