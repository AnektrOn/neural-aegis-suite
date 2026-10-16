import { Link } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import { useLanguage, type Locale } from "@/i18n/LanguageContext";

export function PrismLandingNav() {
  const { locale, setLocale, t } = useLanguage();

  return (
    <header className="prism-nav" aria-label="Navigation">
      <Link to="/dev" className="prism-brand">
        <span>Aegis</span>
      </Link>
      <div className="prism-nav-end">
        <nav className="prism-links" aria-label="Liens">
          <Link to="/dev">Lab</Link>
        </nav>
        <ThemeToggle compact />
        <div className="prism-lang" role="group" aria-label="Langue">
          {(["fr", "en"] as Locale[]).map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={locale === code}
              onClick={() => setLocale(code)}
            >
              {code}
            </button>
          ))}
        </div>
        <Link to="/auth" className="prism-links signin">
          {t("auth.signIn")}
        </Link>
      </div>
    </header>
  );
}
