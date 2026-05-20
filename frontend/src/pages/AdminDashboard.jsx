import React, { useEffect, useState } from "react";
import Logo from "../Logo";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    traders: [],
    totalUsers: 0,
    totalProducts: 0,
    landingVisits: 0,
    storeVisits: 0,
    feedback: [],
    products: [],
    filteredProducts: [], // New state to hold filtered products
    daily: {
      traders: [],
      products: [],
      landing: [],
      store: []
    }
  });
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [productSearchTerm, setProductSearchTerm] = useState(""); // New state for product search
  const handleLogin = (e) => {
    e.preventDefault();
    // Simple static credentials check as requested
    if (email === "lanrewese1@gmail.com" && password === "123456Crest") {
      setIsAuthorized(true);
    } else {
      alert("Invalid admin credentials");
    }
  };

  const fetchStats = async () => {
    setLoading(true); // Trigger loading screen for visual confirmation
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`);
      if (!res.ok) throw new Error("Could not fetch stats from server");
      const data = await res.json();
      // Merge the new data into existing state to preserve keys like filteredProducts
      setStats(prev => ({ ...prev, ...data }));
    } catch (err) {
      // Removed the alert here, as fetchError will be displayed by the conditional rendering below.
      console.error("Failed to fetch admin stats", err);
      alert("❌ Connection Error: Could not reach the server at " + API_URL);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (isAuthorized) {
      fetchStats(); 
    }
  }, [isAuthorized]);

  // ✅ FIXED: Now watches search term and product data
  useEffect(() => {
    if (stats.products && stats.products.length > 0) {
      const lowercasedSearchTerm = productSearchTerm.toLowerCase();
      const filtered = stats.products.filter(p => p.name.toLowerCase().includes(lowercasedSearchTerm) || p.traderPhone.includes(lowercasedSearchTerm));
      setStats(prevStats => ({ ...prevStats, filteredProducts: filtered }));
    }
  }, [productSearchTerm, stats.products]); // Dependency array fixed

  const toggleVerify = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/verify/${userId}`, { method: 'PATCH' });
      if (!res.ok) throw new Error("Server returned an error");
      fetchStats();
    } catch (err) {
      console.error(err);
      alert("❌ Verification failed. Ensure backend is running.");
    }
  };

  const deleteTrader = async (userId) => {
    if (window.confirm("Are you sure? This will delete the trader and all products.")) {
      try {
        const res = await fetch(`${API_URL}/api/admin/trader/${userId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Delete failed");
        fetchStats();
      } catch (err) {
        console.error(err);
        alert("❌ Delete failed. Check server logs.");
      }
    }
  };

  const deleteProduct = async (productId) => {
    if (window.confirm("Delete this product?")) {
      try {
        await fetch(`${API_URL}/api/admin/products/${productId}`, { method: 'DELETE' });
        fetchStats();
      } catch (err) { alert("Delete failed"); }
    }
  };

  const editProduct = async (product) => {
    const newName = window.prompt("Edit Product Name:", product.name);
    const newPrice = window.prompt("Edit Product Price (numbers only):", product.price);
    
    if (newName && newPrice) {
      try {
        await fetch(`${API_URL}/api/admin/products/${product._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName, price: Number(newPrice) })
        });
        fetchStats();
      } catch (err) { alert("Update failed"); }
    }
  };

  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f4f7f6' }}>
        <Logo width="200" height="60" />
        <form onSubmit={handleLogin} style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px', marginTop: '20px' }}>
          <h2 style={{ textAlign: 'center', color: '#075e54', margin: 0 }}>Admin Login</h2>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          <button type="submit" style={{ background: '#075e54', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Login</button>
        </form>
      </div>
    );
  }

  if (loading) return <div style={{ padding: 50, textAlign: 'center' }}>Loading Admin Panel...</div>;

  return (
    <div style={{ padding: '1rem', background: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Logo width="150" height="40" />
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Super Admin</h1>
        </div>
        <button 
          onClick={fetchStats} 
          style={{ ...btnStyle('#075e54'), padding: '10px 20px', fontWeight: 'bold' }}>
          🔄 Refresh Stats
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard label="Total Traders" value={stats.totalUsers} />
        <StatCard label="Total Products" value={stats.totalProducts} />
        <StatCard label="Landing Views" value={stats.landingVisits || 0} />
        <StatCard label="Store Views" value={stats.storeVisits || 0} />
      </div>

      {/* Daily Growth Trends */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0 }}>📈 7-Day Activity Trends</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <TrendSection 
            title="New Traders" 
            data={stats.daily?.traders} 
            color="#1d9bf0" 
          />
          <TrendSection 
            title="Products Added" 
            data={stats.daily?.products} 
            color="#075e54" 
          />
          <TrendSection 
            title="Landing Visits" 
            data={stats.daily?.landing} 
            color="#25d366" 
          />
          <TrendSection 
            title="Store Traffic" 
            data={stats.daily?.store} 
            color="#ffc107" 
          />
        </div>
      </div>

      {/* Visual Analytics Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={chartCardStyle}>
          <h3>Traffic Engagement</h3>
          <p style={{ fontSize: '0.8rem', color: '#666' }}>Landing vs Store Views</p>
          <div style={{ marginTop: '20px' }}>
            <ProgressBar 
              label="Landing Page" 
              value={stats.landingVisits} 
              total={stats.landingVisits + stats.storeVisits} 
              color="#075e54" 
            />
            <ProgressBar 
              label="Store Views" 
              value={stats.storeVisits} 
              total={stats.landingVisits + stats.storeVisits} 
              color="#25d366" 
            />
          </div>
        </div>
        
        <div style={chartCardStyle}>
          <h3>Inventory Scale</h3>
          <p style={{ fontSize: '0.8rem', color: '#666' }}>Traders vs Total Products</p>
          <div style={{ marginTop: '20px' }}>
            <ProgressBar 
              label="Traders" 
              value={stats.totalUsers} 
              total={stats.totalProducts || 1} 
              color="#1d9bf0" 
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginTop: '10px' }}>
              <span>Avg. Products per Trader:</span>
              <strong>{(stats.totalProducts / (stats.totalUsers || 1)).toFixed(1)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <h3>Traders Management</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', minWidth: '600px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '12px' }}>Company</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(stats.traders || []).map(t => (
                <tr key={t._id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{t.companyName}</td>
                  <td>{t.phone}</td>
                  <td>{t.address || 'N/A'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{t.isVerified ? '✅ Verified' : '❌ Unverified'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button onClick={() => toggleVerify(t._id)} style={btnStyle(t.isVerified ? '#666' : '#25d366')}>
                      {t.isVerified ? 'Unverify' : 'Verify'}
                    </button>
                    <button onClick={() => deleteTrader(t._id)} style={btnStyle('#ff4d4d', 'white')}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Products Management Section */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0 }}>📦 Products Management</h3>
          {/* Clean Search Toolbar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <input 
              type="text" 
              placeholder="🔍 Search product name or trader phone..." 
              value={productSearchTerm} 
              onChange={e => setProductSearchTerm(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px 15px', 
                borderRadius: '8px', 
                border: '2px solid #eef2f1', 
                background: '#f9fbfb',
                outline: 'none',
                fontSize: '0.9rem'
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {productSearchTerm === "" && (stats.filteredProducts || []).length > 5 ? (
            <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
              Showing 5 most recent items. Use the search bar to find more.
            </p>
          ) : null}
          
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead style={{ background: '#f8f9fa' }}>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '12px' }}>Product Details</th>
                <th style={{ padding: '12px' }}>Price</th>
                <th style={{ padding: '12px' }}>Trader</th>
                <th style={{ padding: '12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(productSearchTerm === "" ? (stats.products || []).slice(0, 5) : (stats.filteredProducts || [])).map(p => (
                <tr key={p._id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#aaa' }}>No Image</div>
                      )}
                      <span style={{ fontWeight: 500 }}>{p.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold', color: '#075e54' }}>₦{p.price.toLocaleString()}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: '#666' }}>{p.traderPhone}</td>
                  <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                    <button onClick={() => editProduct(p)} style={{ ...btnStyle('#1d9bf0'), padding: '5px 10px' }}>Edit</button>
                    <button onClick={() => deleteProduct(p._id)} style={{ ...btnStyle('#ff4d4d'), padding: '5px 10px' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginTop: '2rem' }}>
        <h3>Latest Customer Feedback</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          {stats.feedback?.length === 0 ? (
            <p>No feedback received yet.</p>
          ) : (
            stats.feedback?.map(f => (
              <div key={f._id} style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <strong>{f.type === 'trader' ? '🏪 Trader Feedback' : (f.customerName || '👤 Customer')}</strong>
                  <span style={{ color: '#ffc107' }}>{'★'.repeat(f.rating)}</span>
                </div>
                <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>{f.comment}</p>
                <div style={{ fontSize: '0.8rem', color: '#999' }}>
                  For Trader: {f.traderPhone} ({f.traderSlug}) • {new Date(f.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#075e54' }}>{value}</div>
    </div>
  );
}

function TrendSection({ title, data, color }) {
  const maxVal = Math.max(...(data || []).map(d => d.count), 5);
  
  return (
    <div style={{ border: '1px solid #eee', padding: '10px', borderRadius: '8px' }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#666' }}>{title}</h4>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '60px' }}>
        {(!data || data.length === 0) ? (
          <span style={{ fontSize: '0.7rem', color: '#999' }}>No data</span>
        ) : (
          data.map((day, idx) => (
            <div key={idx} title={`${day._id}: ${day.count}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                width: '100%', 
                height: `${(day.count / maxVal) * 100}%`, 
                background: color, 
                borderRadius: '2px 2px 0 0',
                minHeight: '2px'
              }}></div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ProgressBar({ label, value, total, color }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
        <span>{label}</span>
        <strong>{value} ({percentage}%)</strong>
      </div>
      <div style={{ width: '100%', background: '#eee', borderRadius: '10px', height: '10px', overflow: 'hidden' }}>
        <div style={{ width: `${percentage}%`, background: color, height: '100%', transition: 'width 0.5s ease-in-out' }}></div>
      </div>
    </div>
  );
}

const chartCardStyle = {
  background: '#fff',
  padding: '1.5rem',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column'
};

function btnStyle(bg, color = 'white') {
  return {
    background: bg,
    color: color,
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    marginRight: '8px',
    fontSize: '0.8rem'
  };
}