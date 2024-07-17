import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "jotai";
import PopupApp from "./components/PopupApp";
import "./index.css";

const rootElement = document.getElementById("popup-root");
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <Provider>
      <PopupApp />
    </Provider>
  </React.StrictMode>,
);
