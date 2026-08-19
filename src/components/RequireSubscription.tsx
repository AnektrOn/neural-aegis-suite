import { Navigate, useLocation } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdmin } from "@/hooks/use-admin";
import { useLanguage } from "@/i18n/LanguageContext";

/**
 * Gates the member application behind an active plan.
 * Admins always pass. Users with a failed payment (past_due) are sent to
 * the pricing page so they can fix their payment method.
 */
export default function RequireSubscription({ children }: { children: React.ReactNode }) {
  const { isActive, loading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { t } = useLanguage();
  const location = useLocation();

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

  if (!isAdmin && !isActive) {
    return <Navigate to="/pricing" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
