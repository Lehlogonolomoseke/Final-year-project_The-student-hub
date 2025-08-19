import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "App";

// MUI Styling
import { ThemeProvider, CssBaseline } from "@mui/material";
import ujTheme from "./components/Theme/ujTheme";

// Material Dashboard 2 React Context
import { MaterialUIControllerProvider } from "context";

// Render App
const container = document.getElementById("app");
const root = createRoot(container);

root.render(
  <BrowserRouter>
    <MaterialUIControllerProvider>
      <ThemeProvider theme={ujTheme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </MaterialUIControllerProvider>
  </BrowserRouter>
);
