import { useMemo } from "react";
import { DienChanWireframeFace } from "@/pages/dev/DienChanWireframeFace";
import { buildPointPlaybackSequence } from "@/pages/dev/dienChanPointPlayback";
import { pointsCoordinates } from "@/pages/dev/dienChanBqcCoordinates";
import { DIEN_CHAN_PROTOCOLS } from "@/pages/dev/dienChan/dienChanProtocols";

type Props = {
  protocolName: string | null;
};

export function PracticesHubLabDienChanFace({ protocolName }: Props) {
  const protocol = useMemo(() => {
    if (protocolName) {
      const match = DIEN_CHAN_PROTOCOLS.find((p) => p.name === protocolName);
      if (match) return match;
    }
    return DIEN_CHAN_PROTOCOLS[0] ?? null;
  }, [protocolName]);

  const { activePoints, spotlightPointId } = useMemo(() => {
    if (!protocol) return { activePoints: [] as number[], spotlightPointId: null as number | null };
    const sequence = buildPointPlaybackSequence(protocol.points).filter((id) => id !== 0);
    return {
      activePoints: sequence,
      spotlightPointId: sequence[0] ?? null,
    };
  }, [protocol]);

  if (!protocol) return null;

  return (
    <div className="practices-hub-lab__dien-host">
      <DienChanWireframeFace
        embed
        className="practices-hub-lab__dien-3d-layer"
        activePoints={activePoints}
        pointsCoordinates={pointsCoordinates}
        spotlightPointId={spotlightPointId}
        reducedMotion
      />
    </div>
  );
}
