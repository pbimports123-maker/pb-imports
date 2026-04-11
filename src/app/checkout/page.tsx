"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, ShieldCheck, Truck, Package, Copy, MessageCircle, CheckCircle } from "lucide-react";

type CartItem = {
  cart_item_id: string;
  product: { id: string; name: string; price: number; brand: string; presentation?: string; dosage?: string };
  quantity: number;
};

type ShippingRate = {
  id: string;
  region: string;
  service_type: string;
  price: number;
};

type FormData = {
  name: string;
  cpf: string;
  phone: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  zip: string;
  city: string;
  state: string;
};

type StoreSettings = {
  pix_key: string;
  pix_holder: string;
  pix_bank: string;
  whatsapp_number: string;
};

const STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem("pb_session_id");
  if (!sid) { sid = crypto.randomUUID(); localStorage.setItem("pb_session_id", sid); }
  return sid;
}

function formatCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatPhone(v: string) {
  return v.replace(/\D/g, "").slice(0, 11).replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

function formatZip(v: string) {
  return v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"dados" | "endereco" | "frete" | "pagamento" | "confirmado">("dados");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingRate | null>(null);
  const [hasInsurance, setHasInsurance] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({ pix_key: "", pix_holder: "", pix_bank: "", whatsapp_number: "" });
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState<FormData>({
    name: "", cpf: "", phone: "",
    street: "", number: "", complement: "", district: "", zip: "", city: "", state: "",
  });

  useEffect(() => { setMounted(true); }, []);

  // Carregar configurações da loja
  useEffect(() => {
    async function loadSettings() {
      const { data } = await supabase.from("store_settings").select("pix_key, pix_holder, pix_bank, whatsapp_number").maybeSingle();
      if (data) setStoreSettings({
        pix_key: data.pix_key ?? "",
        pix_holder: data.pix_holder ?? "",
        pix_bank: data.pix_bank ?? "",
        whatsapp_number: data.whatsapp_number ?? "",
      });
    }
    loadSettings();
  }, []);

  const loadCart = useCallback(async () => {
    const sid = getSessionId();
    if (!sid) return;
    try {
      setCartLoading(true);
      const { data: cart } = await supabase.from("carts").select("id").eq("session_id", sid).single();
      if (!cart) { setCartItems([]); return; }
      const { data: items } = await supabase
        .from("cart_items")
        .select("id, quantity, product:products(id, name, price, brand, presentation, dosage)")
        .eq("cart_id", cart.id);
      setCartItems((items || []).map((i: any) => ({ cart_item_id: i.id, product: i.product, quantity: i.quantity })));
    } catch { toast.error("Erro ao carregar carrinho"); }
    finally { setCartLoading(false); }
  }, []);

  useEffect(() => { if (mounted) loadCart(); }, [mounted, loadCart]);

  useEffect(() => {
    if (!form.state) { setShippingRates([]); setSelectedShipping(null); return; }
    async function loadShipping() {
      const { data } = await supabase.from("shipping_rates").select("*").eq("is_active", true);
      const filtered = (data || []).filter((r: ShippingRate) =>
        r.region.split(",").map((s: string) => s.trim()).includes(form.state)
      );
      setShippingRates(filtered);
      setSelectedShipping(null);
    }
    loadShipping();
  }, [form.state]);

  const subtotal = cartItems.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  const shippingPrice = selectedShipping ? Number(selectedShipping.price) : 0;
  const insurancePrice = hasInsurance ? subtotal * 0.15 : 0;
  const total = subtotal + shippingPrice + insurancePrice;

  const handleInput = (field: keyof FormData, raw: string) => {
    let value = raw;
    if (field === "cpf") value = formatCPF(raw);
    if (field === "phone") value = formatPhone(raw);
    if (field === "zip") value = formatZip(raw);
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === "zip") {
      const digits = raw.replace(/\D/g, "");
      if (digits.length === 8) fetchCep(digits);
    }
  };

  const fetchCep = async (cep: string) => {
    try {
      setCepLoading(true);
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) { toast.error("CEP não encontrado"); return; }
      setForm(prev => ({ ...prev, street: data.logradouro || prev.street, district: data.bairro || prev.district, city: data.localidade || prev.city, state: data.uf || prev.state }));
      toast.success("Endereço preenchido!");
    } catch { toast.error("Erro ao buscar CEP"); }
    finally { setCepLoading(false); }
  };

  const validateDados = () => {
    if (!form.name.trim()) { toast.error("Preencha o nome"); return false; }
    if (!form.cpf.trim() || form.cpf.replace(/\D/g, "").length < 11) { toast.error("CPF inválido"); return false; }
    if (!form.phone.trim()) { toast.error("Preencha o telefone"); return false; }
    return true;
  };

  const validateEndereco = () => {
    if (!form.zip.trim()) { toast.error("Preencha o CEP"); return false; }
    if (!form.street.trim()) { toast.error("Preencha o endereço"); return false; }
    if (!form.number.trim()) { toast.error("Preencha o número"); return false; }
    if (!form.district.trim()) { toast.error("Preencha o bairro"); return false; }
    if (!form.city.trim()) { toast.error("Preencha a cidade"); return false; }
    if (!form.state.trim()) { toast.error("Selecione o estado"); return false; }
    return true;
  };

  const validateFrete = () => {
    if (!selectedShipping) { toast.error("Selecione uma opção de frete"); return false; }
    return true;
  };

  const submitOrder = async () => {
    setSubmitting(true);
    try {
      const { data: order, error: orderErr } = await supabase.from("orders").insert({
        customer_name: form.name,
        customer_cpf: form.cpf,
        customer_phone: form.phone,
        address_street: form.street,
        address_number: form.number,
        address_complement: form.complement,
        address_district: form.district,
        address_zip: form.zip,
        address_city: form.city,
        address_state: form.state,
        shipping_type: selectedShipping!.service_type,
        shipping_price: shippingPrice,
        has_insurance: hasInsurance,
        insurance_price: insurancePrice,
        subtotal,
        total,
        payment_method: "pix",
        payment_status: "pending",
        status: "aguardando_pagamento",
      }).select("id").single();
      if (orderErr) throw orderErr;

      const orderItems = cartItems.map(i => ({
        order_id: order.id,
        product_id: i.product.id,
        product_name: i.product.name,
        product_brand: i.product.brand || "",
        product_presentation: (i.product as any).presentation || "",
        product_dosage: (i.product as any).dosage || "",
        product_price: Number(i.product.price),
        quantity: i.quantity,
        subtotal: Number(i.product.price) * i.quantity,
      }));
      await supabase.from("order_items").insert(orderItems);

      const sid = getSessionId();
      const { data: cart } = await supabase.from("carts").select("id").eq("session_id", sid).single();
      if (cart) await supabase.from("cart_items").delete().eq("cart_id", cart.id);

      setOrderId(order.id);
      setStep("pagamento");
    } catch (err: any) {
      toast.error("Erro ao finalizar pedido: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyPix = () => {
    navigator.clipboard.writeText(storeSettings.pix_key);
    setCopied(true);
    toast.success("Chave PIX copiada!");
    setTimeout(() => setCopied(false), 3000);
  };

  const openWhatsApp = () => {
    const seguroTexto = hasInsurance ? `\nSeguro (15%): R$ ${insurancePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "";
    const itens = cartItems.map(i => `${i.quantity}x ${i.product.name}${i.product.brand ? ` (${i.product.brand})` : ""} - R$ ${(Number(i.product.price) * i.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`).join("\n");
    const msg = `*NOVO PEDIDO - PB Imports*\n\nNome: ${form.name}\nCPF: ${form.cpf}\nTelefone: ${form.phone}\nEndereço: ${form.street}, ${form.number}${form.complement ? ` - ${form.complement}` : ""}\nBairro: ${form.district}\nCidade/Estado: ${form.city}/${form.state}\nCEP: ${form.zip}\n\n${itens}\n\nSubtotal: R$ ${subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\nFrete (${selectedShipping?.service_type}): R$ ${shippingPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\nSeguro: ${hasInsurance ? `Sim - R$ ${insurancePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Não"}\n*Total Final: R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}*`;
    const number = storeSettings.whatsapp_number.replace(/\D/g, "");
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`, "_blank");
    setTimeout(() => setStep("confirmado"), 1500);
  };

  if (!mounted || cartLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF8EF" }}>
      <div style={{ width: 40, height: 40, border: "3px solid #EDE8DA", borderTop: "3px solid #C28266", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (cartItems.length === 0 && step !== "pagamento" && step !== "confirmado") return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FAF8EF", gap: 16 }}>
      <p style={{ fontSize: 48 }}>🛒</p>
      <p style={{ fontFamily: "Raleway, sans-serif", fontSize: 20, fontWeight: 700, color: "#0D0F13" }}>Carrinho vazio</p>
      <Link href="/" style={{ padding: "12px 24px", background: "#C28266", color: "#fff", borderRadius: 10, textDecoration: "none", fontFamily: "Raleway, sans-serif", fontWeight: 600 }}>Voltar ao catálogo</Link>
    </div>
  );

  const steps = ["dados", "endereco", "frete", "pagamento"];
  const stepLabels = ["Seus Dados", "Endereço", "Frete", "Pagamento"];
  const currentStepIdx = steps.indexOf(step);

  return (
    <div style={{ minHeight: "100vh", background: "#FAF8EF", padding: "32px 16px 80px" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;600;700&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FAF8EF; font-family: "DM Sans", sans-serif; color: #0D0F13; }
      `}</style>

      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Top */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#fff", border: "1px solid rgba(194,130,102,0.25)", borderRadius: 8, color: "#7A6558", fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
            <ChevronLeft size={16} /> Voltar
          </Link>
          <h1 style={{ fontFamily: "Raleway, sans-serif", fontSize: 22, fontWeight: 700, color: "#0D0F13" }}>
            Finalizar <span style={{ color: "#C28266" }}>Pedido</span>
          </h1>
        </div>

        {/* Steps */}
        {step !== "confirmado" && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28 }}>
            {steps.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, background: i < currentStepIdx ? "#7AAF90" : i === currentStepIdx ? "#C28266" : "#EDE8DA", color: i <= currentStepIdx ? "#fff" : "#B0A090" }}>
                    {i < currentStepIdx ? "✓" : i + 1}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: i === currentStepIdx ? "#C28266" : i < currentStepIdx ? "#7AAF90" : "#B0A090", whiteSpace: "nowrap" }}>{stepLabels[i]}</span>
                </div>
                {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: "rgba(194,130,102,0.2)", margin: "0 8px" }} />}
              </div>
            ))}
          </div>
        )}

        {/* STEP: DADOS */}
        {step === "dados" && (
          <div style={{ background: "#fff", border: "1px solid rgba(194,130,102,0.18)", borderRadius: 14, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontFamily: "Raleway, sans-serif", fontSize: 15, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
              <Package size={16} color="#C28266" /> Seus Dados
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Nome Completo *", field: "name" as keyof FormData, placeholder: "Seu nome completo" },
                { label: "CPF *", field: "cpf" as keyof FormData, placeholder: "000.000.000-00" },
                { label: "Celular *", field: "phone" as keyof FormData, placeholder: "(00) 00000-0000" },
              ].map(({ label, field, placeholder }) => (
                <div key={field} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#7A6558", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
                  <input placeholder={placeholder} value={form[field]} onChange={e => handleInput(field, e.target.value)}
                    style={{ padding: "11px 14px", background: "#FAF8EF", border: "1px solid rgba(194,130,102,0.25)", borderRadius: 8, fontSize: 15, outline: "none", width: "100%" }} />
                </div>
              ))}
            </div>
            <button onClick={() => { if (validateDados()) setStep("endereco"); }}
              style={{ width: "100%", padding: 15, background: "#C28266", color: "#fff", border: "none", borderRadius: 10, fontFamily: "Raleway, sans-serif", fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 24 }}>
              Continuar →
            </button>
          </div>
        )}

        {/* STEP: ENDEREÇO */}
        {step === "endereco" && (
          <div style={{ background: "#fff", border: "1px solid rgba(194,130,102,0.18)", borderRadius: 14, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontFamily: "Raleway, sans-serif", fontSize: 15, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
              <Truck size={16} color="#C28266" /> Endereço de Entrega
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#7A6558", textTransform: "uppercase", letterSpacing: 0.5 }}>CEP *</label>
                <input placeholder="00000-000" value={form.zip} onChange={e => handleInput("zip", e.target.value)} disabled={cepLoading}
                  style={{ padding: "11px 14px", background: "#FAF8EF", border: "1px solid rgba(194,130,102,0.25)", borderRadius: 8, fontSize: 15, outline: "none", width: "100%" }} />
                {cepLoading && <span style={{ fontSize: 11, color: "#C28266" }}>🔍 Buscando endereço...</span>}
              </div>
              {[
                { label: "Endereço *", field: "street" as keyof FormData, placeholder: "Rua, Avenida..." },
                { label: "Número *", field: "number" as keyof FormData, placeholder: "123" },
                { label: "Complemento", field: "complement" as keyof FormData, placeholder: "Apto, Casa..." },
                { label: "Bairro *", field: "district" as keyof FormData, placeholder: "Bairro" },
                { label: "Cidade *", field: "city" as keyof FormData, placeholder: "Cidade" },
              ].map(({ label, field, placeholder }) => (
                <div key={field} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#7A6558", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
                  <input placeholder={placeholder} value={form[field]} onChange={e => handleInput(field, e.target.value)}
                    style={{ padding: "11px 14px", background: "#FAF8EF", border: "1px solid rgba(194,130,102,0.25)", borderRadius: 8, fontSize: 15, outline: "none", width: "100%" }} />
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#7A6558", textTransform: "uppercase", letterSpacing: 0.5 }}>Estado *</label>
                <select value={form.state} onChange={e => handleInput("state", e.target.value)}
                  style={{ padding: "11px 14px", background: "#FAF8EF", border: "1px solid rgba(194,130,102,0.25)", borderRadius: 8, fontSize: 15, outline: "none", width: "100%" }}>
                  <option value="">Selecione...</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={() => setStep("dados")}
                style={{ flex: 1, padding: 14, background: "transparent", color: "#C28266", border: "1.5px solid rgba(194,130,102,0.4)", borderRadius: 10, fontFamily: "Raleway, sans-serif", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                ← Voltar
              </button>
              <button onClick={() => { if (validateEndereco()) setStep("frete"); }}
                style={{ flex: 2, padding: 14, background: "#C28266", color: "#fff", border: "none", borderRadius: 10, fontFamily: "Raleway, sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* STEP: FRETE */}
        {step === "frete" && (
          <div style={{ background: "#fff", border: "1px solid rgba(194,130,102,0.18)", borderRadius: 14, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, fontFamily: "Raleway, sans-serif", fontSize: 15, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
              <Truck size={16} color="#C28266" /> Opções de Frete
            </div>

            {shippingRates.length === 0 ? (
              <p style={{ fontSize: 13, color: "#B0A090", textAlign: "center", padding: "20px 0" }}>Nenhuma opção disponível para {form.state}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {shippingRates.map(rate => (
                  <label key={rate.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", border: `1.5px solid ${selectedShipping?.id === rate.id ? "#C28266" : "rgba(194,130,102,0.2)"}`, borderRadius: 10, cursor: "pointer", background: selectedShipping?.id === rate.id ? "rgba(194,130,102,0.04)" : "#fff" }}>
                    <input type="radio" name="shipping" checked={selectedShipping?.id === rate.id} onChange={() => setSelectedShipping(rate)} style={{ accentColor: "#C28266" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{rate.service_type} (sem seguro)</div>
                      <div style={{ fontSize: 12, color: "#A8978E", marginTop: 2 }}>Envio padrão</div>
                    </div>
                    <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 15, fontWeight: 700, color: "#C28266" }}>
                      R$ {Number(rate.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Seguro */}
            <div style={{ marginTop: 16 }}>
              <label style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 16, border: `1.5px solid ${hasInsurance ? "#C28266" : "rgba(194,130,102,0.2)"}`, borderRadius: 10, cursor: "pointer", background: hasInsurance ? "rgba(194,130,102,0.04)" : "#fff" }}>
                <input type="checkbox" checked={hasInsurance} onChange={e => setHasInsurance(e.target.checked)} style={{ accentColor: "#C28266", width: 18, height: 18, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>🔒 Adicionar Seguro</div>
                  <div style={{ fontSize: 12, color: "#7A6558", marginTop: 4, lineHeight: 1.5 }}>Garante reenvio em caso de extravio. Com seguro, envio somente via Transportadora.</div>
                  {hasInsurance && <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 13, fontWeight: 700, color: "#C28266", marginTop: 6 }}>+ R$ {insurancePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (15% do subtotal)</div>}
                </div>
              </label>
            </div>

            {/* Resumo */}
            <div style={{ marginTop: 20, padding: 16, background: "#FAF8EF", borderRadius: 10, border: "1px solid rgba(194,130,102,0.15)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}><span style={{ color: "#7A6558" }}>Subtotal produtos</span><strong>R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}><span style={{ color: "#7A6558" }}>Frete</span><strong>{selectedShipping ? `R$ ${shippingPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</strong></div>
              {hasInsurance && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}><span style={{ color: "#7A6558" }}>Seguro (15%)</span><strong>R$ {insurancePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>}
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Raleway, sans-serif", fontSize: 18, fontWeight: 700, marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(194,130,102,0.15)" }}>
                <span>Total</span><strong style={{ color: "#9E6650" }}>R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setStep("endereco")}
                style={{ flex: 1, padding: 14, background: "transparent", color: "#C28266", border: "1.5px solid rgba(194,130,102,0.4)", borderRadius: 10, fontFamily: "Raleway, sans-serif", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
                ← Voltar
              </button>
              <button onClick={() => { if (validateFrete()) submitOrder(); }} disabled={submitting}
                style={{ flex: 2, padding: 14, background: "#C28266", color: "#fff", border: "none", borderRadius: 10, fontFamily: "Raleway, sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: submitting ? 0.6 : 1 }}>
                {submitting ? "Gerando pedido..." : "Confirmar Pedido →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP: PAGAMENTO */}
        {step === "pagamento" && (
          <div style={{ background: "#fff", border: "1px solid rgba(194,130,102,0.18)", borderRadius: 14, padding: 24 }}>
            {/* Resumo */}
            <div style={{ marginBottom: 24, padding: 16, background: "#FAF8EF", borderRadius: 10, border: "1px solid rgba(194,130,102,0.15)" }}>
              <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12, color: "#7A6558" }}>Resumo do Pedido</div>
              {cartItems.map(i => (
                <div key={i.cart_item_id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span>{i.quantity}x {i.product.name}</span>
                  <strong>R$ {(Number(i.product.price) * i.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                </div>
              ))}
              <div style={{ borderTop: "1px solid rgba(194,130,102,0.15)", marginTop: 10, paddingTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span style={{ color: "#7A6558" }}>Subtotal</span><strong>R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span style={{ color: "#7A6558" }}>Frete ({selectedShipping?.service_type})</span><strong>R$ {shippingPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>
                {hasInsurance && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span style={{ color: "#7A6558" }}>Seguro (15%)</span><strong>R$ {insurancePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Raleway, sans-serif", fontSize: 20, fontWeight: 700, marginTop: 8 }}>
                  <span>TOTAL</span><strong style={{ color: "#9E6650" }}>R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                </div>
              </div>
            </div>

            {/* PIX */}
            <div style={{ padding: 20, background: "#fff", border: "1px solid rgba(194,130,102,0.2)", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontFamily: "Raleway, sans-serif", fontSize: 14, fontWeight: 700, color: "#0D0F13" }}>
                💳 Pagamento via PIX
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#A8978E", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Chave PIX (CNPJ)</div>
                <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 20, fontWeight: 700, color: "#0D0F13", letterSpacing: 1 }}>{storeSettings.pix_key || "—"}</div>
              </div>
              {storeSettings.pix_holder && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#A8978E", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Titular</div>
                  <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 15, fontWeight: 700 }}>{storeSettings.pix_holder}</div>
                </div>
              )}
              <div style={{ padding: "10px 14px", background: "rgba(212,169,106,0.1)", border: "1px solid rgba(212,169,106,0.3)", borderRadius: 8, fontSize: 12, color: "#8A6830", marginBottom: 16 }}>
                ⚠️ Use esta chave <strong>somente para este pedido</strong>. Ela pode ser alterada a qualquer momento.
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#A8978E", marginBottom: 4 }}>Valor a pagar</div>
                  <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 24, fontWeight: 700, color: "#C28266" }}>R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                </div>
                <button onClick={copyPix} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: copied ? "rgba(122,175,144,0.1)" : "#FAF8EF", border: `1px solid ${copied ? "rgba(122,175,144,0.4)" : "rgba(194,130,102,0.25)"}`, borderRadius: 8, cursor: "pointer", fontSize: 13, color: copied ? "#5A8F70" : "#7A6558", fontWeight: 600 }}>
                  {copied ? <CheckCircle size={14} /> : <Copy size={14} />} {copied ? "Copiado!" : "Copiar chave"}
                </button>
              </div>
            </div>

            {/* Como Finalizar */}
            <div style={{ padding: 20, background: "#FAF8EF", borderRadius: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#A8978E", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Como Finalizar</div>
              {[
                { n: 1, text: "Copie a chave PIX acima e realize o pagamento pelo app do seu banco" },
                { n: 2, text: "Clique em Finalizar Pedido abaixo para enviar os dados do pedido via WhatsApp" },
                { n: 3, text: "Na conversa do WhatsApp, envie o comprovante de pagamento para confirmar" },
              ].map(({ n, text }) => (
                <div key={n} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#C28266", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{n}</div>
                  <span style={{ fontSize: 13, color: "#3A2E28", lineHeight: 1.5 }}>{text.split("realize o pagamento").map((part, i) => i === 0 ? <span key={i}>{part}<strong>realize o pagamento</strong></span> : <span key={i}>{part}</span>)}</span>
                </div>
              ))}
            </div>

            <button onClick={openWhatsApp}
              style={{ width: "100%", padding: 16, background: "#25D366", color: "#fff", border: "none", borderRadius: 12, fontFamily: "Raleway, sans-serif", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 10 }}>
              <MessageCircle size={20} /> Finalizar Pedido via WhatsApp
            </button>
            <button onClick={() => router.push("/")}
              style={{ width: "100%", padding: 12, background: "transparent", color: "#7A6558", border: "1px solid rgba(194,130,102,0.25)", borderRadius: 10, fontFamily: "Raleway, sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Voltar
            </button>
          </div>
        )}

        {/* STEP: CONFIRMADO */}
        {step === "confirmado" && (
          <div style={{ background: "#fff", border: "1px solid rgba(194,130,102,0.18)", borderRadius: 14, padding: 40, textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(122,175,144,0.15)", border: "2px solid #7AAF90", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <CheckCircle size={32} color="#7AAF90" />
            </div>
            <h2 style={{ fontFamily: "Raleway, sans-serif", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Pedido finalizado!</h2>
            <p style={{ fontSize: 14, color: "#7A6558", marginBottom: 6 }}>Seu pedido foi enviado para o WhatsApp do vendedor.</p>
            <p style={{ fontSize: 14, color: "#7A6558", marginBottom: 24 }}>Aguarde a confirmação.</p>
            <div style={{ fontFamily: "Raleway, sans-serif", fontSize: 20, fontWeight: 700, color: "#C28266", marginBottom: 28 }}>
              Total: R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => router.push("/")}
                style={{ padding: "12px 24px", background: "transparent", color: "#7A6558", border: "1px solid rgba(194,130,102,0.3)", borderRadius: 10, fontFamily: "Raleway, sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Ver Produtos
              </button>
              <button onClick={() => { setStep("dados"); setForm({ name: "", cpf: "", phone: "", street: "", number: "", complement: "", district: "", zip: "", city: "", state: "" }); setSelectedShipping(null); setHasInsurance(false); }}
                style={{ padding: "12px 24px", background: "#C28266", color: "#fff", border: "none", borderRadius: 10, fontFamily: "Raleway, sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                Novo Pedido
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
