import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Table2, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";

interface Props {
  config: { instructions?: string; fields?: string[]; accent_color?: string };
  title: string;
  hideTitle?: boolean;
  onComplete?: () => void;
  onAbandon?: () => void;
}

export default function DecisionMatrixWidget({
  config,
  title,
  hideTitle,
  onComplete,
  onAbandon,
}: Props) {
  const { t } = useLanguage();
  const accent = config.accent_color || "hsl(35 80% 58%)";
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
    <div className="flex flex-col space-y-4 py-4 max-w-lg mx-auto w-full">
      {!hideTitle && (
        <div className="flex items-center gap-2 text-neural-label justify-center">
          <Table2 size={14} style={{ color: accent }} />
          <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
        </div>
      )}
      {config.instructions ? (
        <p className="text-xs text-center text-muted-foreground">{config.instructions}</p>
      ) : null}

      <motion.div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: `color-mix(in srgb, ${accent} 30%, transparent)` }}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div
          className="grid grid-cols-3 text-[9px] uppercase tracking-[0.15em] font-medium"
          style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)` }}
        >
          <motion.div className="p-3 border-r border-border/20" />
          {options.map((opt) => (
            <motion.div
              key={opt}
              className="p-3 text-center border-r border-border/20 last:border-r-0"
              style={{ color: accent }}
            >
              {opt}
            </motion.div>
          ))}
        </motion.div>
        <motion.div className="grid grid-cols-3 border-t border-border/20">
          <motion.div
            className="p-3 text-[10px] font-medium border-r border-border/20 flex items-center"
            style={{ color: accent }}
          >
            {criterion}
          </motion.div>
          {options.map((opt) => {
            const key = `${opt}::${criterion}`;
            return (
              <motion.div key={key} className="p-2 border-r border-border/20 last:border-r-0">
                <input
                  type="text"
                  value={scores[key] ?? ""}
                  onChange={(e) => {
                    touchedRef.current = true;
                    setScores((prev) => ({ ...prev, [key]: e.target.value }));
                  }}
                  placeholder="1–10"
                  className="w-full text-center text-sm bg-background/40 rounded-lg py-2 border border-border/30"
                />
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>

      <button
        type="button"
        disabled={!cells.every((k) => scores[k]?.trim())}
        onClick={() => {
          completedRef.current = true;
          onComplete?.();
        }}
        className="inline-flex items-center justify-center gap-2 mx-auto text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded border border-primary/30 text-primary disabled:opacity-40"
      >
        <CheckCircle2 size={12} />
        {t("toolbox.markDone")}
      </button>
    </div>
  );
}
