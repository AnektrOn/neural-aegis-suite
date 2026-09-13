import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Table2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";
import {
  useSaveToolboxWritingToJournal,
  type ToolboxJournalMeta,
} from "@/features/journal/useSaveToolboxWritingToJournal";
import { formatLabeledJournalContent } from "@/features/journal/saveToolboxWritingToJournal";
import {
  ToolboxWidgetHeader,
  ToolboxWidgetInstructions,
  ToolboxWidgetPrimaryButton,
  ToolboxWidgetRoot,
  phaseColorMix,
  resolveToolboxAccent,
  toolboxWidgetInputClass,
} from "@/features/toolbox/ui";
import { cn } from "@/lib/utils";

interface Props {
  config: { instructions?: string; fields?: string[]; accent_color?: string };
  title: string;
  hideTitle?: boolean;
  journal?: ToolboxJournalMeta;
  onComplete?: () => void;
  onAbandon?: () => void;
}

export default function DecisionMatrixWidget({
  config,
  title,
  hideTitle,
  journal,
  onComplete,
  onAbandon,
}: Props) {
  const { t } = useLanguage();
  const { saveWriting, saving } = useSaveToolboxWritingToJournal(journal);
  const accent = resolveToolboxAccent(config.accent_color, 0);
  const fields = config.fields?.length
    ? config.fields
    : [t("toolbox.widgetFallback.optionA"), t("toolbox.widgetFallback.optionB"), t("toolbox.widgetFallback.mainCriterion")];
  const options = fields.slice(0, 2);
  const criterion = fields[2] ?? t("toolbox.widgetFallback.criterion");
  const [scores, setScores] = useState<Record<string, string>>({});
  const touchedRef = useRef(false);
  const completedRef = useRef(false);

  useWidgetAbandonGuard(touchedRef, completedRef, onAbandon);

  const cells = options.flatMap((opt) => [`${opt}::${criterion}`]);

  return (
    <ToolboxWidgetRoot>
      {!hideTitle ? (
        <ToolboxWidgetHeader title={title} icon={Table2} iconClassName="text-neural-accent" />
      ) : null}
      <ToolboxWidgetInstructions>{config.instructions}</ToolboxWidgetInstructions>

      <motion.div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: phaseColorMix(accent, 30) }}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div
          className="grid grid-cols-3 text-[9px] uppercase tracking-[0.15em] font-medium"
          style={{ background: phaseColorMix(accent, 12) }}
        >
          <div className="p-3 border-r border-border/20" />
          {options.map((opt) => (
            <div
              key={opt}
              className="p-3 text-center border-r border-border/20 last:border-r-0"
              style={{ color: accent }}
            >
              {opt}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 border-t border-border/20">
          <div
            className="p-3 text-[10px] font-medium border-r border-border/20 flex items-center"
            style={{ color: accent }}
          >
            {criterion}
          </div>
          {options.map((opt) => {
            const key = `${opt}::${criterion}`;
            return (
              <div key={key} className="p-2 border-r border-border/20 last:border-r-0">
                <input
                  type="text"
                  value={scores[key] ?? ""}
                  onChange={(e) => {
                    touchedRef.current = true;
                    setScores((prev) => ({ ...prev, [key]: e.target.value }));
                  }}
                  placeholder="1–10"
                  className={cn(toolboxWidgetInputClass, "h-9 text-center")}
                />
              </div>
            );
          })}
        </div>
      </motion.div>

      <ToolboxWidgetPrimaryButton
        disabled={!cells.every((k) => scores[k]?.trim()) || saving}
        onClick={async () => {
          if (saving) return;
          const content = formatLabeledJournalContent(
            options.map((opt) => ({
              label: `${opt} × ${criterion}`,
              body: scores[`${opt}::${criterion}`] ?? "",
            })),
          );
          const ok = await saveWriting(content);
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
