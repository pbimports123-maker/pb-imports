"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChevronLeft, ShieldCheck, Truck, Package, AlertCircle, Tag, X, CheckCircle } from "lucide-react";

type CartItem = {
  cart_item_id: string;
  product: { id: string; name: string; price: number; brand: string };
  quantity: number;
};

type ShippingRate = {
  id: string;
  region: string;
  service_type: string;
  price: number;
};

type Coupon = {
  id: string;
  code: string;
  type: "free_shipping" | "percentage";
  value: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
};

type FormData = {
  name: string;
  cpf: string;
  phone: string;
  email: string;
  birthdate: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  zip: string;
  city: string;
  state: string;
};

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO"
];

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = localStorage.getItem("pb_session_id");
  if (!sid) { sid = crypto.randomUUID(); localStorage.setItem("pb_session_id", sid); }
  return sid;
}

function formatCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatPhone(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function formatZip(v: string) {
  return v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartLoading, setCartLoading] = useState(true);
  const [allShippingRates, setAllShippingRates] = useState<ShippingRate[]>([]);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingRate | null>(null);
  const [hasInsurance, setHasInsurance] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "summary">("form");
  const [cepLoading, setCepLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Cupom
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const [form, setForm] = useState<FormData>({
    name: "", cpf: "", phone: "", email: "", birthdate: "",
    street: "", number: "", complement: "",
    district: "", zip: "", city: "", state: "",
  });

  useEffect(() => { setMounted(true); }, []);

  const loadCart = useCallback(async () => {
    const sid = getSessionId();
    if (!sid) return;
    try {
      setCartLoading(true);
      const { data: cart } = await supabase
        .from("carts").select("id").eq("session_id", sid).single();
      if (!cart) { setCartItems([]); return; }
      const { data: items } = await supabase
        .from("cart_items")
        .select("id, quantity, product:products(id, name, price, brand)")
        .eq("cart_id", cart.id);
      setCartItems((items || []).map((i: any) => ({
        cart_item_id: i.id,
        product: i.product,
        quantity: i.quantity,
      })));
    } catch (err) {
      toast.error("Erro ao carregar carrinho");
    } finally {
      setCartLoading(false);
    }
  }, []);

  useEffect(() => { if (mounted) loadCart(); }, [mounted, loadCart]);

  useEffect(() => {
    if (!form.state) { setAllShippingRates([]); setShippingRates([]); setSelectedShipping(null); return; }
    async function loadShipping() {
      const { data, error } = await supabase
        .from("shipping_rates").select("*").eq("is_active", true);
      if (error) { toast.error("Erro ao buscar fretes"); return; }
      const filtered = (data || []).filter((r: ShippingRate) =>
        r.region.split(",").map((s: string) => s.trim()).includes(form.state)
      );
      setAllShippingRates(filtered);
      setSelectedShipping(null);
    }
    loadShipping();
  }, [form.state]);

  useEffect(() => {
    if (hasInsurance) {
      const only = allShippingRates.filter((r) =>
        r.service_type.toLowerCase().includes("transportadora") ||
        r.service_type.toLowerCase().includes("transportadoras")
      );
      setShippingRates(only);
    } else {
      setShippingRates(allShippingRates);
    }
    setSelectedShipping(null);
  }, [hasInsurance, allShippingRates]);

  const subtotal = cartItems.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  const shippingPrice = selectedShipping ? Number(selectedShipping.price) : 0;
  const insurancePrice = hasInsurance ? subtotal * 0.15 : 0;

  const couponDiscount = (() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "free_shipping") return shippingPrice;
    if (appliedCoupon.type === "percentage") return subtotal * (appliedCoupon.value / 100);
    return 0;
  })();

  const shippingFinal = appliedCoupon?.type === "free_shipping" ? 0 : shippingPrice;
  const total = subtotal + shippingFinal + insurancePrice - (appliedCoupon?.type === "percentage" ? couponDiscount : 0);

  const fetchCep = async (cep: string) => {
    try {
      setCepLoading(true);
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (data.erro) { toast.error("CEP não encontrado"); return; }
      setForm((prev) => ({
        ...prev,
        street: data.logradouro || prev.street,
        district: data.bairro || prev.district,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }));
      toast.success("Endereço preenchido automaticamente!");
    } catch {
      toast.error("Erro ao buscar CEP");
    } finally {
      setCepLoading(false);
    }
  };

  const handleInput = (field: keyof FormData, raw: string) => {
    let value = raw;
    if (field === "cpf") value = formatCPF(raw);
    if (field === "phone") value = formatPhone(raw);
    if (field === "zip") value = formatZip(raw);
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "zip") {
      const digits = raw.replace(/\D/g, "");
      if (digits.length === 8) fetchCep(digits);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .single();
      if (error || !data) { toast.error("Cupom inválido ou não encontrado"); return; }
      if (data.max_uses !== null && data.used_count >= data.max_uses) { toast.error("Cupom esgotado"); return; }
      setAppliedCoupon(data);
      toast.success(data.type === "free_shipping" ? "🎉 Frete grátis aplicado!" : `🎉 Desconto de ${data.value}% aplicado!`);
    } catch {
      toast.error("Erro ao validar cupom");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.success("Cupom removido");
  };

  const validateForm = () => {
    const required: (keyof FormData)[] = ["name","cpf","phone","email","birthdate","street","number","district","zip","city","state"];
    for (const f of required) {
      if (!form[f].trim()) {
        toast.error(`Preencha o campo: ${fieldLabel(f)}`);
        return false;
      }
    }
    // Valida e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error("Digite um e-mail válido");
      return false;
    }
    if (!selectedShipping) { toast.error("Selecione uma opção de frete"); return false; }
    if (cartItems.length === 0) { toast.error("Seu carrinho está vazio"); return false; }
    if (!acceptedTerms) { toast.error("Você precisa aceitar as regras de envio para continuar"); return false; }
    return true;
  };

  const fieldLabel = (f: keyof FormData) => ({
    name: "Nome", cpf: "CPF", phone: "Telefone", email: "E-mail",
    birthdate: "Data de nascimento", street: "Endereço", number: "Número",
    complement: "Complemento", district: "Bairro", zip: "CEP", city: "Cidade", state: "Estado",
  }[f]);

  const goToSummary = () => { if (validateForm()) setStep("summary"); };

  const submitOrder = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_name: form.name,
          customer_cpf: form.cpf,
          customer_phone: form.phone,
          customer_email: form.email,
          customer_birthdate: form.birthdate,
          address_street: form.street,
          address_number: form.number,
          address_complement: form.complement,
          address_district: form.district,
          address_zip: form.zip,
          address_city: form.city,
          address_state: form.state,
          shipping_type: selectedShipping!.service_type,
          shipping_price: shippingFinal,
          has_insurance: hasInsurance,
          insurance_price: insurancePrice,
          subtotal,
          total,
          payment_method: "pix",
          payment_status: "pending",
          coupon_code: appliedCoupon?.code || null,
          coupon_discount: couponDiscount || null,
        })
        .select("id")
        .single();
      if (orderErr) throw orderErr;

      if (appliedCoupon) {
        await supabase.from("coupons").update({ used_count: appliedCoupon.used_count + 1 }).eq("id", appliedCoupon.id);
      }

      const orderItems = cartItems.map((i) => ({
        order_id: order.id,
        product_id: i.product.id,
        product_name: i.product.name,
        product_price: Number(i.product.price),
        quantity: i.quantity,
        subtotal: Number(i.product.price) * i.quantity,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;

      const sid = getSessionId();
      const { data: cart } = await supabase.from("carts").select("id").eq("session_id", sid).single();
      if (cart) await supabase.from("cart_items").delete().eq("cart_id", cart.id);

      router.push(`/pedido/${order.id}`);
    } catch (err: any) {
      toast.error("Erro ao finalizar pedido: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || cartLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF8EF" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #EDE8DA", borderTop: "3px solid #C28266", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (cartItems.length === 0 && !cartLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FAF8EF", gap: 16 }}>
        <p style={{ fontSize: 48 }}>🛒</p>
        <p style={{ fontFamily: "Raleway, sans-serif", fontSize: 20, fontWeight: 700, color: "#0D0F13" }}>Carrinho vazio</p>
        <Link href="/" style={{ padding: "12px 24px", background: "#C28266", color: "#fff", borderRadius: 10, textDecoration: "none", fontFamily: "Raleway, sans-serif", fontWeight: 600 }}>
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="co-root">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #FAF8EF; font-family: "DM Sans", sans-serif; color: #0D0F13; }
      `}</style>

      <style jsx>{`
        .co-root { min-height: 100vh; background: #FAF8EF; padding: 32px 16px 80px; }
        .co-wrap { max-width: 980px; margin: 0 auto; }
        .co-top { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
        .back-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: #fff; border: 1px solid rgba(194,130,102,0.25); border-radius: 8px; color: #7A6558; font-size: 13px; font-weight: 500; cursor: pointer; text-decoration: none; transition: all 0.2s; }
        .back-btn:hover { border-color: #C28266; color: #C28266; }
        .co-title { font-family: "Raleway", sans-serif; font-size: 24px; font-weight: 700; color: #0D0F13; }
        .co-title span { color: #C28266; }
        .steps { display: flex; align-items: center; gap: 8px; margin-bottom: 32px; }
        .step { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #B0A090; }
        .step.active { color: #C28266; }
        .step.done { color: #7AAF90; }
        .step-num { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; background: #EDE8DA; color: #B0A090; }
        .step.active .step-num { background: #C28266; color: #fff; }
        .step.done .step-num { background: #7AAF90; color: #fff; }
        .step-sep { flex: 1; height: 1px; background: rgba(194,130,102,0.2); }
        .co-grid { display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start; }
        @media (max-width: 780px) { .co-grid { grid-template-columns: 1fr; } }
        .card { background: #fff; border: 1px solid rgba(194,130,102,0.18); border-radius: 14px; padding: 24px; margin-bottom: 16px; }
        .card-title { font-family: "Raleway", sans-serif; font-size: 15px; font-weight: 700; color: #0D0F13; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        .card-title svg { color: #C28266; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .form-row.triple { grid-template-columns: 1fr 1fr 1fr; }
        @media (max-width: 540px) { .form-row, .form-row.triple { grid-template-columns: 1fr; } }
        .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .field label { font-size: 12px; font-weight: 600; color: #7A6558; letter-spacing: 0.3px; text-transform: uppercase; }
        .field input, .field select { padding: 11px 14px; background: #FAF8EF; border: 1px solid rgba(194,130,102,0.25); border-radius: 8px; color: #0D0F13; font-family: "DM Sans", sans-serif; font-size: 15px; outline: none; transition: all 0.2s; width: 100%; }
        .field input:focus, .field select:focus { border-color: #C28266; box-shadow: 0 0 0 3px rgba(194,130,102,0.12); }
        .field input::placeholder { color: #C8B8AE; }
        .field input:disabled { opacity: 0.6; cursor: not-allowed; }
        .cep-hint { font-size: 11px; color: #C28266; display: flex; align-items: center; gap: 4px; margin-top: 2px; }

        /* Cupom */
        .coupon-wrap { display: flex; gap: 10px; }
        .coupon-input { flex: 1; padding: 11px 14px; background: #FAF8EF; border: 1px solid rgba(194,130,102,0.25); border-radius: 8px; color: #0D0F13; font-family: "DM Sans", sans-serif; font-size: 15px; outline: none; transition: all 0.2s; text-transform: uppercase; letter-spacing: 1px; }
        .coupon-input:focus { border-color: #C28266; box-shadow: 0 0 0 3px rgba(194,130,102,0.12); }
        .coupon-input::placeholder { text-transform: none; letter-spacing: 0; color: #C8B8AE; }
        .coupon-btn { padding: 11px 20px; background: #C28266; color: #fff; border: none; border-radius: 8px; font-family: "Raleway", sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .coupon-btn:hover { background: #9E6650; }
        .coupon-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .coupon-applied { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: rgba(122,175,144,0.08); border: 1px solid rgba(122,175,144,0.3); border-radius: 10px; margin-top: 10px; }
        .coupon-applied-info { display: flex; align-items: center; gap: 10px; }
        .coupon-applied-code { font-family: "Raleway", sans-serif; font-size: 14px; font-weight: 700; color: #5A8F70; letter-spacing: 1px; }
        .coupon-applied-desc { font-size: 12px; color: #7A6558; margin-top: 2px; }
        .coupon-remove { background: none; border: none; color: #C0614F; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; align-items: center; }
        .coupon-remove:hover { background: rgba(192,97,79,0.1); }

        .shipping-opts { display: flex; flex-direction: column; gap: 10px; }
        .shipping-opt { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border: 1.5px solid rgba(194,130,102,0.2); border-radius: 10px; cursor: pointer; transition: all 0.2s; }
        .shipping-opt:hover { border-color: #C28266; background: rgba(194,130,102,0.04); }
        .shipping-opt.selected { border-color: #C28266; background: rgba(194,130,102,0.06); }
        .shipping-opt input[type="radio"] { accent-color: #C28266; width: 16px; height: 16px; flex-shrink: 0; }
        .shipping-info { flex: 1; }
        .shipping-name { font-size: 14px; font-weight: 600; color: #0D0F13; }
        .shipping-desc { font-size: 12px; color: #A8978E; margin-top: 2px; }
        .shipping-price { font-family: "Raleway", sans-serif; font-size: 15px; font-weight: 700; color: #C28266; }
        .no-state { font-size: 13px; color: #B0A090; text-align: center; padding: 20px 0; }
        .insurance-card { display: flex; align-items: flex-start; gap: 14px; padding: 16px; border: 1.5px solid rgba(194,130,102,0.2); border-radius: 10px; cursor: pointer; transition: all 0.2s; }
        .insurance-card:hover { border-color: #C28266; }
        .insurance-card.selected { border-color: #C28266; background: rgba(194,130,102,0.06); }
        .insurance-card input[type="checkbox"] { accent-color: #C28266; width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px; }
        .insurance-title { font-size: 14px; font-weight: 600; color: #0D0F13; margin-bottom: 4px; }
        .insurance-desc { font-size: 12px; color: #7A6558; line-height: 1.5; }
        .insurance-price { font-family: "Raleway", sans-serif; font-size: 14px; font-weight: 700; color: #C28266; margin-top: 6px; }

        /* Aceite de termos */
        .terms-card { display: flex; align-items: flex-start; gap: 14px; padding: 16px 20px; background: rgba(194,130,102,0.04); border: 1.5px solid rgba(194,130,102,0.2); border-radius: 10px; cursor: pointer; transition: all 0.2s; margin-bottom: 16px; }
        .terms-card.accepted { border-color: #7AAF90; background: rgba(122,175,144,0.06); }
        .terms-card input[type="checkbox"] { accent-color: #C28266; width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px; cursor: pointer; }
        .terms-text { font-size: 13px; color: #3A2E28; line-height: 1.5; }
        .terms-link { color: #C28266; font-weight: 600; text-decoration: underline; }
        .terms-link:hover { color: #9E6650; }

        .summary-card { background: #fff; border: 1px solid rgba(194,130,102,0.18); border-radius: 14px; padding: 24px; position: sticky; top: 24px; }
        .summary-title { font-family: "Raleway", sans-serif; font-size: 15px; font-weight: 700; color: #0D0F13; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 18px; }
        .summary-items { margin-bottom: 18px; }
        .summary-item { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(194,130,102,0.1); }
        .summary-item:last-child { border-bottom: none; }
        .si-name { font-size: 13px; font-weight: 500; color: #0D0F13; line-height: 1.3; }
        .si-qty { font-size: 11px; color: #A8978E; margin-top: 2px; }
        .si-price { font-size: 13px; font-weight: 600; color: #C28266; white-space: nowrap; }
        .summary-divider { height: 1px; background: rgba(194,130,102,0.15); margin: 14px 0; }
        .summary-line { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 13px; }
        .summary-line span { color: #7A6558; }
        .summary-line strong { color: #0D0F13; font-weight: 600; }
        .summary-line.discount strong { color: #5A8F70; }
        .summary-total { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; padding-top: 14px; border-top: 2px solid rgba(194,130,102,0.2); }
        .summary-total span { font-family: "Raleway", sans-serif; font-size: 15px; font-weight: 700; color: #0D0F13; }
        .summary-total strong { font-family: "Raleway", sans-serif; font-size: 22px; font-weight: 700; color: #9E6650; }
        .pix-badge { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(122,175,144,0.1); border: 1px solid rgba(122,175,144,0.3); border-radius: 8px; margin-top: 14px; font-size: 12px; color: #5A8F70; font-weight: 500; }
        .btn-primary { width: 100%; padding: 15px; background: #C28266; color: #fff; border: none; border-radius: 10px; font-family: "Raleway", sans-serif; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.2s; margin-top: 20px; letter-spacing: 0.3px; }
        .btn-primary:hover { background: #9E6650; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .btn-secondary { width: 100%; padding: 12px; background: transparent; color: #C28266; border: 1.5px solid rgba(194,130,102,0.4); border-radius: 10px; font-family: "Raleway", sans-serif; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-top: 10px; }
        .btn-secondary:hover { background: rgba(194,130,102,0.06); }
        .final-summary { background: #fff; border: 1px solid rgba(194,130,102,0.18); border-radius: 14px; padding: 28px; max-width: 600px; margin: 0 auto; }
        .fs-header { text-align: center; margin-bottom: 24px; }
        .fs-title { font-family: "Raleway", sans-serif; font-size: 22px; font-weight: 700; color: #0D0F13; margin-bottom: 6px; }
        .fs-sub { font-size: 13px; color: #7A6558; }
        .fs-section { margin-bottom: 20px; }
        .fs-section-title { font-size: 11px; font-weight: 700; color: #A8978E; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
        .fs-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(194,130,102,0.08); font-size: 14px; }
        .fs-row span { color: #7A6558; }
        .fs-row strong { color: #0D0F13; font-weight: 500; }
        .fs-total-box { background: rgba(194,130,102,0.06); border: 1.5px solid rgba(194,130,102,0.25); border-radius: 10px; padding: 16px 20px; margin-top: 20px; }
        .fs-total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 13px; }
        .fs-total-row span { color: #7A6558; }
        .fs-total-row strong { color: #0D0F13; font-weight: 600; }
        .fs-total-final { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; margin-top: 8px; border-top: 1px solid rgba(194,130,102,0.2); }
        .fs-total-final span { font-family: "Raleway", sans-serif; font-size: 16px; font-weight: 700; color: #0D0F13; }
        .fs-total-final strong { font-family: "Raleway", sans-serif; font-size: 26px; font-weight: 700; color: #9E6650; }
        .fs-warning { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; background: rgba(212,169,106,0.1); border: 1px solid rgba(212,169,106,0.3); border-radius: 8px; margin-top: 16px; font-size: 12px; color: #8A6830; line-height: 1.5; }
      `}</style>

      <div className="co-wrap">
        <div className="co-top">
          <Link href="/" className="back-btn"><ChevronLeft size={16} /> Voltar</Link>
          <h1 className="co-title">Finalizar <span>Pedido</span></h1>
        </div>

        <div className="steps">
          <div className={`step ${step === "form" ? "active" : "done"}`}>
            <div className="step-num">{step === "summary" ? "✓" : "1"}</div>
            Seus dados
          </div>
          <div className="step-sep" />
          <div className={`step ${step === "summary" ? "active" : ""}`}>
            <div className="step-num">2</div>
            Confirmar pedido
          </div>
          <div className="step-sep" />
          <div className="step">
            <div className="step-num">3</div>
            Pagamento Pix
          </div>
        </div>

        {step === "form" && (
          <div className="co-grid">
            <div>
              {/* Dados pessoais */}
              <div className="card">
                <div className="card-title"><Package size={16} /> Dados Pessoais</div>
                <div className="form-row">
                  <div className="field" style={{ gridColumn: "1/-1" }}>
                    <label>Nome completo *</label>
                    <input placeholder="Seu nome completo" value={form.name} onChange={(e) => handleInput("name", e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>CPF *</label>
                    <input placeholder="000.000.000-00" value={form.cpf} onChange={(e) => handleInput("cpf", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Telefone / WhatsApp *</label>
                    <input placeholder="(00) 00000-0000" value={form.phone} onChange={(e) => handleInput("phone", e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>E-mail *</label>
                    <input type="email" placeholder="seu@email.com" value={form.email} onChange={(e) => handleInput("email", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Data de nascimento *</label>
                    <input type="date" value={form.birthdate} onChange={(e) => handleInput("birthdate", e.target.value)} max={new Date().toISOString().split("T")[0]} />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="card">
                <div className="card-title"><Truck size={16} /> Endereço de Entrega</div>
                <div className="form-row">
                  <div className="field">
                    <label>CEP *</label>
                    <input placeholder="00000-000" value={form.zip} onChange={(e) => handleInput("zip", e.target.value)} disabled={cepLoading} style={cepLoading ? { borderColor: "#C28266", opacity: 0.7 } : {}} />
                    {cepLoading && <span className="cep-hint">🔍 Buscando endereço...</span>}
                  </div>
                  <div className="field">
                    <label>Estado *</label>
                    <select value={form.state} onChange={(e) => handleInput("state", e.target.value)}>
                      <option value="">Selecione...</option>
                      {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="field" style={{ gridColumn: "1/-1" }}>
                    <label>Endereço *</label>
                    <input placeholder="Rua, Avenida, etc." value={form.street} onChange={(e) => handleInput("street", e.target.value)} />
                  </div>
                </div>
                <div className="form-row triple">
                  <div className="field">
                    <label>Número *</label>
                    <input placeholder="123" value={form.number} onChange={(e) => handleInput("number", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Complemento</label>
                    <input placeholder="Apto, Casa..." value={form.complement} onChange={(e) => handleInput("complement", e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Bairro *</label>
                    <input placeholder="Bairro" value={form.district} onChange={(e) => handleInput("district", e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>Cidade *</label>
                    <input placeholder="Cidade" value={form.city} onChange={(e) => handleInput("city", e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Frete */}
              <div className="card">
                <div className="card-title"><Truck size={16} /> Tipo de Frete</div>
                {!form.state ? (
                  <p className="no-state">Selecione seu estado para ver as opções de frete</p>
                ) : shippingRates.length === 0 && hasInsurance ? (
                  <p className="no-state">⚠️ Não há transportadora disponível para {form.state} com seguro</p>
                ) : shippingRates.length === 0 ? (
                  <p className="no-state">Nenhuma opção de frete disponível para {form.state}</p>
                ) : (
                  <div className="shipping-opts">
                    {shippingRates.map((rate) => (
                      <label key={rate.id} className={`shipping-opt ${selectedShipping?.id === rate.id ? "selected" : ""}`}>
                        <input type="radio" name="shipping" checked={selectedShipping?.id === rate.id} onChange={() => setSelectedShipping(rate)} />
                        <div className="shipping-info">
                          <div className="shipping-name">{rate.service_type}</div>
                          <div className="shipping-desc">
                            {rate.service_type === "PAC" && "Entrega econômica • 8 a 15 dias úteis"}
                            {rate.service_type === "SEDEX" && "Entrega expressa • 2 a 5 dias úteis"}
                            {rate.service_type === "VIP" && "Entrega prioritária • 1 a 3 dias úteis"}
                          </div>
                        </div>
                        <span className="shipping-price">
                          {appliedCoupon?.type === "free_shipping" ? "GRÁTIS" : `R$ ${Number(rate.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Cupom */}
              <div className="card">
                <div className="card-title"><Tag size={16} /> Cupom de Desconto</div>
                {!appliedCoupon ? (
                  <div className="coupon-wrap">
                    <input className="coupon-input" placeholder="Digite o código do cupom" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && applyCoupon()} />
                    <button className="coupon-btn" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()}>
                      {couponLoading ? "..." : "Aplicar"}
                    </button>
                  </div>
                ) : (
                  <div className="coupon-applied">
                    <div className="coupon-applied-info">
                      <CheckCircle size={18} color="#5A8F70" />
                      <div>
                        <div className="coupon-applied-code">{appliedCoupon.code}</div>
                        <div className="coupon-applied-desc">{appliedCoupon.type === "free_shipping" ? "Frete grátis" : `${appliedCoupon.value}% de desconto`}</div>
                      </div>
                    </div>
                    <button className="coupon-remove" onClick={removeCoupon}><X size={16} /></button>
                  </div>
                )}
              </div>

              {/* Seguro */}
              <div className="card">
                <div className="card-title"><ShieldCheck size={16} /> Seguro de Envio</div>
                <label className={`insurance-card ${hasInsurance ? "selected" : ""}`}>
                  <input type="checkbox" checked={hasInsurance} onChange={(e) => setHasInsurance(e.target.checked)} />
                  <div>
                    <div className="insurance-title">🔒 Proteger meu pedido</div>
                    <div className="insurance-desc">Garante o reenvio ou reembolso caso o pedido seja interceptado, extraviado ou perdido no transporte.</div>
                    {hasInsurance && (
                      <>
                        <div className="insurance-price">+ R$ {insurancePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} (15% do subtotal)</div>
                        <div style={{ fontSize: 12, color: "#D4A96A", marginTop: 6 }}>⚠️ Com seguro, envio somente via Transportadora</div>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* Aceite de Política */}
              <label className={`terms-card ${acceptedTerms ? "accepted" : ""}`} onClick={() => setAcceptedTerms(v => !v)}>
                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} onClick={(e) => e.stopPropagation()} />
                <span className="terms-text">
                  Li e concordo com as{" "}
                  <Link href="/regras" className="terms-link" target="_blank" onClick={(e) => e.stopPropagation()}>
                    Regras de Envio
                  </Link>{" "}
                  e Políticas de Entrega da PB Imports. Estou ciente dos prazos, condições de pagamento e procedimentos em caso de extravio.
                </span>
              </label>

              <button className="btn-primary" onClick={goToSummary}>Ver resumo do pedido →</button>
            </div>

            {/* Resumo lateral */}
            <div>
              <div className="summary-card">
                <div className="summary-title">📦 Seu pedido</div>
                <div className="summary-items">
                  {cartItems.map((item) => (
                    <div className="summary-item" key={item.cart_item_id}>
                      <div>
                        <div className="si-name">{item.product.name}</div>
                        <div className="si-qty">{item.quantity}x · {item.product.brand}</div>
                      </div>
                      <div className="si-price">R$ {(Number(item.product.price) * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                    </div>
                  ))}
                </div>
                <div className="summary-divider" />
                <div className="summary-line"><span>Subtotal produtos</span><strong>R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>
                <div className="summary-line">
                  <span>Frete ({selectedShipping?.service_type || "—"})</span>
                  <strong>{selectedShipping ? (appliedCoupon?.type === "free_shipping" ? "GRÁTIS" : `R$ ${shippingPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`) : "—"}</strong>
                </div>
                {hasInsurance && <div className="summary-line"><span>🔒 Seguro (15%)</span><strong>R$ {insurancePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>}
                {appliedCoupon?.type === "percentage" && couponDiscount > 0 && (
                  <div className="summary-line discount"><span>🎟️ Cupom ({appliedCoupon.value}%)</span><strong>- R$ {couponDiscount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>
                )}
                <div className="summary-total">
                  <span>Total</span>
                  <strong>R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                </div>
                <div className="pix-badge">💳 Pagamento via Pix — aprovação imediata</div>
              </div>
            </div>
          </div>
        )}

        {step === "summary" && (
          <div className="final-summary">
            <div className="fs-header">
              <div className="fs-title">Confirme seu pedido</div>
              <div className="fs-sub">Revise tudo antes de gerar o Pix</div>
            </div>
            <div className="fs-section">
              <div className="fs-section-title">👤 Dados do cliente</div>
              <div className="fs-row"><span>Nome</span><strong>{form.name}</strong></div>
              <div className="fs-row"><span>CPF</span><strong>{form.cpf}</strong></div>
              <div className="fs-row"><span>WhatsApp</span><strong>{form.phone}</strong></div>
              <div className="fs-row"><span>E-mail</span><strong>{form.email}</strong></div>
              <div className="fs-row"><span>Nascimento</span><strong>{form.birthdate ? new Date(form.birthdate + "T00:00:00").toLocaleDateString("pt-BR") : ""}</strong></div>
            </div>
            <div className="fs-section">
              <div className="fs-section-title">📍 Endereço de entrega</div>
              <div className="fs-row"><span>Endereço</span><strong>{form.street}, {form.number}{form.complement ? ` - ${form.complement}` : ""}</strong></div>
              <div className="fs-row"><span>Bairro</span><strong>{form.district}</strong></div>
              <div className="fs-row"><span>Cidade/Estado</span><strong>{form.city} — {form.state}</strong></div>
              <div className="fs-row"><span>CEP</span><strong>{form.zip}</strong></div>
            </div>
            <div className="fs-section">
              <div className="fs-section-title">📦 Itens do pedido</div>
              {cartItems.map((item) => (
                <div className="fs-row" key={item.cart_item_id}>
                  <span>{item.quantity}x {item.product.name}</span>
                  <strong>R$ {(Number(item.product.price) * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                </div>
              ))}
            </div>
            <div className="fs-total-box">
              <div className="fs-total-row"><span>Subtotal produtos</span><strong>R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>
              <div className="fs-total-row"><span>Frete {selectedShipping?.service_type}</span><strong>{appliedCoupon?.type === "free_shipping" ? "GRÁTIS" : `R$ ${shippingPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}</strong></div>
              {hasInsurance && <div className="fs-total-row"><span>🔒 Seguro de envio (15%)</span><strong style={{ color: "#C0614F" }}>R$ {insurancePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>}
              {appliedCoupon?.type === "percentage" && couponDiscount > 0 && (
                <div className="fs-total-row"><span>🎟️ Cupom ({appliedCoupon.value}%)</span><strong style={{ color: "#5A8F70" }}>- R$ {couponDiscount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div>
              )}
              {appliedCoupon && <div className="fs-total-row"><span>🎟️ Cupom aplicado</span><strong style={{ color: "#5A8F70" }}>{appliedCoupon.code}</strong></div>}
              <div className="fs-total-final">
                <span>Total a pagar</span>
                <strong>R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>
            <div className="fs-warning">
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
              Envio em até 72h úteis após confirmação do pagamento. O Pix será gerado na próxima etapa.
            </div>
            <button className="btn-primary" onClick={submitOrder} disabled={submitting}>
              {submitting ? "Gerando pedido..." : "💳 Gerar Pix e pagar →"}
            </button>
            <button className="btn-secondary" onClick={() => setStep("form")}>← Editar dados</button>
          </div>
        )}
      </div>
    </div>
  );
}