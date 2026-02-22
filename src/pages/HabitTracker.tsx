import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Flame, ListChecks } from "lucide-react";

interface Habit {
  id: string;
  name: string;
  category: string;
  completed: boolean;
  isFocus: boolean;
}

const mockHabits: Habit[] = [
  { id: "1", name: "Morning Meditation (15 min)", category: "Mind", completed: false, isFocus: true },
  { id: "2", name: "Strategic Reading (30 min)", category: "Growth", completed: false, isFocus: true },
  { id: "3", name: "Cold Exposure", category: "Body", completed: true, isFocus: false },
  { id: "4", name: "Journaling", category: "Mind", completed: false, isFocus: true },
  { id: "5", name: "1-on-1 with Direct Report", category: "Leadership", completed: false, isFocus: false },
  { id: "6", name: "Physical Training", category: "Body", completed: true, isFocus: false },
  { id: "7", name: "Deep Work Block (2h)", category: "Performance", completed: false, isFocus: true },
];

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>(mockHabits);
  const completedCount = habits.filter((h) => h.completed).length;
  const focusCount = habits.filter((h) => h.isFocus).length;

  const toggleComplete = (id: string) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h)));
  };

  const toggleFocus = (id: string) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, isFocus: !h.isFocus } : h)));
  };

  return (
    <div className="space-y-10 max-w-4xl">
      <div>
        <p className="text-neural-label mb-3">Performance Architecture</p>
        <h1 className="text-neural-title text-3xl text-foreground">Habit Tracker</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-6">
          <ListChecks size={16} strokeWidth={1.5} className="text-primary mb-3" />
          <p className="text-2xl font-cinzel text-foreground">{completedCount}/{habits.length}</p>
          <p className="text-neural-label mt-1">Completed</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="ethereal-glass p-6">
          <Flame size={16} strokeWidth={1.5} className="text-neural-warm mb-3" />
          <p className="text-2xl font-cinzel text-foreground">{focusCount}</p>
          <p className="text-neural-label mt-1">Focus Items</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="ethereal-glass p-6">
          <p className="text-2xl font-cinzel text-primary">12</p>
          <p className="text-neural-label mt-1">Day Streak</p>
        </motion.div>
      </div>

      {/* Habit List */}
      <div className="space-y-3">
        {habits.map((habit, i) => (
          <motion.div
            key={habit.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            className={`ethereal-glass p-5 flex items-center gap-4 transition-all ${
              habit.completed ? "opacity-50" : ""
            }`}
          >
            {/* Completion toggle */}
            <button
              onClick={() => toggleComplete(habit.id)}
              className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-all duration-300 ${
                habit.completed
                  ? "bg-primary/20 border-primary/40"
                  : "border-border hover:border-primary/30"
              }`}
            >
              {habit.completed && <Check size={14} className="text-primary" />}
            </button>

            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium transition-colors ${habit.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {habit.name}
              </p>
              <p className="text-neural-label mt-0.5">{habit.category}</p>
            </div>

            {/* Focus toggle */}
            <button
              onClick={() => toggleFocus(habit.id)}
              className={`text-[9px] uppercase tracking-[0.3em] px-3 py-1.5 rounded-full border transition-all ${
                habit.isFocus
                  ? "text-neural-warm border-neural-warm/30 bg-neural-warm/5"
                  : "text-muted-foreground border-border hover:border-muted-foreground/30"
              }`}
            >
              {habit.isFocus ? "Focus" : "Set Focus"}
            </button>
          </motion.div>
        ))}
      </div>

      {focusCount < 3 && (
        <p className="text-sm text-destructive/70 italic">
          ⚡ Select at least 3 focus items to activate your daily protocol.
        </p>
      )}
    </div>
  );
}
