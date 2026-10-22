import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import PrismLandingCanvas from "../ui/PrismLandingCanvas";
import "../styles/prism-landing.css";

/** Dev landing : travelling caméra, POV. */
export default function PrismLandingPage() {
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
      <div className="prism-landing-canvas">
        <PrismLandingCanvas />
      </div>
    </div>
  );
}
