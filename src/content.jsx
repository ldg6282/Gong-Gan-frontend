import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "jotai";
import App from "./App";
import "./index.css";

function initContentScript() {
  if (document.head) {
    document.head.remove();
  }
  if (document.body) {
    document.body.remove();
  }

  const newHead = document.createElement("head");
  const newBody = document.createElement("body");

  document.documentElement.appendChild(newHead);
  document.documentElement.appendChild(newBody);

  const appRoot = document.createElement("div");
  appRoot.id = "GONG-GAN-ROOT";
  document.body.appendChild(appRoot);

  const rootElement = document.createElement("div");
  rootElement.id = "content-script-root";
  appRoot.appendChild(rootElement);

  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <Provider>
        <App />
      </Provider>
    </StrictMode>,
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
