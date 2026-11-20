import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { translations, type Locale, type TranslationKey } from "./translations";
import { readLocalePreference, saveLocalePreference } from './localePreference';

export { readLocalePreference, saveLocalePreference } from './localePreference';
export type { Locale, TranslationKey } from "./translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const GLOBAL_LANGUAGE_CONTEXT_KEY = "__AEGIS_LANGUAGE_CONTEXT__";

const LanguageContext: React.Context<LanguageContextType | null> =
  ((globalThis as unknown as { [key: string]: React.Context<LanguageContextType | null> })[
    GLOBAL_LANGUAGE_CONTEXT_KEY
  ] ??= createContext<LanguageContextType | null>(null));

function fallbackTranslate(locale: Locale, key: TranslationKey, params?: Record<string, string | number>): string {
  let str: string = translations[key]?.[locale] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    });
  }
  return str;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readLocalePreference);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    saveLocalePreference(l);
    // Mirror the choice on the user profile so alerts/pop-ups use the right language.
    void (async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase.auth.getUser();
        if (data?.user?.id) {
          await supabase.from("profiles").update({ preferred_language: l }).eq("id", data.user.id);
        }
      } catch {
        /* silent: language still applies locally */
      }
    })();
  }, []);

  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    let str: string = translations[key]?.[locale] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }
    return str;
  }, [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Safe failsafe during HMR, root-level evaluations, or testing
    const locale = readLocalePreference();
    return {
      locale,
      setLocale: saveLocalePreference,
      t: (key: TranslationKey, params?: Record<string, string | number>) =>
        fallbackTranslate(locale, key, params),
    };
  }
  return ctx;
}
