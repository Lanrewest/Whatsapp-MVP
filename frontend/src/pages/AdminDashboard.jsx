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
  });
  const [loading, setLoading] = useState(true);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch admin stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (isAuthorized) {
      fetchStats(); 
    }
  }, [isAuthorized]);

  const toggleVerify = async (userId) => {
    await fetch(`${API_URL}/api/admin/verify/${userId}`, { method: 'PATCH' });
    fetchStats();
  };

  const deleteTrader = async (userId) => {
    if (window.confirm("Are you sure? This will delete the trader and all products.")) {
      await fetch(`${API_URL}/api/admin/trader/${userId}`, { method: 'DELETE' });
      fetchStats();
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
    <div style={{ padding: '2rem', background: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Logo width="150" height="40" />
          <h1>Super Admin Control</h1>
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

      <div style={{ background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <h3>Traders Management</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
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
            {stats.traders.map(t => (
              <tr key={t._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px' }}>{t.companyName}</td>
                <td>{t.phone}</td>
                <td>{t.address || 'N/A'}</td>
                <td>{t.isVerified ? '✅ Verified' : '❌ Unverified'}</td>
                <td>
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