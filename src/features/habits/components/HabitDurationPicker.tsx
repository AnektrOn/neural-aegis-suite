import { Clock } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  buildDurationPresetMinutes,
  formatDurationPresetLabel,
  type ToolboxDurationOptions,
} from "@/lib/toolbox-widget-duration";
import { cn } from "@/lib/utils";

interface Props {
  options: ToolboxDurationOptions;
  valueMinutes: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
  /** compact = modal-friendly, fewer chips, no long hint */
  variant?: "default" | "compact";
}

export default function HabitDurationPicker({
  options,
  valueMinutes,
  onChange,
  disabled,
  variant = "default",
}: Props) {
  const { t, locale } = useLanguage();
  const loc = locale === "en" ? "en" : "fr";
  const presets = buildDurationPresetMinutes(options);
  const compact = variant === "compact";

  return (
    <div
      className={cn(
        "rounded-xl border border-border/30 bg-secondary/10 space-y-2",
        compact ? "p-2.5" : "p-3",
      )}
    >
      <div className="flex items-center gap-2 text-neural-label">
        <Clock size={compact ? 11 : 12} className="text-primary/70" />
        <span className="text-[9px] uppercase tracking-[0.22em]">{t("habits.durationPickerTitle")}</span>
      </div>
      {!compact && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {options.perStepMode && options.guideStepCount
            ? t("habits.durationPickerHintPerStep", {
                n: options.guideStepCount,
                default: options.defaultMinutes,
              })
            : t("habits.durationPickerHint", { default: options.defaultMinutes })}
        </p>
      )}
      <div className="flex flex-wrap gap-1">
        {presets.map((minutes) => {
          const selected = valueMinutes === minutes;
          const isDefault = minutes === options.defaultMinutes;
          return (
            <button
              key={minutes}
              type="button"
              disabled={disabled}
              onClick={() => onChange(minutes)}
              className={cn(
                "rounded-md border transition-colors",
                compact ? "min-h-[28px] px-2 py-0.5 text-[9px] tracking-[0.12em]" : "min-h-[32px] px-2.5 py-1 text-[10px] tracking-[0.14em]",
                "uppercase",
                selected
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : "border-border/30 text-muted-foreground hover:border-primary/25 hover:text-foreground",
              )}
            >
              {formatDurationPresetLabel(minutes, options, loc)}
              {isDefault ? " *" : ""}
            </button>
          );
        })}
      </div>
      {valueMinutes !== options.defaultMinutes ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(options.defaultMinutes)}
          className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground hover:text-primary transition-colors"
        >
          {t("habits.durationResetDefault")}
        </button>
      ) : null}
    </div>
  );
}
