import React from "react";

export default function LandingPage() {
  const WHATSAPP_LINK = "https://wa.me/14155238886?text=Join%20themselves-game";

  const handleGetStarted = () => {
    window.open(WHATSAPP_LINK, "_blank");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", color: "#333", fontFamily: "Segoe UI, sans-serif" }}>
      <header style={{ background: "linear-gradient(135deg, #25d366 0%, #075e54 100%)", color: "#fff", padding: "80px 20px", textAlign: "center" }}>
        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="ArewaMarket" style={{ width: 80, marginBottom: 24 }} />
        <h1 style={{ fontSize: "3.5rem", margin: "0 0 16px", fontWeight: "800" }}>ArewaMarket</h1>
        <h2 style={{ fontWeight: 400, fontSize: "1.5rem", marginBottom: 32, opacity: 0.9 }}>Digital Storefronts for Northern Traders</h2>
        <button 
          onClick={handleGetStarted}
          style={{ background: "#fff", color: "#075e54", border: "none", padding: "16px 40px", borderRadius: "50px", fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>
          Get Started for Free
        </button>
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "60px 20px" }}>
        <section style={{ marginBottom: 80 }}>
          <h2 style={{ textAlign: "center", fontSize: "2.2rem", color: "#075e54", marginBottom: 48 }}>How It Works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "32px" }}>
            <div style={{ background: "#fff", padding: "32px", borderRadius: "16px", textAlign: "center", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
              <div style={{ width: 50, height: 50, background: "#25d366", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "1.2rem", fontWeight: "bold" }}>1</div>
              <h3>Setup Your Store</h3>
              <p style={{ color: "#666", lineHeight: "1.5" }}>Register your business details and WhatsApp number in seconds.</p>
            </div>
            <div style={{ background: "#fff", padding: "32px", borderRadius: "16px", textAlign: "center", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
              <div style={{ width: 50, height: 50, background: "#25d366", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "1.2rem", fontWeight: "bold" }}>2</div>
              <h3>Upload Products</h3>
              <p style={{ color: "#666", lineHeight: "1.5" }}>Add pictures and prices for everything you sell to create your catalog.</p>
            </div>
            <div style={{ background: "#fff", padding: "32px", borderRadius: "16px", textAlign: "center", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
              <div style={{ width: 50, height: 50, background: "#25d366", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "1.2rem", fontWeight: "bold" }}>3</div>
              <h3>Share Link</h3>
              <p style={{ color: "#666", lineHeight: "1.5" }}>Share your unique store link on your WhatsApp Status and groups.</p>
            </div>
            <div style={{ background: "#fff", padding: "32px", borderRadius: "16px", textAlign: "center", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
              <div style={{ width: 50, height: 50, background: "#25d366", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "1.2rem", fontWeight: "bold" }}>4</div>
              <h3>Sell via Chat</h3>
              <p style={{ color: "#666", lineHeight: "1.5" }}>Customers send orders directly to your WhatsApp. No middleman.</p>
            </div>
          </div>
        </section>

        <section style={{ background: "#fff", padding: "50px 30px", borderRadius: "24px", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", border: "1px solid #eee" }}>
          <h2 style={{ fontSize: "2rem", color: "#075e54", marginBottom: 16 }}>Ready to grow your business?</h2>
          <p style={{ fontSize: "1.1rem", color: "#555", marginBottom: 32, maxWidth: 600, margin: "0 auto 32px" }}>
            Join Northern traders who are making selling easier and faster using ArewaMarket.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <button 
              onClick={handleGetStarted}
              style={{ background: "#25d366", color: "#fff", border: "none", padding: "16px 40px", borderRadius: "12px", fontSize: "1.1rem", fontWeight: "bold", cursor: "pointer" }}>
              Create Store
            </button>
          </div>
        </section>
      </main>

      <footer style={{ textAlign: "center", padding: "40px", borderTop: "1px solid #eee", color: "#999" }}>
        <div style={{ fontWeight: "bold", color: "#075e54", marginBottom: 10 }}>ArewaMarket</div>
        <p style={{ fontSize: "0.85rem" }}>© 2024. All rights reserved.</p>
        <div style={{ marginTop: 20, fontSize: "0.8rem", color: "#bbb" }}>
            Example Store: <code>/store/08012345678</code>
        </div>
      </footer>
    </div>
  );
}