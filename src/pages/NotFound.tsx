import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-aegis-gradient px-6">
      <div className="dashboard-panel max-w-md text-center p-10">
        <h1 className="mb-4 font-cormorant text-4xl font-light text-text-primary">{t("notFound.title")}</h1>
        <p className="mb-6 text-muted-foreground">{t("notFound.oops")}</p>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 px-5 font-barlow text-xs uppercase tracking-wide text-primary hover:bg-primary/15"
        >
          {t("notFound.returnHome")}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
