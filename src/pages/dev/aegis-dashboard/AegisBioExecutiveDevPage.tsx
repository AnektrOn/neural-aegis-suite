import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileAppDockBar } from "@/components/MobileAppDockBar";
import AegisBioExecutiveDashboard from "./AegisBioExecutiveDashboard";

/**
 * Hero Lab + fixtures — true 100dvh × 100vw (no top/bottom letterbox).
 * Floating Lab chip only; Hero Builder stays in-dashboard overlay.
 */
export default function AegisBioExecutiveDevPage() {
  return (
    <div className="aegis-bio-exec-dev-page relative h-[100dvh] w-[100vw] max-w-[100vw] overflow-hidden bg-[color:var(--hero-bg,#070707)]">
      <Button
        variant="outline"
        size="sm"
        asChild
        className="aegis-bio-exec-dev__back-link fixed bottom-4 left-4 z-[70] rounded-xl border-border/60 bg-card/80 text-foreground shadow-sm backdrop-blur-md hover:bg-card"
      >
        <Link to="/dev">
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
          Lab
        </Link>
      </Button>
      <AegisBioExecutiveDashboard />
      <MobileAppDockBar previewOnDesktop className="aegis-bio-exec-dev__external-dock" />
    </div>
  );
}
