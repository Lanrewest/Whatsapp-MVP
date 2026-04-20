import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Store from "./pages/Store";
import LandingPage from "./pages/LandingPage";

export default function App() {
    return ( <
        BrowserRouter >
        <
        Routes >
        <
        Route path = "/store/:phone"
        element = { < Store / > }
        /> <
        Route path = "/"
        element = { < LandingPage / > }
        /> <
        Route path = "*"
        element = { < LandingPage / > }
        /> < /
        Routes > <
        /BrowserRouter>
        return ( <
            BrowserRouter >
            <
            Routes >
            <
            Route path = "/store/:phone"
            element = { < Store / > }
            /> <
            Route path = "/"
            element = { < LandingPage / > }
            /> <
            Route path = "*"
            element = { < LandingPage / > }
            /> <
            /Routes> <
            /BrowserRouter>
        );
    }