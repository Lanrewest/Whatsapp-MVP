import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../Logo";
import LoadingSpinner from "../LoadingSpinner";
import { optimizeCloudinaryUrl } from "../utils";

const PRODUCT_CATEGORY_OPTIONS = [
  "Fashion",
  "Food",
  "Electronics",
  "Beauty",
  "Home",
  "Services",
  "Textiles",
  "General",
];

const PRICE_RANGE_OPTIONS = [
  { label: "All prices", value: "all" },
  { label: "Under ₦5,000", value: "under-5000" },
  { label: "₦5,000 - ₦20,000", value: "5000-20000" },
  { label: "₦20,000 - ₦50,000", value: "20000-50000" },
  { label: "Above ₦50,000", value: "above-50000" },
];

export default function GeneralStore() {
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState("all");
  const [showFilters, setShowFilters] = useState(true);
  const [productColumns, setProductColumns] = useState(4);
  const [isCompactScreen, setIsCompactScreen] = useState(false);
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
    const updateViewportState = () => {
      const width = window.innerWidth;
      setIsCompactScreen(width < 900);

      if (width >= 1280) setProductColumns(4);
      else if (width >= 980) setProductColumns(3);
      else if (width >= 720) setProductColumns(2);
      else setProductColumns(1);
    };

    updateViewportState();
    window.addEventListener("resize", updateViewportState);
    return () => window.removeEventListener("resize", updateViewportState);
  }, []);

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

        const productCategories = [
          product.category,
          ...(product.traderCategories || []),
        ].filter(Boolean);
        const matchesCategory =
          selectedCategories.length === 0 ||
          selectedCategories.some((category) => productCategories.includes(category));

        const price = Number(product.price || 0);
        const matchesPriceRange =
          priceRange === "all" ||
          (priceRange === "under-5000" && price < 5000) ||
          (priceRange === "5000-20000" && price >= 5000 && price <= 20000) ||
          (priceRange === "20000-50000" && price > 20000 && price <= 50000) ||
          (priceRange === "above-50000" && price > 50000);

        return (
          matchesSearch &&
          matchesVerified &&
          matchesCategory &&
          matchesPriceRange
        );
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return Number(a.price || 0) - Number(b.price || 0);
        if (sortBy === "price-high") return Number(b.price || 0) - Number(a.price || 0);
        if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });

    setFilteredProducts(results);
    setVisibleCount(12);
  }, [searchTerm, sortBy, showVerifiedOnly, selectedCategories, priceRange, allProducts]);

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setPriceRange("all");
    setSearchTerm("");
    setSortBy("newest");
    setShowVerifiedOnly(false);
  };

  const categoryOptions = Array.from(
    new Set([
      ...PRODUCT_CATEGORY_OPTIONS,
      ...allProducts.flatMap((product) => [
        product.category,
        ...(product.traderCategories || []),
      ]),
    ].filter(Boolean)),
  );

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const activeFilterCount = [selectedCategories.length > 0, priceRange !== "all", showVerifiedOnly]
    .filter(Boolean).length;

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
    <div style={{ minHeight: "100vh", background: "#f7f7f7", padding: 16, boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1180, width: "100%", margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 24, background: 'linear-gradient(135deg, #ffffff 0%, #f7fbf8 100%)', borderRadius: 20, border: '1px solid #dbe7de', boxShadow: '0 14px 34px rgba(15, 23, 42, 0.06)', padding: '20px 16px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>
            <Logo width="300" height="60" />
          </Link>
          <h2 style={{ color: "#333", fontSize: "1.75rem", margin: "0 0 6px" }}>General Store Catalog</h2>
          <p style={{ color: "#666", margin: 0, fontSize: '0.95rem' }}>Browse premium products from verified traders.</p>
        </header>

        <section style={{ marginBottom: 18, padding: '10px 12px', background: '#fff9e6', borderLeft: '4px solid #ffc107', borderRadius: '4px' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#856404' }}>
            <strong>⚠️ Safe Shopping Tip:</strong> Arewa Connect connects you with traders.
            Always verify the product and trader details before making any payments.
            Transactions are conducted directly between you and the seller via WhatsApp.
            Arewa Connect does not handle payments or deliveries.
          </p>
        </section>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <h3 style={{ margin: 0, color: '#0f172a' }}>Available Products</h3>
          <button onClick={() => setShowFilters((prev) => !prev)} style={{ ...filterToggleStyle, width: isCompactScreen ? '100%' : 'auto' }}>
            {showFilters ? 'Hide filters' : `Filters${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}
          </button>
        </div>

        <section>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10, flexDirection: isCompactScreen ? 'column' : 'row', background: 'rgba(255,255,255,0.8)', padding: 10, borderRadius: 14, border: '1px solid #e7efe9', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.04)' }}>
              <input
                type="text"
                placeholder="Search products, traders, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1, minWidth: 0, width: '100%', padding: 12, borderRadius: 10, border: '1px solid #cfe2d8', boxSizing: 'border-box', fontSize: '0.95rem', background: '#fff' }}
              />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ ...controlStyle, width: isCompactScreen ? '100%' : 'auto' }}>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>

            {showFilters && (
              <div style={filterPanelStyle}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>Price range</label>
                    <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} style={{ ...controlStyle, maxWidth: 260 }}>
                      {PRICE_RANGE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button onClick={() => setShowVerifiedOnly((prev) => !prev)} style={toggleStyle(showVerifiedOnly)}>
                      {showVerifiedOnly ? 'Verified only' : 'Verified sellers'}
                    </button>
                    <button onClick={resetFilters} style={resetButtonStyle}>Reset</button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
              {categoryOptions.map((category) => {
                const active = selectedCategories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    style={{
                      ...filterChipStyle,
                      background: active ? '#075e54' : '#fff',
                      color: active ? '#fff' : '#333',
                      borderColor: active ? '#075e54' : '#d1d5db',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ color: '#666', fontSize: '0.9rem' }}>{filteredProducts.length} result(s)</span>
          </div>
          {visibleProducts.length === 0 ? (
            <p style={{ color: '#888' }}>No products found matching your search.</p>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${productColumns}, minmax(0, 1fr))`, gap: 14, alignItems: 'stretch' }}>
                {visibleProducts.map((product) => {
                  const imageList = product.imageUrls && product.imageUrls.length > 0
                    ? product.imageUrls
                    : product.imageUrl
                      ? [product.imageUrl]
                      : [];
                  const selectedImage = imageList[0] || '';

                  return (
                    <div key={product._id} style={{ ...cardStyle, width: '100%', boxSizing: 'border-box' }}>
                      {selectedImage && (
                        <img
                          src={optimizeCloudinaryUrl(selectedImage, { width: 400 })}
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
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 6px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>{product.category || 'General'}</span>
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
  minWidth: 0,
  width: '100%',
  maxWidth: 220,
  padding: '10px',
  borderRadius: 10,
  border: '1px solid #cfe2d8',
  boxSizing: 'border-box',
  background: '#fff',
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
};

const filterPanelStyle = {
  background: 'linear-gradient(180deg, #ffffff 0%, #f6fff8 100%)',
  borderRadius: 16,
  border: '1px solid #dbe7de',
  boxShadow: '0 12px 26px rgba(15, 23, 42, 0.06)',
  padding: 14,
};

const filterChipStyle = {
  padding: '9px 12px',
  borderRadius: 999,
  border: '1px solid #d1d5db',
  cursor: 'pointer',
  fontSize: '0.82rem',
  fontWeight: 700,
  boxShadow: '0 4px 10px rgba(15, 23, 42, 0.04)',
};

const filterToggleStyle = {
  border: '1px solid #075e54',
  background: '#075e54',
  color: '#fff',
  padding: '8px 12px',
  borderRadius: 999,
  cursor: 'pointer',
  fontSize: '0.82rem',
  fontWeight: 700,
};

const resetButtonStyle = {
  border: 'none',
  background: '#eefbf2',
  color: '#075e54',
  padding: '6px 10px',
  borderRadius: 999,
  cursor: 'pointer',
  fontSize: '0.78rem',
  fontWeight: 700,
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
  borderRadius: 16,
  border: '1px solid #ebf0ec',
  boxShadow: '0 12px 24px rgba(15, 23, 42, 0.05)',
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minWidth: 0,
  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
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