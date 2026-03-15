import { useState } from "react";
import { Drawer } from "vaul";
import { Brain, Flame, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const frequencyLabels = [
  "Épuisé", "Bas", "Agité", "Neutre", "Équilibré",
  "Focalisé", "Élevé", "Flow", "Optimal", "Transcendant",
];

interface QuickLogModalProps {
  open: boolean;
  onClose: () => void;
}

export default function QuickLogModal({ open, onClose }: QuickLogModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mood, setMood] = useState(7.0);
  const [stress, setStress] = useState(3.0);
  const [sleep, setSleep] = useState(7.5);
  const [loading, setLoading] = useState(false);

  const moodIdx = Math.min(Math.max(Math.round(mood) - 1, 0), 9);
  const moodLabel = frequencyLabels[moodIdx];
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

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
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Enregistré", description: moodLabel });
        onClose();
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40" />
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-card border-t border-primary/10 px-5 focus:outline-none"
          style={{ paddingBottom: "calc(2rem + var(--safe-bottom))" }}
        >
          {/* Handle */}
          <div className="w-8 h-1 bg-border/40 rounded-full mx-auto mt-3 mb-6" />

          {/* Header */}
          <div className="mb-6">
            <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/50 mb-0.5">
              État neural
            </p>
            <p className="text-base font-light text-foreground capitalize">{today}</p>
          </div>

          {/* Sliders */}
          <div className="space-y-6">
            {/* Humeur */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Brain size={13} strokeWidth={1.5} style={{ color: "hsl(var(--primary))" }} />
                  <span className="text-[10px] tracking-widest uppercase text-muted-foreground/70">Humeur</span>
                </div>
                <span className="text-sm font-light tabular-nums" style={{ color: "hsl(var(--primary))" }}>
                  {mood.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={mood}
                onChange={(e) => setMood(parseFloat(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer slider-mood"
                style={{
                  background: `linear-gradient(to right, hsl(var(--primary)) ${(mood - 1) / 9 * 100}%, hsl(var(--border)) ${(mood - 1) / 9 * 100}%)`,
                }}
              />
              <p
                className="text-[9px] mt-1.5 transition-all"
                style={{ color: "hsl(var(--primary) / 0.5)" }}
              >
                {moodLabel}
              </p>
            </div>

            {/* Stress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Flame size={13} strokeWidth={1.5} className="text-red-400" />
                  <span className="text-[10px] tracking-widest uppercase text-muted-foreground/70">Stress</span>
                </div>
                <span className="text-sm font-light tabular-nums text-red-400">{stress.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={stress}
                onChange={(e) => setStress(parseFloat(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer slider-stress"
                style={{
                  background: `linear-gradient(to right, hsl(var(--destructive)) ${stress / 10 * 100}%, hsl(var(--border)) ${stress / 10 * 100}%)`,
                }}
              />
            </div>

            {/* Sommeil */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Moon size={13} strokeWidth={1.5} className="text-blue-400" />
                  <span className="text-[10px] tracking-widest uppercase text-muted-foreground/70">Sommeil</span>
                </div>
                <span className="text-sm font-light tabular-nums text-blue-400">{sleep.toFixed(1)}h</span>
              </div>
              <input
                type="range"
                min={0}
                max={12}
                step={0.5}
                value={sleep}
                onChange={(e) => setSleep(parseFloat(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer slider-sleep"
                style={{
                  background: `linear-gradient(to right, hsl(220 70% 60%) ${sleep / 12 * 100}%, hsl(var(--border)) ${sleep / 12 * 100}%)`,
                }}
              />
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-neural w-full mt-8 disabled:opacity-50 active:scale-[0.98]"
            style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
          >
            {loading ? "Enregistrement..." : "ENREGISTRER"}
          </button>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
