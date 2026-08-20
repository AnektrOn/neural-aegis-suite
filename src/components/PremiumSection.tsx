import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useAdmin } from "@/hooks/use-admin";
import { useLanguage } from "@/i18n/LanguageContext";

/** True when the current member has no paid access (admins always pass). */
export function usePremiumLocked(): boolean {
  const { isActive, loading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  if (loading || adminLoading) return false;
  return !isAdmin && !isActive;
}

/**
 * Blurs a premium block for free members and overlays a compact unlock CTA.
 * Paid members / admins get the untouched children.
 */
export default function PremiumSection({
  children,
  className = "",
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  const locked = usePremiumLocked();
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  if (!locked) return <>{children}</>;

  return (
    <div className={`relative ${className}`}>
      <div aria-hidden className="pointer-events-none select-none blur-[8px] saturate-50 opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center p-3">
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/80 px-4 py-2.5 text-xs font-medium uppercase tracking-[0.12em] text-primary shadow-lg backdrop-blur-xl transition-colors hover:bg-primary/10"
        >
          <Lock className="h-3.5 w-3.5" aria-hidden />
          {label ?? (isFR ? "Activer la Matrice" : "Activate Matrix")}
        </Link>
      </div>
    </div>
  );
}
