import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "jotai";
import App from "./App";
import "./index.css";

function initContentScript() {
  const rootElement = document.createElement("div");
  rootElement.id = "content-script-root";
  document.body.appendChild(rootElement);

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <Provider>
        <App />
      </Provider>
    </React.StrictMode>,
  );
}

window.addEventListener("message", (e) => {
  if (e.data.type === "FROM_CONTENT_SCRIPT" && e.data.action === "initContent") {
    initContentScript();
  }
});

if (document.readyState === "complete") {
  initContentScript();
} else {
  window.addEventListener("load", initContentScript);
}
