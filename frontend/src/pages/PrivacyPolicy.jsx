import React from "react";
import { Link } from "react-router-dom";
import Logo from "../Logo";

export default function PrivacyPolicy() {
  return (
    <div style={{ padding: "40px 5%", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif", color: "#333", lineHeight: "1.6" }}>
      <header style={{ textAlign: "center", marginBottom: "40px" }}>
        <Link to="/"><Logo width="200" height="40" /></Link>
        <h1 style={{ marginTop: "20px", color: "#075e54" }}>Privacy Policy</h1>
      </header>

      <section>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <p>At Arewa Connect, we value your privacy. This policy explains how we collect and use your information when you use our WhatsApp-based storefront service.</p>

        <h3>1. Information We Collect</h3>
        <p><strong>Traders:</strong> We collect your WhatsApp phone number, business name, address, and product information to create your storefront.</p>
        <p><strong>Customers:</strong> When you place an order, the name and request you provide are sent directly to the trader via WhatsApp. We do not store customer payment information.</p>

        <h3>2. How We Use Information</h3>
        <p>We use the data to facilitate the connection between traders and customers. Your phone number is used as your unique identifier to manage your store via our WhatsApp bot.</p>

        <h3>3. Data Sharing</h3>
        <p>We do not sell your data. Your store information is public to anyone with your link so they can browse your products. Transactional data (orders) happens directly on WhatsApp between you and your customer.</p>

        <h3>4. Security</h3>
        <p>We use industry-standard measures to protect the data stored on our servers. However, please remember that no method of transmission over the internet is 100% secure.</p>

        <h3>5. Contact Us</h3>
        <p>If you have any questions about this Privacy Policy, please contact us through our official WhatsApp channel.</p>
      </section>
      
      <footer style={{ marginTop: "50px", borderTop: "1px solid #eee", paddingTop: "20px", textAlign: "center" }}>
        <Link to="/" style={{ color: "#075e54", textDecoration: "none", fontWeight: "bold" }}>Back to Home</Link>
      </footer>
    </div>
  );
}