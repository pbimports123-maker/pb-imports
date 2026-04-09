"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, Truck, Loader2 } from "lucide-react";
import Link from "next/link";

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

        const order = ["PAC","SEDEX","Transportadoras","Fretes VIP"];
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

        const ordered = Object.values(grouped).sort((a: any, b: any) => order.indexOf(a.title) - order.indexOf(b.title));
        setShippingData(ordered);
      } catch (error) {
        console.error("Erro ao buscar fretes:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchShipping();
  }, []);

  return (
    <div className="fr-root">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FAF8EF; font-family: "DM Sans", sans-serif; color: #0D0F13; }
      `}</style>
      <style jsx>{`
        .fr-root { min-height: 100vh; background: #FAF8EF; }

        /* Header */
        .fr-header { height: 60px; background: rgba(242,237,224,0.95); border-bottom: 1px solid rgba(194,130,102,0.2); display: flex; align-items: center; padding: 0 20px; gap: 16px; position: sticky; top: 0; z-index: 50; backdrop-filter: blur(20px); }
        .back-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: #fff; border: 1px solid rgba(194,130,102,0.25); border-radius: 8px; color: #7A6558; font-size: 13px; font-weight: 500; cursor: pointer; text-decoration: none; transition: all 0.2s; }
        .back-btn:hover { border-color: #C28266; color: #C28266; }
        .fr-logo { display: flex; align-items: center; gap: 10px; margin: 0 auto; }
        .fr-logo-hex { width: 36px; height: 36px; background: linear-gradient(135deg, #C28266, #9E6650); clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); display: flex; align-items: center; justify-content: center; }
        .fr-logo-hex span { font-family: "Raleway", sans-serif; font-size: 12px; font-weight: 700; color: #fff; }
        .fr-logo-text { display: flex; flex-direction: column; }
        .fr-logo-name { font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 700; color: #9E6650; letter-spacing: 1px; text-transform: uppercase; }
        .fr-logo-sub { font-size: 9px; color: #A8978E; letter-spacing: 2px; text-transform: uppercase; }

        /* Main */
        .fr-main { max-width: 800px; margin: 0 auto; padding: 32px 20px 80px; }

        /* Page title */
        .fr-page-title { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
        .fr-title-icon { width: 50px; height: 50px; background: rgba(194,130,102,0.1); border: 1px solid rgba(194,130,102,0.25); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #C28266; }
        .fr-title-text h1 { font-family: "Raleway", sans-serif; font-size: 24px; font-weight: 700; color: #0D0F13; }
        .fr-title-text p { font-size: 13px; color: #7A6558; margin-top: 4px; }

        /* Loading */
        .fr-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 0; gap: 12px; color: #A8978E; font-size: 14px; }

        /* Seções */
        .fr-sections { display: flex; flex-direction: column; gap: 20px; }
        .fr-section { background: #fff; border: 1px solid rgba(194,130,102,0.18); border-radius: 14px; overflow: hidden; }
        .fr-section-head { padding: 16px 20px; border-bottom: 1px solid rgba(194,130,102,0.1); background: rgba(194,130,102,0.04); }
        .fr-section-title { font-family: "Raleway", sans-serif; font-size: 16px; font-weight: 700; color: #9E6650; }
        .fr-section-sub { font-size: 12px; color: #A8978E; margin-top: 3px; }

        /* Tabela */
        .fr-table { width: 100%; border-collapse: collapse; }
        .fr-table th { padding: 10px 20px; text-align: left; font-size: 10px; font-weight: 700; color: #A8978E; letter-spacing: 0.5px; text-transform: uppercase; border-bottom: 1px solid rgba(194,130,102,0.1); }
        .fr-table th:last-child { text-align: right; }
        .fr-table td { padding: 14px 20px; font-size: 14px; color: #0D0F13; border-bottom: 1px solid rgba(194,130,102,0.06); }
        .fr-table tr:last-child td { border-bottom: none; }
        .fr-table tr:hover td { background: rgba(194,130,102,0.03); }
        .fr-table td:last-child { text-align: right; font-family: "Raleway", sans-serif; font-weight: 700; color: #C28266; }

        /* Footer */
        .fr-footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(194,130,102,0.15); text-align: center; font-size: 12px; color: #A8978E; }
      `}</style>

      {/* Header */}
      <header className="fr-header">
        <Link href="/" className="back-btn">
          <ChevronLeft size={16} /> Voltar
        </Link>
        <div className="fr-logo">
          <div className="fr-logo-hex"><span>PB</span></div>
          <div className="fr-logo-text">
            <span className="fr-logo-name">PB Imports</span>
            <span className="fr-logo-sub">Disponibilidade</span>
          </div>
        </div>
      </header>

      <main className="fr-main">
        {/* Título */}
        <div className="fr-page-title">
          <div className="fr-title-icon"><Truck size={22} /></div>
          <div className="fr-title-text">
            <h1>Tabela de Fretes</h1>
            <p>Valores de envio por região</p>
          </div>
        </div>

        {loading ? (
          <div className="fr-loading">
            <Loader2 size={32} style={{ color: "#C28266" }} className="animate-spin" />
            <span>Carregando tabela de fretes...</span>
          </div>
        ) : shippingData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#A8978E", fontSize: 14 }}>
            Nenhum frete cadastrado no momento.
          </div>
        ) : (
          <div className="fr-sections">
            {shippingData.map((section, idx) => (
              <div key={idx} className="fr-section">
                <div className="fr-section-head">
                  <div className="fr-section-title">{section.title}</div>
                  <div className="fr-section-sub">{section.subtitle}</div>
                </div>
                <table className="fr-table">
                  <thead>
                    <tr>
                      <th>Região</th>
                      <th>Preço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map((row: any, rowIdx: number) => (
                      <tr key={rowIdx}>
                        <td>{row.region}</td>
                        <td>R$ {row.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        <footer className="fr-footer">PB Imports © 2026</footer>
      </main>
    </div>
  );
}