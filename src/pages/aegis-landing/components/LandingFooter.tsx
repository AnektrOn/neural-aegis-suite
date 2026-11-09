import { Link } from "react-router-dom";
import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";

export function LandingFooter() {
  const { copy } = useAegisLandingLocale();

  return (
    <footer className="border-t border-[color:var(--aegis-hairline)] bg-[color:var(--aegis-page)] py-12">
      <div className="aegis-landing__container flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <p className="font-cinzel text-lg tracking-[0.2em]">{copy.footer.product}</p>
        <nav aria-label={copy.footer.legal} className="flex flex-col gap-3">
          <a
            href="/auth"
            className="min-h-[44px] font-mono text-xs uppercase tracking-[0.12em] text-[color:var(--aegis-text-secondary)] hover:text-[color:var(--aegis-text)]"
          >
            {copy.nav.signIn}
          </a>
          {copy.footer.links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="min-h-[44px] font-mono text-xs uppercase tracking-[0.12em] text-[color:var(--aegis-text-secondary)] hover:text-[color:var(--aegis-text)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="aegis-landing__container mt-8 font-mono text-xs uppercase tracking-[0.14em] text-[color:var(--aegis-text-secondary)]">
        {copy.footer.copyright}
      </p>
    </footer>
  );
}
