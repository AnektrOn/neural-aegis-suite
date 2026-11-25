import { Link, useLocation } from "react-router-dom";
import { NOT_FOUND_SEO } from "@/seo/seoPages";
import { SeoHelmet } from "@/seo/SeoHelmet";
import { seoCanonical } from "@/seo/site";

/** Public 404 for unknown or retired marketing URLs (not the in-app member NotFound). */
export default function PublicNotFoundPage() {
  const { pathname } = useLocation();
  const canonical = seoCanonical(pathname);

  return (
    <>
      <SeoHelmet
        title={NOT_FOUND_SEO.title}
        description={NOT_FOUND_SEO.description}
        canonical={canonical}
        noindex
        robots="noindex, follow"
        variant="page"
        pageName={NOT_FOUND_SEO.h1}
      />
      <div className="flex min-h-[60vh] items-center justify-center bg-aegis-gradient px-6">
        <main className="dashboard-panel max-w-md p-10 text-center">
          <h1 className="mb-4 font-cormorant text-4xl font-light text-text-primary">{NOT_FOUND_SEO.h1}</h1>
          <p className="mb-6 text-muted-foreground">{NOT_FOUND_SEO.description}</p>
          <p className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 px-5 font-barlow text-xs uppercase tracking-wide text-primary hover:bg-primary/15"
            >
              Accueil
            </Link>
            <Link
              to="/tools"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border/60 px-5 font-barlow text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
              Outils décisionnels
            </Link>
          </p>
        </main>
      </div>
    </>
  );
}