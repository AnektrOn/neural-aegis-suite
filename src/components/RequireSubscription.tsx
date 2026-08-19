import { Navigate, useLocation } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdmin } from "@/hooks/use-admin";
import { useLanguage } from "@/i18n/LanguageContext";

/**
 * Gates the member application behind an active plan.
 * Admins always pass. Account-management routes stay reachable without a plan
 * so free / past_due users can still manage their account and pay.
 */
const FREE_PATHS = ["/profile", "/settings", "/install"];

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

  const isFreePath = FREE_PATHS.some(
    (p) => location.pathname === p || location.pathname.startsWith(`${p}/`),
  );

  if (!isAdmin && !isActive && !isFreePath) {
    return <Navigate to="/pricing" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

