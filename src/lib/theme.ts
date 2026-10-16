import { useEffect, useState } from "react";

export function getStoredThemeIsDark(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem("theme");
  return (
    stored === "dark" ||
    (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
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

/** Apply dark/light classes on <html> — must run before first paint. */
export function applyTheme(dark: boolean): void {
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.classList.toggle("light", !dark);

  try {
    localStorage.setItem("theme", dark ? "dark" : "light");
  } catch {
    /* private browsing */
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", dark ? "#08090D" : "#FFFFFF");
  }
}
