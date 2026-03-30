"use client";

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
  Info
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RegrasPage() {
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

      <main className="container mx-auto px-4 py-8 max-w-[800px] flex flex-col gap-6">
        {/* Page Title */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg border border-[#d97706]/30 bg-[#d97706]/10 flex items-center justify-center">
            <ScrollText className="text-[#d97706]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Regras de Envio</h1>
            <p className="text-sm text-[#9ca3af]">Informações sobre como funciona o envio</p>
          </div>
        </div>

        {/* Formas de Pagamento */}
        <section className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#404040] bg-gradient-to-r from-[#10b981]/5 to-transparent flex items-center gap-2">
            <CreditCard className="text-[#10b981]" size={20} />
            <h2 className="text-[#10b981] font-bold">Formas de Pagamento</h2>
          </div>
          <div className="p-6 flex flex-col gap-4">
            <ul className="space-y-2 text-[#e5e7eb]">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                Pix
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                Transferência bancária (TED)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                Depósito direto
              </li>
            </ul>
            
            <div className="flex flex-wrap gap-2">
              <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 text-[#ef4444] text-[10px] px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <AlertTriangle size={12} />
                Não utilize caixa eletrônico ou DOC
              </div>
              <div className="bg-[#fbbf24]/10 border border-[#fbbf24]/30 text-[#fbbf24] text-[10px] px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <AlertTriangle size={12} />
                Não insira nome de produtos no comprovante
              </div>
            </div>

            <div className="bg-[#fbbf24]/5 border border-[#fbbf24]/20 p-4 rounded-lg">
              <p className="text-xs text-[#e5e7eb] leading-relaxed">
                <span className="text-[#fbbf24] font-bold">Atenção:</span> Sempre solicite a conta novamente antes de realizar uma nova compra. A conta pode ser alterada. Caso o pagamento seja feito sem nossa autorização, não nos responsabilizamos.
              </p>
            </div>
          </div>
        </section>

        {/* Postagem */}
        <section className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#404040] bg-gradient-to-r from-[#d97706]/5 to-transparent flex items-center gap-2">
            <Package className="text-[#d97706]" size={20} />
            <h2 className="text-[#d97706] font-bold">Postagem</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-[#e5e7eb]">
              A postagem será realizada em até <span className="font-bold">24 horas</span> após a confirmação do pagamento.
            </p>
          </div>
        </section>

        {/* Rastreio */}
        <section className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#404040] bg-gradient-to-r from-[#3b82f6]/5 to-transparent flex items-center gap-2">
            <Search className="text-[#3b82f6]" size={20} />
            <h2 className="text-[#3b82f6] font-bold">Rastreio</h2>
          </div>
          <div className="p-6 flex flex-col gap-2">
            <p className="text-sm text-[#e5e7eb]">
              O código de rastreio será fornecido em até <span className="font-bold">24 horas após a postagem</span>.
            </p>
            <p className="text-xs text-[#9ca3af]">
              Solicite o código de segunda a sexta-feira, após as 18h.
            </p>
          </div>
        </section>

        {/* Seguro */}
        <section className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#404040] bg-gradient-to-r from-[#fbbf24]/5 to-transparent flex items-center gap-2">
            <Shield className="text-[#fbbf24]" size={20} />
            <h2 className="text-[#fbbf24] font-bold">Seguro</h2>
          </div>
          <div className="p-6 flex flex-col gap-4">
            <p className="text-sm text-[#e5e7eb]">
              O seguro é <span className="font-bold">opcional</span>. Consulte o vendedor para mais informações.
            </p>
            <p className="text-sm text-[#e5e7eb]">
              <span className="text-[#fbbf24] font-bold">Para que serve o seguro?</span> Caso o seu pedido seja extraviado ou retido na fiscalização, nós realizaremos um <span className="font-bold">novo reenvio</span>.
            </p>
            <div className="bg-[#ef4444]/5 border border-[#ef4444]/20 p-4 rounded-lg">
              <h4 className="text-[#ef4444] font-bold text-[10px] uppercase tracking-wider mb-2">Observação Importante</h4>
              <p className="text-xs text-[#e5e7eb] leading-relaxed">
                Como nossos produtos são ilícitos, quando há retenção pela fiscalização ou extravio, não temos a quem reclamar, e a mercadoria é considerada perdida. Por isso, <span className="font-bold">o seguro é fundamental</span>.
              </p>
            </div>
          </div>
        </section>

        {/* Recebimento da Mercadoria */}
        <section className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#404040] bg-gradient-to-r from-[#d97706]/5 to-transparent flex items-center gap-2">
            <Video className="text-[#d97706]" size={20} />
            <h2 className="text-[#d97706] font-bold">Recebimento da Mercadoria</h2>
          </div>
          <div className="p-6 flex flex-col gap-4">
            <p className="text-sm text-[#e5e7eb]">
              Para sua própria segurança, <span className="font-bold">filme a abertura da caixa</span>. Nosso controle é extremamente rigoroso e tiramos fotos de todos os pedidos antes de embalá-los.
            </p>
            <ul className="space-y-2 text-sm text-[#e5e7eb]">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                O vídeo deve ser <span className="font-bold">100% nítido</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                A caixa deve estar visível <span className="font-bold">durante toda a filmagem</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                Mostre o conteúdo ao ser retirado da embalagem
              </li>
            </ul>
            <div className="bg-[#ef4444]/10 border border-[#ef4444]/30 p-3 rounded-lg text-center">
              <p className="text-[10px] text-[#ef4444] font-bold uppercase">
                Se a caixa chegar danificada, aberta ou violada — RECUSE A ENTREGA. Caso contrário, não nos responsabilizaremos.
              </p>
            </div>
          </div>
        </section>

        {/* Endereço */}
        <section className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#404040] bg-gradient-to-r from-[#10b981]/5 to-transparent flex items-center gap-2">
            <MapPin className="text-[#10b981]" size={20} />
            <h2 className="text-[#10b981] font-bold">Endereço</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-[#e5e7eb] leading-relaxed">
              Se o cliente fornecer um <span className="font-bold">endereço ou CEP incorretos</span> e a encomenda for extraviada ou perdida, não nos responsabilizaremos, <span className="font-bold">mesmo que o seguro tenha sido pago</span>.
            </p>
          </div>
        </section>

        {/* Credibilidade e Confiança */}
        <section className="bg-[#2d2d2d] border border-[#404040] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#404040] bg-gradient-to-r from-[#8b5cf6]/5 to-transparent flex items-center gap-2">
            <CheckCircle className="text-[#8b5cf6]" size={20} />
            <h2 className="text-[#8b5cf6] font-bold">Credibilidade e Confiança</h2>
          </div>
          <div className="p-6 flex flex-col gap-4">
            <p className="text-sm text-[#e5e7eb] leading-relaxed">
              Todos os números que estão sendo divulgados nos Instagram das principais marcas, como <span className="font-bold">Muscle</span> e <span className="font-bold">Cooper</span>, pertencem à nossa empresa.
            </p>
            <p className="text-sm text-[#e5e7eb] leading-relaxed">
              A <span className="font-bold">Landerlan</span> não divulga números na biografia, mas a grande maioria dos atletas que representam essa marca também é nossa.
            </p>
          </div>
        </section>

        <footer className="mt-12 py-8 text-center border-t border-[#404040]">
          <p className="text-xs text-[#6b7280]">Respect Pharma © 2026</p>
        </footer>
      </main>
    </div>
  );
}