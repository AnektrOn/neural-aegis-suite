import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FLOW_GPGPU_DEV_DEFAULT,
  FLOW_HOLD_KEYFRAMES,
  snapshotFlowKeyframe,
  type FlowGpgpuDevState,
  type FlowKeyframe,
  type FlowKeyframeId,
} from "./flowGpgpuHoldMorph";

export { FLOW_GPGPU_DEV_DEFAULT, type FlowGpgpuDevState } from "./flowGpgpuHoldMorph";

const KEYFRAME_IDS: FlowKeyframeId[] = [0, 1, 2, 3];

function SliderRow({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs tabular-nums text-muted-foreground">{value.toFixed(2)}</span>
      </div>
      {hint ? <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p> : null}
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

type Props = {
  fr: boolean;
  state: FlowGpgpuDevState;
  onChange: (partial: Partial<FlowGpgpuDevState>) => void;
  onReset: () => void;
  onCopyJson: (keyframes: Partial<Record<FlowKeyframeId, FlowKeyframe>>) => void;
  showHoldDuration?: boolean;
  className?: string;
};

export function FlowGpgpuPlaygroundPanel({
  fr,
  state: t,
  onChange,
  onReset,
  onCopyJson,
  showHoldDuration = true,
  className,
}: Props) {
  const particleCount = t.simSize * t.simSize;
  const [keyframes, setKeyframes] = useState<Partial<Record<FlowKeyframeId, FlowKeyframe>>>({
    0: FLOW_HOLD_KEYFRAMES[0],
    1: FLOW_HOLD_KEYFRAMES[1],
    2: FLOW_HOLD_KEYFRAMES[2],
    3: FLOW_HOLD_KEYFRAMES[3],
  });

  const capture = (id: FlowKeyframeId) => {
    setKeyframes((prev) => ({ ...prev, [id]: snapshotFlowKeyframe(t) }));
  };

  const load = (id: FlowKeyframeId) => {
    const shot = keyframes[id];
    if (!shot) return;
    onChange(shot);
  };

  return (
    <div
      data-intro-hold-ignore
      className={
        className ??
        "flex max-h-svh w-full max-w-sm flex-col gap-3 overflow-y-auto border-r border-border/60 bg-background/95 p-4 backdrop-blur-md sm:w-[20rem]"
      }
    >
      <div className="flex items-start gap-2">
        <Checkbox
          id="flow-hold-anim"
          checked={t.holdAnimEnabled === true}
          onCheckedChange={(v) => onChange({ holdAnimEnabled: v === true })}
        />
        <div className="space-y-1">
          <Label htmlFor="flow-hold-anim" className="text-xs font-normal leading-snug">
            {fr ? "Animation clic long" : "Hold animation"}
          </Label>
          <p className="text-[11px] text-muted-foreground leading-snug">
            {fr
              ? "Désactivé : les curseurs s’appliquent tout de suite. Activé : le clic long joue 0 → 1 → 2 → 3."
              : "Off: sliders apply live. On: hold plays states 0 → 1 → 2 → 3."}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onReset}>
          {fr ? "Réinitialiser" : "Reset"}
        </Button>
        <Button variant="secondary" size="sm" className="flex-1 gap-1.5" onClick={() => onCopyJson(keyframes)}>
          <Copy className="h-3.5 w-3.5" />
          JSON
        </Button>
      </div>
      <SliderRow
        label="focus"
        hint={fr ? "Le plus net vers ~5 : plan de netteté ≈ distance caméra → particules." : "Sharpest around ~5: focus plane ≈ camera-to-particles distance."}
        value={t.focus}
        min={2}
        max={14}
        step={0.1}
        onChange={(v) => onChange({ focus: v })}
      />
      <SliderRow
        label="aperture"
        hint={fr ? "Plus haut = moins de flou DOF" : "Higher = less DOF blur"}
        value={t.aperture}
        min={0.8}
        max={5}
        step={0.05}
        onChange={(v) => onChange({ aperture: v })}
      />
      <SliderRow
        label={fr ? "Particules" : "Particles"}
        hint={`${particleCount.toLocaleString()} pts`}
        value={t.simSize}
        min={128}
        max={512}
        step={128}
        onChange={(v) => onChange({ simSize: v })}
      />
      <SliderRow
        label={fr ? "Vitesse" : "Speed"}
        value={t.speed}
        min={15}
        max={200}
        step={1}
        onChange={(v) => onChange({ speed: v })}
      />
      {showHoldDuration ? (
        <SliderRow
          label={fr ? "Durée clic long (s)" : "Hold duration (s)"}
          value={t.holdDurationSec}
          min={0.8}
          max={10}
          step={0.1}
          onChange={(v) => onChange({ holdDurationSec: v })}
        />
      ) : null}

      <div className="space-y-2 border-t border-border/50 pt-3">
        <p className="text-xs font-medium">{fr ? "États 0 → 3" : "States 0 → 3"}</p>
        <p className="text-[11px] leading-snug text-muted-foreground">
          {fr
            ? "Règle le look, puis clique 0 / 1 / 2 / 3 pour figer. « Load » recharge un état. Copie le JSON pour l’anim."
            : "Dial the look, then click 0 / 1 / 2 / 3 to freeze. Load recalls a state. Copy JSON for the anim."}
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {KEYFRAME_IDS.map((id) => {
            const shot = keyframes[id];
            return (
              <div key={id} className="space-y-1">
                <Button
                  type="button"
                  size="sm"
                  variant={shot ? "secondary" : "outline"}
                  className="w-full"
                  onClick={() => capture(id)}
                >
                  {id}
                </Button>
                {shot ? (
                  <button
                    type="button"
                    className="w-full text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    onClick={() => load(id)}
                  >
                    load
                  </button>
                ) : (
                  <span className="block text-center text-[10px] text-muted-foreground/50">—</span>
                )}
              </div>
            );
          })}
        </div>
        {KEYFRAME_IDS.map((id) => {
          const shot = keyframes[id];
          if (!shot) return null;
          return (
            <p key={`sum-${id}`} className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {id}: f {shot.focus.toFixed(1)} · a {shot.aperture.toFixed(2)} · n {shot.simSize} · v {shot.speed.toFixed(0)}
            </p>
          );
        })}
      </div>
    </div>
  );
}
