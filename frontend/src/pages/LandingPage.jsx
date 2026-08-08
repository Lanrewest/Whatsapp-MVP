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
  accent: "#f6efe0",
  accentDeep: "#e6f4eb",
  borderSoft: "#dce8e0",
  muted: "#7c8b86",
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
    padding: "3.2rem 5% 3.8rem",
    textAlign: "center",
    background: `linear-gradient(135deg, ${theme.white} 0%, #ecf8f1 100%)`,
    borderRadius: "0 0 32px 32px",
    margin: "0 5%",
    boxShadow: "0 14px 40px rgba(7, 94, 84, 0.08)",
  },
  heroPanel: {
    maxWidth: 1160,
    margin: "0 auto",
    background: "rgba(255,255,255,0.85)",
    border: `1px solid ${theme.borderSoft}`,
    borderRadius: 28,
    padding: "28px 24px",
    boxShadow: "0 20px 60px rgba(15, 23, 42, 0.06)",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 14px",
    borderRadius: "999px",
    background: theme.accent,
    color: theme.primary,
    fontWeight: 700,
    fontSize: "0.9rem",
    marginBottom: "1rem",
  },
  heroSupportCard: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    padding: "12px 18px",
    borderRadius: "999px",
    background: "rgba(7, 94, 84, 0.06)",
    border: `1px solid ${theme.borderSoft}`,
    boxShadow: "0 8px 24px rgba(7, 94, 84, 0.08)",
    margin: "0 auto 24px",
    maxWidth: "560px",
    flexWrap: "wrap",
  },
  heroSupportText: {
    color: theme.textLight,
    fontSize: "0.95rem",
    lineHeight: 1.6,
    textAlign: "left",
    fontWeight: 500,
  },
  heroActions: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "1.6rem",
  },
  statPill: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: "999px",
    background: theme.white,
    border: `1px solid ${theme.borderSoft}`,
    color: theme.textDark,
    fontSize: "0.9rem",
    boxShadow: "0 6px 16px rgba(15, 23, 42, 0.04)",
  },
  heroTitle: {
    fontSize: "3rem",
    lineHeight: "1.15",
    marginBottom: "1rem",
    fontWeight: "800",
    color: "#111",
  },
  heroSubtitle: {
    fontWeight: 400,
    fontSize: "1.15rem",
    marginBottom: "2rem",
    maxWidth: "720px",
    margin: "0 auto 2rem",
    color: theme.textLight,
    lineHeight: 1.7,
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
  sectionTitle: {
    textAlign: "center",
    fontSize: "2.2rem",
    color: theme.primary,
    marginBottom: 12,
  },
  sectionIntro: {
    textAlign: "center",
    maxWidth: 720,
    margin: "0 auto 32px",
    color: theme.textLight,
    fontSize: "1.03rem",
    lineHeight: 1.7,
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
    border: `1px solid ${theme.borderSoft}`,
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  featureCard: {
    background: theme.white,
    borderRadius: 18,
    border: `1px solid ${theme.borderSoft}`,
    padding: "24px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
  },
  showcaseCard: {
    background: `linear-gradient(145deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
    borderRadius: 24,
    color: theme.white,
    padding: "24px",
    boxShadow: "0 20px 40px rgba(7, 94, 84, 0.2)",
  },
  testimonialCard: {
    background: theme.white,
    borderRadius: 20,
    border: `1px solid ${theme.borderSoft}`,
    padding: "24px",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
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
  const normalizeNumber = (value) => (value || "").replace(/\D/g, "");
  const BUSINESS_WHATSAPP_NUMBER = normalizeNumber(process.env.REACT_APP_TWILIO_NUMBER || "+14155238886");
  const WHATSAPP_LINK = `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=Join`;

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
            .hero-support-card {
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              text-align: center !important;
              border-radius: 18px !important;
              padding: 14px 16px !important;
              max-width: 100% !important;
              gap: 10px !important;
            }
            .hero-support-text {
              text-align: center !important;
              font-size: 0.92rem !important;
            }
            .hero-title {
              font-size: 2.1rem !important;
              line-height: 1.2 !important;
            }
            .hero-subtitle {
              font-size: 1rem !important;
              margin-bottom: 1.5rem !important;
            }
            .hero-panel {
              padding: 22px 16px !important;
            }
            .hero {
              padding: 2.2rem 4% 2.8rem !important;
              margin: 0 4% !important;
            }
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
        <div style={styles.heroPanel}>
          <div style={styles.heroSupportCard} className="hero-support-card">
            <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="Arewa Connect" className="hero-img" style={{ width: 58, height: 58, flexShrink: 0 }} />
            <div style={styles.heroSupportText} className="hero-support-text">A simple, trusted way to turn your WhatsApp into a polished storefront.</div>
          </div>
          <h1 style={styles.heroTitle} className="hero-title">Turn your WhatsApp into a premium digital storefront</h1>
          <h2 style={styles.heroSubtitle} className="hero-subtitle">Show your products, collect orders, and grow your reach with a polished store experience built for modern trading.</h2>
          <div style={styles.heroActions}>
            <button onClick={handleGetStarted} style={styles.buttonPrimary}>
              Get Started for Free
            </button>
            <Link to="/store" style={{ ...styles.buttonPrimary, background: theme.secondary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              View All Stores
            </Link>
          </div>
          <div style={{ marginTop: '1.4rem', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={styles.statPill}>⚡ Free to start</span>
            <span style={styles.statPill}>📱 WhatsApp ready</span>
            <span style={styles.statPill}>🛍️ Sell in minutes</span>
          </div>

          <div style={{ marginTop: '28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={styles.showcaseCard}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 8 }}>Beautiful product catalog</div>
              <div style={{ opacity: 0.95, lineHeight: 1.6 }}>Give customers a clearer, faster way to browse what you sell.</div>
            </div>
            <div style={styles.featureCard}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: theme.primary }}>Simple setup</div>
              <div style={{ color: theme.textLight, lineHeight: 1.6 }}>Create your store in minutes without a full website or app.</div>
            </div>
            <div style={styles.featureCard}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: theme.primary }}>Built for trust</div>
              <div style={{ color: theme.textLight, lineHeight: 1.6 }}>Clear product details and direct WhatsApp conversations keep buyers confident.</div>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Why traders love Arewa Connect</h2>
          <p style={styles.sectionIntro}>A premium storefront experience that helps you look professional, build trust, and close sales faster.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div style={styles.featureCard}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: theme.accentDeep, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: '1.1rem' }}>🛒</div>
              <h3 style={{ margin: '0 0 8px', color: theme.primary }}>Elegant product browsing</h3>
              <p style={{ margin: 0, color: theme.textLight, lineHeight: 1.7 }}>Customers can explore your items clearly and quickly without friction.</p>
            </div>
            <div style={styles.featureCard}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: theme.accentDeep, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: '1.1rem' }}>💬</div>
              <h3 style={{ margin: '0 0 8px', color: theme.primary }}>Direct WhatsApp sales</h3>
              <p style={{ margin: 0, color: theme.textLight, lineHeight: 1.7 }}>Every enquiry moves straight into your existing WhatsApp chat flow.</p>
            </div>
            <div style={styles.featureCard}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: theme.accentDeep, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: '1.1rem' }}>📈</div>
              <h3 style={{ margin: '0 0 8px', color: theme.primary }}>More visibility</h3>
              <p style={{ margin: 0, color: theme.textLight, lineHeight: 1.7 }}>Share your store link in groups, stories, and chats to reach more buyers.</p>
            </div>
          </div>
        </section>

        <section style={{ ...styles.section, paddingTop: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div style={styles.testimonialCard}>
              <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>“</div>
              <p style={{ margin: '0 0 16px', color: theme.textLight, lineHeight: 1.7 }}>This makes my business look more professional than ever. Customers understand my products instantly.</p>
              <div style={{ fontWeight: 700, color: theme.primary }}>AJS Textiles</div>
            </div>
            <div style={styles.showcaseCard}>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 8 }}>Ready to make your business look premium?</div>
              <div style={{ opacity: 0.95, lineHeight: 1.7, marginBottom: 16 }}>Launch your store today and start selling with confidence.</div>
              <button onClick={handleGetStarted} style={{ ...styles.buttonPrimary, background: theme.white, color: theme.primary }}>
                Create Your Store
              </button>
            </div>
          </div>
        </section>

        <section style={styles.ctaSection}>
          <h2 className="cta-title" style={{ fontSize: "2.25rem", marginBottom: 16 }}>Ready to grow your business?</h2>
          <p style={{ fontSize: "1.05rem", marginBottom: 32, opacity: 0.95, maxWidth: 720, marginInline: 'auto' }}>
            Join traders who are using a cleaner, faster, more modern storefront experience to connect with buyers every day.
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
          Example Store: <code>/store/arewaconnect</code>
        </div>
      </footer>
    </div>
  );
}