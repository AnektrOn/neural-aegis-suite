import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Trophy, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

const CRITERIA_TYPES = [
  { value: "mood_above", label: "Humeur ≥ seuil", labelEn: "Mood ≥ threshold" },
  { value: "habits_completed", label: "Habitudes complétées ≥", labelEn: "Habits completed ≥" },
  { value: "journal_written", label: "Journal écrit", labelEn: "Journal written" },
  { value: "sleep_above", label: "Sommeil ≥ heures", labelEn: "Sleep ≥ hours" },
  { value: "stress_below", label: "Stress ≤ seuil", labelEn: "Stress ≤ threshold" },
  { value: "decision_made", label: "Décision prise", labelEn: "Decision made" },
  { value: "toolbox_completed", label: "Outil terminé", labelEn: "Tool completed" },
  { value: "relation_updated", label: "Relation mise à jour", labelEn: "Relation updated" },
];

interface Criteria {
  id?: string;
  criteria_type: string;
  criteria_label: string;
  target_value: number;
  points: number;
  is_active: boolean;
}

interface UserProfile {
  id: string;
  display_name: string | null;
}

export default function ScoreboardConfig() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) loadCriteria(selectedUser);
  }, [selectedUser]);

  const loadUsers = async () => {
    const { data } = await supabase.from("profiles").select("id, display_name");
    if (data) {
      setUsers(data as any);
      if (data.length > 0) setSelectedUser((data[0] as any).id);
    }
    setLoading(false);
  };

  const loadCriteria = async (userId: string) => {
    const { data } = await supabase
      .from("scoreboard_criteria" as any)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    setCriteria((data as any[]) || []);
  };

  const addCriteria = () => {
    setCriteria(prev => [...prev, {
      criteria_type: "mood_above",
      criteria_label: "Humeur ≥ 7",
      target_value: 7,
      points: 2,
      is_active: true,
    }]);
  };

  const removeCriteria = async (index: number) => {
    const item = criteria[index];
    if (item.id) {
      await supabase.from("scoreboard_criteria" as any).delete().eq("id", item.id);
    }
    setCriteria(prev => prev.filter((_, i) => i !== index));
  };

  const updateCriteria = (index: number, field: keyof Criteria, value: any) => {
    setCriteria(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const saveCriteria = async () => {
    if (!user || !selectedUser) return;
    setSaving(true);

    // Delete existing and re-insert for simplicity
    await supabase.from("scoreboard_criteria" as any).delete().eq("user_id", selectedUser);

    const inserts = criteria.map(c => ({
      user_id: selectedUser,
      criteria_type: c.criteria_type,
      criteria_label: c.criteria_label,
      target_value: c.target_value,
      points: c.points,
      is_active: c.is_active,
      created_by: user.id,
    }));

    if (inserts.length > 0) {
      const { error } = await supabase.from("scoreboard_criteria" as any).insert(inserts as any);
      if (error) {
        toast({ title: "Erreur", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    toast({ title: "Scoreboard sauvegardé", description: `${inserts.length} critères configurés pour cet utilisateur.` });
    setSaving(false);
    loadCriteria(selectedUser);
  };

  const totalPoints = criteria.filter(c => c.is_active).reduce((s, c) => s + c.points, 0);

  if (loading) return <div className="flex items-center justify-center p-20"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <p className="text-neural-label mb-3 text-neural-accent/60">Administration</p>
        <h1 className="text-neural-title text-2xl sm:text-3xl text-foreground flex items-center gap-3">
          <Trophy size={24} className="text-primary" />
          Scoreboard du Jour
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Définissez les critères de scoring pour chaque utilisateur. Le scoreboard est calculé quotidiennement.
        </p>
      </div>

      {/* User selector */}
      <div className="ethereal-glass p-6">
        <label className="text-neural-label block mb-2">Sélectionner un utilisateur</label>
        <select
          value={selectedUser}
          onChange={e => setSelectedUser(e.target.value)}
          className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/30 transition-colors"
        >
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.display_name || u.id.slice(0, 8)}</option>
          ))}
        </select>
      </div>

      {/* Criteria list */}
      <div className="space-y-3">
        {criteria.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="ethereal-glass p-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-3">
                <label className="text-neural-label block mb-1">Type</label>
                <select
                  value={c.criteria_type}
                  onChange={e => updateCriteria(i, "criteria_type", e.target.value)}
                  className="w-full bg-secondary/20 border border-border/20 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                >
                  {CRITERIA_TYPES.map(ct => (
                    <option key={ct.value} value={ct.value}>{ct.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="text-neural-label block mb-1">Label</label>
                <input
                  value={c.criteria_label}
                  onChange={e => updateCriteria(i, "criteria_label", e.target.value)}
                  className="w-full bg-secondary/20 border border-border/20 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-neural-label block mb-1">Seuil</label>
                <input
                  type="number"
                  value={c.target_value}
                  onChange={e => updateCriteria(i, "target_value", Number(e.target.value))}
                  className="w-full bg-secondary/20 border border-border/20 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-neural-label block mb-1">Points</label>
                <input
                  type="number"
                  value={c.points}
                  onChange={e => updateCriteria(i, "points", Number(e.target.value))}
                  className="w-full bg-secondary/20 border border-border/20 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none"
                />
              </div>
              <div className="sm:col-span-1 flex items-center justify-center">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={c.is_active}
                    onChange={e => updateCriteria(i, "is_active", e.target.checked)}
                    className="accent-primary"
                  />
                  <span className="text-[9px] text-muted-foreground">Actif</span>
                </label>
              </div>
              <div className="sm:col-span-1 flex justify-end">
                <button onClick={() => removeCriteria(i)} className="p-2 text-destructive/60 hover:text-destructive transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <button onClick={addCriteria} className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
          <Plus size={14} /> Ajouter un critère
        </button>
        <div className="flex items-center gap-4">
          <span className="text-neural-label">Score max: <strong className="text-foreground">{totalPoints} pts</strong></span>
          <button onClick={saveCriteria} disabled={saving} className="btn-neural">
            <Save size={14} />
            {saving ? "Enregistrement..." : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  );
}
