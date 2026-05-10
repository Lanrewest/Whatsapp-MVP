import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Store from "./pages/Store"; // .jsx is implied
import GeneralStore from "./pages/GeneralStore"; // .jsx is implied
import LandingPage from "./pages/LandingPage.jsx"; // .jsx is explicit for clarity
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/store" element={<GeneralStore />} />{" "}
        <Route path="/store/:slug" element={<Store />} />{" "}
        <Route path="/" element={<LandingPage />} />{" "}
        <Route path="*" element={<NotFound />} />{" "}
      </Routes>{" "}
    </BrowserRouter>
  );
}
