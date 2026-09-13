import { lazy, Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { BREATHING_ORB_PATTERNS } from "@/features/toolbox/nebula/breathingOrbPatterns";
import { copy } from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";

const ToolboxParticleBreathwork = lazy(() =>
  import("@/features/toolbox/nebula/pilots/ToolboxParticleBreathwork").then((mod) => ({
    default: mod.ToolboxParticleBreathwork,
  })),
);

const PATTERN = BREATHING_ORB_PATTERNS["478"];

export function ToolboxSessionScene() {
  const { isFR, goTo } = usePromotePlayer();
  const title = copy(isFR, "Respiration 4-7-8", "4-7-8 breath");

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-black">
      <div className="absolute inset-0 [&>div]:h-full [&>div]:min-h-0">
        <Suspense fallback={<div className="h-full bg-black" />}>
          <ToolboxParticleBreathwork
            config={PATTERN.config}
            title={title}
            variant="modal"
            sessionKey="promote-dev-breath-478"
          />
        </Suspense>
      </div>
      <button
        type="button"
        onClick={() => goTo("toolbox")}
        className="absolute left-3 top-[max(1rem,env(safe-area-inset-top))] z-[80] inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground/80"
        aria-label={copy(isFR, "Retour", "Back")}
      >
        <ArrowLeft size={20} />
      </button>
    </div>
  );
}
