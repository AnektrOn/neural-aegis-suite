import { Link, Outlet } from "react-router-dom";
import aegisLogo from "@/assets/aegis-logo.png";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import AppFooter from "@/components/AppFooter";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/use-admin";
import { isAnonymousUser, isGuestUser } from "@/lib/authVisitor";

export default function NewsletterLayout() {
  const { t } = useLanguage();
  const { user, isGuest, isAnonymous } = useAuth();
  const { isAdmin } = useAdmin();

  const visitorOnly =
    user && (isGuest || isAnonymous || isGuestUser(user) || isAnonymousUser(user));
  const member =
    user && !isAnonymousUser(user) && !isGuestUser(user) && !isGuest && !isAnonymous;

  const homeTo = !user ? "/auth" : visitorOnly ? "/visitor" : member ? "/" : "/auth";
  const homeLabel = !user
    ? t("newsletter.nav.signIn")
    : visitorOnly
      ? t("newsletter.nav.visitor")
      : member
        ? t("newsletter.nav.app")
        : t("newsletter.nav.signIn");

  return (
    <div className="min-h-screen bg-bg-base flex flex-col newsletter-layout">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-bg-base/80 backdrop-blur-md">
        <div className="max-w-3xl lg:max-w-[44rem] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link to="/newsletter" className="flex items-center gap-2 shrink-0 min-h-[44px]">
            <img
              src={aegisLogo}
              alt="Aegis"
              className="w-8 h-8 rounded-lg object-contain"
            />
            <span className="font-display text-[10px] tracking-[0.2em] uppercase text-text-secondary hidden sm:inline">
              Neural Aegis
            </span>
          </Link>

          <nav className="flex items-center gap-3 text-xs" aria-label={t("newsletter.nav.aria")}>
            {visitorOnly && (
              <>
                <Link
                  to="/quiz"
                  className="text-text-secondary hover:text-text-primary transition-colors duration-200 uppercase tracking-wider font-display min-h-[44px] inline-flex items-center"
                >
                  {t("visitor.nav.quiz")}
                </Link>
                <Link
                  to="/visitor"
                  className="text-text-secondary hover:text-text-primary transition-colors duration-200 uppercase tracking-wider font-display min-h-[44px] inline-flex items-center"
                >
                  {t("newsletter.nav.visitor")}
                </Link>
              </>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="text-accent-primary hover:text-accent-primary/80 transition-colors duration-200 uppercase tracking-wider font-display min-h-[44px] inline-flex items-center"
              >
                {t("nav.admin")}
              </Link>
            )}
            <Link
              to={homeTo}
              className="text-text-secondary hover:text-text-primary transition-colors duration-200 uppercase tracking-wider font-display min-h-[44px] inline-flex items-center"
            >
              {homeLabel}
            </Link>
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

      <div className="max-w-3xl lg:max-w-[44rem] mx-auto w-full px-4 sm:px-6 pb-8">
        <AppFooter />
      </div>
    </div>
  );
}
