import { Link } from "react-router-dom";
import AegisLogo from "@/components/AegisLogo";
import AppSumoRedemption from "@/components/AppSumoRedemption";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/i18n/LanguageContext";
import { SeoHelmet } from "@/seo/SeoHelmet";
import { NOINDEX_STATIC_ROUTES } from "@/seo/seoPages";
import { seoCanonical } from "@/seo/site";

const REDEEM_SEO = NOINDEX_STATIC_ROUTES.find((r) => r.route === "/redeem")!;

export default function Redeem() {
  const { locale } = useLanguage();
  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-foreground">
      <SeoHelmet
        title={REDEEM_SEO.title}
        description={REDEEM_SEO.description}
        canonical={seoCanonical("/redeem")}
        noindex
        robots={REDEEM_SEO.robots}
      />
      <div className="mx-auto w-full max-w-lg">
        <header className="flex items-center justify-between gap-4">
          <Link to="/">
            <AegisLogo className="h-20 w-20 object-contain" />
          </Link>
          <LanguageSwitcher />
        </header>
        <h1 className="mt-8 text-3xl">AEGIS × AppSumo</h1>
        <AppSumoRedemption />
        <Link to="/pricing" className="mt-6 inline-block text-sm text-muted-foreground">
          {locale === "fr" ? "Voir les offres" : "View plans"}
        </Link>
      </div>
    </main>
  );
}