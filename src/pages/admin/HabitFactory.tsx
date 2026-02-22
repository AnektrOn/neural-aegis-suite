import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Factory, Plus, X, Save, Trash2, Users, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface HabitTemplate {
  id: string;
  name: string;
  category: string;
  description: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  display_name: string | null;
}

interface Assignment {
  id: string;
  user_id: string;
  habit_template_id: string;
  is_active: boolean;
}

export default function HabitFactory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<HabitTemplate[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", category: "", description: "" });
  const [search, setSearch] = useState("");

  const categories = ["Mind", "Body", "Leadership", "Performance", "Growth", "Wellness"];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [tRes, pRes, aRes] = await Promise.all([
      supabase.from("habit_templates" as any).select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, display_name"),
      supabase.from("assigned_habits" as any).select("*"),
    ]);
    if (tRes.data) setTemplates(tRes.data as any);
    if (pRes.data) setProfiles(pRes.data);
    if (aRes.data) setAssignments(aRes.data as any);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from("habit_templates" as any).insert({
      name: form.name,
      category: form.category,
      description: form.description || null,
      created_by: user.id,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Habit Created", description: `"${form.name}" added to the factory.` });
      setShowForm(false);
      setForm({ name: "", category: "", description: "" });
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("habit_templates" as any).delete().eq("id", id);
    if (!error) {
      toast({ title: "Deleted", description: "Habit template removed." });
      loadData();
    }
  };

  const handleAssign = async (templateId: string, userId: string) => {
    if (!user) return;
    const existing = assignments.find((a) => a.habit_template_id === templateId && a.user_id === userId);
    if (existing) {
      toast({ title: "Already Assigned", description: "This habit is already assigned to this user." });
      return;
    }

    const { error } = await supabase.from("assigned_habits" as any).insert({
      user_id: userId,
      habit_template_id: templateId,
      assigned_by: user.id,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Assigned", description: "Habit assigned to leader." });
      loadData();
    }
  };

  const getAssignedUsers = (templateId: string) =>
    assignments.filter((a) => a.habit_template_id === templateId && a.is_active);

  const filtered = templates.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-neural-label mb-3 text-neural-accent/60">Administration</p>
          <h1 className="text-neural-title text-3xl text-foreground">Habit Factory</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-neural">
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Habit</>}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
          className="ethereal-glass p-8 space-y-5"
          style={{ borderColor: "hsla(270, 50%, 55%, 0.15)" }}
        >
          <p className="text-neural-label text-neural-accent/60">Create Habit Template</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-neural-label block mb-2">Habit Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Morning Meditation"
                className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-neural-label block mb-2">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-neural-accent/40 transition-colors"
              >
                <option value="">Select...</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-neural-label block mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="High-impact habit for peak performance..."
              className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/40 transition-colors resize-none"
            />
          </div>

          <button type="submit" className="btn-neural">
            <Save size={14} /> Create Habit
          </button>
        </motion.form>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search habits..."
          className="w-full bg-secondary/20 border border-border/20 rounded-xl pl-12 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/30 transition-colors"
        />
      </div>

      {/* Templates list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="ethereal-glass p-12 text-center">
            <Factory size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No habit templates yet. Create one to get started.</p>
          </div>
        )}
        {filtered.map((template, i) => {
          const assigned = getAssignedUsers(template.id);
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="ethereal-glass p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{template.name}</p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-[9px] uppercase tracking-[0.3em] px-2 py-1 rounded-full border border-neural-accent/20 text-neural-accent bg-neural-accent/5">
                      {template.category}
                    </span>
                    <span className="text-neural-label flex items-center gap-1">
                      <Users size={10} /> {assigned.length} assigned
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAssigningId(assigningId === template.id ? null : template.id)}
                    className="p-2 rounded-lg border border-border/30 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                    title="Assign to user"
                  >
                    <Users size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 rounded-lg border border-border/30 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {template.description && (
                <p className="text-xs text-muted-foreground mb-3">{template.description}</p>
              )}

              {/* Assignment panel */}
              {assigningId === template.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 pt-4 border-t border-border/10"
                >
                  <p className="text-neural-label mb-3">Assign to Leader</p>
                  <div className="flex flex-wrap gap-2">
                    {profiles.map((p) => {
                      const isAssigned = assigned.some((a) => a.user_id === p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => !isAssigned && handleAssign(template.id, p.id)}
                          disabled={isAssigned}
                          className={`text-[9px] uppercase tracking-[0.2em] px-3 py-2 rounded-lg border transition-all ${
                            isAssigned
                              ? "border-primary/30 text-primary bg-primary/5 cursor-default"
                              : "border-border/30 text-muted-foreground hover:border-neural-accent/30 hover:text-neural-accent"
                          }`}
                        >
                          {p.display_name || "Unnamed"} {isAssigned && "✓"}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
