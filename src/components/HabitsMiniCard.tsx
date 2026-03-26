import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowUpRight } from "lucide-react";
import { NeuralCard } from "@/components/ui/neural-card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Habit {
  id: string;
  name: string;
}

interface HabitsMiniCardProps {
  userId: string;
}

export default function HabitsMiniCard({ userId }: HabitsMiniCardProps) {
  const { toast } = useToast();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      try {
        const { data: assigned } = await supabase
          .from("assigned_habits" as any)
          .select("id, habit_template_id")
          .eq("user_id", userId)
          .eq("is_active", true);
        if (!assigned || assigned.length === 0) return;

        const templateIds = (assigned as any[]).map((a) => a.habit_template_id);
        const { data: templates } = await supabase
          .from("habit_templates" as any)
          .select("id, name")
          .in("id", templateIds);

        const tplMap = new Map((templates as any[] || []).map((t) => [t.id, t]));
        setHabits(
          (assigned as any[]).map((a) => ({
            id: a.id,
            name: tplMap.get(a.habit_template_id)?.name ?? "Habitude",
          }))
        );

        const { data: completions } = await supabase
          .from("habit_completions" as any)
          .select("assigned_habit_id")
          .eq("user_id", userId)
          .eq("completed_date", today);
        setCompletedIds(new Set((completions as any[] || []).map((c) => c.assigned_habit_id)));
      } catch {
        // silent fail
      }
    };
    load();
  }, [userId]);

  const toggle = async (habitId: string) => {
    const wasDone = completedIds.has(habitId);
    // Optimistic update
    setCompletedIds((prev) => {
      const s = new Set(prev);
      if (wasDone) s.delete(habitId);
      else s.add(habitId);
      return s;
    });
    if (wasDone) {
      const { error } = await supabase
        .from("habit_completions" as any)
        .delete()
        .eq("user_id", userId)
        .eq("assigned_habit_id", habitId)
        .eq("completed_date", today);
      if (error) {
        setCompletedIds((prev) => { const s = new Set(prev); s.add(habitId); return s; });
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      }
    } else {
      const { error } = await supabase
        .from("habit_completions" as any)
        .insert({ user_id: userId, assigned_habit_id: habitId, completed_date: today } as any);
      if (error) {
        setCompletedIds((prev) => { const s = new Set(prev); s.delete(habitId); return s; });
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
      }
    }
  };

  if (habits.length === 0) return null;

  const doneCount = completedIds.size;
  const progress = habits.length > 0 ? (doneCount / habits.length) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, duration: 0.25 }}>
      <NeuralCard glow="none" className="space-y-2.5 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 rounded-full bg-accent-primary shrink-0" />
            <p className="font-display text-[10px] tracking-[0.15em] uppercase text-text-tertiary">Habitudes du jour</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-text-tertiary tabular-nums font-display">{doneCount}/{habits.length}</span>
            <Link to="/habits" className="text-accent-primary/50 hover:text-accent-primary transition-colors" aria-label="Voir les habitudes">
              <ArrowUpRight size={11} strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        <div className="space-y-0">
          {habits.map((h) => {
            const done = completedIds.has(h.id);
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => toggle(h.id)}
                className="flex items-center gap-3 py-2.5 border-b border-border-subtle/40 group w-full text-left active:scale-[0.99] transition-transform"
              >
                <div
                  className={`w-4 h-4 rounded border transition-all flex items-center justify-center shrink-0 ${
                    done ? "bg-accent-positive border-accent-positive" : "border-border-active group-hover:border-accent-primary/50"
                  }`}
                >
                  {done && <Check size={10} className="text-bg-base" strokeWidth={3} />}
                </div>
                <span className={`text-xs truncate ${done ? "text-text-tertiary line-through" : "text-text-primary"}`}>{h.name}</span>
              </button>
            );
          })}
        </div>

        <div className="pt-1">
          <div className="h-0.5 bg-border-subtle/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-primary/50 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </NeuralCard>
    </motion.div>
  );
}
