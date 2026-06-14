import React, { useEffect } from "react";
import { Link } from "react-router-dom"; // Ensure this is present
import Logo from "../Logo";

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
    width: "100%",
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
    padding: "4rem 5%",
    textAlign: "center",
    background: `linear-gradient(135deg, ${theme.white} 0%, #e8f5e9 100%)`,
  },
  heroTitle: {
    fontSize: "2.8rem",
    lineHeight: "1.2",
    marginBottom: "1rem",
    fontWeight: "800",
    color: "#111",
  },
  heroSubtitle: {
    fontWeight: 400,
    fontSize: "1.2rem",
    marginBottom: "2rem",
    maxWidth: "700px",
    margin: "0 auto 2rem",
    color: theme.textLight,
  },
  buttonPrimary: {
    background: theme.primary,
    color: theme.white,
    border: "none",
    padding: "14px 32px",
    borderRadius: "50px",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
    transition: "0.3s",
  },
  section: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "60px 5%",
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
    display: "flex",
    flexDirection: "column",
    height: "100%",
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
    padding: "4rem 1.5rem",
    borderRadius: "24px",
    textAlign: "center",
    margin: "20px 5%",
  },
  footer: {
    textAlign: "center",
    padding: "40px",
    borderTop: "1px solid #eee",
    color: "#999",
  }
};

export default function LandingPage() {
  // Replace with your actual Twilio WhatsApp Number (e.g., +234...)
  const WHATSAPP_LINK = `https://wa.me/${process.env.REACT_APP_TWILIO_NUMBER || "14155238886"}?text=Join%20themselves-game`;

  useEffect(() => {
    document.title = "Arewa Connect | Digital Storefronts for Northern Traders";
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
    // Analytics: Track landing page visit
    fetch(`${API_URL}/api/analytics/track?page=landing`, { method: 'POST' })
      .catch(err => console.warn("Analytics failed", err));
  }, []);

  const handleGetStarted = () => {
    window.open(WHATSAPP_LINK, "_blank");
  };

  return (
    <div style={styles.container}>
      {/* Injected CSS for Responsiveness */}
      <style>
        {`
          @media (max-width: 600px) {
            h1 { font-size: 2.2rem !important; }
            h2 { font-size: 1.1rem !important; }
            .navbar-btn { padding: 8px 16px !important; font-size: 0.8rem !important; }
            .hero-img { width: 60px !important; }
            .cta-title { font-size: 1.8rem !important; }
          }
          @media (max-width: 768px) {
            .how-it-works-grid {
              grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
              gap: 1.5rem !important;
            }
            .step-card { padding: 1.5rem !important; }
          }
          .step-card:hover { transform: translateY(-5px); transition: transform 0.3s ease; }
        `}
      </style>

      <nav style={styles.navbar}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Logo width="225" height="45" />
        </Link>
        <button onClick={handleGetStarted} className="navbar-btn" style={{ ...styles.buttonPrimary, padding: '10px 24px', fontSize: '0.9rem' }}>
          Join Now
        </button>
      </nav>

      <header style={styles.hero}>
        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="Arewa Connect" className="hero-img" style={{ width: 80, marginBottom: 24 }} />
        <h1 style={styles.heroTitle}>Arewa Connect</h1>
        <h2 style={styles.heroSubtitle}>Digital Storefronts for Northern Traders</h2>
        <button onClick={handleGetStarted} style={styles.buttonPrimary}>
          Get Started for Free
        </button>
      </header>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link to="/store" style={{ ...styles.buttonPrimary, background: theme.secondary, textDecoration: 'none' }}>
          View All Stores
        </Link>
      </div>

      <main>
        <section style={styles.section}>
          <h2 style={{ textAlign: "center", fontSize: "2.2rem", color: "#075e54", marginBottom: 48 }}>How It Works</h2>
          <div style={styles.grid} className="how-it-works-grid">
            <div style={styles.card} className="step-card">
              <div style={styles.stepIcon}>1</div>
              <h3>Setup Your Store</h3>
              <p style={{ color: "#666", lineHeight: "1.5" }}>Register your business details and WhatsApp number in seconds.</p>
            </div>
            <div style={styles.card} className="step-card">
              <div style={styles.stepIcon}>2</div>
              <h3>Upload Products</h3>
              <p style={{ color: "#666", lineHeight: "1.5" }}>Add pictures and prices for everything you sell to create your catalog.</p>
            </div>
            <div style={styles.card} className="step-card">
              <div style={styles.stepIcon}>3</div>
              <h3>Share Link</h3>
              <p style={{ color: "#666", lineHeight: "1.5" }}>Share your unique store link on your WhatsApp Status and groups.</p>
            </div>
            <div style={styles.card} className="step-card">
              <div style={styles.stepIcon}>4</div>
              <h3>Sell via Chat</h3>
              <p style={{ color: "#666", lineHeight: "1.5" }}>Customers send orders directly to your WhatsApp. No middleman.</p>
            </div>
          </div>
        </section>

        <section style={styles.ctaSection}>
          <h2 className="cta-title" style={{ fontSize: "2.5rem", marginBottom: 16 }}>Ready to grow your business?</h2>
          <p style={{ fontSize: "1.1rem", marginBottom: 32, opacity: 0.9 }}>
            Join Northern traders who are making selling easier and faster using Arewa Connect.
          </p>
          <button 
            onClick={handleGetStarted}
            style={{ ...styles.buttonPrimary, background: theme.white, color: theme.primary }}>
            Create Your Store
          </button>
        </section>
      </main>

      <footer style={styles.footer}>
        <div style={{ fontWeight: "bold", color: "#075e54", marginBottom: 10 }}>Arewa Connect</div>
        <p style={{ fontSize: "0.85rem" }}>© {new Date().getFullYear()}. All rights reserved.</p>
        <div style={{ marginTop: 15, display: "flex", justifyContent: "center", gap: "20px", fontSize: "0.85rem" }}>
          <Link to="/privacy-policy" style={{ color: "#666", textDecoration: "none" }}>Privacy Policy</Link>
          <Link to="/terms-of-service" style={{ color: "#666", textDecoration: "none" }}>Terms of Service</Link>
          <Link to="/contact-us" style={{ color: "#666", textDecoration: "none" }}>Contact Us</Link>
        </div>
        <div style={{ marginTop: 20, fontSize: "0.8rem", color: "#bbb" }}>
          Example Store: <code>/store/08012345678</code>
        </div>
      </footer>
    </div>
  );
}