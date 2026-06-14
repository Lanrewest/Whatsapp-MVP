import React from "react";
import { Link } from "react-router-dom";
import Logo from "../Logo";

export default function TermsOfService() {
  return (
    <div style={{ padding: "40px 5%", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif", color: "#333", lineHeight: "1.6" }}>
      <header style={{ textAlign: "center", marginBottom: "40px" }}>
        <Link to="/"><Logo width="200" height="40" /></Link>
        <h1 style={{ marginTop: "20px", color: "#075e54" }}>Terms of Service</h1>
      </header>

      <section>
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h3>1. Acceptance of Terms</h3>
        <p>By using Arewa Connect, you agree to these terms. If you do not agree, please do not use the service.</p>

        <h3>2. Description of Service</h3>
        <p>Arewa Connect is a tool that allows traders to create digital catalogs accessible via a web link. Orders are placed directly via WhatsApp. We do not process payments or handle delivery.</p>

        <h3>3. User Responsibilities</h3>
        <p>Traders are responsible for the accuracy of their product listings, prices, and the fulfillment of orders. Customers are responsible for verifying the legitimacy of traders before making payments.</p>

        <h3>4. Prohibited Content</h3>
        <p>Users may not list illegal goods, weapons, or fraudulent services. We reserve the right to remove any store that violates these rules or local laws.</p>

        <h3>5. Limitation of Liability</h3>
        <p>Arewa Connect is not responsible for any disputes, financial losses, or damages resulting from transactions between traders and customers. All business is conducted at your own risk.</p>

        <h3>6. Verified Badges</h3>
        <p>The "Verified" badge indicates that a trader has completed a verification process. It does not constitute a guarantee of service quality or a background check by Arewa Connect.</p>
      </section>

      <footer style={{ marginTop: "50px", borderTop: "1px solid #eee", paddingTop: "20px", textAlign: "center" }}>
        <Link to="/" style={{ color: "#075e54", textDecoration: "none", fontWeight: "bold" }}>Back to Home</Link>
      </footer>
    </div>
  );
}