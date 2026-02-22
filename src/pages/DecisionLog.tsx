import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Clock, ArrowUpRight, Plus, X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import RadialSlider from "@/components/RadialSlider";

interface Decision {
  id: string;
  name: string;
  priority: number;
  time_to_decide: string | null;
  responsibility: number;
  status: string;
  created_at: string;
}

const priorityColor = (p: number) => {
  if (p >= 5) return "text-primary";
  if (p >= 3) return "text-neural-warm";
  return "text-muted-foreground";
};

export default function DecisionLog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", priority: 3.0, responsibility: 5.0 });

  useEffect(() => {
    if (user) loadDecisions();
  }, [user]);

  const loadDecisions = async () => {
    const { data } = await supabase
      .from("decisions" as any)
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setDecisions(data as any);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from("decisions" as any).insert({
      user_id: user.id,
      name: form.name,
      priority: Math.round(form.priority),
      responsibility: Math.round(form.responsibility),
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Decision Logged" });
      setShowForm(false);
      setForm({ name: "", priority: 3.0, responsibility: 5.0 });
      loadDecisions();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "decided") updates.decided_at = new Date().toISOString();
    await supabase.from("decisions" as any).update(updates).eq("id", id);
    loadDecisions();
  };

  const openCount = decisions.filter((d) => d.status === "pending").length;
  const decidedThisWeek = decisions.filter((d) => {
    if (d.status !== "decided") return false;
    const week = new Date();
    week.setDate(week.getDate() - 7);
    return new Date(d.created_at) > week;
  }).length;

  return (
    <div className="space-y-10 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-neural-label mb-3">Cognitive Architecture</p>
          <h1 className="text-neural-title text-3xl text-foreground">Decision Log</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-neural">
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Decision</>}
        </button>
      </div>

      {/* Form with radial sliders */}
      {showForm && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleCreate} className="ethereal-glass p-8 space-y-5">
          <div>
            <label className="text-neural-label block mb-2">Decision Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Q3 Hiring Strategy"
              className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors" />
          </div>
          <div className="flex justify-center gap-12">
            <RadialSlider
              value={form.priority}
              onChange={(v) => setForm({ ...form, priority: v })}
              min={0}
              max={5}
              step={0.1}
              size={120}
              label="Priority"
              color="hsl(var(--neural-warm))"
            />
            <RadialSlider
              value={form.responsibility}
              onChange={(v) => setForm({ ...form, responsibility: v })}
              min={0}
              max={10}
              step={0.1}
              size={120}
              label="Weight"
              color="hsl(var(--primary))"
            />
          </div>
          <button type="submit" className="btn-neural mx-auto"><Save size={14} /> Log Decision</button>
        </motion.form>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Decisions", value: decisions.length, icon: Target },
          { label: "Open Decisions", value: openCount, icon: Clock },
          { label: "Decided This Week", value: decidedThisWeek, icon: ArrowUpRight },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="ethereal-glass p-6">
            <stat.icon size={16} strokeWidth={1.5} className="text-primary mb-3" />
            <p className="text-2xl font-cinzel font-light text-foreground">{stat.value}</p>
            <p className="text-neural-label mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {decisions.length === 0 && (
          <div className="ethereal-glass p-12 text-center">
            <Target size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No decisions logged yet.</p>
          </div>
        )}
        {decisions.map((d, i) => (
          <motion.div key={d.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="ethereal-glass p-6 flex items-center gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
              <p className="text-neural-label mt-1">{new Date(d.created_at).toLocaleDateString()}</p>
            </div>
            <div className="text-center">
              <p className={`text-sm font-cinzel ${priorityColor(d.priority)}`}>P{d.priority}</p>
              <p className="text-neural-label">Priority</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-cinzel text-foreground">{d.time_to_decide || "—"}</p>
              <p className="text-neural-label">Speed</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-cinzel text-foreground">{d.responsibility}/10</p>
              <p className="text-neural-label">Weight</p>
            </div>
            <div className="flex gap-1">
              {(["pending", "decided", "deferred"] as const).map((s) => (
                <button key={s} onClick={() => updateStatus(d.id, s)}
                  className={`text-[8px] uppercase tracking-[0.2em] px-2 py-1 rounded-full border transition-all ${
                    d.status === s
                      ? s === "decided" ? "text-primary border-primary/20 bg-primary/5"
                        : s === "pending" ? "text-neural-warm border-neural-warm/20 bg-neural-warm/5"
                        : "text-muted-foreground border-border bg-muted/20"
                      : "text-muted-foreground/40 border-transparent hover:border-border/30"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
