import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Store from "./pages/Store";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/store/:slug" element={<Store />} />
                <Route
                    path="*"
                    element={
                        <div
                            style={{
                                minHeight: '100vh',
                                background: 'linear-gradient(135deg, #25d366 0%, #075e54 100%)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                padding: 24
                            }}
                        >
                            <img
                                src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                                alt="ArewaMarket"
                                style={{ width: 80, marginBottom: 24 }}
                            />
                            <h1 style={{ fontSize: '2.8rem', marginBottom: 8 }}>ArewaMarket</h1>
                            <h2 style={{ fontWeight: 400, marginBottom: 24 }}>Empowering Northern Traders</h2>
                            <p style={{ maxWidth: 400, fontSize: '1.1rem', marginBottom: 32 }}>
                                Discover, connect, and buy from local traders on WhatsApp. Each trader has a unique store link to showcase their products and receive customer requests directly.
                            </p>
                            <div style={{ background: '#fff', color: '#075e54', borderRadius: 8, padding: 16, boxShadow: '0 2px 8px #0002', fontWeight: 500 }}>
                                To view a trader's store, use their unique link (e.g.{' '}
                                <span style={{ color: '#25d366' }}>/store/&lt;company-name&gt;</span>).
                            </div>
                        </div>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}
}