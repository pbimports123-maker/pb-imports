"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, CreditCard, Package, Search, Shield, Video, MapPin, CheckCircle, Loader2, ScrollText } from "lucide-react";
import Link from "next/link";

const DEFAULT_RULES: Record<string, string> = {
  pagamento: ["Pix", "Transferência bancária (TED)", "Depósito direto", "⚠️ Não utilize caixa eletrônico ou DOC", "⚠️ Não insira nome de produtos no comprovante", "Atenção: sempre solicite a conta novamente antes de realizar uma nova compra. A conta pode ser alterada. Caso o pagamento seja feito sem nossa autorização, não nos responsabilizamos."].join("\n"),
  postagem: "A postagem será realizada em até 24 horas após a confirmação do pagamento.",
  rastreio: "O código de rastreio será fornecido em até 24 horas após a postagem.\nSolicite o código de segunda a sexta-feira, após as 18h.",
  seguro: ["O seguro é opcional. Consulte o vendedor para mais informações.", "Para que serve o seguro? Caso o pedido seja extraviado ou retido na fiscalização, realizaremos um novo reenvio.", "Observação importante: como os produtos são ilícitos, quando há retenção pela fiscalização ou extravio não há a quem reclamar, e a mercadoria é considerada perdida. Por isso, o seguro é fundamental."].join("\n"),
  recebimento: ["Para sua própria segurança, filme a abertura da caixa.", "• O vídeo deve ser 100% nítido", "• A caixa deve estar visível durante toda a filmagem", "• Mostre o conteúdo ao ser retirado da embalagem", "Se a caixa chegar danificada, aberta ou violada — RECUSE A ENTREGA."].join("\n"),
  endereco: "Se o cliente fornecer um endereço ou CEP incorretos e a encomenda for extraviada ou perdida, não nos responsabilizaremos, mesmo que o seguro tenha sido pago.",
  credibilidade: "Diferenciais, parcerias e atletas...",
};

function applyDefaults(data: Record<string, string>) {
  const out: Record<string, string> = {};
  Object.keys(DEFAULT_RULES).forEach((key) => {
    const val = data[key];
    out[key] = typeof val === "string" && val.trim() && !val.includes("?") ? val : DEFAULT_RULES[key];
  });
  return out;
}

export default function RegrasPage() {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<any>(null);

  useEffect(() => {
    async function fetchRules() {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('shipping_rules').select('content').order('created_at', { ascending: false }).limit(1).single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data?.content) { setRules(applyDefaults(JSON.parse(data.content))); }
        else { setRules(DEFAULT_RULES); }
      } catch (error) { console.error("Erro ao buscar regras:", error); setRules(DEFAULT_RULES); }
      finally { setLoading(false); }
    }
    fetchRules();
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF8EF" }}>
        <Loader2 style={{ color: "#C28266" }} size={48} className="animate-spin" />
      </div>
    );
  }

  const safe = applyDefaults(rules || {});

  const sections = [
    { id: "pagamento", title: "Formas de Pagamento", icon: CreditCard, color: "#C28266", text: safe.pagamento },
    { id: "postagem", title: "Postagem", icon: Package, color: "#D4A96A", text: safe.postagem },
    { id: "rastreio", title: "Rastreio", icon: Search, color: "#8AAFC2", text: safe.rastreio },
    { id: "seguro", title: "Seguro", icon: Shield, color: "#7AAF90", text: safe.seguro },
    { id: "recebimento", title: "Recebimento da Mercadoria", icon: Video, color: "#C0614F", text: safe.recebimento },
    { id: "endereco", title: "Endereço", icon: MapPin, color: "#9E6650", text: safe.endereco },
    { id: "credibilidade", title: "Credibilidade e Confiança", icon: CheckCircle, color: "#A8C4B0", text: safe.credibilidade },
  ];

  return (
    <div className="rg-root">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FAF8EF; font-family: "DM Sans", sans-serif; color: #0D0F13; }
      `}</style>
      <style jsx>{`
        .rg-root { min-height: 100vh; background: #FAF8EF; }

        .rg-header { height: 60px; background: rgba(242,237,224,0.95); border-bottom: 1px solid rgba(194,130,102,0.2); display: flex; align-items: center; padding: 0 20px; gap: 16px; position: sticky; top: 0; z-index: 50; backdrop-filter: blur(20px); }
        .back-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: #fff; border: 1px solid rgba(194,130,102,0.25); border-radius: 8px; color: #7A6558; font-size: 13px; font-weight: 500; cursor: pointer; text-decoration: none; transition: all 0.2s; }
        .back-btn:hover { border-color: #C28266; color: #C28266; }
        .rg-logo { display: flex; align-items: center; gap: 10px; margin: 0 auto; }
        .rg-logo-hex { width: 36px; height: 36px; background: linear-gradient(135deg, #C28266, #9E6650); clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); display: flex; align-items: center; justify-content: center; }
        .rg-logo-hex span { font-family: "Raleway", sans-serif; font-size: 12px; font-weight: 700; color: #fff; }
        .rg-logo-name { font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 700; color: #9E6650; letter-spacing: 1px; text-transform: uppercase; }
        .rg-logo-sub { font-size: 9px; color: #A8978E; letter-spacing: 2px; text-transform: uppercase; }

        .rg-main { max-width: 900px; margin: 0 auto; padding: 32px 20px 80px; }

        .rg-page-title { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
        .rg-title-icon { width: 50px; height: 50px; background: rgba(194,130,102,0.1); border: 1px solid rgba(194,130,102,0.25); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #C28266; }
        .rg-title-text h1 { font-family: "Raleway", sans-serif; font-size: 24px; font-weight: 700; color: #0D0F13; }
        .rg-title-text p { font-size: 13px; color: #7A6558; margin-top: 4px; }

        /* Timeline */
        .rg-timeline { position: relative; padding-left: 48px; }
        .rg-timeline::before { content: ""; position: absolute; left: 16px; top: 8px; bottom: 8px; width: 2px; background: linear-gradient(to bottom, #C28266, #D4A96A, #7AAF90); border-radius: 2px; opacity: 0.4; }

        .rg-section { position: relative; margin-bottom: 20px; background: #fff; border: 1px solid rgba(194,130,102,0.18); border-radius: 14px; overflow: hidden; }
        .rg-section-dot { position: absolute; left: -40px; top: 20px; width: 32px; height: 32px; border-radius: 50%; background: #fff; border: 1px solid rgba(194,130,102,0.25); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 4px #FAF8EF; }

        .rg-section-head { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(194,130,102,0.1); background: rgba(194,130,102,0.03); }
        .rg-section-badge { padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; font-family: "Raleway", sans-serif; }
        .rg-section-updated { font-size: 10px; color: #A8978E; letter-spacing: 0.5px; text-transform: uppercase; }

        .rg-section-body { padding: 18px 20px; font-size: 14px; line-height: 1.7; color: #3A2E28; white-space: pre-wrap; }
        .rg-section-body .rg-bold-line { font-weight: 700; font-size: 15px; color: #0D0F13; display: block; margin-bottom: 4px; }

        .rg-footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(194,130,102,0.15); text-align: center; font-size: 12px; color: #A8978E; }
      `}</style>

      <header className="rg-header">
        <Link href="/" className="back-btn"><ChevronLeft size={16} /> Voltar</Link>
        <div className="rg-logo">
          <div className="rg-logo-hex"><span>PB</span></div>
          <div>
            <div className="rg-logo-name">PB Imports</div>
            <div className="rg-logo-sub">Disponibilidade</div>
          </div>
        </div>
      </header>

      <main className="rg-main">
        <div className="rg-page-title">
          <div className="rg-title-icon"><ScrollText size={22} /></div>
          <div className="rg-title-text">
            <h1>Regras de Envio</h1>
            <p>Orientações claras para pagamento, postagem e recebimento.</p>
          </div>
        </div>

        <div className="rg-timeline">
          {sections.map((item) => (
            <div key={item.id} className="rg-section">
              <div className="rg-section-dot">
                <item.icon size={14} style={{ color: item.color }} />
              </div>
              <div className="rg-section-head">
                <span className="rg-section-badge" style={{ color: item.color, background: `${item.color}18`, border: `1px solid ${item.color}33` }}>
                  {item.title}
                </span>
                <span className="rg-section-updated">Atualizado</span>
              </div>
              <div className="rg-section-body">
                {item.text.split("\n").map((line, i) =>
                  i === 0 && item.id === "pagamento" ? (
                    <span key={i} className="rg-bold-line">{line}</span>
                  ) : (
                    <span key={i}>{line}{"\n"}</span>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>

        <footer className="rg-footer">PB Imports · 2026 · Disponibilidade</footer>
      </main>
    </div>
  );
}
