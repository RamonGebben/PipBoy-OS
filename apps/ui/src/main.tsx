import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { loadConfig } from "./config";
import { applyTheme } from "./themes";
import "./styles/global.css";

const cfg = loadConfig();
applyTheme(cfg.theme);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
