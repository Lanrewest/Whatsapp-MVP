import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Logo from "../Logo";

export default function Store() {
  const { slug } = useParams();
  const API_BASE_URL = process.env.REACT_APP_API_URL || "https://localhost:5000";

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({}); // { productId: { name, price, qty } }
  const [customerName, setCustomerName] = useState("");
  const [customerRequest, setCustomerRequest] = useState("");
  const [status, setStatus] = useState("");
  const [trader, setTrader] = useState(null);
  const [loading, setLoading] = useState(true); // Added loading state
  const [fetchError, setFetchError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const addToCart = (product) => {
    setCart(prev => {
      const current = prev[product._id] || { ...product, qty: 0 };
      return {
        ...prev,
        [product._id]: { ...current, qty: current.qty + 1 }
      };
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId].qty > 1) {
        newCart[productId].qty -= 1;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const handleBuyNow = (product) => {
    addToCart(product);
    setSelectedProduct(null);
    document.getElementById("checkout-form")?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;
      setLoading(true);
      setFetchError(null);
      try {
        const [prodRes, traderRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/products/${slug}`),
          fetch(`${API_BASE_URL}/api/trader/${slug}`)
        ]);

        if (!prodRes.ok) throw new Error("Failed to load products");
        if (!traderRes.ok) throw new Error("Failed to load trader info");

        const prodData = await prodRes.json();
        const traderData = await traderRes.json();

        setProducts(prodData);
        setTrader(traderData);

        // Update tab name to the Trader's Company Name
        if (traderData?.companyName) {
          document.title = `${traderData.companyName} | ArewaMarket`;
        }

        // Analytics: Track store visit
        fetch(`${API_BASE_URL}/api/analytics/track?page=store&slug=${slug}`, { method: 'POST' })
          .catch(() => {});
      } catch (err) {
        console.error("Error loading store:", err);
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trader || cartItems.length === 0) return;

    // Construct Order Message
    let orderSummary = cartItems.map(item => `- ${item.name} (x${item.qty}): ₦${item.price * item.qty}`).join('\n');
    const fullMessage = `Hello ${trader.companyName || 'Trader'},\n\nI'm ${customerName}. I'd like to place an order for:\n\n${orderSummary}\n\n*Total: ₦${cartTotal}*\n\nAdditional Request: ${customerRequest}`;

    setStatus("Sending...");
    
    try {
      // 1. Notify Backend (Optional, but keeps your logs/twilio working)
      await fetch(`${API_BASE_URL}/api/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          traderPhone: trader.phone,
          customerName,
          customerRequest: fullMessage
        })
      });
    } catch (err) {
      console.warn("Backend notification failed, but continuing to WhatsApp checkout.");
    }

    // 2. Open Direct WhatsApp link
    // Ensure phone starts with country code and has no '+' or spaces
    const cleanPhone = trader.phone.replace(/\D/g, '');
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullMessage)}`;
    window.open(waLink, '_blank');

    setStatus("Redirecting to WhatsApp...");
    setCart({});
    setCustomerName("");
    setCustomerRequest("");
  };

  if (loading) {
    return <div style={{ textAlign: "center", padding: 50 }}>Loading Store...</div>;
  }

  if (fetchError) {
    return <div style={{ textAlign: "center", padding: 50, color: "red" }}>Error loading store: {fetchError}. Please ensure the backend is running and accessible.</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f7f7", padding: 24 }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 32 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}>
            <Logo width="220" height="55" />
          </Link>
          {trader ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <h2 style={{ color: "#333", fontSize: "1.5rem", margin: "0 0 4px" }}>{trader.companyName || "Trader Store"}</h2>
                {trader.isVerified && <span title="Verified Trader" style={{ fontSize: '1.2rem' }}>✅</span>}
              </div>
              {trader.address && <p style={{ color: "#666", margin: 0 }}>{trader.address}</p>}
            </div>
          ) : (
            <h2 style={{ color: "#333", fontSize: "1.5rem" }}>Trader Store</h2>
          )}
        </header>
        <section>
          <h3 style={{ marginBottom: 16 }}>Products</h3>
          {products.length === 0 ? (
            <p style={{ color: "#888" }}>No products yet.</p>
          ) : (
            products.map(p => (
              <div key={p._id} style={{ background: "#fff", borderRadius: 8, boxShadow: "0 2px 8px #0001", marginBottom: 20, padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
                {p.imageUrl && <img src={p.imageUrl} alt={p.name} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: 8 }} />}
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 4px", color: "#075e54" }}>{p.name}</h3>
                  <p style={{ margin: 0, color: "#222", fontWeight: 'bold' }}>₦{p.price}</p>
                </div>
                <div className="product-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                   <button onClick={() => setSelectedProduct(p)} style={btnDetails}>Details</button>
                   {cart[p._id] ? (
                     <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={() => removeFromCart(p._id)} style={btnSmall}>-</button>
                        <span>{cart[p._id].qty}</span>
                        <button onClick={() => addToCart(p)} style={btnSmall}>+</button>
                     </div>
                   ) : (
                     <button onClick={() => addToCart(p)} style={btnAdd}>Add</button>
                   )}
                </div>
              </div>
            ))
          )}
        </section>

        {cartItems.length > 0 && (
          <section style={{ background: '#e8f5e9', padding: 20, borderRadius: 12, marginTop: 24 }}>
            <h3>Your Cart</h3>
            {cartItems.map(item => (
              <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: 4 }}>
                <span>{item.name} x {item.qty}</span>
                <span>₦{item.price * item.qty}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #ccc', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>Total:</span>
              <span>₦{cartTotal}</span>
            </div>
          </section>
        )}

        <section style={{ marginTop: 32 }}>
          <h3 id="checkout-form">Finish Your Order</h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            <input
              type="text"
              placeholder="Your Name"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              required
              style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
            />
            <textarea
              placeholder="Any extra instructions? (e.g. delivery time)"
              value={customerRequest}
              onChange={e => setCustomerRequest(e.target.value)}
              style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc", minHeight: 60 }}
            />
            <button 
              type="submit" 
              disabled={cartItems.length === 0}
              style={{ background: cartItems.length === 0 ? "#ccc" : "#25d366", color: "#fff", border: "none", borderRadius: 6, padding: "12px 0", fontWeight: 600, fontSize: "1rem", cursor: 'pointer' }}
            >
              Checkout via WhatsApp
            </button>
            {status && <div style={{ color: status.includes("Redirecting") ? "green" : "red", textAlign: 'center' }}>{status}</div>}
          </form>
        </section>
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <button onClick={() => setSelectedProduct(null)} style={btnClose}>×</button>
            <h2 style={{ color: '#075e54', marginBottom: '16px', fontSize: '1.4rem' }}>Product Details</h2>
            {selectedProduct.imageUrl && (
              <img 
                src={selectedProduct.imageUrl} 
                alt={selectedProduct.name} 
                style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '12px', marginBottom: '16px' }} 
              />
            )}
            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <p style={{ margin: '8px 0', fontSize: '1.1rem' }}><strong>{selectedProduct.name}</strong></p>
              <p style={{ margin: '8px 0', color: '#075e54', fontWeight: 'bold', fontSize: '1.2rem' }}>₦{selectedProduct.price}</p>
              <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }} />
              <p style={{ margin: '4px 0', color: '#666', fontSize: '0.9rem' }}>Sold By: <strong>{trader?.companyName}</strong></p>
              {trader?.address && <p style={{ margin: '4px 0', color: '#666', fontSize: '0.9rem' }}>Location: {trader.address}</p>}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} style={btnAdd}>Add to Cart</button>
              <button onClick={() => handleBuyNow(selectedProduct)} style={{ ...btnAdd, background: '#25d366' }}>Buy Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const btnAdd = {
  background: '#075e54',
  color: '#fff',
  border: 'none',
  padding: '6px 16px',
  borderRadius: '20px',
  cursor: 'pointer'
};

const btnSmall = {
  background: '#eee',
  border: '1px solid #ccc',
  width: '30px',
  height: '30px',
  borderRadius: '50%',
  cursor: 'pointer'
};

const btnDetails = {
  background: '#eee',
  color: '#333',
  border: '1px solid #ccc',
  padding: '6px 16px',
  borderRadius: '20px',
  cursor: 'pointer',
  fontSize: '0.8rem'
};

const btnClose = {
  position: 'absolute',
  top: '10px',
  right: '15px',
  background: 'none',
  border: 'none',
  fontSize: '28px',
  cursor: 'pointer',
  color: '#999'
};

const modalOverlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
  padding: '20px'
};

const modalContent = {
  background: '#fff',
  borderRadius: '16px',
  padding: '24px',
  maxWidth: '450px',
  width: '100%',
  position: 'relative',
  maxHeight: '90vh',
  overflowY: 'auto',
  textAlign: 'center'
};
