import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { useHoldProgress } from "@/features/intro/useHoldProgress";
import { toast } from "sonner";
import { GpgpuCurlDofScene } from "./scenes/GpgpuCurlDofScene";
import {
  FLOW_GPGPU_DEV_DEFAULT,
  FlowGpgpuPlaygroundPanel,
  type FlowGpgpuDevState,
} from "./FlowGpgpuPlaygroundPanel";

export default function GpgpuCurlDofDevPage() {
  const { locale } = useLanguage();
  const fr = locale === "fr";
  const [t, setT] = useState<FlowGpgpuDevState>(FLOW_GPGPU_DEV_DEFAULT);
  const patch = (partial: Partial<FlowGpgpuDevState>) => setT((prev) => ({ ...prev, ...partial }));

  const holdAnim = t.holdAnimEnabled === true;
  const hold = useHoldProgress({
    enabled: holdAnim,
    duration: t.holdDurationSec,
    onComplete: () => {},
  });

  const copyJson = async (keyframes: object) => {
    const payload = {
      scene: "intro-v2-flow",
      holdDurationSec: t.holdDurationSec,
      holdAnimEnabled: t.holdAnimEnabled === true,
      live: {
        focus: t.focus,
        aperture: t.aperture,
        simSize: t.simSize,
        speed: t.speed,
      },
      keyframes,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success(fr ? "Réglages copiés (JSON)" : "Settings copied (JSON)");
    } catch {
      toast.error(fr ? "Copie impossible" : "Could not copy");
    }
  };

  return (
    <div className="relative min-h-svh bg-[#0a0d12]">
      <div className="fixed left-0 top-0 z-50 flex max-h-svh flex-col">
        <div className="flex items-center gap-2 border-b border-border/60 bg-background/95 p-3 backdrop-blur-md">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dev" aria-label={fr ? "Retour DevLab" : "Back to DevLab"}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{fr ? "Flux GPGPU" : "GPGPU flow"}</p>
            <p className="text-xs text-muted-foreground">
              {fr ? "Clic long → netteté" : "Hold → sharpness"}
            </p>
          </div>
        </div>
        <FlowGpgpuPlaygroundPanel
          fr={fr}
          state={t}
          onChange={patch}
          onReset={() => setT(FLOW_GPGPU_DEV_DEFAULT)}
          onCopyJson={(keyframes) => void copyJson(keyframes)}
        />
      </div>
      <div className="min-h-svh w-full">
        <GpgpuCurlDofScene
          className="absolute inset-0"
          hold={hold}
          phase={holdAnim ? "interact" : "entry"}
          devKnobs={t}
        />
      </div>
    </div>
  );
}
