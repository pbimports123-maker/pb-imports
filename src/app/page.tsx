{/* ── Selos de segurança + Rodapé ── */}
      <div style={{ marginTop: 48, borderTop: "1px solid rgba(194,130,102,0.15)", paddingTop: 32 }}>

        {/* Selos */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
          {[
            { icon: "🔒", title: "SSL Certificado", desc: "Conexão segura e criptografada" },
            { icon: "💳", title: "Pagamento via Pix", desc: "Aprovação imediata e segura" },
            { icon: "🛡️", title: "Dados Protegidos", desc: "Sua privacidade é prioridade" },
            { icon: "✅", title: "Compra Segura", desc: "Satisfação garantida" },
          ].map((selo, i) => (
            <div key={i} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              padding: "16px 12px", background: "#fff",
              border: "1px solid rgba(194,130,102,0.18)", borderRadius: 12, textAlign: "center"
            }}>
              <span style={{ fontSize: 26 }}>{selo.icon}</span>
              <span style={{ fontFamily: "Raleway, sans-serif", fontSize: 12, fontWeight: 700, color: "#0D0F13" }}>{selo.title}</span>
              <span style={{ fontSize: 11, color: "#A8978E", lineHeight: 1.4 }}>{selo.desc}</span>
            </div>
          ))}
        </div>

        {/* Rodapé */}
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8, paddingBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 30, height: 30,
              background: "linear-gradient(135deg, #C28266, #9E6650)",
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ fontFamily: "Raleway, sans-serif", fontSize: 9, fontWeight: 700, color: "#fff" }}>PB</span>
            </div>
            <span style={{ fontFamily: "Raleway, sans-serif", fontSize: 14, fontWeight: 700, color: "#9E6650", letterSpacing: 2, textTransform: "uppercase" }}>
              PB Imports
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#A8978E" }}>
            © {new Date().getFullYear()} PB Imports — Todos os direitos reservados.
          </p>
          <p style={{ fontSize: 11, color: "#C2B0A8" }}>
            CNPJ: 63.965.018/0001-48 · São Paulo, SP · Brasil
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 8 }}>
            <Link href="/fretes" style={{ fontSize: 11, color: "#B0A090", textDecoration: "none" }}>Tabela de Fretes</Link>
            <span style={{ color: "#D4C4B8", fontSize: 10 }}>·</span>
            <Link href="/regras" style={{ fontSize: 11, color: "#B0A090", textDecoration: "none" }}>Regras de Envio</Link>
            <span style={{ color: "#D4C4B8", fontSize: 10 }}>·</span>
            <Link href="/curiosidades" style={{ fontSize: 11, color: "#B0A090", textDecoration: "none" }}>Curiosidades</Link>
          </div>
        </div>

      </div>