import { useState, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MoonStar } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";
import {
  useSaveToolboxWritingToJournal,
  type ToolboxJournalMeta,
} from "@/features/journal/useSaveToolboxWritingToJournal";
import {
  formatLabeledJournalContent,
  moodScoreFromGauge,
} from "@/features/journal/saveToolboxWritingToJournal";
import {
  ToolboxWidgetCard,
  ToolboxWidgetField,
  ToolboxWidgetHeader,
  ToolboxWidgetInput,
  ToolboxWidgetInstructions,
  ToolboxWidgetPrimaryButton,
  ToolboxWidgetRoot,
  phaseColorMix,
  resolveToolboxAccent,
} from "@/features/toolbox/ui";

interface Props {
  config: { instructions?: string; fields?: string[]; accent_color?: string };
  title: string;
  hideTitle?: boolean;
  journal?: ToolboxJournalMeta;
  onComplete?: () => void;
  onAbandon?: () => void;
}

export default function ShadowCheckinWidget({
  config,
  title,
  hideTitle,
  journal,
  onComplete,
  onAbandon,
}: Props) {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();
  const { saveWriting, saving } = useSaveToolboxWritingToJournal(journal);
  const accent = resolveToolboxAccent(config.accent_color, 1);
  const labels = config.fields?.length
    ? config.fields
    : [t("toolbox.widgetFallback.shadow"), t("toolbox.widgetFallback.intensity"), t("toolbox.widgetFallback.trigger")];
  const [shadow, setShadow] = useState("");
  const [intensity, setIntensity] = useState(5);
  const [trigger, setTrigger] = useState("");
  const touchedRef = useRef(false);
  const completedRef = useRef(false);

  useWidgetAbandonGuard(touchedRef, completedRef, onAbandon);

  return (
    <ToolboxWidgetRoot>
      {!hideTitle ? (
        <ToolboxWidgetHeader title={title} icon={MoonStar} iconClassName="text-neural-accent" />
      ) : null}
      <ToolboxWidgetInstructions>{config.instructions}</ToolboxWidgetInstructions>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <ToolboxWidgetCard
          className="space-y-4 p-6"
          style={{
            borderColor: phaseColorMix(accent, 35),
            background: `radial-gradient(ellipse at 50% 0%, ${phaseColorMix(accent, 15)}, transparent 70%)`,
            boxShadow: reduceMotion ? undefined : `0 0 24px ${phaseColorMix(accent, 20)}`,
          }}
        >
          <ToolboxWidgetField label={labels[0]}>
            <ToolboxWidgetInput
              type="text"
              value={shadow}
              onChange={(e) => {
                touchedRef.current = true;
                setShadow(e.target.value);
              }}
            />
          </ToolboxWidgetField>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{labels[1] ?? "Intensité"}</span>
              <span className="font-cinzel text-lg tabular-nums" style={{ color: accent }}>
                {intensity}/10
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={intensity}
              onChange={(e) => {
                touchedRef.current = true;
                setIntensity(Number(e.target.value));
              }}
              className="w-full"
              style={{ accentColor: accent }}
            />
            <div className="flex justify-between text-[9px] text-muted-foreground uppercase tracking-wider">
              <span>0</span>
              <span>10</span>
            </div>
          </div>

          <ToolboxWidgetField label={labels[2]}>
            <ToolboxWidgetInput
              type="text"
              value={trigger}
              onChange={(e) => {
                touchedRef.current = true;
                setTrigger(e.target.value);
              }}
            />
          </ToolboxWidgetField>
        </ToolboxWidgetCard>
      </motion.div>

      <ToolboxWidgetPrimaryButton
        disabled={!shadow.trim() || !trigger.trim() || saving}
        onClick={async () => {
          if (saving) return;
          const content = formatLabeledJournalContent([
            { label: labels[0] ?? "Ombre", body: shadow },
            { label: labels[1] ?? "Intensité", body: `${intensity}/10` },
            { label: labels[2] ?? "Déclencheur", body: trigger },
          ]);
          const ok = await saveWriting(content, { moodScore: moodScoreFromGauge(intensity) });
          if (!ok) return;
          completedRef.current = true;
          onComplete?.();
        }}
      >
        {t("toolbox.markDone")}
      </ToolboxWidgetPrimaryButton>
    </ToolboxWidgetRoot>
  );
}
