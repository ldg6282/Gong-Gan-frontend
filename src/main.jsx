import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "jotai";
import App from "./components/App";
import "./index.css";

const rootElement = document.getElementById("GONG-GAN-ROOT");

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <Provider>
        <App />
      </Provider>
    </StrictMode>,
  );
}
