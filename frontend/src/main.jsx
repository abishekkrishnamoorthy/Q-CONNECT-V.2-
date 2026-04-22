// d:\projects\QCONNECT(V2.0)\frontend\src\main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

/**
 * Logs frontend env and backend health connectivity diagnostics.
 * @returns {Promise<void>}
 */
async function logFrontendBootDiagnostics() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (!apiBaseUrl) {
    // eslint-disable-next-line no-console
    console.error("Frontend env check: VITE_API_BASE_URL is missing");
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`Frontend env check: VITE_API_BASE_URL=${apiBaseUrl}`);

  try {
    const response = await fetch(`${apiBaseUrl}/health`, {
      method: "GET",
      credentials: "include"
    });
    const data = await response.json();
    if (response.ok) {
      // eslint-disable-next-line no-console
      console.log("Frontend API check: backend health reachable", data);
      return;
    }
    // eslint-disable-next-line no-console
    console.warn("Frontend API check: backend responded with non-OK status", data);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Frontend API check failed: unable to reach backend /health", error);
  }
}

logFrontendBootDiagnostics();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
