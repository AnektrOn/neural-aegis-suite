import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { getTrackingConsent, setTrackingConsent } from "@/lib/trackingConsent";

/** EU cookie / analytics consent banner for hesitation + session heartbeats. */
export default function CookieConsentBanner() {
  const { locale } = useLanguage();
  const isFR = locale === "fr";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getTrackingConsent() === null);
  }, []);

  if (!visible) return null;

  const accept = () => {
    setTrackingConsent("accepted");
    setVisible(false);
  };
  const decline = () => {
    setTrackingConsent("declined");
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label={isFR ? "Consentement cookies" : "Cookie consent"}
      className="fixed bottom-0 inset-x-0 z-[80] border-t border-border bg-background/95 backdrop-blur-md p-4 sm:p-5"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isFR
            ? "Nous mesurons l'usage de l'app (sessions, temps sur les champs) pour améliorer le coaching. Aucun tracking publicitaire. "
            : "We measure in-app usage (sessions, field hesitation) to improve coaching. No ad tracking. "}
          <Link to="/legal/privacy" className="underline underline-offset-2 hover:text-foreground">
            {isFR ? "Confidentialité" : "Privacy"}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={decline}
            className="min-h-[44px] rounded-xl border border-border px-4 text-xs uppercase tracking-widest text-muted-foreground hover:bg-secondary/40"
          >
            {isFR ? "Refuser" : "Decline"}
          </button>
          <button
            type="button"
            onClick={accept}
            className="min-h-[44px] rounded-xl bg-primary px-4 text-xs uppercase tracking-widest text-primary-foreground"
          >
            {isFR ? "Accepter" : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}
