import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AEGIS_LANDING_COPY,
  type AegisLandingAudience,
  type AegisLandingCopy,
  type AegisLandingLocale,
} from "./aegisLandingCopy";

const STORAGE_KEY = "aegis-landing-locale";

type Ctx = {
  locale: AegisLandingLocale;
  setLocale: (l: AegisLandingLocale) => void;
  audience: AegisLandingAudience;
  copy: AegisLandingCopy;
};

const AegisLandingLocaleContext = createContext<Ctx | null>(null);

/** Locale + audience context. Locale persists in `localStorage`; audience is a route prop. */
export function AegisLandingLocaleProvider({
  audience,
  children,
}: {
  audience: AegisLandingAudience;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<AegisLandingLocale>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s === "en" ? "en" : "fr";
    } catch {
      return "fr";
    }
  });

  const setLocale = useCallback((l: AegisLandingLocale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const copy = AEGIS_LANDING_COPY[audience][locale];

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, audience, copy }),
    [locale, setLocale, audience, copy],
  );

  return (
    <AegisLandingLocaleContext.Provider value={value}>
      {children}
    </AegisLandingLocaleContext.Provider>
  );
}

/** Must be called under `AegisLandingLocaleProvider`. */
export function useAegisLandingLocale() {
  const ctx = useContext(AegisLandingLocaleContext);
  if (!ctx) throw new Error("useAegisLandingLocale outside provider");
  return ctx;
}
