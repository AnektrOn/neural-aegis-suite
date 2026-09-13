import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { UsersRound } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";
import {
  useSaveToolboxWritingToJournal,
  type ToolboxJournalMeta,
} from "@/features/journal/useSaveToolboxWritingToJournal";
import { formatLabeledJournalContent } from "@/features/journal/saveToolboxWritingToJournal";
import {
  TOOLBOX_ACCENT_SLOTS,
  ToolboxWidgetHeader,
  ToolboxWidgetInstructions,
  ToolboxWidgetPrimaryButton,
  ToolboxWidgetRoot,
  phaseColorMix,
  toolboxWidgetLabelClass,
  toolboxWidgetTextareaClass,
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

export default function EmpathyPerspectiveWidget({
  config,
  title,
  hideTitle,
  journal,
  onComplete,
  onAbandon,
}: Props) {
  const { t } = useLanguage();
  const { saveWriting, saving } = useSaveToolboxWritingToJournal(journal);
  const labels = config.fields?.length
    ? config.fields
    : [t("toolbox.widgetFallback.me"), t("toolbox.widgetFallback.other"), t("toolbox.widgetFallback.bridge")];
  const [values, setValues] = useState<Record<number, string>>({ 0: "", 1: "", 2: "" });
  const touchedRef = useRef(false);
  const completedRef = useRef(false);

  useWidgetAbandonGuard(touchedRef, completedRef, onAbandon);

  return (
    <ToolboxWidgetRoot className="max-w-lg">
      {!hideTitle ? (
        <ToolboxWidgetHeader title={title} icon={UsersRound} iconClassName="text-neural-accent" />
      ) : null}
      <ToolboxWidgetInstructions>{config.instructions}</ToolboxWidgetInstructions>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {labels.slice(0, 3).map((label, i) => {
          const color = TOOLBOX_ACCENT_SLOTS[i] ?? TOOLBOX_ACCENT_SLOTS[0];
          return (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border p-3 space-y-2 min-h-[140px] flex flex-col"
              style={{
                borderColor: phaseColorMix(color, 35),
                background: phaseColorMix(color, 6),
              }}
            >
              <p className={toolboxWidgetLabelClass} style={{ color }}>
                {label}
              </p>
              <textarea
                value={values[i] ?? ""}
                onChange={(e) => {
                  touchedRef.current = true;
                  setValues((prev) => ({ ...prev, [i]: e.target.value }));
                }}
                rows={4}
                className={cn(toolboxWidgetTextareaClass, "min-h-0 flex-1 resize-none")}
                placeholder={t("toolbox.empathy.placeholder", { column: label })}
              />
            </motion.div>
          );
        })}
      </div>

      <ToolboxWidgetPrimaryButton
        disabled={!Object.values(values).every((v) => v.trim()) || saving}
        onClick={async () => {
          if (saving) return;
          const content = formatLabeledJournalContent(
            labels.slice(0, 3).map((label, i) => ({ label, body: values[i] ?? "" })),
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
