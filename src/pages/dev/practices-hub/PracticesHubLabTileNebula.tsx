import { lazy, memo, Suspense, useMemo } from "react";
import type { PracticesHubTileId } from "@/features/practices-hub/practicesHubTiles";
import {
  getPracticesHubLabTileNebulaPreset,
  PRACTICES_HUB_LAB_NEBULA_PALETTE,
} from "./practicesHubLabTileNebulaPresets";

const QuantumNebula = lazy(() => import("@/components/ui/quantum-nebula"));

type PracticesHubLabTileNebulaProps = {
  tileId: PracticesHubTileId;
};

function PracticesHubLabTileNebulaInner({ tileId }: PracticesHubLabTileNebulaProps) {
  const preset = useMemo(() => getPracticesHubLabTileNebulaPreset(tileId), [tileId]);

  return (
    <QuantumNebula
      fullscreen={false}
      cloudHeightRatio={0.55}
      theme="dark"
      transparent
      state={preset.state}
      figure={preset.figure}
      audioSrc={null}
      autoPlayAudio={false}
      visualTuning={preset.visualTuning}
      audioTuning={preset.audioTuning}
      particlePalette={PRACTICES_HUB_LAB_NEBULA_PALETTE}
      className="absolute inset-0 h-full w-full"
    />
  );
}

/** Welcome-style quantum nebula, one preset per practice tile. */
export const PracticesHubLabTileNebula = memo(function PracticesHubLabTileNebula({
  tileId,
}: PracticesHubLabTileNebulaProps) {
  return (
    <Suspense fallback={null}>
      <PracticesHubLabTileNebulaInner tileId={tileId} />
    </Suspense>
  );
});
