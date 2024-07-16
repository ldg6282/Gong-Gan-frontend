import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.createElement("div");
rootElement.id = "content-script-root";
document.body.appendChild(rootElement);

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
