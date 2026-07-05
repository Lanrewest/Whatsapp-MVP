import React, { useEffect, useState } from "react";
import Logo from "../Logo";
import LoadingSpinner from "../LoadingSpinner";
import { optimizeCloudinaryUrl } from "../utils";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    traders: [],
    totalUsers: 0,
    totalProducts: 0,
    landingVisits: 0,
    storeVisits: 0,
    todayLanding: 0,
    todayStore: 0,
    hourlyData: [],
    feedback: [],
    products: [],
    daily: {
      traders: [],
      products: [],
      landing: [],
      store: []
    },
    tierStats: {
      basic: 0,
      verified: 0,
      pro: 0
    },
    trends: {
      seven: null,
      thirty: null
    }
  });
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [trendRange, setTrendRange] = useState("seven"); // "seven" or "thirty"
  const [editingTraderId, setEditingTraderId] = useState(null);
  const [traderDraft, setTraderDraft] = useState({ companyName: "", address: "", storeBannerUrl: "" });
  const [editingProductId, setEditingProductId] = useState(null);
  const [productDraft, setProductDraft] = useState({ name: "", price: "", imageUrl: "", imageUrls: [] });
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [traderSearchTerm, setTraderSearchTerm] = useState("");
  const [traderStatusFilter, setTraderStatusFilter] = useState("all");
  const [showNewTraderForm, setShowNewTraderForm] = useState(false);
  const [newTraderForm, setNewTraderForm] = useState({ phone: "", companyName: "", address: "" });
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProductForm, setNewProductForm] = useState({ name: "", price: "", traderPhone: "", imageUrl: "", imageUrls: [] });
  const [productStatusFilter, setProductStatusFilter] = useState("all");

  // State for collapsible sections
  const [collapsed, setCollapsed] = useState({
    trends: false,
    peakHours: false,
    engagement: false,
    traders: false,
    products: false,
    feedback: false,
  });

  const toggleSection = (section) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || "lanrewese1@gmail.com";
  const ADMIN_PASS = process.env.REACT_APP_ADMIN_PASSWORD || "123456Crest";

  const [productSearchTerm, setProductSearchTerm] = useState(""); // New state for product search
  const handleLogin = (e) => {
    e.preventDefault();
    // Check against environment variables
    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
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
      document.title = "Admin Dashboard | Arewa Connect";
      fetchStats(); 
    }
  }, [isAuthorized, trendRange]);

  const updateTier = async (userId, tier) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/set-tier/${userId}`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier })
      });
      if (!res.ok) throw new Error("Server returned an error");
      fetchStats();
    } catch (err) {
      console.error(err);
      alert("❌ Tier update failed.");
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

  const createTrader = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/admin/traders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTraderForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create trader');
      setShowNewTraderForm(false);
      setNewTraderForm({ phone: '', companyName: '', address: '' });
      fetchStats();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to create trader');
    }
  };

  const createProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/admin/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProductForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create product');
      setShowNewProductForm(false);
      setNewProductForm({ name: "", price: "", traderPhone: "", imageUrl: "", imageUrls: [] });
      fetchStats();
      alert('✅ Product created successfully!');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to create product');
    }
  };

  const updateTraderStatus = async (traderId, updates) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/traders/${traderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Update failed');
      fetchStats();
    } catch (err) {
      console.error(err);
      alert('❌ Unable to update trader status.');
    }
  };

  const startEditTrader = (trader) => {
    setEditingTraderId(trader._id);
    setTraderDraft({
      companyName: trader.companyName || "",
      address: trader.address || "",
      storeBannerUrl: trader.storeBannerUrl || ""
    });
  };

  const cancelEditTrader = () => {
    setEditingTraderId(null);
    setTraderDraft({ companyName: "", address: "" });
  };

  const saveTrader = async (traderId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/traders/${traderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(traderDraft)
      });
      if (!res.ok) throw new Error("Update failed");
      setEditingTraderId(null);
      fetchStats();
    } catch (err) {
      console.error(err);
      alert("❌ Unable to update trader details.");
    }
  };

  const startEditProduct = (product) => {
    setEditingProductId(product._id);
    setProductDraft({
      name: product.name || "",
      price: product.price || "",
      imageUrl: product.imageUrl || "",
      imageUrls: product.imageUrls || (product.imageUrl ? [product.imageUrl] : [])
    });
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setProductDraft({ name: "", price: "", imageUrl: "", imageUrls: [] });
  };

  const removeProductImage = (urlToRemove) => {
    const formSetter = editingProductId ? setProductDraft : setNewProductForm;
    formSetter(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter(url => url !== urlToRemove)
    }));
  };
  const uploadProductImages = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const currentImages = editingProductId ? productDraft.imageUrls : newProductForm.imageUrls;
    if ((currentImages.length + files.length) > 3) {
      alert("You can upload a maximum of 3 images per product.");
      return;
    }

    try {
      setIsUploadingImage(true);
      const readers = files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      );

      const imageDataList = await Promise.all(readers);
      const res = await fetch(`${API_URL}/api/admin/upload-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataList })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      // If we are editing a product, update the draft. Otherwise, update the new product form.
      const formSetter = editingProductId ? setProductDraft : setNewProductForm;
      formSetter(prev => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ...data.urls].slice(0, 3), // Append and enforce limit
        imageUrl: prev.imageUrl || data.urls[0] || "" // Keep existing main image if present
      }));
    } catch (err) {
      console.error(err);
      alert('❌ Unable to upload images.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const toggleProductApproval = async (productId, currentValue) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !currentValue })
      });
      if (!res.ok) throw new Error('Update failed');
      fetchStats();
    } catch (err) {
      console.error(err);
      alert('❌ Unable to update product approval.');
    }
  };

  const toggleProductFeature = async (productId) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/products/${productId}/toggle-feature`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Update failed');
      fetchStats(); // Refresh data to show the change
    } catch (err) {
      console.error(err);
      alert('❌ Unable to update feature status.');
    }
  };

  const saveProduct = async (productId) => {
    try {
      const updatedPrice = Number(productDraft.price);
      if (Number.isNaN(updatedPrice)) {
        alert("Please enter a valid price.");
        return;
      }

      const res = await fetch(`${API_URL}/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productDraft.name,
          price: updatedPrice,
          imageUrl: productDraft.imageUrl,
          imageUrl: productDraft.imageUrls[0] || "", // Ensure the main image is the first in the array
          imageUrls: productDraft.imageUrls
        })
      });
      if (!res.ok) throw new Error("Update failed");
      setEditingProductId(null);
      fetchStats();
    } catch (err) {
      console.error(err);
      alert("❌ Unable to update product.");
    }
  };

  const filteredTraders = (stats.traders || []).filter((t) => {
    const search = traderSearchTerm.toLowerCase();
    const matchesSearch =
      (t.companyName || "").toLowerCase().includes(search) ||
      (t.phone || "").toLowerCase().includes(search);
    const matchesStatus =
      traderStatusFilter === "all" ||
      (traderStatusFilter === "approved" && t.isApproved !== false) ||
      (traderStatusFilter === "pending" && t.isApproved === false) ||
      (traderStatusFilter === "blocked" && t.isBlocked);
    return matchesSearch && matchesStatus;
  });

  const getFilteredProducts = () => {
    const baseProducts = stats.products || [];
    const filteredBySearch = baseProducts.filter(p => 
      p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
      p.traderPhone.includes(productSearchTerm)
    );
    const filteredByStatus = filteredBySearch.filter(p => productStatusFilter === 'all' || (productStatusFilter === 'approved' && p.isApproved !== false) || (productStatusFilter === 'pending' && p.isApproved === false));
    return productSearchTerm === "" ? filteredByStatus.slice(0, 5) : filteredByStatus;
  };

  const exportToCSV = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    
    // 1. Summary Section
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "AREWA CONNECT ACTIVITY REPORT\n";
    csvContent += `Generated on: ${dateStr}\n\n`;
    csvContent += "SUMMARY STATS\n";
    csvContent += `Total Traders, ${stats.totalUsers}\n`;
    csvContent += `Total Products, ${stats.totalProducts}\n`;
    csvContent += `Landing Page Visits, ${stats.landingVisits}\n`;
    csvContent += `Store Catalog Visits, ${stats.storeVisits}\n\n`;

    // 2. Data Rows
    const dataRows = [
      ["DATA LOGS"],
      ["Category", "Identifier", "Status/Price/Rating", "Timestamp"],
      ...stats.traders.map(t => ["TRADER", t.companyName, t.isVerified ? "Verified" : "Unverified", new Date(t.createdAt).toLocaleString()]),
      ...stats.products.map(p => ["PRODUCT", p.name, `N${p.price}`, new Date(p.createdAt).toLocaleString()]),
      ...stats.feedback.map(f => ["FEEDBACK", f.customerName || "Anonymous", `${f.rating} Stars - ${f.comment.replace(/,/g, ';').replace(/\n/g, ' ')}`, new Date(f.createdAt).toLocaleString()])
    ];
    
    csvContent += dataRows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ArewaConnect_FullReport_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f4f7f6' }}>
        <Logo width="300" height="60" />
        <form onSubmit={handleLogin} style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px', marginTop: '20px' }}>
          <h2 style={{ textAlign: 'center', color: '#075e54', margin: 0 }}>Admin Login</h2>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
          <button type="submit" style={{ background: '#075e54', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Login</button>
        </form>
      </div>
    );
  }

  if (loading) return <LoadingSpinner message="Opening Admin Control Center..." />;

  return (
    <div style={{ padding: '1rem', background: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Logo width="188" height="40" />
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Super Admin</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={exportToCSV} 
            style={{ ...btnStyle('#1d9bf0'), padding: '10px 20px', fontWeight: 'bold' }}>
            📥 Export Full Report (CSV)
          </button>
          <button 
            onClick={fetchStats} 
            style={{ ...btnStyle('#075e54'), padding: '10px 20px', fontWeight: 'bold' }}>
            🔄 Refresh Stats
          </button>
        </div>
      </header>

      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard label="Total Traders" value={stats.totalUsers} />
        <StatCard label="Total Products" value={stats.totalProducts} />
        <StatCard label="Landing Page Visits" value={stats.landingVisits} subValue={`Today: ${stats.todayLanding || 0}`} />
        <StatCard label="Store Views" value={stats.storeVisits} subValue={`Today: ${stats.todayStore || 0}`} />
        <StatCard label="Pro / Verified" value={stats.tierStats?.pro || 0} subValue={`Verified: ${stats.tierStats?.verified || 0}`} />
      </div>

      {/* Daily Growth Trends */}
      <div style={collapsibleCardStyle}>
        <div style={sectionHeaderStyle} onClick={() => toggleSection('trends')}>
          <h3 style={{ margin: 0 }}>📈 Historical Activity Trends</h3>
          <span>{collapsed.trends ? '➕' : '➖'}</span>
        </div>
        
        {!collapsed.trends && (
          <>
            <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <div style={{ background: '#eee', borderRadius: '8px', padding: '4px' }}>
            <button 
              onClick={() => setTrendRange("seven")} 
              style={{ border: 'none', padding: '5px 15px', borderRadius: '6px', background: trendRange === "seven" ? '#fff' : 'transparent', cursor: 'pointer', fontWeight: trendRange === "seven" ? 'bold' : 'normal' }}>
              7 Days
            </button>
            <button 
              onClick={() => setTrendRange("thirty")} 
              style={{ border: 'none', padding: '5px 15px', borderRadius: '6px', background: trendRange === "thirty" ? '#fff' : 'transparent', cursor: 'pointer', fontWeight: trendRange === "thirty" ? 'bold' : 'normal' }}>
              30 Days
            </button>
          </div>
            </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <TrendSection 
            title="New Traders" 
            data={stats.trends?.[trendRange]?.traders} 
            color="#1d9bf0" 
          />
          <TrendSection 
            title="Products Added" 
            data={stats.trends?.[trendRange]?.products} 
            color="#075e54" 
          />
          <TrendSection 
            title="Landing Visits" 
            data={stats.trends?.[trendRange]?.landing} 
            color="#25d366" 
          />
          <TrendSection 
            title="Store Traffic" 
            data={stats.trends?.[trendRange]?.store} 
            color="#ffc107" 
          />
        </div>
        </>
        )}
      </div>

      {/* Hourly "Time of Day" Trend */}
      <div style={collapsibleCardStyle}>
        <div style={sectionHeaderStyle} onClick={() => toggleSection('peakHours')}>
          <h3 style={{ margin: 0 }}>⏰ Peak Activity Hours (Last 24h)</h3>
          <span>{collapsed.peakHours ? '➕' : '➖'}</span>
        </div>
        
        {!collapsed.peakHours && (
          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '20px' }}>Identify when your users are most active during the day.</p>
            <div style={{ height: '100px', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
          {Array.from({ length: 24 }).map((_, hour) => {
            const hourData = stats.hourlyData?.find(d => d._id === hour);
            const count = hourData ? hourData.count : 0;
            const maxHourly = Math.max(...(stats.hourlyData || []).map(d => d.count), 1);
            return (
              <div key={hour} title={`${hour}:00 - ${count} visits`} style={{ flex: 1, background: count > 0 ? '#25d366' : '#f0f0f0', height: `${(count / maxHourly) * 100}%`, minHeight: '4px', borderRadius: '2px' }}></div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#999', marginTop: '5px' }}>
          <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span>
        </div>
          </div>
        )}
      </div>

      {/* Traffic Engagement Section with Graph */}
      <div style={collapsibleCardStyle}>
        <div style={sectionHeaderStyle} onClick={() => toggleSection('engagement')}>
          <h3 style={{ margin: 0 }}>📊 Traffic Engagement & Conversion</h3>
          <span>{collapsed.engagement ? '➕' : '➖'}</span>
        </div>

        {!collapsed.engagement && (
          <>
            <div style={{ marginTop: '1.5rem' }}>
            <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f9fbfb', borderRadius: '12px' }}>
              <h4 style={{ margin: '0 0 1rem 0' }}>Conversion Graph ({trendRange === 'seven' ? '7 Days' : '30 Days'})</h4>
              <EngagementGraph 
                landingData={stats.trends?.[trendRange]?.landing || []} 
                storeData={stats.trends?.[trendRange]?.store || []} 
              />
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '10px', fontSize: '0.8rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: 12, height: 12, background: '#075e54' }}></div> Landing Page</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><div style={{ width: 12, height: 12, background: '#25d366' }}></div> Store Views</span>
              </div>
            </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
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
          </>
        )}
      </div>

      {/* Traders Management Section */}
      <div style={collapsibleCardStyle}>
        <div style={sectionHeaderStyle} onClick={() => toggleSection('traders')}>
          <h3 style={{ margin: 0 }}>🏪 Traders Management</h3>
          <span>{collapsed.traders ? '➕' : '➖'}</span>
        </div>

        {!collapsed.traders && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="🔍 Search trader by name or phone"
                  value={traderSearchTerm}
                  onChange={(e) => setTraderSearchTerm(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', minWidth: '260px' }}
                />
                <select
                  value={traderStatusFilter}
                  onChange={(e) => setTraderStatusFilter(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
                >
                  <option value="all">All traders</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
              <button onClick={() => setShowNewTraderForm(prev => !prev)} style={btnStyle('#075e54')}>+ Register Trader</button>
            </div>

            {showNewTraderForm && (
              <form onSubmit={createTrader} style={{ display: 'grid', gap: '10px', marginBottom: '1rem', padding: '1rem', background: '#f9fbfb', borderRadius: '10px' }}>
                <input
                  type="text"
                  placeholder="Phone number"
                  value={newTraderForm.phone}
                  onChange={(e) => setNewTraderForm(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
                <input
                  type="text"
                  placeholder="Company name"
                  value={newTraderForm.companyName}
                  onChange={(e) => setNewTraderForm(prev => ({ ...prev, companyName: e.target.value }))}
                  required
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
                <textarea
                  placeholder="Address"
                  value={newTraderForm.address}
                  onChange={(e) => setNewTraderForm(prev => ({ ...prev, address: e.target.value }))}
                  rows="2"
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={btnStyle('#075e54')}>Create Trader</button>
                  <button type="button" onClick={() => setShowNewTraderForm(false)} style={btnStyle('#666')}>Cancel</button>
                </div>
              </form>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '12px' }}>Company</th>
                    <th>Tier & Usage</th>
                    <th>Contact</th>
                    <th>Receipt</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTraders.map(t => (
                    <tr key={t._id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>
                        {editingTraderId === t._id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input
                              value={traderDraft.companyName}
                              onChange={(e) => setTraderDraft(prev => ({ ...prev, companyName: e.target.value }))}
                              placeholder="Company name"
                              style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc' }}
                            />
                            <textarea
                              value={traderDraft.address}
                              onChange={(e) => setTraderDraft(prev => ({ ...prev, address: e.target.value }))}
                              placeholder="Address"
                              rows="2"
                              style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc' }}
                            />
                            <input
                              value={traderDraft.storeBannerUrl}
                              onChange={(e) => setTraderDraft(prev => ({ ...prev, storeBannerUrl: e.target.value }))}
                              placeholder="Store Banner Image URL"
                              style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc' }}
                            />
                          </div>
                        ) : (
                          <div>
                            <strong>{t.companyName || 'Unnamed Trader'}</strong>
                            <div style={{ color: '#666', fontSize: '0.85rem', marginTop: '4px' }}>{t.address || 'No address set'}</div>
                            <div style={{ marginTop: '6px' }}>
                              {t.isBlocked ? <span style={{ background: '#fdecea', color: '#c62828', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Blocked</span> : (t.isApproved === false ? <span style={{ background: '#fff8e1', color: '#f9a825', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Pending</span> : <span style={{ background: '#e8f5e9', color: '#1b5e20', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Approved</span>)}
                            </div>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {t.isPro && <span style={{ background: '#e3f2fd', color: '#0d47a1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>💎 PRO</span>}
                            {t.isVerified && <span style={{ background: '#e8f5e9', color: '#1b5e20', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>✅ VERIFIED</span>}
                            {!t.isPro && !t.isVerified && <span style={{ background: '#f5f5f5', color: '#616161', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>⚪ BASIC</span>}
                          </div>
                          <div style={{ width: '100px', background: '#eee', height: '6px', borderRadius: '3px' }}>
                            <div style={{ 
                              width: `${Math.min((t.dailyUsageCount / (t.isPro ? 200 : t.isVerified ? 50 : 10)) * 100, 100)}%`, 
                              background: t.dailyUsageCount > (t.isPro ? 180 : 8) ? 'red' : '#25d366', 
                              height: '100%', 
                              borderRadius: '3px' 
                            }}></div>
                          </div>
                        </div>
                      </td>
                      <td>{t.phone}</td>
                      <td>
                        {t.verificationReceiptUrl ? (
                          <a href={t.verificationReceiptUrl} target="_blank" rel="noreferrer" style={{ color: '#1d9bf0', fontSize: '0.8rem' }}>View Receipt</a>
                        ) : (
                          <span style={{ color: '#ccc', fontSize: '0.8rem' }}>None</span>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {editingTraderId === t._id ? (
                          <>
                            <button onClick={() => saveTrader(t._id)} style={btnStyle('#075e54')}>Save</button>
                            <button onClick={cancelEditTrader} style={btnStyle('#666')}>Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => startEditTrader(t)} style={btnStyle('#1d9bf0')}>Edit Trader</button>
                        )}
                        <button onClick={() => updateTraderStatus(t._id, { isApproved: t.isApproved === false })} style={btnStyle(t.isApproved === false ? '#25d366' : '#f9a825')}>{t.isApproved === false ? 'Approve' : 'Pending'}</button>
                        <button onClick={() => updateTraderStatus(t._id, { isBlocked: !t.isBlocked })} style={btnStyle(t.isBlocked ? '#25d366' : '#ff4d4d')}>{t.isBlocked ? 'Unblock' : 'Block'}</button>
                        {!t.isPro && (
                          <button onClick={() => updateTier(t._id, 'pro')} style={btnStyle('#075e54')}>Make Pro</button>
                        )}
                        {!t.isVerified && (
                          <button onClick={() => updateTier(t._id, 'verified')} style={btnStyle('#25d366')}>Verify</button>
                        )}
                        {(t.isPro || t.isVerified) && (
                          <button onClick={() => updateTier(t._id, 'basic')} style={btnStyle('#666')}>Reset</button>
                        )}
                        <button onClick={() => deleteTrader(t._id)} style={btnStyle('#ff4d4d', 'white')}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Products Management Section */}
      <div style={collapsibleCardStyle}>
        <div style={sectionHeaderStyle} onClick={() => toggleSection('products')}>
          <h3 style={{ margin: 0 }}>📦 Products Management</h3>
          <span>{collapsed.products ? '➕' : '➖'}</span>
        </div>

        {!collapsed.products && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

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

              <select
                value={productStatusFilter}
                onChange={(e) => setProductStatusFilter(e.target.value)}
                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
              >
                <option value="all">All products</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
              </select>
              </div>
              <button onClick={() => setShowNewProductForm(prev => !prev)} style={btnStyle('#075e54')}>+ Add New Product</button>
            </div>

            {showNewProductForm && (
              <form onSubmit={createProduct} style={{ display: 'grid', gap: '10px', marginBottom: '1rem', padding: '1rem', background: '#f9fbfb', borderRadius: '10px' }}>
                <input
                  type="text"
                  placeholder="Trader's Phone Number"
                  value={newProductForm.traderPhone}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, traderPhone: e.target.value }))}
                  required
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
                <input
                  type="text"
                  placeholder="Product Name"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
                <input
                  type="number"
                  placeholder="Price (e.g., 5000)"
                  value={newProductForm.price}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, price: e.target.value }))}
                  required
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={uploadProductImages}
                  style={{ fontSize: '0.8rem' }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={btnStyle('#075e54')} disabled={isUploadingImage}>{isUploadingImage ? 'Uploading...' : 'Create Product'}</button>
                  <button type="button" onClick={() => setShowNewProductForm(false)} style={btnStyle('#666')}>Cancel</button>
                </div>
              </form>
            )}

            <div style={{ overflowX: 'auto' }}>
              {productSearchTerm === "" && (stats.products || []).length > 5 ? (
                <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                  Showing 5 most recent items. Use the search bar to find more.
                </p>
              ) : null}
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead style={{ background: '#f8f9fa' }}>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                    <th style={{ padding: '12px' }}>Product Details</th>
                    <th style={{ padding: '12px' }}>Price</th>
                    <th style={{ padding: '12px' }}>Trader</th>
                    <th style={{ padding: '12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredProducts().map(p => (
                    <tr key={p._id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                      <td style={{ padding: '12px' }}>
                        {editingProductId === p._id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input
                              value={productDraft.name}
                              onChange={(e) => setProductDraft(prev => ({ ...prev, name: e.target.value }))}
                              style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc' }}
                            />
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={uploadProductImages}
                              style={{ fontSize: '0.8rem' }}
                            />
                            {(productDraft.imageUrls || []).length > 0 && (
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {(productDraft.imageUrls || []).map((img, idx) => (
                                  <div key={idx} style={{ position: 'relative' }}>
                                    <img src={optimizeCloudinaryUrl(img, { width: 120 })} alt="Preview" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                                    <button 
                                      type="button" 
                                      onClick={() => removeProductImage(img)}
                                      style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: '1' }}
                                    >
                                      &times;
                                    </button>
                                  </div>
                                )) }
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {p.imageUrl || (p.imageUrls && p.imageUrls.length > 0) ? (
                                <img src={optimizeCloudinaryUrl(p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls[0] : p.imageUrl, { width: 80 })} alt="" style={{ 
                                  width: '40px', height: '40px', borderRadius: '6px', objectFit: 'contain', background: '#f0f0f0' 
                                }} />
                              ) : (
                                <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#aaa' }}>No Image</div>
                              )}
                              <span style={{ fontWeight: 500 }}>{p.name}</span>
                            </div>
                            <div style={{ marginTop: '6px' }}>
                              {p.isFeatured && <span style={{ background: '#fffbe6', color: '#fadb14', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', marginRight: '5px' }}>⭐ Featured</span>}
                              {p.isApproved === false ? <span style={{ background: '#fff8e1', color: '#f9a825', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Pending Approval</span> : <span style={{ background: '#e8f5e9', color: '#1b5e20', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>Approved</span>}
                            </div>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#075e54' }}>
                        {editingProductId === p._id ? (
                          <input
                            type="number"
                            min="0"
                            value={productDraft.price}
                            onChange={(e) => setProductDraft(prev => ({ ...prev, price: e.target.value }))}
                            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ccc' }}
                          />
                        ) : (
                          `₦${p.price.toLocaleString()}`
                        )}
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.85rem', color: '#666' }}>{p.traderPhone}</td>
                      <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                        {editingProductId === p._id ? (
                          <>
                            <button onClick={() => saveProduct(p._id)} style={{ ...btnStyle('#075e54'), padding: '5px 10px' }} disabled={isUploadingImage}>
                              {isUploadingImage ? 'Uploading...' : 'Save'}
                            </button>
                            <button onClick={cancelEditProduct} style={{ ...btnStyle('#666'), padding: '5px 10px' }}>Cancel</button>
                          </>
                        ) : (
                          <button onClick={() => startEditProduct(p)} style={{ ...btnStyle('#1d9bf0'), padding: '5px 10px' }}>Edit</button>
                        )}
                        <button onClick={() => toggleProductApproval(p._id, p.isApproved !== false)} style={{ ...btnStyle(p.isApproved === false ? '#25d366' : '#f9a825'), padding: '5px 10px' }}>{p.isApproved === false ? 'Approve' : 'Pending'}</button>
                        <button onClick={() => toggleProductFeature(p._id)} style={{ ...btnStyle(p.isFeatured ? '#666' : '#ffc107'), padding: '5px 10px' }}>{p.isFeatured ? 'Unfeature' : 'Feature'}</button>
                        <button onClick={() => deleteProduct(p._id)} style={{ ...btnStyle('#ff4d4d'), padding: '5px 10px' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Section */}
      <div style={collapsibleCardStyle}>
        <div style={sectionHeaderStyle} onClick={() => toggleSection('feedback')}>
          <h3 style={{ margin: 0 }}>💬 Latest Customer Feedback</h3>
          <span>{collapsed.feedback ? '➕' : '➖'}</span>
        </div>

        {!collapsed.feedback && (
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
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, subValue }) {
  return (
    <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#075e54' }}>{value.toLocaleString()}</div>
      {subValue && <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '5px' }}>{subValue}</div>}
    </div>
  );
}

function TrendSection({ title, data, color }) {
  // Sort data by date to show the most recent first
  const sortedData = (data || []).sort((a, b) => new Date(b._id) - new Date(a._id));
  
  return (
    <div style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '8px', background: '#fcfcfc' }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: color, borderBottom: `2px solid ${color}`, paddingBottom: '5px' }}>{title}</h4>
      <div style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.85rem' }}>
        {(!sortedData || sortedData.length === 0) ? (
          <p style={{ color: '#999' }}>No data for this period.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {sortedData.map((day, idx) => (
              <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span>{new Date(day._id).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                <strong style={{ color: '#333' }}>{day.count.toLocaleString()}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EngagementGraph({ landingData, storeData }) {
  const maxVal = Math.max(...landingData.map(d => d.count), ...storeData.map(d => d.count), 5);
  const width = 1000;
  const height = 200;
  
  const getPoints = (data) => {
    if (!data.length) return "";
    const step = width / (data.length - 1 || 1);
    return data.map((d, i) => {
      const x = i * step;
      const y = height - (d.count / maxVal) * height;
      return `${x},${y}`;
    }).join(" ");
  };

  return (
    <div>
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: '100%', height: '150px', display: 'block' }}>
          {[0, 0.25, 0.5, 0.75, 1].map(v => (
            <line key={v} x1="0" y1={height * v} x2={width} y2={height * v} stroke="#eee" strokeWidth="1" />
          ))}
          <polyline fill="none" stroke="#075e54" strokeWidth="3" points={getPoints(landingData)} />
          <polyline fill="none" stroke="#25d366" strokeWidth="3" points={getPoints(storeData)} />
        </svg>
      </div>
      <div style={{ maxHeight: '250px', overflowY: 'auto', marginTop: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '8px' }}>Date</th>
              <th style={{ padding: '8px' }}>Landing Visits</th>
              <th style={{ padding: '8px' }}>Store Views</th>
            </tr>
          </thead>
          <tbody>
            {landingData.map((ld, i) => {
              const sd = storeData.find(s => s._id === ld._id) || { count: 0 };
              return (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '8px' }}>{new Date(ld._id).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>{ld.count}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>{sd.count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
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

const collapsibleCardStyle = {
  background: '#fff',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  marginBottom: '2rem',
};

const sectionHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
};

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