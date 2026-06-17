import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { UsersRound, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";

interface Props {
  config: { instructions?: string; fields?: string[]; accent_color?: string };
  title: string;
  hideTitle?: boolean;
  onComplete?: () => void;
  onAbandon?: () => void;
}

const COLORS = ["hsl(176 70% 48%)", "hsl(220 70% 60%)", "hsl(270 50% 60%)"];

export default function EmpathyPerspectiveWidget({
  config,
  title,
  hideTitle,
  onComplete,
  onAbandon,
}: Props) {
  const { t } = useLanguage();
  const labels = config.fields?.length
    ? config.fields
    : [t("toolbox.widgetFallback.me"), t("toolbox.widgetFallback.other"), t("toolbox.widgetFallback.bridge")];
  const [values, setValues] = useState<Record<number, string>>({ 0: "", 1: "", 2: "" });
  const touchedRef = useRef(false);
  const completedRef = useRef(false);

  useWidgetAbandonGuard(touchedRef, completedRef, onAbandon);

  return (
    <motion.div
      className="flex flex-col space-y-4 py-4 max-w-2xl mx-auto w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {!hideTitle && (
        <div className="flex items-center gap-2 text-neural-label justify-center">
          <UsersRound size={14} className="text-neural-accent" />
          <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
        </div>
      )}
      {config.instructions ? (
        <p className="text-xs text-center text-muted-foreground">{config.instructions}</p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {labels.slice(0, 3).map((label, i) => {
          const color = COLORS[i] ?? COLORS[0];
          return (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border p-3 space-y-2 min-h-[140px] flex flex-col"
              style={{
                borderColor: `color-mix(in srgb, ${color} 35%, transparent)`,
                background: `color-mix(in srgb, ${color} 6%, transparent)`,
              }}
            >
              <p
                className="text-[10px] uppercase tracking-[0.2em] font-medium"
                style={{ color }}
              >
                {label}
              </p>
              <textarea
                value={values[i] ?? ""}
                onChange={(e) => {
                  touchedRef.current = true;
                  setValues((prev) => ({ ...prev, [i]: e.target.value }));
                }}
                rows={4}
                className="flex-1 w-full text-sm bg-background/50 rounded-lg border border-border/30 px-3 py-2 resize-none"
                placeholder={t("toolbox.empathy.placeholder", { column: label })}
              />
            </motion.div>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!Object.values(values).every((v) => v.trim())}
        onClick={() => {
          completedRef.current = true;
          onComplete?.();
        }}
        className="inline-flex items-center justify-center gap-2 mx-auto text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded border border-primary/30 text-primary disabled:opacity-40"
      >
        <CheckCircle2 size={12} />
        {t("toolbox.markDone")}
      </button>
    </motion.div>
  );
}
