import { useLocation } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdmin } from "@/hooks/use-admin";
import { useLanguage } from "@/i18n/LanguageContext";
import { isFreePath } from "@/lib/planAccess";
import PremiumLock from "@/components/PremiumLock";
import { useFreePreview } from "@/hooks/useFreePreview";

/**
 * Gates the member application behind an active plan.
 * Admins always pass. Free members keep account management and daily logging
 * (mood, decisions, habits); paid areas render a blurred preview with a CTA.
 */
export default function RequireSubscription({ children }: { children: React.ReactNode }) {
  const { isActive, loading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { t } = useLanguage();
  const location = useLocation();
  const { enabled: freePreview } = useFreePreview();

  if (loading || adminLoading) {
    return (
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
          role="status"
          aria-label={t("general.loading")}
        />
      </div>
    );
  }

  if ((freePreview || (!isAdmin && !isActive)) && !isFreePath(location.pathname)) {
    return <PremiumLock>{children}</PremiumLock>;
  }

  return <>{children}</>;
}
