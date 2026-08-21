import { useState } from "react";
import { HelpCircle, RotateCcw, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { QuantumNebulaReflexionTuning } from "@/components/ui/quantum-nebula";

interface SliderField {
  key: keyof QuantumNebulaReflexionTuning;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
}

const ringSliders: SliderField[] = [
  {
    key: "ringInnerWidth",
    label: "Anneau 1 — largeur",
    description: "Anneau fin collé à la pupille. Contrôle l’épaisseur de la première coque.",
    min: 0.004,
    max: 0.08,
    step: 0.001,
  },
  {
    key: "ringDensityInner",
    label: "Anneau 1 — densité",
    description: "Part de particules sur l’anneau collé à la pupille.",
    min: 0.01,
    max: 1,
    step: 0.01,
  },
  {
    key: "ringMidWidth",
    label: "Anneau 2 — largeur",
    description: "Anneau très fin un peu plus loin de la pupille.",
    min: 0.002,
    max: 0.05,
    step: 0.001,
  },
  {
    key: "ringMidPosition",
    label: "Anneau 2 — distance",
    description: "Position relative entre pupille et bord (0 = près pupille, 1 = bord).",
    min: 0.12,
    max: 0.7,
    step: 0.01,
  },
  {
    key: "ringDensityMid",
    label: "Anneau 2 — densité",
    description: "Part de particules sur le second anneau.",
    min: 0.01,
    max: 1,
    step: 0.01,
  },
  {
    key: "ringOuterThinWidth",
    label: "Anneau 3 — largeur",
    description: "Anneau fin externe, juste avant le bord.",
    min: 0.004,
    max: 0.08,
    step: 0.001,
  },
  {
    key: "ringDensityOuterThin",
    label: "Anneau 3 — densité",
    description: "Part de particules sur l’anneau fin externe.",
    min: 0.01,
    max: 1,
    step: 0.01,
  },
  {
    key: "ringOuterGap",
    label: "Écart anneaux externes",
    description: "Espace entre l’anneau fin externe et l’anneau épais du bord.",
    min: 0.01,
    max: 0.15,
    step: 0.001,
  },
  {
    key: "ringOuterThickWidth",
    label: "Anneau 4 — largeur",
    description: "Anneau épais tout au bord de la sphère.",
    min: 0.02,
    max: 0.2,
    step: 0.002,
  },
  {
    key: "ringDensityOuterThick",
    label: "Anneau 4 — densité",
    description: "Part de particules sur l’anneau épais externe.",
    min: 0.01,
    max: 1,
    step: 0.01,
  },
];

const reflexionSliders: SliderField[] = [
  {
    key: "pulseSpeed",
    label: "Vitesse de pulse",
    description:
      "Tempo d’ondulation le long des dendrites. Plus élevé = activité de pensée plus rapide ; plus bas = rythme méditatif.",
    min: 0.2,
    max: 5,
    step: 0.05,
  },
  {
    key: "waveAmplitude",
    label: "Amplitude des branches",
    description:
      "Amplitude du mouvement des extrémités du neurone. 0 = structure figée ; élevé = dendrites qui respirent clairement.",
    min: 0,
    max: 0.2,
    step: 0.005,
  },
  {
    key: "stateMixRate",
    label: "Vitesse de morphing",
    description:
      "Rapidité de la transition du nuage vers le neurone (et retour). Plus élevé = bascule plus courte, sans rebond.",
    min: 0.01,
    max: 0.35,
    step: 0.01,
  },
  {
    key: "glowBoost",
    label: "Boost de glow",
    description:
      "Surcroît de luminosité sur les zones denses (soma / branches épaisses) pendant le pulse de pensée.",
    min: 0,
    max: 0.8,
    step: 0.02,
  },
  {
    key: "sizePulse",
    label: "Pulse de taille",
    description:
      "Variation de taille des points le long du pulse. Donne un scintillement organique aux filaments.",
    min: 0,
    max: 0.35,
    step: 0.01,
  },
  {
    key: "rotationSpeed",
    label: "Rotation lente",
    description:
      "Vitesse de rotation continue du neurone sur lui-même. Très faible pour un mouvement presque imperceptible.",
    min: 0,
    max: 0.002,
    step: 0.00005,
  },
  {
    key: "cameraZoom",
    label: "Zoom caméra",
    description:
      "Rapprochement de la caméra en état Réflexion. Plus élevé = neurone plus grand dans le cadre.",
    min: 0,
    max: 1.5,
    step: 0.05,
  },
];

function HelpLabel({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="truncate text-[11px] font-medium text-muted-foreground">{label}</span>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex shrink-0 rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Aide : ${label}`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="left"
          className="max-w-[260px] border-border/50 bg-popover px-3 py-2 text-xs leading-relaxed text-popover-foreground"
        >
          {description}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function formatValue(value: number, step: number) {
  if (step >= 1) return String(Math.round(value));
  if (step < 0.001) return value.toFixed(5);
  if (step < 0.01) return value.toFixed(4);
  if (step < 0.1) return value.toFixed(3);
  return value.toFixed(2);
}

export interface QuantumNebulaReflexionSettingsModalProps {
  tuning: QuantumNebulaReflexionTuning;
  pupilRadius: number;
  onChange: <K extends keyof QuantumNebulaReflexionTuning>(
    key: K,
    value: QuantumNebulaReflexionTuning[K],
  ) => void;
  onPupilRadiusChange: (value: number) => void;
  onReset: () => void;
  className?: string;
}

export function QuantumNebulaReflexionSettingsModal({
  tuning,
  pupilRadius,
  onChange,
  onPupilRadiusChange,
  onReset,
  className,
}: QuantumNebulaReflexionSettingsModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={200}>
      <>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(
            "gap-2 border-border/40 bg-background/80 text-xs backdrop-blur-sm",
            className,
          )}
          onClick={() => setOpen((current) => !current)}
        >
          <Settings2 className="h-4 w-4" />
          Réglages réflexion
        </Button>

        {open ? (
          <aside className="fixed left-4 top-20 z-30 h-[min(78vh,620px)] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border/30 bg-background/90 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3 border-b border-border/40 px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Reflection state
                </p>
                <h2 className="text-base font-semibold text-foreground">Réglages du neurone</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Panneau non bloquant — le neurone reste visible pendant que tu ajustes.
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1.5 px-2 text-[11px]"
                  onClick={onReset}
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[calc(100%-5.5rem)] px-5">
              <div className="space-y-3 py-4 pb-8">
                <label className="block space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <HelpLabel
                      label="Taille de la pupille"
                      description="Cœur noir absolu au centre, présent dans tous les états. Les particules ne peuvent pas y entrer."
                    />
                    <span className="shrink-0 font-mono text-[11px] text-foreground/80">
                      {pupilRadius.toFixed(3)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.02}
                    max={0.8}
                    step={0.01}
                    value={pupilRadius}
                    className="w-full accent-primary"
                    onChange={(event) => onPupilRadiusChange(Number(event.target.value))}
                  />
                </label>

                <div className="border-t border-border/30 pt-3">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Densité — 4 anneaux
                  </p>
                  {ringSliders.map((field) => (
                    <label key={field.key} className="mb-3 block space-y-1.5 last:mb-0">
                      <div className="flex items-center justify-between gap-3">
                        <HelpLabel label={field.label} description={field.description} />
                        <span className="shrink-0 font-mono text-[11px] text-foreground/80">
                          {formatValue(tuning[field.key], field.step)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={tuning[field.key]}
                        className="w-full accent-primary"
                        onChange={(event) => onChange(field.key, Number(event.target.value))}
                      />
                    </label>
                  ))}
                </div>

                <div className="border-t border-border/30 pt-3">
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Temporaire — à remplacer
                  </p>
                  {reflexionSliders.map((field) => (
                    <label key={field.key} className="mb-3 block space-y-1.5 last:mb-0">
                      <div className="flex items-center justify-between gap-3">
                        <HelpLabel label={field.label} description={field.description} />
                        <span className="shrink-0 font-mono text-[11px] text-foreground/80">
                          {formatValue(tuning[field.key], field.step)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        value={tuning[field.key]}
                        className="w-full accent-primary"
                        onChange={(event) => onChange(field.key, Number(event.target.value))}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </aside>
        ) : null}
      </>
    </TooltipProvider>
  );
}
