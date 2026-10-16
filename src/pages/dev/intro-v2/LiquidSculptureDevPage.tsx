import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Copy } from "lucide-react";
import SculptureHero, {
  type SculptureColorGrade,
  type SculptureHeroProps,
} from "@/components/ui/liquid-sculpture-hero";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/i18n/LanguageContext";
import { useHoldProgress } from "@/features/intro/useHoldProgress";
import { INTRO_V2_SCULPTURE_SRC } from "./introV2SculptureAsset";
import { toast } from "sonner";

const STAGE_BLACK = "#000000";

type Tunables = Pick<
  SculptureHeroProps,
  | "strength"
  | "radius"
  | "particleDensity"
  | "dotSize"
  | "particleSpread"
  | "turbulence"
  | "liquid"
  | "returnSpeed"
  | "holdUnifyExponent"
  | "ambientIntensity"
  | "speed"
  | "vortexIntensity"
  | "intro"
  | "ambient"
  | "streaks"
  | "interactive"
  | "stabilizeOnHold"
  | "sculptureScale"
  | "mobileSculptureScale"
  | "sculptureX"
  | "sculptureY"
  | "colorGrade"
  | "colorGradeStrength"
>;

const COLOR_GRADES: SculptureColorGrade[] = ["none", "log", "cinematic", "aegis"];

type DevLabState = Tunables & {
  holdDurationSec: number;
};

const DEFAULT_TUNABLES: DevLabState = {
  strength: 0.65,
  radius: 240,
  particleDensity: 0.95,
  dotSize: 0.85,
  particleSpread: 1.45,
  turbulence: 1.2,
  liquid: 1.15,
  returnSpeed: 1.55,
  holdUnifyExponent: 2.35,
  ambientIntensity: 0.45,
  speed: 1.05,
  vortexIntensity: 1.25,
  intro: false,
  ambient: true,
  streaks: false,
  interactive: true,
  stabilizeOnHold: true,
  sculptureScale: 0.88,
  mobileSculptureScale: 0.82,
  sculptureX: 0,
  sculptureY: 0,
  holdDurationSec: 3.2,
  colorGrade: "aegis",
  colorGradeStrength: 0.82,
};

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
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <Label className="leading-snug">{label}</Label>
        <span className="shrink-0 tabular-nums text-muted-foreground">{value.toFixed(2)}</span>
      </div>
      {hint ? <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p> : null}
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

export default function LiquidSculptureDevPage() {
  const { locale } = useLanguage();
  const fr = locale === "fr";
  const [t, setT] = useState<DevLabState>(DEFAULT_TUNABLES);
  const patch = (partial: Partial<DevLabState>) => setT((prev) => ({ ...prev, ...partial }));

  const hold = useHoldProgress({
    enabled: true,
    duration: t.holdDurationSec,
    onComplete: () => {},
  });
  const getHoldOrder = useCallback(() => {
    const s = hold.current;
    return s.holding ? s.progress : 0;
  }, [hold]);

  const heroProps = useMemo(() => {
    const { holdDurationSec: _d, ...tunables } = t;
    return tunables;
  }, [t]);

  const exportPayload = useMemo(
    () => ({
      scene: "intro-v2-sculpture",
      holdDurationSec: t.holdDurationSec,
      sculptureHero: {
        ...heroProps,
        layoutMode: "stage",
        restStyle: "particles",
        stabilizeOnHold: true,
        intro: false,
      },
    }),
    [heroProps, t.holdDurationSec]
  );

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2));
      toast.success(fr ? "Réglages copiés (JSON)" : "Settings copied (JSON)");
    } catch {
      toast.error(fr ? "Copie impossible" : "Could not copy");
    }
  };

  return (
    <div className="relative min-h-svh bg-black">
      <div className="fixed left-0 top-0 z-50 flex max-h-svh w-full max-w-sm flex-col gap-2 overflow-y-auto border-r border-border/60 bg-background/95 p-4 backdrop-blur-md sm:w-[22rem]">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dev" aria-label={fr ? "Retour DevLab" : "Back to DevLab"}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{fr ? "Sculpture liquide" : "Liquid sculpture"}</p>
            <p className="text-xs text-muted-foreground">
              {fr ? "Scène 2 — maintenez le clic pour stabiliser" : "Scene 2 — hold click to stabilize"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setT(DEFAULT_TUNABLES)}>
            {fr ? "Réinitialiser" : "Reset"}
          </Button>
          <Button variant="secondary" size="sm" className="flex-1 gap-1.5" onClick={() => void copyJson()}>
            <Copy className="h-3.5 w-3.5" />
            {fr ? "Copier JSON" : "Copy JSON"}
          </Button>
        </div>

        <Accordion type="multiple" defaultValue={["vortex", "hold", "particles"]} className="w-full">
          <AccordionItem value="interaction">
            <AccordionTrigger className="text-sm py-2">
              {fr ? "Interaction" : "Interaction"}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-3">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="sh-stabilize-hold">{fr ? "Stabiliser au maintien" : "Stabilize on hold"}</Label>
                <Switch
                  id="sh-stabilize-hold"
                  checked={t.stabilizeOnHold ?? true}
                  onCheckedChange={(v) => patch({ stabilizeOnHold: v })}
                />
              </div>
              <SliderRow
                label={fr ? "Durée du clic long (s)" : "Hold duration (s)"}
                hint={fr ? "Temps pour atteindre 100 % de stabilisation" : "Time to reach full stabilization"}
                value={t.holdDurationSec}
                min={0.8}
                max={16}
                step={0.1}
                onChange={(v) => patch({ holdDurationSec: v })}
              />
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="sh-interactive">{fr ? "Suivi pointeur" : "Pointer tracking"}</Label>
                <Switch
                  id="sh-interactive"
                  checked={t.interactive ?? true}
                  onCheckedChange={(v) => patch({ interactive: v })}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="vortex">
            <AccordionTrigger className="text-sm py-2">{fr ? "Vortex & chaos" : "Vortex & chaos"}</AccordionTrigger>
            <AccordionContent className="space-y-4 pb-3">
              <SliderRow
                label={fr ? "Intensité vortex (spirale)" : "Vortex intensity (spiral)"}
                value={t.vortexIntensity ?? 1.2}
                min={0}
                max={2.5}
                step={0.05}
                onChange={(v) => patch({ vortexIntensity: v })}
              />
              <SliderRow
                label={fr ? "Vitesse simulation" : "Simulation speed"}
                hint={fr ? "Vitesse globale des particules / du fluide" : "Global particle / fluid speed"}
                value={t.speed ?? 1}
                min={0.25}
                max={3}
                step={0.05}
                onChange={(v) => patch({ speed: v })}
              />
              <SliderRow
                label={fr ? "Turbulence" : "Turbulence"}
                value={t.turbulence ?? 1}
                min={0}
                max={2}
                step={0.05}
                onChange={(v) => patch({ turbulence: v })}
              />
              <SliderRow
                label={fr ? "Force de perturbation" : "Disturbance strength"}
                value={t.strength ?? 1}
                min={0}
                max={2}
                step={0.05}
                onChange={(v) => patch({ strength: v })}
              />
              <SliderRow
                label={fr ? "Dispersion particules" : "Particle spread"}
                value={t.particleSpread ?? 1}
                min={0}
                max={2}
                step={0.05}
                onChange={(v) => patch({ particleSpread: v })}
              />
              <SliderRow
                label={fr ? "Flux liquide (global)" : "Liquid flow (global)"}
                value={t.liquid ?? 1}
                min={0}
                max={2}
                step={0.05}
                onChange={(v) => patch({ liquid: v })}
              />
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="sh-ambient">{fr ? "Mouvement ambiant" : "Ambient motion"}</Label>
                <Switch id="sh-ambient" checked={t.ambient ?? false} onCheckedChange={(v) => patch({ ambient: v })} />
              </div>
              <SliderRow
                label={fr ? "Intensité ambiante" : "Ambient intensity"}
                value={t.ambientIntensity ?? 1}
                min={0}
                max={2}
                step={0.05}
                onChange={(v) => patch({ ambientIntensity: v })}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="hold">
            <AccordionTrigger className="text-sm py-2">
              {fr ? "Stabilisation (maintien)" : "Stabilization (hold)"}
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-3">
              <SliderRow
                label={fr ? "Vitesse d’unification" : "Unification speed"}
                hint={
                  fr
                    ? "Plus bas = rassemblement plus lent (0 = très lent)"
                    : "Lower = slower particle pull-in (0 = very slow)"
                }
                value={t.returnSpeed ?? 1}
                min={0}
                max={8}
                step={0.05}
                onChange={(v) => patch({ returnSpeed: v })}
              />
              <SliderRow
                label={fr ? "Courbe d’unification" : "Unification curve"}
                hint={
                  fr
                    ? "Plus élevé = le vortex dure plus longtemps avant le rassemblement"
                    : "Higher = vortex lasts longer before particles unify"
                }
                value={t.holdUnifyExponent ?? 2.35}
                min={1}
                max={7}
                step={0.1}
                onChange={(v) => patch({ holdUnifyExponent: v })}
              />
              <SliderRow
                label={fr ? "Rayon d’influence" : "Influence radius"}
                hint={fr ? "Zone autour du curseur (réf. 1440 px)" : "Area around cursor (1440px ref)"}
                value={t.radius ?? 220}
                min={40}
                max={500}
                step={5}
                onChange={(v) => patch({ radius: v })}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="particles">
            <AccordionTrigger className="text-sm py-2">{fr ? "Particules" : "Particles"}</AccordionTrigger>
            <AccordionContent className="space-y-4 pb-3">
              <SliderRow
                label={fr ? "Densité" : "Density"}
                value={t.particleDensity ?? 1}
                min={0.15}
                max={2}
                step={0.05}
                onChange={(v) => patch({ particleDensity: v })}
              />
              <SliderRow
                label={fr ? "Taille des points" : "Dot size"}
                value={t.dotSize ?? 1}
                min={0.2}
                max={2.5}
                step={0.05}
                onChange={(v) => patch({ dotSize: v })}
              />
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="sh-streaks">{fr ? "Traînées (vélocité)" : "Streaks (velocity)"}</Label>
                <Switch id="sh-streaks" checked={t.streaks ?? false} onCheckedChange={(v) => patch({ streaks: v })} />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="layout">
            <AccordionTrigger className="text-sm py-2">{fr ? "Cadrage" : "Framing"}</AccordionTrigger>
            <AccordionContent className="space-y-4 pb-3">
              <SliderRow
                label={fr ? "Échelle desktop" : "Desktop scale"}
                value={t.sculptureScale ?? 1}
                min={0.3}
                max={1.5}
                step={0.02}
                onChange={(v) => patch({ sculptureScale: v })}
              />
              <SliderRow
                label={fr ? "Échelle mobile" : "Mobile scale"}
                value={t.mobileSculptureScale ?? 1}
                min={0.3}
                max={1.5}
                step={0.02}
                onChange={(v) => patch({ mobileSculptureScale: v })}
              />
              <SliderRow
                label={fr ? "Offset X (%)" : "Offset X (%)"}
                value={t.sculptureX ?? 0}
                min={-25}
                max={25}
                step={1}
                onChange={(v) => patch({ sculptureX: v })}
              />
              <SliderRow
                label={fr ? "Offset Y (%)" : "Offset Y (%)"}
                value={t.sculptureY ?? 0}
                min={-25}
                max={25}
                step={1}
                onChange={(v) => patch({ sculptureY: v })}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="advanced">
            <AccordionTrigger className="text-sm py-2">{fr ? "Avancé" : "Advanced"}</AccordionTrigger>
            <AccordionContent className="space-y-4 pb-3">
              <div className="space-y-2">
                <Label htmlFor="sh-lut">{fr ? "Filtre couleur (LUT)" : "Color grade (LUT)"}</Label>
                <select
                  id="sh-lut"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={t.colorGrade ?? "none"}
                  onChange={(e) => patch({ colorGrade: e.target.value as SculptureColorGrade })}
                >
                  {COLOR_GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g === "none"
                        ? fr
                          ? "Aucun"
                          : "None"
                        : g === "log"
                          ? fr
                            ? "LOG → affichage"
                            : "LOG → display"
                          : g === "cinematic"
                            ? fr
                              ? "Ciné (chaud/froid)"
                              : "Cinematic"
                            : fr
                              ? "AEGIS cristal"
                              : "AEGIS crystal"}
                    </option>
                  ))}
                </select>
              </div>
              <SliderRow
                label={fr ? "Intensité LUT" : "LUT strength"}
                value={t.colorGradeStrength ?? 0}
                min={0}
                max={1}
                step={0.02}
                onChange={(v) => patch({ colorGradeStrength: v })}
              />
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="sh-intro">{fr ? "Intro assemblage (démo)" : "Intro assembly (demo)"}</Label>
                <Switch id="sh-intro" checked={t.intro ?? false} onCheckedChange={(v) => patch({ intro: v })} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <SculptureHero
        {...heroProps}
        getHoldOrder={t.stabilizeOnHold ? getHoldOrder : undefined}
        layoutMode="stage"
        restStyle="particles"
        showNav={false}
        showCredit={false}
        backdropText=""
        loadFonts={false}
        src={INTRO_V2_SCULPTURE_SRC}
        darkSrc={INTRO_V2_SCULPTURE_SRC}
        mobileSrc={INTRO_V2_SCULPTURE_SRC}
        mobileDarkSrc={INTRO_V2_SCULPTURE_SRC}
        darkBackground={STAGE_BLACK}
        background={STAGE_BLACK}
        theme="dark"
        height="100svh"
        className="min-h-svh"
      />
    </div>
  );
}
