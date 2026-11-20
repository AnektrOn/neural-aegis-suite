import type { Locale } from './translations';

export function resolveLocalePreference(saved: string | null, legacy: string | null, browserLanguage: string): Locale {
  if (saved === 'en' || saved === 'fr') return saved;
  if (legacy === 'en' || legacy === 'fr') return legacy;
  return browserLanguage.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

export function readLocalePreference(): Locale {
  const browserLang = typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'fr';
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('app-locale') : null;
    const legacy = typeof localStorage !== 'undefined' ? localStorage.getItem('aegis-landing-locale') : null;
    return resolveLocalePreference(saved, legacy, browserLang);
  } catch {
    return resolveLocalePreference(null, null, browserLang);
  }
}

export function saveLocalePreference(locale: Locale) {
  try {
    localStorage.setItem('app-locale', locale);
    localStorage.setItem('aegis-landing-locale', locale);
  } catch { /* The current page still uses the selected language. */ }
}