import React from "react";

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #fff8e1 0%, #fef3c7 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  fontFamily: "Arial, sans-serif",
};

const cardStyle = {
  width: "100%",
  maxWidth: "640px",
  background: "#ffffff",
  borderRadius: "16px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  padding: "28px",
  color: "#222",
};

const buttonStyle = {
  display: "inline-block",
  marginTop: "16px",
  padding: "12px 18px",
  borderRadius: "999px",
  background: "#25d366",
  color: "#fff",
  textDecoration: "none",
  fontWeight: "bold",
};

export default function Upgrade() {
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ marginTop: 0, color: "#1f2937" }}>Upgrade Your Arewa Connect Account</h1>
        <p style={{ lineHeight: 1.6 }}>
          To unlock a higher daily message limit, you can upgrade to one of the following options:
        </p>

        <ul style={{ lineHeight: 1.7, paddingLeft: "20px" }}>
          <li><strong>Verified Badge</strong> — ₦2,000 monthly (50 messages/day)</li>
          <li><strong>Pro Subscription</strong> — ₦3,000 monthly (200 messages/day + Pro Features)</li>
        </ul>

        <p style={{ lineHeight: 1.6 }}>
          For the quickest way to continue, reply with <strong>7</strong> in this WhatsApp chat and choose your plan.
        </p>

        <a href="/" style={buttonStyle}>Back to Home</a>
      </div>
    </div>
  );
}
