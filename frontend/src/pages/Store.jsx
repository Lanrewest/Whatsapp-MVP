import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function Store() {
  const { phone } = useParams();
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [products, setProducts] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerRequest, setCustomerRequest] = useState("");
  const [status, setStatus] = useState("");
  const [trader, setTrader] = useState(null);
  const [loading, setLoading] = useState(true); // Added loading state
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!phone) return;
      setLoading(true);
      setFetchError(null);
      try {
        const [prodRes, traderRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/products/${phone}`),
          fetch(`${API_BASE_URL}/api/trader/${phone}`)
        ]);

        if (!prodRes.ok) throw new Error("Failed to load products");
        if (!traderRes.ok) throw new Error("Failed to load trader info");

        const prodData = await prodRes.json();
        const traderData = await traderRes.json();

        setProducts(prodData);
        setTrader(traderData);
      } catch (err) {
        console.error("Error loading store:", err);
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [phone]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");
    const res = await fetch(`${API_BASE_URL}/api/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        traderPhone: phone,
        customerName,
        customerRequest
      })
    });

    if (res.ok) {
      setStatus("Request sent!");
      setCustomerName("");
      setCustomerRequest("");
    } else {
      setStatus("Failed to send request.");
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 50 }}>Loading Store...</div>;
  }

  if (fetchError) {
    return <div style={{ textAlign: "center", padding: 50, color: "red" }}>Error: {fetchError}</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7", padding: 24 }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ color: "#075e54", fontSize: "2.5rem" }}>ArewaMarket</h1>
          {trader ? (
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ color: "#333", fontSize: "1.5rem", margin: "0 0 4px" }}>{trader.companyName || "Trader Store"}</h2>
              {trader.address && <p style={{ color: "#666", margin: 0 }}>{trader.address}</p>}
            </div>
          ) : (
            <h2 style={{ color: "#333", fontSize: "1.5rem" }}>Trader Store</h2>
          )}
        </header>
        <section>
          {products.length === 0 ? (
            <p style={{ color: "#888" }}>No products yet.</p>
          ) : (
            products.map(p => (
              <div key={p._id} style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #0001", marginBottom: 20, padding: 16 }}>
                {p.imageUrl && <img src={p.imageUrl} alt={p.name} style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8 }} />}
                <h3 style={{ margin: "12px 0 4px", color: "#075e54" }}>{p.name}</h3>
                <p style={{ margin: 0, color: "#222" }}>₦{p.price}</p>
              </div>
            ))
          )}
        </section>
        <section style={{ marginTop: 32 }}>
          <h3>Request Product / Contact Trader</h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="text"
              placeholder="Your Name"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              required
              style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
            />
            <textarea
              placeholder="What do you want to request or ask?"
              value={customerRequest}
              onChange={e => setCustomerRequest(e.target.value)}
              required
              style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", minHeight: 60 }}
            />
            <button type="submit" style={{ background: "#25d366", color: "#fff", border: "none", borderRadius: 6, padding: "12px 0", fontWeight: 600, fontSize: "1rem" }}>
              Send Request
            </button>
            {status && <div style={{ color: status === "Request sent!" ? "green" : "red" }}>{status}</div>}
          </form>
        </section>
      </div>
    </div>
  );
}
