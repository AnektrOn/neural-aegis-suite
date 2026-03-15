import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wind, Eye, Brain, Sparkles, Heart, BookOpen, Link as LinkIcon, Search, Trash2, Users, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import ToolboxAssignmentForm from "@/components/admin/ToolboxAssignmentForm";

interface ToolboxAssignment {
  id: string;
  user_id: string;
  content_type: string;
  title: string;
  duration: string | null;
  assigned_at: string;
  external_url: string | null;
  widget_config: any;
  user_name?: string;
}

interface UserProfile {
  id: string;
  display_name: string | null;
}

const TYPE_META: Record<string, { icon: typeof Wind; color: string; label: string }> = {
  breathwork: { icon: Wind, color: "text-primary", label: "Breathwork" },
  focus_introspectif: { icon: Eye, color: "text-neural-accent", label: "Focus Introspectif" },
  body_scan: { icon: Brain, color: "text-neural-warm", label: "Body Scan" },
  affirmations: { icon: Sparkles, color: "text-primary", label: "Affirmations" },
  gratitude: { icon: Heart, color: "text-destructive", label: "Gratitude" },
  journal_prompt: { icon: BookOpen, color: "text-neural-accent", label: "Journal Prompt" },
  external_link: { icon: LinkIcon, color: "text-muted-foreground", label: "Lien Externe" },
  meditation: { icon: Eye, color: "text-primary", label: "Méditation" },
  visualization: { icon: Eye, color: "text-neural-accent", label: "Visualisation" },
  course: { icon: BookOpen, color: "text-neural-warm", label: "Formation" },
};

export default function ToolboxManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [assignments, setAssignments] = useState<ToolboxAssignment[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [assignRes, profilesRes] = await Promise.all([
      supabase.from("toolbox_assignments").select("*").order("assigned_at", { ascending: false }),
      supabase.from("profiles").select("id, display_name"),
    ]);
    const profs = (profilesRes.data || []) as UserProfile[];
    setProfiles(profs);
    const items = (assignRes.data || []).map((a: any) => ({
      ...a,
      user_name: profs.find((p) => p.id === a.user_id)?.display_name || "Inconnu",
    }));
    setAssignments(items);
    setLoading(false);
  };

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase.from("toolbox_assignments").delete().eq("id", id);
    if (error) toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
    else { toast({ title: "Outil retiré" }); loadData(); }
  };

  const allTypes = ["all", ...new Set(assignments.map((a) => a.content_type))];
  const filtered = assignments
    .filter((a) => filterType === "all" || a.content_type === filterType)
    .filter((a) => !search || (a.user_name || "").toLowerCase().includes(search.toLowerCase()) || a.title.toLowerCase().includes(search.toLowerCase()));

  const userAssignmentCounts = profiles.map((p) => ({
    ...p,
    count: assignments.filter((a) => a.user_id === p.id).length,
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <p className="text-neural-label mb-3 text-neural-accent/60">Gestion des outils</p>
        <h1 className="text-neural-title text-3xl text-foreground">Boîte à Outils</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Outils assignés", value: assignments.length, icon: Package },
          { label: "Utilisateurs équipés", value: new Set(assignments.map((a) => a.user_id)).size, icon: Users },
          { label: "Types utilisés", value: new Set(assignments.map((a) => a.content_type)).size, icon: Sparkles },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="ethereal-glass p-6">
            <stat.icon size={16} strokeWidth={1.5} className="text-neural-accent mb-3" />
            <p className="text-2xl font-cinzel text-foreground">{stat.value}</p>
            <p className="text-neural-label mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Assign new tool */}
      <div className="ethereal-glass p-6 space-y-4">
        <p className="text-sm font-medium text-foreground">Assigner un nouvel outil</p>
        <div>
          <label className="text-neural-label block mb-1.5">Utilisateur</label>
          <select
            value={selectedUser || ""}
            onChange={(e) => setSelectedUser(e.target.value || null)}
            className="w-full sm:w-auto bg-secondary/30 border border-border/30 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40 transition-colors"
          >
            <option value="">Sélectionner un utilisateur…</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.display_name || "Sans nom"}</option>
            ))}
          </select>
        </div>
        {selectedUser && (
          <ToolboxAssignmentForm userId={selectedUser} onAssigned={loadData} />
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("common.searchByNameOrTool")}
            className="w-full bg-secondary/20 border border-border/20 rounded-xl pl-12 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/30 transition-colors" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {allTypes.map((t) => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`text-[9px] uppercase tracking-[0.2em] px-3 py-2 rounded-lg border transition-all ${
                filterType === t ? "border-primary/40 bg-primary/5 text-primary" : "border-border/30 text-muted-foreground hover:border-primary/30"
              }`}>
              {t === "all" ? "Tous" : TYPE_META[t]?.label || t}
            </button>
          ))}
        </div>
      </div>

      {/* Assignments list */}
      <div className="space-y-3">
        {loading && (
          <div className="ethereal-glass p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="ethereal-glass p-12 text-center">
            <Package size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">{t("common.noToolsAssigned")}</p>
          </div>
        )}
        {filtered.map((item, i) => {
          const meta = TYPE_META[item.content_type] || TYPE_META.course;
          return (
            <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className="ethereal-glass p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary/30 border border-border/20 flex items-center justify-center shrink-0">
                <meta.icon size={16} strokeWidth={1.5} className={meta.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                <p className="text-neural-label mt-0.5">
                  {item.user_name} · {meta.label} · {item.duration || "—"} · {new Date(item.assigned_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <button onClick={() => deleteAssignment(item.id)}
                className="p-2 rounded-lg border border-border/30 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors shrink-0"
                title="Retirer">
                <Trash2 size={14} />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
