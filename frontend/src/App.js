import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Store from "./pages/Store";
import LandingPage from "./pages/LandingPage.jsx";

export default function App() {
    return ( <
        BrowserRouter >
        <
        Routes >
        <
        Route path = "/store/:slug"
        element = { < Store / > }
        />{" "} <
        Route path = "/"
        element = { < LandingPage / > }
        />{" "} <
        Route path = "*"
        element = { < LandingPage / > }
        />{" "} <
        /Routes>{" "} <
        /BrowserRouter>
    );
}