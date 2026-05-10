import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Store from "./pages/Store"; // .jsx is implied
import GeneralStore from "./pages/GeneralStore"; // .jsx is implied
import LandingPage from "./pages/LandingPage.jsx"; // .jsx is explicit for clarity
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  useEffect(() => {
    // Set Default Tab Title
    document.title = "ArewaMarket | Northern Digital Storefronts";

    // Dynamic Favicon Fix: Forces the tab icon to appear
    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.rel = 'icon';
    link.href = 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg';
    document.getElementsByTagName('head')[0].appendChild(link);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />{" "}
        <Route path="/store" element={<GeneralStore />} />{" "}
        <Route path="/store/:slug" element={<Store />} />{" "}
        <Route path="/" element={<LandingPage />} />{" "}
        <Route path="*" element={<NotFound />} />{" "}
      </Routes>{" "}
    </BrowserRouter>
  );
}
