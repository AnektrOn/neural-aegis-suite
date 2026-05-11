import type { Locale } from "@/i18n/translations";

type I18nObject = Partial<Record<Locale, string>> | Record<string, string> | null | undefined;

function asString(v: unknown): string | null {
  if (typeof v === "string") {
    const t = v.trim();
    return t ? t : null;
  }
  return null;
}

/**
 * Prefer `locale`; fall back across languages; ultimately fall back to `legacy`.
 *
 * Stored shape is `{ fr?: string; en?: string }` JSONB (`*_i18n` columns).
 */
export function pickLocalizedText(locale: Locale, i18n: I18nObject, legacy?: string | null): string {
  const obj = (i18n && typeof i18n === "object" ? i18n : {}) as Partial<Record<Locale, string>>;

  const primary = asString(obj[locale]);
  if (primary) return primary;

  const fallback = asString(locale === "fr" ? obj.en : obj.fr);
  if (fallback) return fallback;

  const anyLang = [...Object.keys(obj)]
    .map((k) => asString((obj as any)[k]))
    .find((s) => Boolean(s));

  const legacyTrim = legacy?.trim();
  if (legacyTrim) return legacyTrim;

  return anyLang || "";
}

export function bilingualPair(fr: string, en: string) {
  return { fr: fr.trim(), en: en.trim() } satisfies Record<Locale, string>;
}
