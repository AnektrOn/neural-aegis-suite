import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { useAegisLandingLocale } from "../i18n/AegisLandingLocaleProvider";
import { LandingButton } from "./LandingButton";

const links = [
  { href: "#comment", key: "comment" as const },
  { href: "#pour-qui", key: "pourQui" as const },
  { href: "#tarif", key: "tarif" as const },
  { href: "#faq", key: "faq" as const },
];

function AudienceToggle({ className }: { className?: string }) {
  const { copy, audience } = useAegisLandingLocale();

  return (
    <nav
      aria-label={copy.nav.audience}
      className={`items-center gap-2 whitespace-nowrap font-mono text-xs uppercase tracking-[0.12em] ${className ?? ""}`}
    >
      <Link
        to="/"
        aria-current={audience === "individuel" ? "page" : undefined}
        className={`inline-flex min-h-[44px] items-center ${audience === "individuel" ? "text-[color:var(--aegis-text)]" : "text-[color:var(--aegis-text-secondary)] hover:text-[color:var(--aegis-text)]"}`}
      >
        {copy.nav.audienceIndividuel}
      </Link>
      <span className="text-[color:var(--aegis-hairline)]" aria-hidden>
        ·
      </span>
      <Link
        to="/entreprise"
        aria-current={audience === "entreprise" ? "page" : undefined}
        className={`inline-flex min-h-[44px] items-center ${audience === "entreprise" ? "text-[color:var(--aegis-text)]" : "text-[color:var(--aegis-text-secondary)] hover:text-[color:var(--aegis-text)]"}`}
      >
        {copy.nav.audienceEntreprise}
      </Link>
    </nav>
  );
}

export function LandingNav() {
  const { copy, locale, setLocale } = useAegisLandingLocale();
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const linkClass =
    "inline-flex min-h-[44px] items-center whitespace-nowrap font-mono text-xs uppercase tracking-[0.12em] text-[color:var(--aegis-muted)] transition-colors hover:text-[color:var(--aegis-text)]";

  return (
    <header className="aegis-landing__container grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0 py-4 md:py-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <div className="flex min-w-0 items-center gap-5">
        <Link
          to="/"
          className="shrink-0 font-cinzel text-lg tracking-[0.2em] text-[color:var(--aegis-text)]"
        >
          AEGIS
        </Link>
        <AudienceToggle className="hidden sm:flex" />
      </div>
      <nav
        aria-label={copy.nav.primary}
        className="hidden items-center justify-center gap-6 whitespace-nowrap lg:flex"
      >
        {links.map((l) => (
          <a key={l.key} href={l.href} className={linkClass}>
            {copy.nav[l.key]}
          </a>
        ))}
      </nav>
      <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
        <button
          type="button"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center text-[color:var(--aegis-text)] lg:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? copy.nav.menuClose : copy.nav.menu}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            {open ? (
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            ) : (
              <path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            )}
          </svg>
        </button>
        <LandingButton href="#tarif" variant="dark" className="hidden sm:inline-flex">
          {copy.nav.cta}
        </LandingButton>
        <div
          className="flex min-h-[44px] items-center gap-2 font-mono text-xs tracking-[0.14em]"
          role="group"
          aria-label={copy.nav.lang}
        >
          <button
            type="button"
            className={`min-h-[44px] min-w-[44px] ${locale === "fr" ? "text-[color:var(--aegis-text)]" : "text-[color:var(--aegis-text-secondary)]"}`}
            aria-pressed={locale === "fr"}
            onClick={() => setLocale("fr")}
          >
            {copy.nav.langFr}
          </button>
          <span className="text-[color:var(--aegis-hairline)]" aria-hidden>
            /
          </span>
          <button
            type="button"
            className={`min-h-[44px] min-w-[44px] ${locale === "en" ? "text-[color:var(--aegis-text)]" : "text-[color:var(--aegis-text-secondary)]"}`}
            aria-pressed={locale === "en"}
            onClick={() => setLocale("en")}
          >
            {copy.nav.langEn}
          </button>
        </div>
      </div>
      <AudienceToggle className="col-span-2 flex sm:hidden" />
      <nav
        id={menuId}
        aria-label={copy.nav.primary}
        className={`col-span-2 flex-col border-t border-[color:var(--aegis-hairline)] py-2 lg:hidden ${open ? "flex" : "hidden"}`}
      >
        {links.map((l) => (
          <a
            key={l.key}
            href={l.href}
            className={linkClass}
            onClick={() => setOpen(false)}
          >
            {copy.nav[l.key]}
          </a>
        ))}
      </nav>
    </header>
  );
}
