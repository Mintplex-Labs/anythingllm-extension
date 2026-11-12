import React from "react";
import ReactDOM from "react-dom/client";
import SidePanel from "./components/SidePanel";
import "./i18n";
import "./index.css";
import { applyTheme, resolveTheme } from "./utils/theme";

// Paint the system theme right away; the saved preference loads asynchronously.
applyTheme(resolveTheme("system"));

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SidePanel />
  </React.StrictMode>
);
