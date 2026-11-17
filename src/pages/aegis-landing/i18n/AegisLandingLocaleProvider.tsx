import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  AEGIS_LANDING_COPY,
  type AegisLandingAudience,
  type AegisLandingCopy,
  type AegisLandingLocale,
} from "./aegisLandingCopy";
import { useLanguage } from '@/i18n/LanguageContext';

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
  const { locale, setLocale } = useLanguage();

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
