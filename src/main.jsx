import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import Modal from "react-modal";
import "./index.css";
import "./lib/axios-setup.js";
import App from "./app/App.jsx";

Modal.setAppElement("#root");

createRoot(document.getElementById("root")).render(
  <HashRouter>
    <StrictMode>
      <App />
    </StrictMode>
  </HashRouter>,
);
