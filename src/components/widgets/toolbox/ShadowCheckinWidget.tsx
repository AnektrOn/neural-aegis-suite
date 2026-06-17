import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { MoonStar, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useWidgetAbandonGuard } from "@/hooks/useWidgetAbandonGuard";

interface Props {
  config: { instructions?: string; fields?: string[]; accent_color?: string };
  title: string;
  hideTitle?: boolean;
  onComplete?: () => void;
  onAbandon?: () => void;
}

export default function ShadowCheckinWidget({
  config,
  title,
  hideTitle,
  onComplete,
  onAbandon,
}: Props) {
  const { t } = useLanguage();
  const accent = config.accent_color || "hsl(270 40% 45%)";
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
    <motion.div
      className="flex flex-col items-center space-y-6 py-4 max-w-md mx-auto w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {!hideTitle && (
        <div className="flex items-center gap-2 text-neural-label">
          <MoonStar size={14} style={{ color: accent }} />
          <span className="text-xs uppercase tracking-[0.3em]">{title}</span>
        </div>
      )}
      {config.instructions ? (
        <p className="text-xs text-center text-muted-foreground px-2">{config.instructions}</p>
      ) : null}

      <motion.div
        className="relative w-full space-y-4 rounded-2xl border p-5"
        style={{
          borderColor: `color-mix(in srgb, ${accent} 35%, transparent)`,
          background: `radial-gradient(ellipse at 50% 0%, color-mix(in srgb, ${accent} 15%, transparent), transparent 70%)`,
        }}
        animate={{ boxShadow: [`0 0 20px color-mix(in srgb, ${accent} 20%, transparent)`, `0 0 40px color-mix(in srgb, ${accent} 35%, transparent)`, `0 0 20px color-mix(in srgb, ${accent} 20%, transparent)`] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <label className="block space-y-1.5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{labels[0]}</span>
          <input
            type="text"
            value={shadow}
            onChange={(e) => {
              touchedRef.current = true;
              setShadow(e.target.value);
            }}
            className="w-full rounded-xl border border-border/30 bg-background/50 px-4 py-2.5 text-sm"
          />
        </label>

        <div className="space-y-3">
          <motion.div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{labels[1] ?? "Intensité"}</span>
            <motion.span
              key={intensity}
              className="font-cinzel text-lg tabular-nums"
              style={{ color: accent }}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {intensity}/10
            </motion.span>
          </motion.div>
          <input
            type="range"
            min={0}
            max={10}
            value={intensity}
            onChange={(e) => {
              touchedRef.current = true;
              setIntensity(Number(e.target.value));
            }}
            className="w-full accent-[var(--primary)]"
            style={{ accentColor: accent }}
          />
          <div className="flex justify-between text-[9px] text-muted-foreground uppercase tracking-wider">
            <span>0</span>
            <span>10</span>
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{labels[2]}</span>
          <input
            type="text"
            value={trigger}
            onChange={(e) => {
              touchedRef.current = true;
              setTrigger(e.target.value);
            }}
            className="w-full rounded-xl border border-border/30 bg-background/50 px-4 py-2.5 text-sm"
          />
        </label>
      </motion.div>

      <button
        type="button"
        disabled={!shadow.trim() || !trigger.trim()}
        onClick={() => {
          completedRef.current = true;
          onComplete?.();
        }}
        className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] px-4 py-2 rounded border border-primary/30 text-primary disabled:opacity-40"
      >
        <CheckCircle2 size={12} />
        {t("toolbox.markDone")}
      </button>
    </motion.div>
  );
}
