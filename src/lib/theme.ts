import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "theme";

const THEME_COLOR: Record<ThemeMode, string> = {
  dark: "#0b0b0a",
  light: "#f5f2eb",
};

/** Read persisted theme (member shell). Default: dark (Obsidienne). */
export function getStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* private browsing */
  }
  return "dark";
}

export function getStoredThemeIsDark(): boolean {
  return getStoredTheme() === "dark";
}

/** Apply `html.light` / `html.dark` and theme-color meta. */
export function applyTheme(mode?: ThemeMode): void {
  const theme = mode ?? getStoredTheme();
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.classList.toggle("dark", theme === "dark");

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", THEME_COLOR[theme]);
  }
}

export function setTheme(mode: ThemeMode): void {
  applyTheme(mode);
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
      if (event.key === STORAGE_KEY) bump();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      observer.disconnect();
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return revision;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setThemeState(getStoredTheme());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setTheme(mode);
    setThemeState(mode);
  }, []);

  return {
    theme,
    isDark: theme === "dark",
    setTheme: setThemeMode,
    toggleTheme: () => setThemeMode(theme === "dark" ? "light" : "dark"),
  };
}