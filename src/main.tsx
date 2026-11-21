import { createRoot } from "react-dom/client";
import { ensureEthereumFallback } from "./shims/ethereum-fallback";
import App from "./App.tsx";
import "./index.css";

ensureEthereumFallback();

createRoot(document.getElementById("root")!).render(<App />);
