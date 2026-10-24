import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import PrismLandingR3fCanvas from "../ui/PrismLandingR3fCanvas";
import "@/pages/dev/prism-landing/styles/prism-landing.css";

/** MVP R3F : godrays + bloom + caméra Theatre (2 keyframes). */
export default function PrismLandingR3fPage() {
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

      <div
        className="pointer-events-none absolute inset-x-0 top-14 z-20 flex flex-col items-center gap-2 px-4 text-center"
        aria-live="polite"
      >
        <p className="text-sm font-medium tracking-wide text-amber-100/90">
          Prism landing — React Three Fiber (MVP)
        </p>
        <p className="max-w-md text-xs text-white/65">
          Travelling Theatre.js · godrays three-good-godrays · golden inchangée sur{" "}
          <Link className="pointer-events-auto underline text-amber-200/90" to="/dev/prism-landing">
            /dev/prism-landing
          </Link>
        </p>
      </div>

      <div className="prism-landing-canvas">
        <PrismLandingR3fCanvas />
      </div>
    </div>
  );
}
