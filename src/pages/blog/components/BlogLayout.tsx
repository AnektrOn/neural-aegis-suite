import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import AegisLogo from "@/components/AegisLogo";
import { PublicMarketingLanguageToggle } from "@/components/public/PublicMarketingLanguageToggle";
import PublicFooter from "@/components/public/PublicFooter";
import { useLanguage } from "@/i18n/LanguageContext";
import { toolsHeaderShell, toolsPageShell } from "@/components/tools/toolsDesign";
import "@/components/tools/tools-shell.css";

type Props = {
  children: ReactNode;
};

/** Shared blog chrome: mobile-first shell, keyboard-friendly header, semantic main. */
export function BlogLayout({ children }: Props) {
  const { locale } = useLanguage();
  const blogLabel = locale === "fr" ? "Blog" : "Blog";

  return (
    <div className={`tools-route ${toolsPageShell}`}>
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-primary/6 blur-3xl"
        aria-hidden
      />

      <header className={`relative ${toolsHeaderShell}`}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3">
              <AegisLogo alt="AEGIS" className="h-9 w-9 rounded-lg object-contain" />
              <span className="font-display text-[10px] font-medium uppercase tracking-[0.2em] text-primary">
                AEGIS
              </span>
            </Link>
            <Link
              to="/blog"
              className="hidden min-h-11 items-center font-display text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary sm:inline-flex"
            >
              {blogLabel}
            </Link>
          </div>
          <PublicMarketingLanguageToggle />
        </div>
      </header>

      {children}
      <PublicFooter />
    </div>
  );
}