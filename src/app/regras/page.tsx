"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronLeft,
  CreditCard,
  Package,
  Search,
  Shield,
  Video,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ScrollText,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const DEFAULT_RULES: Record<string, string> = {
  pagamento: [
    "Pix",
    "Transferência bancária (TED)",
    "Depósito direto",
    "⚠️ Não utilize caixa eletrônico ou DOC",
    "⚠️ Não insira nome de produtos no comprovante",
    "Atenção: sempre solicite a conta novamente antes de realizar uma nova compra. A conta pode ser alterada. Caso o pagamento seja feito sem nossa autorização, não nos responsabilizamos.",
  ].join("\n"),
  postagem:
    "A postagem será realizada em até 24 horas após a confirmação do pagamento.",
  rastreio:
    "O código de rastreio será fornecido em até 24 horas após a postagem.\nSolicite o código de segunda a sexta-feira, após as 18h.",
  seguro: [
    "O seguro é opcional. Consulte o vendedor para mais informações.",
    "Para que serve o seguro? Caso o pedido seja extraviado ou retido na fiscalização, realizaremos um novo reenvio.",
    "Observação importante: como os produtos são ilícitos, quando há retenção pela fiscalização ou extravio não há a quem reclamar, e a mercadoria é considerada perdida. Por isso, o seguro é fundamental.",
  ].join("\n"),
  recebimento: [
    "Para sua própria segurança, filme a abertura da caixa. Nosso controle é extremamente rigoroso e tiramos fotos de todos os pedidos antes de embalá-los.",
    "• O vídeo deve ser 100% nítido",
    "• A caixa deve estar visível durante toda a filmagem",
    "• Mostre o conteúdo ao ser retirado da embalagem",
    "Se a caixa chegar danificada, aberta ou violada — RECUSE A ENTREGA. Caso contrário, não nos responsabilizaremos.",
  ].join("\n"),
  endereco:
    "Se o cliente fornecer um endereço ou CEP incorretos e a encomenda for extraviada ou perdida, não nos responsabilizaremos, mesmo que o seguro tenha sido pago.",
  credibilidade:
    "Diferenciais, parcerias e atletas...",
};

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
          setRules(applyDefaults(JSON.parse(data.content)));
        } else {
          setRules(DEFAULT_RULES);
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
      <div className="min-h-screen bg-[#0a0f14] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#fbbf24]" size={48} />
      </div>
    );
  }

  const safe = applyDefaults(rules || {});

  const sections = [
    {
      id: "pagamento",
      title: "Formas de Pagamento",
      icon: CreditCard,
      color: "#22d3ee",
      accent: "from-[#22d3ee]/12",
      text: safe.pagamento,
    },
    {
      id: "postagem",
      title: "Postagem",
      icon: Package,
      color: "#f59e0b",
      accent: "from-[#f59e0b]/12",
      text: safe.postagem,
    },
    {
      id: "rastreio",
      title: "Rastreio",
      icon: Search,
      color: "#3b82f6",
      accent: "from-[#3b82f6]/12",
      text: safe.rastreio,
    },
    {
      id: "seguro",
      title: "Seguro",
      icon: Shield,
      color: "#fbbf24",
      accent: "from-[#fbbf24]/12",
      text: safe.seguro,
    },
    {
      id: "recebimento",
      title: "Recebimento da Mercadoria",
      icon: Video,
      color: "#f97316",
      accent: "from-[#f97316]/12",
      text: safe.recebimento,
    },
    {
      id: "endereco",
      title: "Endereço",
      icon: MapPin,
      color: "#10b981",
      accent: "from-[#10b981]/12",
      text: safe.endereco,
    },
    {
      id: "credibilidade",
      title: "Credibilidade e Confiança",
      icon: CheckCircle,
      color: "#8b5cf6",
      accent: "from-[#8b5cf6]/12",
      text: safe.credibilidade,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f14] text-white flex flex-col">
      <header className="h-16 border-b border-[#1f2937] flex items-center px-4 sticky top-0 bg-[#0b0f15]/85 backdrop-blur z-50">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-[#9ca3af] hover:text-white">
            <ChevronLeft size={24} />
          </Button>
        </Link>
        <div className="flex-grow flex justify-center pr-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-[#22d3ee] flex items-center justify-center text-black font-black text-xs">
              PB
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-[0.16em] text-[#22d3ee] uppercase">PB IMPORTS</span>
              <span className="text-[10px] font-semibold text-[#6b7280] tracking-[0.24em] uppercase">Disponibilidade</span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0b1220] via-[#0a1019] to-[#0a0d14]" />
        <div className="pointer-events-none absolute inset-0 opacity-20 mix-blend-screen bg-[radial-gradient(circle_at_20%_20%,#22d3ee33,transparent_25%),radial-gradient(circle_at_80%_0%,#fbbf2433,transparent_22%),radial-gradient(circle_at_70%_70%,#8b5cf633,transparent_22%)]" />

        <div className="relative container mx-auto px-5 py-10 max-w-5xl flex flex-col gap-7">
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-12 h-12 rounded-xl border border-[#22d3ee33] bg-[#0f172a] shadow-[0_10px_40px_-15px_#22d3ee] flex items-center justify-center">
              <ScrollText className="text-[#22d3ee]" size={22} />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111826] border border-[#1f2937] text-[11px] uppercase tracking-[0.2em] text-[#9ca3af]">
                Disponibilidade
                <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee]" />
              </div>
              <h1 className="text-3xl font-semibold">Regras de Envio</h1>
              <p className="text-sm text-[#9ca3af]">Orientações claras para pagamento, postagem e recebimento.</p>
            </div>
          </div>

          <div className="relative pl-10">
            <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-[#22d3ee] via-[#fbbf24] to-[#8b5cf6] opacity-60" />
            <div className="space-y-6">
              {sections.map((item) => (
                <section
                  key={item.id}
                  className="relative rounded-2xl border border-[#1f2937] bg-[#0f131c]/90 shadow-[0_15px_50px_-30px_rgba(0,0,0,0.8)] overflow-visible"
                >
                  <div className="absolute -left-9 top-7 w-11 h-11 rounded-full bg-[#0f131c] border border-[#1f2937] flex items-center justify-center shadow-[0_0_0_6px_#0b0f17]">
                    <item.icon size={18} style={{ color: item.color }} />
                  </div>
                  <div
                    className={`p-4 border-b border-[#1f2937] bg-gradient-to-r ${item.accent} to-transparent flex items-center gap-3`}
                  >
                    <span
                      className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide"
                      style={{
                        color: item.color,
                        backgroundColor: `${item.color}22`,
                        border: `1px solid ${item.color}44`,
                      }}
                    >
                      {item.title}
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Atualizado</span>
                  </div>
                  <div className="p-6">
                    <p className="text-sm leading-relaxed text-[#dfe4ea] whitespace-pre-wrap">{item.text}</p>
                  </div>
                </section>
              ))}
            </div>
          </div>

          <footer className="pt-6 pb-10 text-center text-xs text-[#6b7280]">
            PB IMPORTS · 2026 · Disponibilidade
          </footer>
        </div>
      </main>
    </div>
  );
}

function applyDefaults(data: Record<string, string>) {
  const out: Record<string, string> = {};
  Object.keys(DEFAULT_RULES).forEach((key) => {
    const val = data[key];
    out[key] =
      typeof val === "string" && val.trim() && !val.includes("�")
        ? val
        : DEFAULT_RULES[key];
  });
  return out;
}
