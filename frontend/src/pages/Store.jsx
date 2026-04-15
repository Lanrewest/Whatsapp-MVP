import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function Store() {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [trader, setTrader] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerRequest, setCustomerRequest] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (slug) {
      fetch(`/api/products/${slug}`)
        .then(res => res.json())
        .then(setProducts);
      fetch(`/api/trader/${slug}`)
        .then(res => res.json())
        .then(data => setTrader(data));
    }
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Sending...");
    const res = await fetch("/api/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        traderPhone: slug, // still using slug, backend will resolve
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

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7", padding: 24 }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="ArewaMarket" style={{ width: 60, marginBottom: 12 }} />
          <h1 style={{ color: "#075e54", fontSize: "2.2rem", marginBottom: 0 }}>ArewaMarket</h1>
          <h2 style={{ color: "#333", fontSize: "1.3rem", margin: 0 }}>Trader Store</h2>
          {trader && (
            <div style={{ marginTop: 16, background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 2px 8px #0001" }}>
              <h3 style={{ color: "#075e54", margin: 0 }}>{trader.companyName || "Unnamed Trader"}</h3>
              {trader.address && <p style={{ color: "#555", margin: 0 }}>{trader.address}</p>}
            </div>
          )}
        </header>
        <section>
          {products.length === 0 ? (
            <p style={{ color: "#888" }}>No products yet.</p>
          ) : (
            products.map(p => (
              <div key={p._id} style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #0001", marginBottom: 20, padding: 16, display: 'flex', gap: 16 }}>
                {p.imageUrl && <img src={p.imageUrl} alt={p.name} style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8 }} />}
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 8px", color: "#075e54" }}>{p.name}</h3>
                  <p style={{ margin: 0, color: "#222", fontWeight: 600, fontSize: '1.1rem' }}>
                    ₦{p.price}
                  </p>
                </div>
              </div>
            ))
          )}
        </section>
        <section style={{ marginTop: 32 }}>
          <h3 style={{ color: '#075e54' }}>Request Product / Contact Trader</h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, background: '#fff', borderRadius: 8, padding: 20, boxShadow: '0 2px 8px #0001' }}>
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
              <h2 style={{ color: "#333", fontSize: "1.3rem", margin: 0 }}>Trader Store</h2>
              {trader && (
                <div style={{ marginTop: 16, background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 2px 8px #0001" }}>
                  <h3 style={{ color: "#075e54", margin: 0 }}>{trader.companyName || "Unnamed Trader"}</h3>
                  {trader.address && <p style={{ color: "#555", margin: 0 }}>{trader.address}</p>}
                </div>
              )}
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
