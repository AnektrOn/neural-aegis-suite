import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/i18n/LanguageContext";

export default function AppFooter() {
  const isMobile = useIsMobile();
  const { t, locale } = useLanguage();
  const isFR = locale === "fr";
  if (isMobile) return null;

  const links = [
    { to: "/pricing", label: isFR ? "Tarifs" : "Pricing" },
    { to: "/legal/terms", label: isFR ? "Conditions générales" : "Terms" },
    { to: "/legal/refund", label: isFR ? "Remboursements" : "Refunds" },
    { to: "/legal/privacy", label: isFR ? "Confidentialité" : "Privacy" },
  ];

  return (
    <footer className="mt-10 pt-4 border-t border-border-subtle/50 text-center">
      <p className="text-[10px] tracking-[0.18em] uppercase text-text-tertiary/70 font-display">
        {t("footer.protocol")}
      </p>
      <p className="text-[9px] tracking-[0.12em] uppercase text-text-tertiary/50 mt-1">
        {t("footer.ownership")}
      </p>
      <nav className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="text-[9px] tracking-[0.12em] uppercase text-text-tertiary/60 transition-colors hover:text-foreground"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
