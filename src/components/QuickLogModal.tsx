import { useState } from "react";
import { Drawer } from "vaul";
import { Brain, Flame, Moon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import RadialSlider from "@/components/RadialSlider";
import type { TranslationKey } from "@/i18n/translations";

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

interface QuickLogModalProps {
  open: boolean;
  onClose: () => void;
}

export default function QuickLogModal({ open, onClose }: QuickLogModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const [mood, setMood] = useState(7.0);
  const [stress, setStress] = useState(3.0);
  const [sleep, setSleep] = useState(7.5);
  const [loading, setLoading] = useState(false);

  const moodIdx = Math.min(Math.max(Math.round(mood) - 1, 0), 9);
  const moodLabel = t(frequencyKeys[moodIdx]);
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";
  const today = new Date().toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" });

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("mood_entries" as any).insert({
        user_id: user.id,
        value: Math.round(mood),
        sleep,
        stress,
        meals_count: 0,
        meals: [],
      } as any);
      if (error) {
        toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
      } else {
        toast({ title: t("mood.saved"), description: moodLabel });
        onClose();
      }
    } catch {
      toast({ title: t("toast.error"), description: t("toast.unexpected"), variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card border-t border-primary/10 flex flex-col max-h-[90dvh] focus:outline-none"
        >
          {/* Sticky header with handle + close */}
          <div className="shrink-0 relative pt-3 pb-2 px-5">
            <div className="w-10 h-1 bg-border/50 rounded-full mx-auto" />
            <button
              type="button"
              onClick={onClose}
              aria-label={t("general.close") || "Fermer"}
              className="absolute right-3 top-2 w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all"
              style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          <div className="px-5 flex-1 overflow-y-auto min-h-0 overscroll-contain">
            {/* Title */}
            <div className="mb-5">
              <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/50 mb-0.5">
                {t("quickLog.neuralState")}
              </p>
              <p className="text-base font-light text-foreground capitalize">{today}</p>
            </div>

            {/* Radial sliders */}
            <div className="grid grid-cols-1 gap-6 pb-4">
              <div className="ethereal-glass p-4 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={13} strokeWidth={1.5} style={{ color: "hsl(var(--primary))" }} />
                  <span className="text-[10px] tracking-widest uppercase text-muted-foreground/70">{t("mood.label")}</span>
                </div>
                <RadialSlider
                  value={mood}
                  onChange={setMood}
                  min={1}
                  max={10}
                  step={0.5}
                  size={140}
                  color="hsl(var(--primary))"
                />
                <p className="text-[10px] mt-1 text-primary/60">{moodLabel}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="ethereal-glass p-3 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame size={12} strokeWidth={1.5} className="text-red-400" />
                    <span className="text-[9px] tracking-widest uppercase text-muted-foreground/70">{t("mood.stress")}</span>
                  </div>
                  <RadialSlider
                    value={stress}
                    onChange={setStress}
                    min={0}
                    max={10}
                    step={0.5}
                    size={108}
                    color="hsl(var(--destructive))"
                  />
                </div>

                <div className="ethereal-glass p-3 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2">
                    <Moon size={12} strokeWidth={1.5} className="text-blue-400" />
                    <span className="text-[9px] tracking-widest uppercase text-muted-foreground/70">{t("mood.sleep")}</span>
                  </div>
                  <RadialSlider
                    value={sleep}
                    onChange={setSleep}
                    min={0}
                    max={12}
                    step={0.5}
                    size={108}
                    color="hsl(220 70% 60%)"
                    formatValue={(v) => `${v.toFixed(1)}h`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CTA — sticky footer */}
          <div className="shrink-0 px-5 pt-3 pb-[calc(1rem+var(--safe-bottom))] border-t border-border/40 bg-card">
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-neural w-full disabled:opacity-50 active:scale-[0.98]"
              style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
            >
              {loading ? t("general.saving") : t("general.save")}
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
