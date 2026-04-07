"use client";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Download, FileSpreadsheet, CheckCircle, XCircle, AlertCircle, X } from "lucide-react";
import * as XLSX from "xlsx";

type ImportRow = {
  name: string;
  brand: string;
  category_name?: string;
  presentation?: string;
  dosage?: string;
  price: number;
  old_price?: number;
  stock: number;
  description?: string;
  detailed_description?: string;
  image_url?: string;
  usage_mode?: string;
  contraindications?: string;
  active_ingredient?: string;
  rating?: number;
  is_out_of_stock?: boolean;
  is_active?: boolean;
};

type ImportResult = {
  row: number;
  name: string;
  status: "created" | "updated" | "error";
  message?: string;
};

export default function ImportExcelModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");

  // ── Lê o Excel ─────────────────────────────────────────────
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const allRows: ImportRow[] = [];

        // Lê todas as abas
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[];

          // Mapeamento de categorias da planilha → banco
          const CAT_MAP: Record<string, string> = {
            "tirzepatida":              "Emagrecedores",
            "retatrutide":              "Emagrecedores",
            "emagrecedores":            "Emagrecedores",
            "mais itens":               "Emagrecedores",
            "farmácia + manipulados":   "Farmácia + Manipulados",
            "farmacia + manipulados":   "Farmácia + Manipulados",
            "marcas importadas":        "Marcas Importadas",
            "marcas premium":           "Marcas Premium",
            "peptídeos":                "Peptídeos",
            "peptideos":                "Peptídeos",
            "sarms + produtos variados":"SARMS + Produtos Variados",
            "estética":                 "ESTÉTICA",
            "estetica":                 "ESTÉTICA",
          };

          rows.forEach((row) => {
            // Suporta tanto o formato novo (sua planilha real) quanto o modelo
            const name = String(
              row["Nome do Produto"] || row["Nome"] || row["name"] || ""
            ).trim();

            if (!name) return;

            const rawCategory = String(
              row["Categoria"] || row["category_name"] || ""
            ).trim() || sheetName;

            const category = CAT_MAP[rawCategory.toLowerCase()] || rawCategory;

            const brand = String(
              row["Marca"] || row["brand"] || ""
            ).trim();

            const presentation = String(
              row["Apresentação"] || row["Apresentacao"] || row["presentation"] || ""
            ).trim() || undefined;

            const dosage = String(
              row["Dosagem"] || row["dosage"] || ""
            ).trim() || undefined;

            const priceRaw = row["Preço de Venda"] || row["Preço"] || row["price"] || "0";
            const price = parseFloat(String(priceRaw).replace(/[^\d.,]/g, "").replace(",", ".")) || 0;

            const oldPriceRaw = row["Preço Antigo"] || row["old_price"] || "";
            const old_price = oldPriceRaw ? parseFloat(String(oldPriceRaw).replace(/[^\d.,]/g, "").replace(",", ".")) : undefined;

            const stock = parseInt(String(row["Estoque"] || row["stock"] || "0")) || 0;

            allRows.push({
              name,
              brand,
              category_name: category,
              presentation,
              dosage,
              price,
              old_price,
              stock,
              description: String(row["Descrição"] || row["description"] || "").trim() || undefined,
              detailed_description: String(row["Descrição Detalhada"] || row["detailed_description"] || "").trim() || undefined,
              image_url: String(row["URL Imagem"] || row["image_url"] || "").trim() || undefined,
              usage_mode: String(row["Modo de Uso"] || row["usage_mode"] || "").trim() || undefined,
              contraindications: String(row["Contraindicações"] || row["contraindications"] || "").trim() || undefined,
              active_ingredient: String(row["Princípio Ativo"] || row["active_ingredient"] || "").trim() || undefined,
              rating: row["Avaliação"] || row["rating"] ? parseFloat(String(row["Avaliação"] || row["rating"])) : undefined,
              is_out_of_stock: String(row["Em Falta"] || row["is_out_of_stock"] || "").toLowerCase() === "sim" || String(row["is_out_of_stock"]) === "true",
              is_active: String(row["Ativo"] || row["is_active"] || "sim").toLowerCase() !== "não" && String(row["is_active"]) !== "false",
            });
          });
        });

        setPreview(allRows);
        setStep("preview");
      } catch (err) {
        toast.error("Erro ao ler o arquivo. Verifique se é um .xlsx válido.");
      }
    };
    reader.readAsArrayBuffer(f);
  };

  // ── Importa para o Supabase ─────────────────────────────────
  const handleImport = async () => {
    if (!preview.length) return;
    setImporting(true);
    const res: ImportResult[] = [];

    // Busca categorias existentes
    const { data: cats } = await supabase.from("categories").select("id, name");
    const catMap = new Map((cats || []).map(c => [c.name.toLowerCase(), c.id]));

    // Coleta categorias novas que precisam ser criadas
    const newCatNames = [...new Set(
      preview
        .map(r => r.category_name?.trim())
        .filter(Boolean)
        .filter(n => !catMap.has(n!.toLowerCase()))
    )];

    // Cria categorias novas automaticamente
    if (newCatNames.length > 0) {
      const sortStart = (cats?.length || 0) + 1;
      const newCats = newCatNames.map((name, i) => ({
        name,
        acronym: name!.slice(0, 2).toUpperCase(),
        color: ["#C28266","#7AAF90","#D4A96A","#8AAFC2","#C0614F","#9E6650","#A8C4B0"][i % 7],
        sort_order: sortStart + i,
      }));
      const { data: created, error: catErr } = await supabase
        .from("categories").insert(newCats).select("id, name");
      if (!catErr && created) {
        created.forEach(c => catMap.set(c.name.toLowerCase(), c.id));
      }
    }

    // Busca produtos existentes para upsert por nome + marca + apresentação
    const { data: existingProds } = await supabase.from("products").select("id, name, brand, presentation");
    const prodMap = new Map(
      (existingProds || []).map(p => [
        `${p.name?.toLowerCase().trim()}|${p.brand?.toLowerCase().trim()}|${p.presentation?.toLowerCase().trim() || ""}`,
        p.id
      ])
    );

    for (let i = 0; i < preview.length; i++) {
      const row = preview[i];
      try {
        const category_id = row.category_name ? catMap.get(row.category_name.toLowerCase()) : undefined;

        const payload: any = {
          name: row.name,
          brand: row.brand,
          price: row.price,
          stock: row.stock,
          is_active: row.is_active ?? true,
          is_out_of_stock: row.is_out_of_stock ?? row.stock <= 0,
        };

        if (category_id) payload.category_id = category_id;
        if (row.presentation) payload.presentation = row.presentation;
        if (row.dosage) payload.dosage = row.dosage;
        if (row.old_price !== undefined) payload.old_price = row.old_price;
        if (row.description) payload.description = row.description;
        if (row.detailed_description) payload.detailed_description = row.detailed_description;
        if (row.image_url) payload.image_url = row.image_url;
        if (row.usage_mode) payload.usage_mode = row.usage_mode;
        if (row.contraindications) payload.contraindications = row.contraindications;
        if (row.active_ingredient) payload.active_ingredient = row.active_ingredient;
        if (row.rating !== undefined) payload.rating = row.rating;

        const existingId = prodMap.get(
          `${row.name.toLowerCase().trim()}|${row.brand?.toLowerCase().trim() || ""}|${row.presentation?.toLowerCase().trim() || ""}`
        );

        if (existingId) {
          // Atualiza produto existente
          const { error } = await supabase.from("products").update(payload).eq("id", existingId);
          if (error) throw error;
          res.push({ row: i + 2, name: row.name, status: "updated" });
        } else {
          // Cria novo produto
          const { error } = await supabase.from("products").insert([payload]);
          if (error) throw error;
          res.push({ row: i + 2, name: row.name, status: "created" });
        }
      } catch (err: any) {
        res.push({ row: i + 2, name: row.name, status: "error", message: err.message });
      }
    }

    setResults(res);
    setStep("done");
    setImporting(false);

    const created = res.filter(r => r.status === "created").length;
    const updated = res.filter(r => r.status === "updated").length;
    const errors = res.filter(r => r.status === "error").length;

    if (errors === 0) {
      toast.success(`✅ ${created} criados · ${updated} atualizados`);
    } else {
      toast.error(`⚠️ ${errors} erro(s) — ${created} criados · ${updated} atualizados`);
    }
  };

  // ── Gera planilha modelo ────────────────────────────────────
  const downloadTemplate = () => {
    const headers = [
      "Nome", "Marca", "Categoria", "Apresentação", "Dosagem",
      "Preço", "Preço Antigo", "Estoque",
      "Descrição", "Descrição Detalhada", "URL Imagem",
      "Modo de Uso", "Contraindicações", "Princípio Ativo",
      "Avaliação", "Em Falta", "Ativo"
    ];
    const example = [
      "Tirzepatida 5mg", "ZPHCD", "Tirzepatida", "4 doses de 5mg", "5mg",
      "330", "", "10",
      "Descrição curta", "Descrição longa", "",
      "", "", "Tirzepatida",
      "5", "não", "sim"
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    ws["!cols"] = headers.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos");
    XLSX.writeFile(wb, "modelo_produtos_pb_imports.xlsx");
    toast.success("Planilha modelo baixada!");
  };

  const created = results.filter(r => r.status === "created").length;
  const updated = results.filter(r => r.status === "updated").length;
  const errors = results.filter(r => r.status === "error").length;

  return (
    <div className="imp-overlay">
      <div className="imp-modal">
        <style jsx>{`
          .imp-overlay { position: fixed; inset: 0; background: rgba(13,15,19,0.5); display: flex; align-items: center; justify-content: center; z-index: 400; backdrop-filter: blur(6px); }
          .imp-modal { background: #fff; border: 1px solid rgba(194,130,102,0.2); border-radius: 16px; width: 680px; max-width: 96vw; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(194,130,102,0.18); overflow: hidden; }
          .imp-head { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid rgba(194,130,102,0.1); }
          .imp-title { font-family: "Raleway", sans-serif; font-size: 18px; font-weight: 700; color: var(--accent-terra-dark); display: flex; align-items: center; gap: 10px; }
          .imp-close { width: 32px; height: 32px; border: 1px solid rgba(194,130,102,0.2); border-radius: 8px; background: transparent; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
          .imp-close:hover { border-color: #C0614F; color: #C0614F; }
          .imp-body { padding: 24px; overflow-y: auto; flex: 1; }

          /* Step upload */
          .template-btn { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: transparent; border: 1.5px solid rgba(194,130,102,0.35); border-radius: 8px; color: var(--accent-terra); font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-bottom: 20px; }
          .template-btn:hover { background: rgba(194,130,102,0.06); }
          .upload-zone { border: 2px dashed rgba(194,130,102,0.3); border-radius: 12px; padding: 40px 24px; text-align: center; cursor: pointer; transition: all 0.2s; background: #FAF8EF; }
          .upload-zone:hover { border-color: var(--accent-terra); background: rgba(194,130,102,0.04); }
          .upload-icon { width: 56px; height: 56px; background: rgba(194,130,102,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; color: var(--accent-terra); }
          .upload-title { font-family: "Raleway", sans-serif; font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
          .upload-sub { font-size: 13px; color: var(--text-muted); }
          .upload-file-name { margin-top: 10px; font-size: 12px; color: var(--accent-terra); font-weight: 600; }
          .instructions { margin-top: 20px; background: rgba(138,175,200,0.08); border: 1px solid rgba(138,175,200,0.25); border-radius: 10px; padding: 14px 16px; }
          .inst-title { font-size: 12px; font-weight: 700; color: #4A7A9B; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
          .inst-list { font-size: 12px; color: var(--text-muted); line-height: 1.8; padding-left: 16px; }

          /* Preview */
          .preview-info { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: rgba(122,175,144,0.08); border: 1px solid rgba(122,175,144,0.25); border-radius: 8px; margin-bottom: 16px; font-size: 13px; color: #5A8F70; font-weight: 500; }
          .preview-table { width: 100%; border-collapse: collapse; font-size: 12px; }
          .preview-table th { padding: 8px 12px; text-align: left; font-weight: 700; color: var(--text-muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid rgba(194,130,102,0.1); background: rgba(194,130,102,0.04); }
          .preview-table td { padding: 8px 12px; border-bottom: 1px solid rgba(194,130,102,0.06); color: var(--text-primary); }
          .preview-table tr:last-child td { border-bottom: none; }
          .preview-wrap { max-height: 280px; overflow-y: auto; border: 1px solid rgba(194,130,102,0.15); border-radius: 8px; }
          .preview-wrap::-webkit-scrollbar { width: 4px; }
          .preview-wrap::-webkit-scrollbar-thumb { background: rgba(194,130,102,0.3); border-radius: 4px; }

          /* Results */
          .results-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
          .result-stat { padding: 14px; border-radius: 10px; text-align: center; }
          .result-stat.created { background: rgba(122,175,144,0.1); border: 1px solid rgba(122,175,144,0.3); }
          .result-stat.updated { background: rgba(194,130,102,0.08); border: 1px solid rgba(194,130,102,0.25); }
          .result-stat.errored { background: rgba(192,97,79,0.08); border: 1px solid rgba(192,97,79,0.25); }
          .stat-num { font-family: "Raleway", sans-serif; font-size: 28px; font-weight: 700; }
          .result-stat.created .stat-num { color: #5A8F70; }
          .result-stat.updated .stat-num { color: var(--accent-terra-dark); }
          .result-stat.errored .stat-num { color: #C0614F; }
          .stat-label { font-size: 11px; font-weight: 600; color: var(--text-muted); margin-top: 2px; }
          .results-list { max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
          .result-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; font-size: 13px; }
          .result-item.created { background: rgba(122,175,144,0.06); }
          .result-item.updated { background: rgba(194,130,102,0.06); }
          .result-item.error { background: rgba(192,97,79,0.06); }
          .result-name { flex: 1; font-weight: 500; color: var(--text-primary); }
          .result-msg { font-size: 11px; color: #C0614F; }

          /* Footer */
          .imp-foot { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 24px; border-top: 1px solid rgba(194,130,102,0.1); }
          .btn-cancel { padding: 10px 18px; border: 1px solid rgba(194,130,102,0.25); border-radius: 8px; background: transparent; color: var(--text-muted); font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 600; cursor: pointer; }
          .btn-cancel:hover { border-color: var(--accent-terra); color: var(--accent-terra); }
          .btn-primary { padding: 10px 22px; background: var(--accent-terra); border: none; border-radius: 8px; color: #fff; font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
          .btn-primary:hover { background: var(--accent-terra-dark); }
          .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        `}</style>

        {/* Header */}
        <div className="imp-head">
          <div className="imp-title">
            <FileSpreadsheet size={20} />
            Importar Produtos via Excel
          </div>
          <button className="imp-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="imp-body">

          {/* ── Step 1: Upload ── */}
          {step === "upload" && (
            <>
              <button className="template-btn" onClick={downloadTemplate}>
                <Download size={15} /> Baixar planilha modelo
              </button>

              <div className="upload-zone" onClick={() => fileRef.current?.click()}>
                <div className="upload-icon"><Upload size={24} /></div>
                <div className="upload-title">Clique para selecionar o arquivo</div>
                <div className="upload-sub">Suporta arquivos .xlsx e .xls</div>
                {file && <div className="upload-file-name">📎 {file.name}</div>}
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleFile} />

              <div className="instructions">
                <div className="inst-title"><AlertCircle size={14} /> Instruções</div>
                <ul className="inst-list">
                  <li>Baixe a planilha modelo e preencha os dados</li>
                  <li>A coluna <strong>Nome</strong> é obrigatória e é usada para identificar o produto</li>
                  <li>Produtos com nome já existente serão <strong>atualizados</strong></li>
                  <li>Produtos novos serão <strong>criados</strong> automaticamente</li>
                  <li>A coluna <strong>Categoria</strong> deve ter o nome exato cadastrado no sistema</li>
                  <li>Em Falta: escreva <strong>sim</strong> ou <strong>não</strong></li>
                  <li>Ativo: escreva <strong>sim</strong> ou <strong>não</strong></li>
                </ul>
              </div>
            </>
          )}

          {/* ── Step 2: Preview ── */}
          {step === "preview" && (
            <>
              <div className="preview-info">
                <CheckCircle size={16} />
                {preview.length} produto(s) encontrado(s) na planilha. Revise antes de importar.
              </div>
              <div className="preview-wrap">
                <table className="preview-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nome</th>
                      <th>Marca</th>
                      <th>Categoria</th>
                      <th>Apresentação</th>
                      <th>Dosagem</th>
                      <th>Preço</th>
                      <th>Estoque</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i}>
                        <td style={{ color: "var(--text-muted)" }}>{i + 2}</td>
                        <td style={{ fontWeight: 600 }}>{row.name || <span style={{ color: "#C0614F" }}>⚠ Vazio</span>}</td>
                        <td>{row.brand}</td>
                        <td>{row.category_name || "—"}</td>
                        <td>{row.presentation || "—"}</td>
                        <td>{row.dosage || "—"}</td>
                        <td>R$ {row.price.toFixed(2).replace(".", ",")}</td>
                        <td>{row.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ── Step 3: Done ── */}
          {step === "done" && (
            <>
              <div className="results-summary">
                <div className="result-stat created">
                  <div className="stat-num">{created}</div>
                  <div className="stat-label">Criados</div>
                </div>
                <div className="result-stat updated">
                  <div className="stat-num">{updated}</div>
                  <div className="stat-label">Atualizados</div>
                </div>
                <div className="result-stat errored">
                  <div className="stat-num">{errors}</div>
                  <div className="stat-label">Erros</div>
                </div>
              </div>
              <div className="results-list">
                {results.map((r, i) => (
                  <div key={i} className={`result-item ${r.status}`}>
                    {r.status === "created" && <CheckCircle size={14} color="#5A8F70" />}
                    {r.status === "updated" && <CheckCircle size={14} color="#C28266" />}
                    {r.status === "error" && <XCircle size={14} color="#C0614F" />}
                    <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 24 }}>L{r.row}</span>
                    <span className="result-name">{r.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: r.status === "created" ? "#5A8F70" : r.status === "updated" ? "#C28266" : "#C0614F" }}>
                      {r.status === "created" ? "Criado" : r.status === "updated" ? "Atualizado" : "Erro"}
                    </span>
                    {r.message && <span className="result-msg">{r.message}</span>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="imp-foot">
          {step === "upload" && (
            <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          )}
          {step === "preview" && (
            <>
              <button className="btn-cancel" onClick={() => { setStep("upload"); setPreview([]); setFile(null); }}>
                Voltar
              </button>
              <button className="btn-primary" onClick={handleImport} disabled={importing}>
                <Upload size={15} />
                {importing ? `Importando ${preview.length} produto(s)...` : `Importar ${preview.length} produto(s)`}
              </button>
            </>
          )}
          {step === "done" && (
            <button className="btn-primary" onClick={() => { onClose(); onDone(); }}>
              <CheckCircle size={15} /> Concluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}