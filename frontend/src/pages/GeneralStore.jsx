import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../Logo";
import LoadingSpinner from "../LoadingSpinner";

export default function GeneralStore() {
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    document.title = "Browse All Products | Arewa Connect";
    const fetchAllProducts = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const apiUrl = `${API_BASE_URL}/api/products`;
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`API error: ${response.status} at ${apiUrl}`);
        }
        const data = await response.json();
        setAllProducts(data);
        setFilteredProducts(data); // Initially, all products are filtered products
      } catch (err) {
        console.error("Error loading all products:", err);
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllProducts();
  }, []);

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const results = allProducts.filter(product =>
      product.name.toLowerCase().includes(lowercasedSearchTerm) ||
      (product.traderName && product.traderName.toLowerCase().includes(lowercasedSearchTerm)) // Assuming traderName might be added to product schema or fetched
    );
    setFilteredProducts(results);
  }, [searchTerm, allProducts]);

  if (loading) {
    return <LoadingSpinner message="Searching the Marketplace..." />;
  }

  if (fetchError) {
    return <div style={{ textAlign: "center", padding: 50, color: "red" }}>Error: {fetchError}</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7", padding: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>
            <Logo width="300" height="60" />
          </Link>
          <h2 style={{ color: "#333", fontSize: "1.5rem", margin: "0 0 4px" }}>General Store Catalog</h2>
          <p style={{ color: "#666", margin: 0 }}>Browse products from all traders.</p>
        </header>

        <section style={{ marginBottom: 24, padding: '12px', background: '#fff9e6', borderLeft: '4px solid #ffc107', borderRadius: '4px' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#856404' }}>
            <strong>⚠️ Safe Shopping Tip:</strong> Arewa Connect connects you with traders. 
            Always verify the product and trader details before making any payments. 
            Transactions are conducted directly between you and the seller via WhatsApp. 
            Arewa Connect does not handle payments or deliveries.
          </p>
        </section>

        <section style={{ marginBottom: 24 }}>
          <input
            type="text"
            placeholder="Search products or traders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
          />
        </section>

        <section>
          <h3 style={{ marginBottom: 16 }}>Available Products</h3>
          {filteredProducts.length === 0 ? (
            <p style={{ color: "#888" }}>No products found matching your search.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
              {filteredProducts.map(p => (
                <div key={p._id} style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #0001", padding: 16 }}>
                  {p.imageUrl && <img src={p.imageUrl} alt={p.name} style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8, marginBottom: 10 }} />}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <h4 style={{ margin: "0 0 4px", color: "#075e54" }}>{p.name}</h4>
                    {p.isVerified && <span title="Verified Trader" style={{ color: '#1d9bf0', fontSize: '0.9rem' }}>✅</span>}
                  </div>
                  <p style={{ margin: 0, color: "#222", fontWeight: 'bold' }}>₦{p.price.toLocaleString()}</p>
                  {p.traderSlug && ( // Use traderSlug for the link
                    <Link to={`/store/${p.traderSlug}`} style={linkStyle}>
                      View Trader's Store
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const linkStyle = {
  display: 'block',
  marginTop: 10,
  padding: '8px 12px',
  background: '#25d366',
  color: '#fff',
  textDecoration: 'none',
  borderRadius: 5,
  textAlign: 'center',
  fontSize: '0.9rem'
};