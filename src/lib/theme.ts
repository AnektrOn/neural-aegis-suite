import { useEffect, useState } from "react";

/** App is dark-only for now; ignore stored / system preference. */
export function getStoredThemeIsDark(): boolean {
  return true;
}

/** Bumps when `html` light/dark classes or stored theme change (for WebGL/CSS resync). */
export function useThemeClassRevision(): number {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const root = document.documentElement;
    const bump = () => setRevision((n) => n + 1);
    const observer = new MutationObserver(bump);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    const onStorage = (event: StorageEvent) => {
      if (event.key === "theme") bump();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      observer.disconnect();
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return revision;
}

/** Apply dark theme on <html> — must run before first paint. */
export function applyTheme(): void {
  const root = document.documentElement;
  root.classList.add("dark");
  root.classList.remove("light");

  try {
    localStorage.setItem("theme", "dark");
  } catch {
    /* private browsing */
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", "#0b0b0a");
  }
}