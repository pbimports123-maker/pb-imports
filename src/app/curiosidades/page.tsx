"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Lightbulb } from "lucide-react";
import Link from "next/link";

type Curiosity = {
  id: string;
  title: string;
  content: string;
  created_at?: string;
};

export default function CuriosidadesPage() {
  const [items, setItems] = useState<Curiosity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("curiosities")
        .select("id,title,content,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("Erro ao carregar curiosidades", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#05070c] text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,#22d3ee22,transparent_35%),radial-gradient(circle_at_80%_0%,#fbbf2422,transparent_30%),radial-gradient(circle_at_70%_70%,#8b5cf622,transparent_25%)]" />
      <div className="relative max-w-5xl mx-auto px-5 py-8">
        <header className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-sm text-[#9ca3af] hover:text-white transition-colors">
            ← Voltar
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0f172a] border border-[#1f2937] text-[11px] uppercase tracking-[0.2em] text-[#9ca3af]">
            Curiosidades
            <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee]" />
          </div>
        </header>

        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl border border-[#22d3ee33] bg-[#0f172a] shadow-[0_10px_40px_-15px_#22d3ee] flex items-center justify-center">
            <Sparkles className="text-[#22d3ee]" size={22} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold">Curiosidades e Dicas</h1>
            <p className="text-sm text-[#9ca3af]">Conteúdo rápido sobre produtos, prazos, segurança e boas práticas.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-[#9ca3af]">
            <Loader2 className="animate-spin" size={18} />
            Carregando curiosidades...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-[#1f2937] bg-[#0c1119] p-6 text-[#9ca3af] flex gap-3 items-start">
            <Lightbulb size={18} className="text-[#fbbf24]" />
            Nenhuma curiosidade publicada ainda.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[#1f2937] bg-[#0f131c]/90 shadow-[0_15px_50px_-30px_rgba(0,0,0,0.8)] p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                  {item.created_at && (
                    <span className="text-[11px] uppercase tracking-[0.15em] text-[#9ca3af]">
                      {new Date(item.created_at).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed text-[#dfe4ea] whitespace-pre-wrap">{item.content}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
