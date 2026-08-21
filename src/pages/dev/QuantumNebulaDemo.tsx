import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Pause, Play, Upload } from "lucide-react";
import GenerativeArtSceneV3, {
  QUANTUM_NEBULA_STATE_LABELS,
  QUANTUM_NEBULA_STATES,
  defaultAudioTuning,
  defaultReflexionTuning,
  defaultVisualTuning,
  type QuantumNebulaAudioTuning,
  type QuantumNebulaReflexionTuning,
  type QuantumNebulaState,
  type QuantumNebulaVisualTuning,
} from "@/components/ui/quantum-nebula";
import { QuantumNebulaReflexionSettingsModal } from "@/components/ui/QuantumNebulaReflexionSettingsModal";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const tuningSliders: Array<{
  key: keyof Omit<QuantumNebulaAudioTuning, "pulsePattern">;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "boomStrength", label: "Boom strength", min: 0, max: 4, step: 0.05 },
  { key: "boomForce", label: "Boom force", min: 0, max: 0.02, step: 0.0002 },
  { key: "beatThreshold", label: "Beat threshold", min: 0, max: 0.35, step: 0.005 },
  { key: "beatAttack", label: "Beat attack", min: 0, max: 10, step: 0.1 },
  { key: "beatHold", label: "Beat hold", min: 0, max: 4, step: 0.05 },
  { key: "boomDecay", label: "Boom decay", min: 0.5, max: 0.99, step: 0.005 },
  { key: "volumeGate", label: "Pause volume gate", min: 0, max: 0.18, step: 0.002 },
  { key: "pauseMotionScale", label: "Pause motion scale", min: 0, max: 1, step: 0.01 },
  { key: "silenceThreshold", label: "Silence threshold", min: 0, max: 0.12, step: 0.002 },
  { key: "midWaveForce", label: "Mid wave force", min: 0, max: 0.008, step: 0.0001 },
  { key: "trebleJitter", label: "Treble jitter", min: 0, max: 0.006, step: 0.0001 },
  { key: "audioSizeBoost", label: "Point size boost", min: 0, max: 2, step: 0.02 },
  { key: "boomWaveFrequency", label: "Wave frequency", min: 0.5, max: 10, step: 0.1 },
  { key: "boomWaveSpeed", label: "Wave speed", min: 0.2, max: 14, step: 0.1 },
  { key: "ambientBoomStrength", label: "No-audio fallback", min: 0, max: 3, step: 0.05 },
  { key: "spiralTwist", label: "Spiral twist", min: 0, max: 2.5, step: 0.05 },
  { key: "rippleSharpness", label: "Ripple sharpness", min: 0.5, max: 6, step: 0.05 },
  { key: "bloomBoost", label: "Bloom boost", min: 0, max: 1.5, step: 0.02 },
  { key: "metatronReveal", label: "Metatron reveal", min: 0, max: 1, step: 0.01 },
  { key: "metatronPull", label: "Metatron pull", min: 0, max: 0.2, step: 0.001 },
  {
    key: "reflexionAudioScale",
    label: "Mouvement on réflexion",
    min: 0,
    max: 1,
    step: 0.01,
  },
];

export default function QuantumNebulaDemo() {
  const [state, setState] = useState<QuantumNebulaState>("solid");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLabel, setAudioLabel] = useState<string | null>(null);
  const [audioPaused, setAudioPaused] = useState(false);
  const [audioTuning, setAudioTuning] =
    useState<QuantumNebulaAudioTuning>(defaultAudioTuning);
  const [visualTuning, setVisualTuning] =
    useState<QuantumNebulaVisualTuning>(defaultVisualTuning);
  const [reflexionTuning, setReflexionTuning] =
    useState<QuantumNebulaReflexionTuning>(defaultReflexionTuning);

  const stateDescription = useMemo(
    () => QUANTUM_NEBULA_STATE_LABELS[state].description.fr,
    [state],
  );

  useEffect(() => {
    return () => {
      if (audioUrl?.startsWith("blob:")) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const handleAudioFile = (file: File | undefined) => {
    if (!file) return;
    if (audioUrl?.startsWith("blob:")) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
    setAudioLabel(file.name);
    setAudioPaused(false);
    setState("mouvement");
  };

  const updateTuning = <K extends keyof QuantumNebulaAudioTuning>(
    key: K,
    value: QuantumNebulaAudioTuning[K],
  ) => {
    setAudioTuning((current) => ({ ...current, [key]: value }));
  };

  const updateReflexion = <K extends keyof QuantumNebulaReflexionTuning>(
    key: K,
    value: QuantumNebulaReflexionTuning[K],
  ) => {
    setReflexionTuning((current) => ({ ...current, [key]: value }));
  };

  const updateVisual = <K extends keyof QuantumNebulaVisualTuning>(
    key: K,
    value: QuantumNebulaVisualTuning[K],
  ) => {
    setVisualTuning((current) => ({ ...current, [key]: value }));
  };

  return (
    <GenerativeArtSceneV3
      fullscreen
      cloudHeightRatio={0.4}
      theme="auto"
      state={state}
      audioSrc={state === "mouvement" ? audioUrl : null}
      autoPlayAudio
      audioPaused={audioPaused}
      showAudioSpectrum={state === "mouvement"}
      audioTuning={audioTuning}
      visualTuning={visualTuning}
      reflexionTuning={reflexionTuning}
    >
      <header className="border-b border-border/30 bg-background/70 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/" aria-label="Retour">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Dev preview
            </p>
            <h1 className="text-base font-semibold tracking-tight">Quantum Nebula</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {state === "reflexion" ? (
              <QuantumNebulaReflexionSettingsModal
                tuning={reflexionTuning}
                pupilRadius={visualTuning.pupilRadius}
                onChange={updateReflexion}
                onPupilRadiusChange={(value) => updateVisual("pupilRadius", value)}
                onReset={() => {
                  setReflexionTuning(defaultReflexionTuning);
                  setVisualTuning((current) => ({
                    ...current,
                    pupilRadius: defaultVisualTuning.pupilRadius,
                  }));
                }}
              />
            ) : null}
            <div className="rounded-xl border border-border/20 bg-secondary/10 p-1">
              <ThemeToggle collapsed={false} />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-4 pb-10 pt-6">
        <div className="flex flex-wrap justify-center gap-2">
          {QUANTUM_NEBULA_STATES.map((s) => (
            <Button
              key={s}
              type="button"
              size="sm"
              variant={state === s ? "default" : "outline"}
              className={cn(
                "border-border/40 bg-background/80 text-xs backdrop-blur-sm",
                state === s && "bg-primary text-primary-foreground",
              )}
              onClick={() => setState(s)}
            >
              {QUANTUM_NEBULA_STATE_LABELS[s].fr}
            </Button>
          ))}
        </div>

        <p className="max-w-md text-center text-sm text-muted-foreground">{stateDescription}</p>

        {state === "mouvement" ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border/30 bg-background/80 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm transition-colors hover:bg-secondary/20">
              <Upload className="h-4 w-4" />
              {audioLabel ?? "Choisir un fichier audio"}
              <input
                type="file"
                accept="audio/*"
                className="sr-only"
                onChange={(e) => handleAudioFile(e.target.files?.[0])}
              />
            </label>
            {audioUrl ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2 border-border/30 bg-background/80 text-sm text-muted-foreground backdrop-blur-sm"
                onClick={() => setAudioPaused((paused) => !paused)}
              >
                {audioPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {audioPaused ? "Reprendre" : "Pause"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {state === "mouvement" ? (
        <aside className="fixed right-4 top-20 z-30 max-h-[calc(100vh-7rem)] w-[min(360px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border/30 bg-background/85 p-4 text-xs shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Audio tuning
              </p>
              <h2 className="text-sm font-semibold text-foreground">Réglages live</h2>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-[11px]"
              onClick={() => setAudioTuning(defaultAudioTuning)}
            >
              Reset
            </Button>
          </div>

          <label className="mb-4 block">
            <span className="mb-1 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
              <span>Taille de la pupille</span>
              <span className="font-mono text-foreground/80">
                {visualTuning.pupilRadius.toFixed(3)}
              </span>
            </span>
            <input
              type="range"
              min={0.02}
              max={0.8}
              step={0.01}
              value={visualTuning.pupilRadius}
              className="w-full accent-primary"
              onChange={(event) => updateVisual("pupilRadius", Number(event.target.value))}
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1 block text-[11px] font-medium text-muted-foreground">
              Pattern de pulsation
            </span>
            <select
              className="h-9 w-full rounded-lg border border-border/40 bg-background/80 px-2 text-xs text-foreground outline-none"
              value={audioTuning.pulsePattern}
              onChange={(event) =>
                updateTuning(
                  "pulsePattern",
                  event.target.value as QuantumNebulaAudioTuning["pulsePattern"],
                )
              }
            >
              <option value="organic">Organic boom</option>
              <option value="spiral">Spiral burst</option>
              <option value="ripple">Ripple wave</option>
            </select>
          </label>

          <div className="space-y-3">
            {tuningSliders.map(({ key, label, min, max, step }) => {
              const value = audioTuning[key];
              return (
                <label key={key} className="block">
                  <span className="mb-1 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                    <span>{label}</span>
                    <span className="font-mono text-foreground/80">
                      {typeof value === "number" ? value.toFixed(step < 0.01 ? 4 : 2) : value}
                    </span>
                  </span>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={typeof value === "number" ? value : 0}
                    className="w-full accent-primary"
                    onChange={(event) => updateTuning(key, Number(event.target.value))}
                  />
                </label>
              );
            })}
          </div>
        </aside>
      ) : null}
    </GenerativeArtSceneV3>
  );
}
