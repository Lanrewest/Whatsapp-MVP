import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "../Logo";
import LoadingSpinner from "../LoadingSpinner";
import { optimizeCloudinaryUrl } from "../utils";

export default function Store() {
  const { slug, phone } = useParams();
  const identifier = slug || phone;
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [customerName, setCustomerName] = useState("");
  const [customerRequest, setCustomerRequest] = useState("");
  const [status, setStatus] = useState("");
  const [trader, setTrader] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [isCompactScreen, setIsCompactScreen] = useState(false);
  const selectedProductImage = selectedProduct?.imageUrl || selectedProduct?.imageUrls?.[0] || "";

  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");

  useEffect(() => {
    const updateViewportState = () => setIsCompactScreen(window.innerWidth < 768);
    updateViewportState();
    window.addEventListener("resize", updateViewportState);
    return () => window.removeEventListener("resize", updateViewportState);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!identifier) return;
      setLoading(true);
      setFetchError(null);
      try {
        const [prodRes, traderRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/products/${identifier}`),
          fetch(`${API_BASE_URL}/api/trader/${identifier}`),
        ]);
        if (!prodRes.ok) throw new Error(`Products API returned ${prodRes.status}`);
        if (!traderRes.ok) throw new Error(`Trader API returned ${traderRes.status}`);
        const prodData = await prodRes.json();
        const traderData = await traderRes.json();
        setProducts(prodData || []);
        setTrader(traderData || null);
        if (traderData?.companyName) document.title = `${traderData.companyName} | Arewa Connect`;
        // best-effort analytics
        fetch(`${API_BASE_URL}/api/analytics/track?page=store&slug=${identifier}`, { method: 'POST' }).catch(() => {});
      } catch (err) {
        console.error(err);
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [identifier]);

  const addToCart = (product) => {
    setCart(prev => {
      const current = prev[product._id] || { ...product, qty: 0 };
      return { ...prev, [product._id]: { ...current, qty: current.qty + 1 } };
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const next = { ...prev };
      if (!next[productId]) return prev;
      if (next[productId].qty > 1) next[productId].qty -= 1; else delete next[productId];
      return next;
    });
  };

  const cartItems = Object.values(cart);
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const handleBuyNow = (product) => {
    addToCart(product);
    setSelectedProduct(null);
    document.getElementById("checkout-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trader || cartItems.length === 0) return;
    const orderSummary = cartItems.map(i => `- ${i.name} (x${i.qty}): ₦${(i.price * i.qty).toLocaleString()}`).join('\n');
    const fullMessage = `Hello ${trader.companyName || 'Trader'},\n\nI'm ${customerName}. I'd like to place an order for:\n\n${orderSummary}\n\n*Total: ₦${cartTotal.toLocaleString()}*\n\nAdditional Request: ${customerRequest}`;
    setStatus("Sending...");
    try {
      await fetch(`${API_BASE_URL}/api/request`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ traderPhone: trader.phone, customerName, customerRequest: fullMessage }) });
    } catch (err) { }
    const cleanPhone = (trader.phone || "").replace(/\D/g, '');
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullMessage)}`;
    window.open(waLink, '_blank', 'noopener,noreferrer');
    setStatus("Redirecting to WhatsApp...");
    setCart({}); setCustomerName(''); setCustomerRequest(''); setShowFeedback(true);
  };

  const submitFeedback = async () => {
    if (!trader) return;
    try {
      await fetch(`${API_BASE_URL}/api/feedback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ traderPhone: trader.phone, traderSlug: trader.slug, customerName: customerName || 'Anonymous', rating, comment: feedbackComment }) });
      alert('Thank you for your feedback!');
      setShowFeedback(false); setFeedbackComment('');
    } catch (err) { console.error(err); }
  };

  if (loading) return <LoadingSpinner message="Entering Storefront..." />;
  if (fetchError) return <div style={{ textAlign: 'center', padding: 50, color: 'red' }}>Error loading store: {fetchError}</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f7', padding: 16, boxSizing: 'border-box' }}>
      <main aria-labelledby="store-header" style={{ maxWidth: 1080, width: '100%', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: '1rem', textDecoration: 'none' }}><Logo width="275" height="55" /></Link>
          {trader ? (
            <>
              {trader.isPro && trader.storeBannerUrl && (
                <div style={{ marginBottom: '1rem', borderRadius: 12, overflow: 'hidden' }}>
                  <img src={optimizeCloudinaryUrl(trader.storeBannerUrl, { width: isCompactScreen ? 600 : 1200 })} alt={`${trader.companyName} banner`} loading="lazy" decoding="async" style={{ width: '100%', height: isCompactScreen ? 140 : 200, objectFit: 'cover' }} />
                </div>
              )}

              <h1 id="store-header" style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>{trader.companyName || 'Trader Store'}</h1>
              {trader.address && <p style={{ margin: 0, color: '#666' }}>{trader.address}</p>}
            </>
          ) : (
            <h1 id="store-header" style={{ margin: 0, fontSize: '1.5rem', color: '#333' }}>Trader Store</h1>
          )}
        </header>

        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Products</h2>
            <span style={{ color: '#666' }}>{products.length} item(s)</span>
          </div>

          {products.length === 0 ? <p style={{ color: '#888' }}>No products yet.</p> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
              {products.map(p => <ProductCard key={p._id} product={p} onAddToCart={addToCart} onRemoveFromCart={removeFromCart} onShowDetails={setSelectedProduct} cartQty={cart[p._id]?.qty || 0} />)}
            </div>
          )}
        </section>

        {cartItems.length > 0 && (
          <section style={{ background: '#e8f5e9', padding: 20, borderRadius: 12, marginTop: 24 }}>
            <h3>Your Cart</h3>
            {cartItems.map(item => <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between' }}><span>{item.name} x {item.qty}</span><span>₦{(item.price * item.qty).toLocaleString()}</span></div>)}
            <div style={{ borderTop: '1px solid #ccc', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}><span>Total:</span><span>₦{cartTotal.toLocaleString()}</span></div>
          </section>
        )}

        <section style={{ marginTop: 32 }}>
          <h3 id="checkout-form">Finish Your Order</h3>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>* Clicking below opens WhatsApp with the trader.</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            <label htmlFor="customerName">Your Name</label>
            <input id="customerName" type="text" placeholder="Your Name" value={customerName} onChange={e => setCustomerName(e.target.value)} required style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc' }} />

            <label htmlFor="customerRequest">Any extra instructions?</label>
            <textarea id="customerRequest" placeholder="Any extra instructions? (e.g. delivery time)" value={customerRequest} onChange={e => setCustomerRequest(e.target.value)} style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc', minHeight: 60 }} />

            <button type="submit" disabled={cartItems.length === 0} style={{ background: cartItems.length === 0 ? '#ccc' : '#25d366', color: '#fff', padding: '12px 0', border: 'none', borderRadius: 6 }}>{cartItems.length === 0 ? 'Cart empty' : 'Checkout via WhatsApp'}</button>
            {status && <div style={{ textAlign: 'center', color: status.includes('Redirecting') ? 'green' : 'red' }}>{status}</div>}
          </form>
        </section>

        {showFeedback && (
          <section style={{ marginTop: 32, padding: 20, background: '#fff', borderRadius: 12 }}>
            <h3>How was your experience?</h3>
            <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>{[1,2,3,4,5].map(n => <button key={n} aria-label={`Rate ${n} star${n>1?'s':''}`} onClick={() => setRating(n)} style={{ padding: 8, borderRadius: '50%', background: rating>=n? '#ffc107':'#fff' }}>{n}</button>)}</div>
            <textarea placeholder="Leave a comment (optional)" value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)} style={{ width: '100%', padding: 10 }} />
            <button onClick={submitFeedback} style={{ marginTop: 10, background: '#075e54', color: '#fff', padding: '10px 14px', border: 'none', borderRadius: 6 }}>Submit Feedback</button>
          </section>
        )}
      </main>

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div style={modalOverlay} role="dialog" aria-modal="true" aria-labelledby="product-detail-title" aria-describedby="product-detail-desc">
            <div style={modalContent}>
              <button type="button" onClick={() => setSelectedProduct(null)} style={btnClose} aria-label="Close product details">×</button>
              <h2 id="product-detail-title" style={{ color: '#075e54' }}>{selectedProduct.name}</h2>
              {selectedProductImage && <img src={optimizeCloudinaryUrl(selectedProductImage, { width: 700 })} alt={selectedProduct.name} loading="lazy" decoding="async" style={{ width: '100%', maxHeight: 250, objectFit: 'contain', borderRadius: 12 }} onClick={() => setZoomedImage(selectedProductImage)} />}
              <div id="product-detail-desc" style={{ textAlign: 'left', marginTop: 12 }}>
                <p style={{ margin: 0, fontSize: '1.05rem' }}><strong>{selectedProduct.name}</strong></p>
                <p style={{ color: '#075e54', fontWeight: 'bold' }}>₦{Number(selectedProduct.price||0).toLocaleString()}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} style={btnAdd}>Add to Cart</button>
                <button onClick={() => handleBuyNow(selectedProduct)} style={{ ...btnAdd, background: '#25d366' }}>Buy Now</button>
              </div>
            </div>
          </div>
        )}

        {zoomedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }} onClick={() => setZoomedImage(null)} role="dialog" aria-modal="true" aria-label="Zoomed product image">
            <button type="button" onClick={() => setZoomedImage(null)} aria-label="Close image preview" style={{ position: 'absolute', top: 20, right: 24, background: 'transparent', border: 'none', color: '#fff', fontSize: 28 }}>×</button>
            <motion.img src={zoomedImage} alt="Zoomed product" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: 8 }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductCard({ product, onAddToCart, onRemoveFromCart, onShowDetails, cartQty }) {
  const imageList = product.imageUrls && product.imageUrls.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [];
  const [selectedImage, setSelectedImage] = useState(imageList[0] || '');
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => setSelectedImage(imageList[0] || ''), [product]);

  return (
    <div style={{ ...storeCardStyle, border: product.isFeatured ? '2px solid #ffc107' : '1px solid #ececec' }}>
      {selectedImage && (
        <motion.div initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
          <img src={optimizeCloudinaryUrl(selectedImage, { width: 400 })} alt={product.name} loading="lazy" decoding="async" style={{ width: '100%', height: 176, objectFit: 'contain', borderRadius: 8, marginBottom: 8, background: '#f0f0f0', cursor: 'zoom-in' }} onClick={() => setZoomedImage(selectedImage)} />
        </motion.div>
      )}

      {imageList.length > 1 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 10 }}>
          {imageList.map((img, i) => <img key={i} src={optimizeCloudinaryUrl(img, { width: 100 })} alt={`${product.name} variation ${i+1}`} loading="lazy" decoding="async" style={{ width: 50, height: 50, objectFit: 'contain', borderRadius: 6, border: selectedImage===img? '2px solid #075e54':'1px solid #ddd', cursor: 'pointer' }} onClick={() => setSelectedImage(img)} />)}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#075e54', fontSize: '0.95rem' }}>{product.name}</h3>
        <span style={{ fontWeight: 'bold' }}>₦{Number(product.price||0).toLocaleString()}</span>
      </div>

      {product.description && <p style={{ color: '#666', fontSize: '0.9rem' }}>{product.description}</p>}

      <div style={{ marginTop: 'auto', display: 'flex', gap: 8 }}>
        <button onClick={() => onShowDetails(product)} style={btnDetails}>Details</button>
        {cartQty > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => onRemoveFromCart(product._id)} style={btnSmall}>-</button>
            <span>{cartQty}</span>
            <button onClick={() => onAddToCart(product)} style={btnSmall}>+</button>
          </div>
        ) : (
          <button onClick={() => onAddToCart(product)} style={btnAdd}>Add</button>
        )}
      </div>

      <AnimatePresence>
        {zoomedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }} onClick={() => setZoomedImage(null)}>
            <motion.img src={zoomedImage} alt="Zoomed product" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: 8 }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Styles reused from project
const storeCardStyle = { background: '#fff', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', minWidth: 0 };
const btnAdd = { background: '#075e54', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 20, cursor: 'pointer' };
const btnSmall = { background: '#eee', border: '1px solid #ccc', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer' };
const btnDetails = { background: '#eee', color: '#333', border: '1px solid #ccc', padding: '6px 12px', borderRadius: 20, cursor: 'pointer' };
const btnClose = { position: 'absolute', top: 10, right: 15, background: 'none', border: 'none', fontSize: 28, cursor: 'pointer' };
const modalOverlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 20 };
const modalContent = { background: '#fff', borderRadius: 12, padding: 24, maxWidth: 'min(520px, calc(100vw - 32px))', width: '100%', position: 'relative' };
