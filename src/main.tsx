import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { initNativeApp } from "./lib/capacitor";
import { applyTheme } from "@/lib/theme";
import { CHUNK_RELOAD_KEY } from "@/lib/lazyWithRetry";
import { installWidgetLifecycleGuards } from "@/lib/widget-lifecycle";
import { initErrorMonitoring } from "@/lib/errorMonitoring";

applyTheme();
installWidgetLifecycleGuards();
void initErrorMonitoring();

// After deploy, cached index.js may reference removed chunk hashes — reload once.
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  const payload: unknown = event.payload;
  const message = payload instanceof Error ? payload.message : "preload failed";
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) !== "1") {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
      window.location.reload();
      return;
    }
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    /* ignore */
  }
  console.error("[vite:preloadError]", message, payload);
  const root = document.getElementById("root");
  if (root && root.childElementCount === 0) {
    root.innerHTML = `
      <div style="min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif;background:#0a0a0a;color:#f5f5f5">
        <div style="max-width:22rem;text-align:center;line-height:1.5">
          <p style="font-size:1.05rem;margin:0 0 0.75rem">Mise à jour bloquée (cache navigateur).</p>
          <p style="font-size:0.875rem;margin:0 0 1rem;opacity:0.85">Recharge forcée&nbsp;: <strong>Cmd+Shift+R</strong> (Mac) ou <strong>Ctrl+Shift+R</strong> (Windows).</p>
          <p style="font-size:0.75rem;margin:0;opacity:0.6">Si ça persiste, ouvre la console puis&nbsp;: <code style="opacity:1">sessionStorage.removeItem('aegis:chunk-reload'); location.reload()</code></p>
        </div>
      </div>`;
  }
});

if (import.meta.env.DEV && import.meta.hot) {
  import.meta.hot.on("vite:beforeFullReload", () => {
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    } catch {
      /* ignore */
    }
  });
}

// After the app has successfully booted, clear the reload guard so a future
// stale-chunk event isn't misread as a reload loop.
window.addEventListener("load", () => {
  setTimeout(() => {
    try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch {}
  }, 4000);
});

void initNativeApp().finally(() => {
  const root = document.getElementById("root");
  if (!root) return;
  createRoot(root).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>,
  );
});
