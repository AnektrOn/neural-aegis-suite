export function getStoredThemeIsDark(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem("theme");
  return (
    stored === "dark" ||
    (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
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
    meta.setAttribute("content", dark ? "#08090D" : "#FAF3E4");
  }
}
