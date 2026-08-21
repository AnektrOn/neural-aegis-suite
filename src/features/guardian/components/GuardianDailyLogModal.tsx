import { Brain, Flame, Moon } from "lucide-react";
import RadialSlider from "@/components/RadialSlider";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import {
  GuardianOverlayFrame,
  type GuardianOverlayPlacement,
} from "./GuardianOverlayFrame";

const frequencyKeys: TranslationKey[] = [
  "mood.exhausted",
  "mood.low",
  "mood.agitated",
  "mood.neutral",
  "mood.balanced",
  "mood.focused",
  "mood.high",
  "mood.flow",
  "mood.optimal",
  "mood.transcendent",
];

interface Props {
  open: boolean;
  placement: GuardianOverlayPlacement;
}

/** Read-only daily log preview shown while Guardian explains (no actions). */
export function GuardianDailyLogModal({ open, placement }: Props) {
  const { t, locale } = useLanguage();
  const mood = 7;
  const stress = 3;
  const sleep = 7.5;
  const moodLabel = t(frequencyKeys[Math.min(Math.max(Math.round(mood) - 1, 0), 9)]);
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";
  const today = new Date().toLocaleDateString(dateLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <GuardianOverlayFrame open={open} title={t("guardian.daily.title")} placement={placement}>
      <div className="pointer-events-none mx-auto flex w-full max-w-[390px] flex-col px-4 py-3 select-none">
        <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">
          {t("quickLog.neuralState")}
        </p>
        <p className="mb-4 text-sm font-light capitalize text-foreground/80">{today}</p>
        <div className="ethereal-glass mb-3 flex flex-col items-center p-4">
          <div className="mb-2 flex items-center gap-2">
            <Brain size={13} strokeWidth={1.5} className="text-primary" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {t("mood.label")}
            </span>
          </div>
          <RadialSlider
            value={mood}
            onChange={() => undefined}
            min={1}
            max={10}
            step={0.5}
            size={placement === "mobile" ? 110 : 130}
            color="hsl(var(--primary))"
          />
          <p className="mt-1 text-[10px] text-primary/70">{moodLabel}</p>
        </div>
        <div className="mb-2 grid grid-cols-2 gap-3">
          <div className="ethereal-glass flex flex-col items-center p-3">
            <div className="mb-2 flex items-center gap-2">
              <Flame size={12} className="text-red-400" />
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                {t("mood.stress")}
              </span>
            </div>
            <RadialSlider
              value={stress}
              onChange={() => undefined}
              min={0}
              max={10}
              step={0.5}
              size={90}
              color="hsl(var(--destructive))"
            />
          </div>
          <div className="ethereal-glass flex flex-col items-center p-3">
            <div className="mb-2 flex items-center gap-2">
              <Moon size={12} className="text-blue-400" />
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                {t("mood.sleep")}
              </span>
            </div>
            <RadialSlider
              value={sleep}
              onChange={() => undefined}
              min={0}
              max={12}
              step={0.5}
              size={90}
              color="hsl(220 70% 60%)"
              formatValue={(v) => `${v.toFixed(1)}h`}
            />
          </div>
        </div>
      </div>
    </GuardianOverlayFrame>
  );
}
