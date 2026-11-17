import type { Locale } from './translations';

export function resolveLocalePreference(saved: string | null, legacy: string | null, browserLanguage: string): Locale {
  if (saved === 'en' || saved === 'fr') return saved;
  if (legacy === 'en' || legacy === 'fr') return legacy;
  return browserLanguage.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

export function readLocalePreference(): Locale {
  try {
    return resolveLocalePreference(localStorage.getItem('app-locale'), localStorage.getItem('aegis-landing-locale'), navigator.language);
  } catch {
    return resolveLocalePreference(null, null, navigator.language);
  }
}

export function saveLocalePreference(locale: Locale) {
  try {
    localStorage.setItem('app-locale', locale);
    localStorage.setItem('aegis-landing-locale', locale);
  } catch { /* The current page still uses the selected language. */ }
}