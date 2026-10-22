import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import PrismLandingCanvasOpt from "../ui/PrismLandingCanvasOpt";
import "../styles/prism-landing.css";

/** Variante perf : profil `optimized` (DPR adaptatif, throttle idle, pause onglet caché). */
export default function PrismLandingPageOpt() {
  return (
    <div className="prism-landing-root">
      <Button
        variant="ghost"
        size="sm"
        className="prism-landing-back gap-2"
        asChild
      >
        <Link to="/dev">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Dev Lab
        </Link>
      </Button>
      <p className="prism-landing-opt-badge" role="status">
        Perf optimisée —{" "}
        <Link to="/dev/prism-landing">revenir à la landing golden</Link>
      </p>
      <div className="prism-landing-canvas">
        <PrismLandingCanvasOpt />
      </div>
    </div>
  );
}
