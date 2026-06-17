import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initNativeApp } from "@/lib/capacitor";
import { applyTheme, getStoredThemeIsDark } from "@/lib/theme";
import { CHUNK_RELOAD_KEY } from "@/lib/lazyWithRetry";
import { installWidgetLifecycleGuards } from "@/lib/widget-lifecycle";

applyTheme(getStoredThemeIsDark());
installWidgetLifecycleGuards();

// After deploy, cached index.js may reference removed chunk hashes — reload once.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  if (sessionStorage.getItem(CHUNK_RELOAD_KEY) !== "1") {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    window.location.reload();
  }
});

void initNativeApp().finally(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
