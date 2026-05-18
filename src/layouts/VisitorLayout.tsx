import { Link, Outlet } from "react-router-dom";
import aegisLogo from "@/assets/aegis-logo.png";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import AppFooter from "@/components/AppFooter";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

export default function VisitorLayout() {
  const { t } = useLanguage();
  const { isAnonymous } = useAuth();

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-bg-base/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/visitor" className="flex items-center gap-2 shrink-0">
            <img src={aegisLogo} alt="Aegis" className="w-8 h-8 rounded-lg object-contain" />
            <span className="font-display text-[10px] tracking-[0.2em] uppercase text-text-secondary hidden sm:inline">
              Neural Aegis
            </span>
          </Link>
          <nav className="flex items-center gap-3 text-xs">
            <Link
              to="/quiz"
              className="text-text-secondary hover:text-text-primary transition-colors uppercase tracking-wider font-display"
            >
              {t("visitor.nav.quiz")}
            </Link>
            <Link
              to="/visitor/report"
              className="text-text-secondary hover:text-text-primary transition-colors uppercase tracking-wider font-display"
            >
              {t("visitor.nav.report")}
            </Link>
            {!isAnonymous && (
              <Link
                to="/"
                className="text-accent-primary hover:text-accent-primary/80 transition-colors uppercase tracking-wider font-display"
              >
                {t("visitor.nav.app")}
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle collapsed />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <AppFooter />
    </div>
  );
}
