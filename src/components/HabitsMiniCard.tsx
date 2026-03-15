import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ListChecks, ArrowUpRight } from "lucide-react";
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24 }}
      className="ethereal-glass p-3 space-y-2.5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks size={13} strokeWidth={1.5} className="text-primary" />
          <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/60">Habitudes du jour</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground/40 tabular-nums">{doneCount}/{habits.length}</span>
          <Link to="/habits" className="text-primary/30 hover:text-primary transition-colors" aria-label="Voir les habitudes">
            <ArrowUpRight size={11} />
          </Link>
        </div>
      </div>

      {/* Habit list */}
      <div className="space-y-1.5">
        {habits.map((h) => {
          const done = completedIds.has(h.id);
          return (
            <button
              key={h.id}
              onClick={() => toggle(h.id)}
              className="flex items-center gap-2 w-full text-left active:scale-[0.99] transition-transform"
            >
              <div
                className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                  done ? "bg-primary/20 border-primary/40" : "border-border/40"
                }`}
              >
                {done && <Check size={9} className="text-primary" />}
              </div>
              <span
                className={`text-[11px] truncate leading-tight transition-colors ${
                  done ? "line-through text-muted-foreground/30" : "text-foreground/70"
                }`}
              >
                {h.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-secondary/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary/40 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}
