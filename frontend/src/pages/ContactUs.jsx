import React from "react";
import { Link } from "react-router-dom";
import Logo from "../Logo";

export default function ContactUs() {
  const normalizeNumber = (value) => (value || "").replace(/\D/g, "");
  const SUPPORT_WHATSAPP_NUMBER = normalizeNumber(process.env.REACT_APP_SUPPORT_NUMBER || "+2349040508117");

  return (
    <div style={{ padding: "40px 5%", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif", color: "#333", textAlign: "center" }}>
      <header style={{ marginBottom: "40px" }}>
        <Link to="/"><Logo width="200" height="40" /></Link>
        <h1 style={{ marginTop: "20px", color: "#075e54" }}>Contact Us</h1>
      </header>

      <div style={{ background: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
        <p style={{ fontSize: "1.1rem", marginBottom: "20px" }}>
          Have questions or need help with your store? Reach out to us directly on WhatsApp!
        </p>
        
        <a 
          href={`https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=Hello%20Arewa%20Connect%20Support`} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            display: "inline-block", 
            background: "#25d366", 
            color: "#fff", 
            padding: "15px 30px", 
            borderRadius: "50px", 
            textDecoration: "none", 
            fontWeight: "bold",
            fontSize: "1.1rem"
          }}
        >
          Chat with Support
        </a>

        <div style={{ marginTop: "40px", color: "#666" }}>
          <p><strong>Email:</strong> support.arewaconnect@gmail.com</p>
        </div>
      </div>

      <footer style={{ marginTop: "50px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
        <Link to="/" style={{ color: "#075e54", textDecoration: "none", fontWeight: "bold" }}>Back to Home</Link>
      </footer>
    </div>
  );
}