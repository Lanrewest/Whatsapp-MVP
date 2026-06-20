import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../Logo";
import LoadingSpinner from "../LoadingSpinner";

export default function GeneralStore() {
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
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
        setAllProducts(data || []);
      } catch (err) {
        console.error("Error loading all products:", err);
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllProducts();
  }, [API_BASE_URL]);

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.trim().toLowerCase();

    const results = allProducts
      .filter((product) => {
        const matchesSearch =
          !lowercasedSearchTerm ||
          product.name?.toLowerCase().includes(lowercasedSearchTerm) ||
          product.traderName?.toLowerCase().includes(lowercasedSearchTerm) ||
          product.traderAddress?.toLowerCase().includes(lowercasedSearchTerm);

        const matchesVerified = !showVerifiedOnly || product.isVerified || product.isPro;

        return matchesSearch && matchesVerified;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return Number(a.price || 0) - Number(b.price || 0);
        if (sortBy === "price-high") return Number(b.price || 0) - Number(a.price || 0);
        if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });

    setFilteredProducts(results);
    setVisibleCount(12);
  }, [searchTerm, sortBy, showVerifiedOnly, allProducts]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const openWhatsApp = (product) => {
    const phone = product.traderPhone || "";
    const cleanPhone = phone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Hi ${product.traderName || "Trader"}, I’m interested in ${product.name} priced at ₦${Number(product.price || 0).toLocaleString()}.`
    );
    const url = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return <LoadingSpinner message="Searching the Marketplace..." />;
  }

  if (fetchError) {
    return <div style={{ textAlign: "center", padding: 50, color: "red" }}>Error: {fetchError}</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7", padding: 16 }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 24 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>
            <Logo width="300" height="60" />
          </Link>
          <h2 style={{ color: "#333", fontSize: "1.5rem", margin: "0 0 4px" }}>General Store Catalog</h2>
          <p style={{ color: "#666", margin: 0 }}>Browse products from all traders.</p>
        </header>

        <section style={{ marginBottom: 18, padding: '10px 12px', background: '#fff9e6', borderLeft: '4px solid #ffc107', borderRadius: '4px' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#856404' }}>
            <strong>⚠️ Safe Shopping Tip:</strong> Arewa Connect connects you with traders.
            Always verify the product and trader details before making any payments.
            Transactions are conducted directly between you and the seller via WhatsApp.
            Arewa Connect does not handle payments or deliveries.
          </p>
        </section>

        <section style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            <input
              type="text"
              placeholder="Search products, traders, or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, minWidth: 240, padding: 10, borderRadius: 6, border: '1px solid #ccc' }}
            />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={controlStyle}>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name (A-Z)</option>
            </select>
            <button onClick={() => setShowVerifiedOnly((prev) => !prev)} style={toggleStyle(showVerifiedOnly)}>
              {showVerifiedOnly ? 'Showing Verified Only' : 'Show Verified Only'}
            </button>
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Available Products</h3>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>{filteredProducts.length} result(s)</span>
          </div>
          {visibleProducts.length === 0 ? (
            <p style={{ color: '#888' }}>No products found matching your search.</p>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
                {visibleProducts.map((product) => {
                  const imageList = product.imageUrls && product.imageUrls.length > 0
                    ? product.imageUrls
                    : product.imageUrl
                      ? [product.imageUrl]
                      : [];
                  const selectedImage = imageList[0] || '';

                  return (
                    <div key={product._id} style={cardStyle}>
                      {selectedImage && (
                        <img
                          src={selectedImage}
                          alt={product.name}
                          style={{ width: '100%', height: 176, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
                        />
                      )}
                      {imageList.length > 1 && (
                        <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflowX: 'auto' }}>
                          {imageList.map((img, index) => (
                            <img
                              key={`${product._id}-${index}`}
                              src={img}
                              alt={`${product.name} ${index + 1}`}
                              style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }}
                            />
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', minHeight: 46 }}>
                        <h4 style={{ margin: '0', color: '#075e54', fontSize: '0.95rem', lineHeight: 1.3 }}>{product.name}</h4>
                        {product.isPro && <span title="Pro Trader" style={{ fontSize: '0.9rem' }}>💎</span>}
                        {product.isVerified && <span title="Verified Trader" style={{ color: '#1d9bf0', fontSize: '0.9rem' }}>✅</span>}
                      </div>
                      <p style={{ margin: '6px 0', color: '#222', fontWeight: 'bold' }}>₦{Number(product.price || 0).toLocaleString()}</p>
                      {product.description && <p style={{ margin: '0 0 8px', color: '#666', fontSize: '0.9rem', minHeight: 38 }}>{product.description}</p>}

                      <div style={{ marginTop: '6px', fontSize: '0.84rem', color: '#666' }}>
                        <p style={{ margin: '2px 0' }}>Sold By: <strong>{product.traderName || 'Unknown Trader'}</strong></p>
                        {product.traderAddress && <p style={{ margin: '2px 0' }}>Location: {product.traderAddress}</p>}
                      </div>

                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        {product.traderSlug && (
                          <Link to={`/store/${product.traderSlug}`} style={linkStyle}>
                            View Store
                          </Link>
                        )}
                        <button onClick={() => openWhatsApp(product)} style={whatsappStyle}>
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {visibleCount < filteredProducts.length && (
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <button onClick={() => setVisibleCount((prev) => prev + 8)} style={loadMoreStyle}>
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

const controlStyle = {
  minWidth: 180,
  padding: '10px',
  borderRadius: 6,
  border: '1px solid #ccc'
};

const toggleStyle = (active) => ({
  padding: '10px 12px',
  borderRadius: 6,
  border: `1px solid ${active ? '#25d366' : '#ccc'}`,
  background: active ? '#eefbf2' : '#fff',
  color: active ? '#075e54' : '#333',
  cursor: 'pointer'
});

const cardStyle = {
  background: '#fff',
  borderRadius: 10,
  border: '1px solid #ececec',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
  padding: 14,
  display: 'flex',
  flexDirection: 'column',
  height: '100%'
};

const linkStyle = {
  flex: 1,
  display: 'block',
  padding: '8px 12px',
  background: '#25d366',
  color: '#fff',
  textDecoration: 'none',
  borderRadius: 5,
  textAlign: 'center',
  fontSize: '0.9rem'
};

const whatsappStyle = {
  flex: 1,
  padding: '8px 12px',
  background: '#075e54',
  color: '#fff',
  border: 'none',
  borderRadius: 5,
  cursor: 'pointer',
  fontSize: '0.9rem'
};

const loadMoreStyle = {
  padding: '10px 16px',
  background: '#fff',
  border: '1px solid #25d366',
  color: '#075e54',
  borderRadius: 6,
  cursor: 'pointer'
};