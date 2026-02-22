import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Flame, ListChecks } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface AssignedHabit {
  id: string;
  habit_template_id: string;
  is_active: boolean;
  template_name: string;
  template_category: string;
}

export default function HabitTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [habits, setHabits] = useState<AssignedHabit[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const { data: assigned } = await supabase.from("assigned_habits" as any).select("id, habit_template_id, is_active").eq("user_id", user!.id).eq("is_active", true);
    if (!assigned || assigned.length === 0) { setHabits([]); setLoading(false); return; }

    const templateIds = (assigned as any[]).map((a) => a.habit_template_id);
    const { data: templates } = await supabase.from("habit_templates" as any).select("id, name, category").in("id", templateIds);
    const templateMap = new Map((templates as any[] || []).map((t) => [t.id, t]));

    const habitsData: AssignedHabit[] = (assigned as any[]).map((a) => {
      const t = templateMap.get(a.habit_template_id);
      return { id: a.id, habit_template_id: a.habit_template_id, is_active: a.is_active, template_name: t?.name || "Inconnu", template_category: t?.category || "Général" };
    });
    setHabits(habitsData);

    const { data: completions } = await supabase.from("habit_completions" as any).select("assigned_habit_id").eq("user_id", user!.id).eq("completed_date", today);
    setCompletedIds(new Set((completions as any[] || []).map((c) => c.assigned_habit_id)));
    setLoading(false);
  };

  const toggleComplete = async (habitId: string) => {
    if (!user) return;
    const isCompleted = completedIds.has(habitId);
    if (isCompleted) {
      await supabase.from("habit_completions" as any).delete().eq("user_id", user.id).eq("assigned_habit_id", habitId).eq("completed_date", today);
      setCompletedIds((prev) => { const s = new Set(prev); s.delete(habitId); return s; });
    } else {
      const { error } = await supabase.from("habit_completions" as any).insert({ user_id: user.id, assigned_habit_id: habitId, completed_date: today } as any);
      if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
      setCompletedIds((prev) => new Set(prev).add(habitId));
    }
  };

  const completedCount = completedIds.size;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-10 max-w-4xl">
      <div>
        <p className="text-neural-label mb-3">Architecture de Performance</p>
        <h1 className="text-neural-title text-3xl text-foreground">Suivi des Habitudes</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-6">
          <ListChecks size={16} strokeWidth={1.5} className="text-primary mb-3" />
          <p className="text-2xl font-cinzel text-foreground">{completedCount}/{habits.length}</p>
          <p className="text-neural-label mt-1">Complétées aujourd'hui</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="ethereal-glass p-6">
          <Flame size={16} strokeWidth={1.5} className="text-neural-warm mb-3" />
          <p className="text-2xl font-cinzel text-foreground">{habits.length}</p>
          <p className="text-neural-label mt-1">Habitudes assignées</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="ethereal-glass p-6">
          <p className="text-2xl font-cinzel text-primary">{habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0}%</p>
          <p className="text-neural-label mt-1">Score du jour</p>
        </motion.div>
      </div>

      {habits.length === 0 ? (
        <div className="ethereal-glass p-12 text-center">
          <ListChecks size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">Aucune habitude assignée. Votre coach vous assignera des habitudes depuis le panneau admin.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit, i) => {
            const completed = completedIds.has(habit.id);
            return (
              <motion.div key={habit.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                className={`ethereal-glass p-5 flex items-center gap-4 transition-all ${completed ? "opacity-50" : ""}`}>
                <button onClick={() => toggleComplete(habit.id)}
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-300 ${completed ? "bg-primary/20 border-primary/40" : "border-border hover:border-primary/30"}`}>
                  {completed && <Check size={14} className="text-primary" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium transition-colors ${completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{habit.template_name}</p>
                  <p className="text-neural-label mt-0.5">{habit.template_category}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
