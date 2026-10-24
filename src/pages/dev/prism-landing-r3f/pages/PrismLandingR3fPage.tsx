import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { R3fSceneConfigProvider } from "../config/r3fSceneConfigContext";
import PrismLandingR3fCanvas from "../ui/PrismLandingR3fCanvas";
import { GodraysHallControls } from "../ui/GodraysHallControls";
import "../styles/godrays-hall.css";

function GodraysHallPageInner() {
  return (
    <div className="godrays-hall-root">
      <Button variant="ghost" size="sm" className="godrays-hall-back gap-2" asChild>
        <Link to="/dev">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Dev Lab
        </Link>
      </Button>

      <div className="godrays-hall-wrap">
        <header className="godrays-hall-header">
          <h1>Godrays Hall</h1>
          <p>
            Orbite : clic gauche · zoom molette · pan clic droit · fente / godrays dorés au centre · cube à droite
            (lumière glaciaire) · clic cube = burst / reform
          </p>
        </header>

        <div className="godrays-hall-stage">
          <div className="godrays-hall-canvas">
            <PrismLandingR3fCanvas />
          </div>
        </div>

        <GodraysHallControls />
      </div>
    </div>
  );
}

/** R3F lab — wasteland, fente / tuile gouttière, godrays (three-good-godrays). */
export default function PrismLandingR3fPage() {
  return (
    <R3fSceneConfigProvider>
      <GodraysHallPageInner />
    </R3fSceneConfigProvider>
  );
}
