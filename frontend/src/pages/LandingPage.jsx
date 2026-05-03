import React from "react";

// Shared theme constants
const theme = {
  primary: "#075e54", // WhatsApp Dark Green
  secondary: "#128c7e",
  whatsappGreen: "#25d366",
  textDark: "#333",
  textLight: "#666",
  white: "#ffffff",
  bgLight: "#f4f7f6",
};

const styles = {
  container: {
    minHeight: "100vh",
    background: theme.bgLight,
    color: theme.textDark,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.2rem 5%",
    background: theme.white,
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: theme.primary,
  },
  hero: {
    padding: "5rem 5%",
    textAlign: "center",
    background: `linear-gradient(135deg, ${theme.white} 0%, #e8f5e9 100%)`,
  },
  heroTitle: {
    fontSize: "3.5rem",
    marginBottom: "1rem",
    fontWeight: "800",
    color: "#111",
  },
  heroSubtitle: {
    fontWeight: 400,
    fontSize: "1.5rem",
    marginBottom: "2rem",
    color: theme.textLight,
    maxWidth: "700px",
    margin: "0 auto 2rem",
  },
  buttonPrimary: {
    background: theme.primary,
    color: theme.white,
    border: "none",
    padding: "16px 40px",
    borderRadius: "50px",
    fontSize: "1.1rem",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
    transition: "0.3s",
  },
  section: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "80px 5%",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "2rem",
  },
  card: {
    background: theme.white,
    padding: "2.5rem",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.03)",
  },
  stepIcon: {
    width: 50,
    height: 50,
    background: theme.whatsappGreen,
    color: theme.white,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    fontSize: "1.2rem",
    fontWeight: "bold",
  },
  ctaSection: {
    background: theme.primary,
    color: theme.white,
    padding: "5rem 5%",
    borderRadius: "24px",
    textAlign: "center",
    margin: "40px 5%",
  },
  footer: {
    textAlign: "center",
    padding: "40px",
    borderTop: "1px solid #eee",
    color: "#999",
  }
};

export default function LandingPage() {
  const WHATSAPP_LINK = "https://wa.me/14155238886?text=Join%20ArewaMarket";

  const handleGetStarted = () => {
    window.open(WHATSAPP_LINK, "_blank");
  };

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.logo}>Arewa<span>Market</span></div>
        <button onClick={handleGetStarted} style={{ ...styles.buttonPrimary, padding: '10px 24px', fontSize: '0.9rem' }}>
          Join Now
        </button>
      </nav>

      <header style={styles.hero}>
        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="ArewaMarket" style={{ width: 80, marginBottom: 24 }} />
        <h1 style={styles.heroTitle}>ArewaMarket</h1>
        <h2 style={styles.heroSubtitle}>Digital Storefronts for Northern Traders</h2>
        <button onClick={handleGetStarted} style={styles.buttonPrimary}>
          Get Started for Free
        </button>
      </header>

      <main>
        <section style={styles.section}>
          <h2 style={{ textAlign: "center", fontSize: "2.2rem", color: "#075e54", marginBottom: 48 }}>How It Works</h2>
          <div style={styles.grid}>
            <div style={styles.card}>
              <div style={styles.stepIcon}>1</div>
              <h3>Setup Your Store</h3>
              <p style={{ color: "#666", lineHeight: "1.5" }}>Register your business details and WhatsApp number in seconds.</p>
            </div>
            <div style={styles.card}>
              <div style={styles.stepIcon}>2</div>
              <h3>Upload Products</h3>
              <p style={{ color: "#666", lineHeight: "1.5" }}>Add pictures and prices for everything you sell to create your catalog.</p>
            </div>
            <div style={styles.card}>
              <div style={styles.stepIcon}>3</div>
              <h3>Share Link</h3>
              <p style={{ color: "#666", lineHeight: "1.5" }}>Share your unique store link on your WhatsApp Status and groups.</p>
            </div>
            <div style={styles.card}>
              <div style={styles.stepIcon}>4</div>
              <h3>Sell via Chat</h3>
              <p style={{ color: "#666", lineHeight: "1.5" }}>Customers send orders directly to your WhatsApp. No middleman.</p>
            </div>
          </div>
        </section>

        <section style={styles.ctaSection}>
          <h2 style={{ fontSize: "2.5rem", marginBottom: 16 }}>Ready to grow your business?</h2>
          <p style={{ fontSize: "1.2rem", marginBottom: 32, opacity: 0.9 }}>
            Join Northern traders who are making selling easier and faster using ArewaMarket.
          </p>
          <button 
            onClick={handleGetStarted}
            style={{ ...styles.buttonPrimary, background: theme.white, color: theme.primary }}>
            Create Your Store
          </button>
        </section>
      </main>

      <footer style={styles.footer}>
        <div style={{ fontWeight: "bold", color: "#075e54", marginBottom: 10 }}>ArewaMarket</div>
        <p style={{ fontSize: "0.85rem" }}>© {new Date().getFullYear()}. All rights reserved.</p>
        <div style={{ marginTop: 20, fontSize: "0.8rem", color: "#bbb" }}>
          Example Store: <code>/store/08012345678</code>
        </div>
      </footer>
    </div>
  );
}