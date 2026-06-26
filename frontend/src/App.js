import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Store from "./pages/Store"; // .jsx is implied
import GeneralStore from "./pages/GeneralStore"; // .jsx is implied
import LandingPage from "./pages/LandingPage.jsx"; // .jsx is explicit for clarity
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ContactUs from "./pages/ContactUs";
import Upgrade from "./pages/Upgrade";

export default function App() {
  useEffect(() => {
    // Set Default Tab Title
    document.title = "ArewaConnect | Northern Digital Storefronts";
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />{" "}
        <Route path="/store" element={<GeneralStore />} />{" "}
        <Route path="/store/:slug" element={<Store />} />{" "}
        <Route path="/" element={<LandingPage />} />{" "}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />{" "}
        <Route path="/terms-of-service" element={<TermsOfService />} />{" "}
        <Route path="/contact-us" element={<ContactUs />} />{" "}
        <Route path="/upgrade" element={<Upgrade />} />{" "}
        <Route path="*" element={<NotFound />} />{" "}
      </Routes>{" "}
    </BrowserRouter>
  );
}
