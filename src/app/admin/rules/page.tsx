"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const FIELDS = [
  { id: "pagamento", label: "Formas de Pagamento", color: "var(--accent-cyan)", placeholder: "Descreva as formas de pagamento..." },
  { id: "postagem", label: "Postagem", color: "var(--accent-gold)", placeholder: "Prazos de postagem..." },
  { id: "rastreio", label: "Rastreio", color: "#6ea8ff", placeholder: "Como e quando o cliente recebe o rastreio..." },
  { id: "seguro", label: "Seguro", color: "var(--accent-green)", placeholder: "Cobertura e custo do seguro..." },
  { id: "recebimento", label: "Recebimento da Mercadoria", color: "var(--accent-purple)", placeholder: "Instruções de filmagem e conferência..." },
  { id: "endereco", label: "Endereço", color: "var(--accent-red)", placeholder: "Avisos sobre Endereço incorreto..." },
  { id: "credibilidade", label: "Credibilidade e Confiança", color: "var(--accent-cyan)", placeholder: "Diferenciais, parcerias e atletas..." },
];

function applyDefaults(data: Record<string,string>) {
  const out: Record<string,string> = {};
  FIELDS.forEach((f)=>{
    const raw = data?.[f.id];
    out[f.id] = (typeof raw === "string" && raw.trim() && !raw.includes("�")) ? raw : DEFAULT_RULES[f.id];
  });
  return out;
}

export default function AdminRulesPage() {
  const [rules, setRules] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("// Nenhuma alteração salva ainda");

  useEffect(() => {
    fetchRules();
  }, []);

  async function fetchRules() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("shipping_rules")
        .select("content")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      const loaded = data?.content ? JSON.parse(data.content) : {};
      setRules(applyDefaults(loaded));
    } catch (err: any) {
      toast.error("Erro ao carregar regras: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const filledCount = useMemo(() => FIELDS.filter((f) => (rules[f.id] || "").trim().length > 0).length, [rules]);
  const progressPct = Math.round((filledCount / FIELDS.length) * 100);

  const handleChange = (id: string, value: string) => {
    setRules((prev) => ({ ...prev, [id]: value }));
  };

  const handleReset = () => {
    if (!confirm("Limpar todos os campos?")) return;
    const cleared: Record<string, string> = {};
    FIELDS.forEach((f) => (cleared[f.id] = DEFAULT_RULES[f.id]));
    setRules(cleared);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = { content: JSON.stringify(rules) };
      const { error } = await supabase.from("shipping_rules").insert([payload]);
      if (error) throw error;
      const now = new Date().toLocaleString("pt-BR");
      setLastSaved(`// Salvo em ${now}`);
      toast.success("Regras atualizadas com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const previewSections = () => (
    <div className="modal-body">
      {FIELDS.map((f) => {
        const text = (rules[f.id] || "").trim();
        return (
          <div key={f.id} className="preview-section" style={{ borderLeftColor: f.color }}>
            <div className="preview-label" style={{ color: f.color }}>
              {f.label}
            </div>
            {text ? <div className="preview-text">{text}</div> : <div className="preview-empty">// Campo não preenchido</div>}
          </div>
        );
      })}
    </div>
  );

  if (loading) {
    return <div className="content" style={{ display: "flex", justifyContent: "center", padding: "60px", color: "var(--accent-cyan)" }}>Carregando...</div>;
  }

  return (
    <div className="content">
      <style jsx>{`
        .page-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:22px;}
        .page-title{font-family:"Orbitron",monospace;font-size:26px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--text-primary);} .page-title span{color:var(--accent-cyan);} .page-sub{font-family:"Share Tech Mono",monospace;font-size:11px;color:var(--text-muted);letter-spacing:2px;margin-top:6px;}
        .btn-main{display:flex;align-items:center;gap:8px;padding:12px 20px;background:linear-gradient(135deg,var(--accent-cyan),var(--accent-blue));border:none;color:var(--bg-void);font-family:"Orbitron",monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;}
        .progress{display:flex;align-items:center;gap:16px;margin-bottom:18px;background:var(--bg-card);border:1px solid var(--border-dim);padding:14px 18px;} .progress-label{font-family:"Share Tech Mono",monospace;font-size:9px;color:var(--text-muted);letter-spacing:3px;} .progress-track{flex:1;height:3px;background:rgba(255,255,255,0.05);} .progress-fill{height:100%;background:linear-gradient(90deg,var(--accent-cyan),var(--accent-green));box-shadow:0 0 10px var(--accent-cyan);} .progress-pct{font-family:"Orbitron",monospace;font-size:11px;color:var(--accent-cyan);letter-spacing:1px;}
        .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px;}
        .card{background:var(--bg-card);border:1px solid var(--border-dim);padding:14px 16px;} .card-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;} .card-label{font-family:"Orbitron",monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:var(--accent-cyan);} .card-hint{font-family:"Share Tech Mono",monospace;font-size:9px;color:var(--text-dim);letter-spacing:1px;}
        .textarea{width:100%;min-height:120px;background:var(--bg-card2);border:1px solid var(--border-dim);color:var(--text-primary);font-family:'Rajdhani',sans-serif;font-size:14px;padding:10px 12px;outline:none;resize:vertical;} .textarea:focus{border-color:rgba(0,229,255,0.25);}
        .char{margin-top:6px;text-align:right;font-family:"Share Tech Mono",monospace;font-size:9px;color:var(--text-dim);} .char.filled{color:var(--text-muted);}
        .bottom{display:flex;align-items:center;justify-content:space-between;margin-top:18px;padding:16px 18px;border:1px solid var(--border-dim);background:var(--bg-card);} .bottom-info{font-family:"Share Tech Mono",monospace;font-size:9px;color:var(--text-muted);letter-spacing:2px;} .bottom-info strong{color:var(--accent-cyan);} .bottom-btns{display:flex;gap:8px;} .btn{padding:10px 16px;border:1px solid var(--border-dim);background:transparent;color:var(--text-muted);font-family:"Share Tech Mono",monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;} .btn:hover{border-color:var(--accent-cyan);color:var(--accent-cyan);} .btn.save{background:linear-gradient(135deg,var(--accent-cyan),var(--accent-blue));color:var(--bg-void);border:none;font-family:"Orbitron",monospace;}
        .modal-overlay{position:fixed;inset:0;background:rgba(2,4,8,0.9);backdrop-filter:blur(6px);display:${showPreview?"flex":"none"};align-items:center;justify-content:center;z-index:200;} .modal{background:var(--bg-card);border:1px solid var(--border-glow);width:640px;max-width:95vw;max-height:80vh;overflow:hidden;display:flex;flex-direction:column;} .modal-header{padding:14px 16px;border-bottom:1px solid var(--border-dim);display:flex;align-items:center;justify-content:space-between;} .modal-title{font-family:"Orbitron",monospace;font-size:12px;color:var(--accent-cyan);letter-spacing:3px;} .modal-body{padding:16px;overflow-y:auto;gap:14px;display:flex;flex-direction:column;} .modal-close{width:26px;height:26px;border:1px solid var(--border-dim);background:transparent;color:var(--text-muted);cursor:pointer;} .preview-section{border-left:2px solid var(--border-glow);padding-left:12px;} .preview-label{font-family:"Share Tech Mono",monospace;font-size:9px;letter-spacing:3px;text-transform:uppercase;margin-bottom:6px;} .preview-text{font-size:14px;line-height:1.6;color:var(--text-primary);white-space:pre-wrap;} .preview-empty{font-family:"Share Tech Mono",monospace;font-size:10px;color:var(--text-dim);} 
      `}</style>

      <div className="page-header">
        <div>
          <div className="page-title">Regras de <span>Envio</span></div>
          <div className="page-sub">// Edite os textos informativos que aparecem para os clientes</div>
        </div>
        <button className="btn-main" onClick={handleSave} disabled={saving}>{saving?"SALVANDO...":"SALVAR ALTERAÇÕES"}</button>
      </div>

      <div className="progress">
        <span className="progress-label">Campos Preenchidos</span>
        <div className="progress-track"><div className="progress-fill" style={{width:`${progressPct}%`}}></div></div>
        <span className="progress-pct">{filledCount} / {FIELDS.length}</span>
      </div>

      <div className="grid">
        {FIELDS.map((f)=>{
          const val=rules[f.id]||DEFAULT_RULES[f.id]||"";
          return (
            <div key={f.id} className="card">
              <div className="card-title">
                <div>
                  <div className="card-label" style={{color:f.color}}>{f.label}</div>
                  <div className="card-hint">{f.placeholder}</div>
                </div>
                <span className="card-hint" style={{color: val.trim() ? "var(--accent-green)" : "var(--text-dim)"}}>{val.trim()?"Preenchido":"Vazio"}</span>
              </div>
              <textarea className="textarea" placeholder={f.placeholder} value={val} onChange={(e)=>handleChange(f.id,e.target.value)}></textarea>
              <div className={`char ${val.length?"filled":""}`}>{val.length} caracteres</div>
            </div>
          );
        })}
      </div>

      <div className="bottom">
        <div className="bottom-info"><strong>Regras de Envio</strong><br />{lastSaved}</div>
        <div className="bottom-btns">
          <button className="btn" onClick={handleReset}>Limpar</button>
          <button className="btn" onClick={()=>setShowPreview(true)}>Preview</button>
          <button className="btn save" onClick={handleSave} disabled={saving}>Salvar</button>
        </div>
      </div>

      <div className="modal-overlay" onClick={(e)=>e.target===e.currentTarget&&setShowPreview(false)}>
        <div className="modal">
          <div className="modal-header">
            <span className="modal-title">// Preview das Regras</span>
            <button className="modal-close" onClick={()=>setShowPreview(false)}>?</button>
          </div>
          {previewSections()}
        </div>
      </div>
    </div>
  );
}


