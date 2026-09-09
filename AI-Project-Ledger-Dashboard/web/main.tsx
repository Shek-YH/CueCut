import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DashboardApp } from "./App.js";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DashboardApp />
  </StrictMode>,
);
