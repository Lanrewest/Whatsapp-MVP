import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Store from "./pages/Store";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/store/:phone" element={<Store />} />
                <Route
                    path="*"
                    element={
                        <div style={{
                            minHeight: '100vh',
                            background: 'linear-gradient(135deg, #25d366 0%, #075e54 100%)',
                            display: 'flex',
                            flexDirectio