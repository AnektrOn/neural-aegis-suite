import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Factory, Plus, X, Save, Trash2, Users, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { assignHabitTemplateToUser, createHabitTemplate } from "@/services/programBuilderService";

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
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");

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
    try {
      await createHabitTemplate(
        {
          name: form.name,
          category: form.category,
          description: form.description || null,
        },
        user.id
      );
      toast({ title: "Habit Created", description: `"${form.name}" added to the factory.` });
      setShowForm(false);
      setForm({ name: "", category: "", description: "" });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
    try {
      const result = await assignHabitTemplateToUser({
        actorId: user.id,
        userId,
        habitTemplateId: templateId,
      });
      if (result.skipped) {
        toast({ title: "Already Assigned", description: "This habit is already assigned to this user." });
        return;
      }
      toast({ title: "Assigned", description: "Habit assigned to leader." });
      loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getAssignedUsers = (templateId: string) =>
    assignments.filter((a) => a.habit_template_id === templateId && a.is_active);

  const filtered = templates.filter((t) => {
    const bySearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const byCategory = categoryFilter === "all" || t.category === categoryFilter;
    // Habit templates have no dedicated duration field yet:
    // we allow admins to filter by duration keyword in description.
    const byDuration =
      !durationFilter.trim() ||
      (t.description || "").toLowerCase().includes(durationFilter.toLowerCase().trim());
    const created = new Date(t.created_at);
    const fromOk = !createdFrom || created >= new Date(`${createdFrom}T00:00:00`);
    const toOk = !createdTo || created <= new Date(`${createdTo}T23:59:59`);
    return bySearch && byCategory && byDuration && fromOk && toOk;
  });

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-neural-label mb-3 text-neural-accent/60">Administration</p>
          <h1 className="text-neural-title text-2xl sm:text-3xl text-foreground">Habit Factory</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-neural shrink-0">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="text-neural-label block mb-2">Catégorie</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-neural-accent/40 transition-colors"
          >
            <option value="all">Toutes</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-neural-label block mb-2">Durée</label>
          <input
            type="text"
            value={durationFilter}
            onChange={(e) => setDurationFilter(e.target.value)}
            placeholder="ex: 10 min (dans description)"
            className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/40 transition-colors"
          />
        </div>
        <div>
          <label className="text-neural-label block mb-2">Créé du</label>
          <input
            type="date"
            value={createdFrom}
            onChange={(e) => setCreatedFrom(e.target.value)}
            className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-neural-accent/40 transition-colors"
          />
        </div>
        <div>
          <label className="text-neural-label block mb-2">Créé au</label>
          <input
            type="date"
            value={createdTo}
            onChange={(e) => setCreatedTo(e.target.value)}
            className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-neural-accent/40 transition-colors"
          />
        </div>
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
