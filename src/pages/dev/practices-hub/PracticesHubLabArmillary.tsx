import { Suspense, lazy, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_SPIN,
  PRATIQUES_CAM,
  PRATIQUES_CORE_COLOR,
  PRATIQUES_RING_EULERS,
  PRATIQUES_SPHERE_OFFSET,
} from "@/pages/aegis-landing/armillary/armillaryConstants";

const ArmillarySphereCanvas = lazy(() =>
  import("@/pages/aegis-landing/armillary/ArmillarySphereCanvas").then((m) => ({
    default: m.ArmillarySphereCanvas,
  })),
);

const PRATIQUES_INITIAL_TARGET = PRATIQUES_CAM.target;

/** Lab hero: prod core tone, softer glow for light band (no CSS filter on canvas). */
const LAB_ARMILLARY_GLOW = 1.15;

function ArmillaryFallback({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)} aria-hidden>
      <div className="h-[70%] w-[70%] max-h-[420px] max-w-[420px] rounded-full bg-[radial-gradient(circle,hsla(40,80%,70%,0.55)_0%,transparent_68%)]" />
    </div>
  );
}

type PracticesHubLabArmillaryProps = {
  className?: string;
};

export function PracticesHubLabArmillary({ className }: PracticesHubLabArmillaryProps) {
  const [webglFailed, setWebglFailed] = useState(false);
  const [ready, setReady] = useState(false);

  if (webglFailed) {
    return <ArmillaryFallback className={className} />;
  }

  return (
    <div className={cn("relative h-full w-full", className)}>
      {!ready ? <ArmillaryFallback className="absolute inset-0" /> : null}
      <Suspense fallback={null}>
        <ArmillarySphereCanvas
          className="absolute inset-0 h-full w-full"
          interactive={false}
          autoCamera={false}
          hover={false}
          quality="high"
          coreColor={PRATIQUES_CORE_COLOR}
          glow={LAB_ARMILLARY_GLOW}
          ringTargets={PRATIQUES_RING_EULERS}
          sphereTarget={PRATIQUES_SPHERE_OFFSET}
          spin={DEFAULT_SPIN}
          initialAzimuth={PRATIQUES_CAM.az}
          initialPolar={PRATIQUES_CAM.pol}
          initialDistance={PRATIQUES_CAM.dist}
          initialTarget={PRATIQUES_INITIAL_TARGET}
          adaptFraming={false}
          onError={() => setWebglFailed(true)}
          onReady={() => setReady(true)}
        />
      </Suspense>
    </div>
  );
}
