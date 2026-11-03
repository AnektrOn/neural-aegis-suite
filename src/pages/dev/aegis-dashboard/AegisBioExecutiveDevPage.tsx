import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileAppDockBar } from "@/components/MobileAppDockBar";
import AegisBioExecutiveDashboard from "./AegisBioExecutiveDashboard";

/**
 * Prod dashboard lives on `/dashboard` (live Supabase + exocortex).
 * This route is only for Hero Lab fixtures: `/dev/aegis-dashboard?fixtures=1`
 */
export default function AegisBioExecutiveDevPage() {
  const [searchParams] = useSearchParams();
  const fixturesLab = searchParams.get("fixtures") === "1";

  if (!fixturesLab) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="aegis-bio-exec-dev-page relative min-h-screen pb-[calc(var(--mobile-dock-padding)+1rem)]">
      <Button
        variant="outline"
        size="sm"
        asChild
        className="aegis-bio-exec-dev__back-link fixed left-4 top-4 z-[70] rounded-xl border-border bg-card/90 text-foreground shadow-sm backdrop-blur-md hover:bg-card"
      >
        <Link to="/dev">
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
          Lab
        </Link>
      </Button>
      <div className="fixed right-4 top-4 z-[70] max-w-[min(100vw-8rem,20rem)] rounded-xl border border-border bg-card/95 px-3 py-2 text-[11px] text-muted-foreground shadow-sm backdrop-blur-md">
        Fixtures + Hero Lab uniquement. Prod :{" "}
        <Link to="/dashboard" className="font-medium text-primary underline-offset-2 hover:underline">
          /dashboard
        </Link>
      </div>
      <AegisBioExecutiveDashboard />
      <MobileAppDockBar previewOnDesktop className="aegis-bio-exec-dev__external-dock" />
    </div>
  );
}
