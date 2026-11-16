import { useLanguage } from "@/i18n/LanguageContext";

/** FR/EN toggle — same pattern as landing nav; wired to global `app-locale`. */
export function PublicMarketingLanguageToggle() {
  const { locale, setLocale } = useLanguage();
  const aria = locale === "fr" ? "Choisir la langue" : "Choose language";

  return (
    <div
      className="flex min-h-[44px] items-center gap-2 font-mono text-xs tracking-[0.14em]"
      role="group"
      aria-label={aria}
    >
      <button
        type="button"
        className={`min-h-[44px] min-w-[44px] ${
          locale === "fr" ? "text-[color:var(--aegis-text)]" : "text-[color:var(--aegis-text-secondary)]"
        }`}
        aria-pressed={locale === "fr"}
        onClick={() => setLocale("fr")}
      >
        FR
      </button>
      <span className="text-[color:var(--aegis-hairline)]" aria-hidden>
        /
      </span>
      <button
        type="button"
        className={`min-h-[44px] min-w-[44px] ${
          locale === "en" ? "text-[color:var(--aegis-text)]" : "text-[color:var(--aegis-text-secondary)]"
        }`}
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
      >
        EN
      </button>
    </div>
  );
}