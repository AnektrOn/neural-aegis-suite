import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Save, Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export default function Profile() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("Europe/Paris");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("display_name, country, timezone").eq("id", user!.id).single();
    if (data) {
      setDisplayName(data.display_name || "");
      setCountry(data.country || "");
      setTimezone((data as any).timezone || "Europe/Paris");
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName, country, timezone } as any).eq("id", user!.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder.", variant: "destructive" });
    } else {
      toast({ title: "Profil mis à jour", description: "Vos modifications ont été enregistrées." });
    }
  };

  const exportData = async () => {
    if (!user) return;
    setExporting(true);

    const [moodRes, decRes, habRes, journalRes, contactsRes] = await Promise.all([
      supabase.from("mood_entries" as any).select("*").eq("user_id", user.id).order("logged_at", { ascending: false }),
      supabase.from("decisions" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("habit_completions" as any).select("*").eq("user_id", user.id).order("completed_date", { ascending: false }),
      supabase.from("journal_entries").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("people_contacts" as any).select("*").eq("user_id", user.id),
    ]);

    const sections: string[] = [];

    // Mood entries
    const moods = (moodRes.data as any[]) || [];
    if (moods.length > 0) {
      sections.push("=== HUMEUR ===");
      sections.push("Date,Valeur,Sommeil,Stress,Repas");
      moods.forEach((m) => {
        sections.push(`${m.logged_at},${m.value},${m.sleep ?? ""},${m.stress ?? ""},${m.meals_count ?? ""}`);
      });
    }

    // Decisions
    const decs = (decRes.data as any[]) || [];
    if (decs.length > 0) {
      sections.push("\n=== DECISIONS ===");
      sections.push("Date,Nom,Statut,Priorité,Responsabilité");
      decs.forEach((d) => {
        sections.push(`${d.created_at},"${d.name}",${d.status},${d.priority},${d.responsibility}`);
      });
    }

    // Habits
    const habits = (habRes.data as any[]) || [];
    if (habits.length > 0) {
      sections.push("\n=== HABITUDES COMPLÉTÉES ===");
      sections.push("Date,Habitude ID");
      habits.forEach((h) => {
        sections.push(`${h.completed_date},${h.assigned_habit_id}`);
      });
    }

    // Journal
    const journals = (journalRes.data as any[]) || [];
    if (journals.length > 0) {
      sections.push("\n=== JOURNAL ===");
      sections.push("Date,Titre,Contenu,Tags,Humeur");
      journals.forEach((j) => {
        sections.push(`${j.created_at},"${j.title || ""}","${j.content.replace(/"/g, '""')}","${(j.tags || []).join(";")}",${j.mood_score ?? ""}`);
      });
    }

    // Contacts
    const contacts = (contactsRes.data as any[]) || [];
    if (contacts.length > 0) {
      sections.push("\n=== CONTACTS ===");
      sections.push("Nom,Rôle,Qualité,Insight");
      contacts.forEach((c) => {
        sections.push(`"${c.name}","${c.role || ""}",${c.quality},"${c.insight || ""}"`);
      });
    }

    const csvContent = sections.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aegis-export-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setExporting(false);
    toast({ title: "Export terminé", description: "Votre fichier CSV a été téléchargé." });
  };

  return (
    <div className="space-y-10 max-w-3xl">
      <div>
        <p className="text-neural-label mb-3">Paramètres</p>
        <h1 className="text-neural-title text-3xl text-foreground">Mon Profil</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-8 space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <User size={24} strokeWidth={1.5} className="text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-neural-label mt-1">Membre depuis {user?.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : "—"}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-neural-label block mb-2">Nom d'affichage</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 transition-colors"
              placeholder="Votre nom"
            />
          </div>
          <div>
            <label className="text-neural-label block mb-2">Pays</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 transition-colors"
              placeholder="France"
            />
          </div>
          <div>
            <label className="text-neural-label block mb-2">Fuseau horaire</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/30 transition-colors"
            >
              {["Europe/Paris", "Europe/London", "Europe/Berlin", "Europe/Madrid", "Europe/Rome", "Europe/Brussels", "Europe/Zurich", "Europe/Amsterdam", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Toronto", "America/Montreal", "Asia/Tokyo", "Asia/Shanghai", "Asia/Dubai", "Africa/Casablanca", "Africa/Tunis", "Pacific/Noumea"].map(tz => (
                <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={saveProfile} disabled={saving} className="btn-neural w-full">
          <Save size={14} />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="ethereal-glass p-8">
        <div className="flex items-center gap-3 mb-4">
          <FileText size={18} strokeWidth={1.5} className="text-primary" />
          <p className="text-neural-label">Export de données</p>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Téléchargez toutes vos données (humeur, décisions, habitudes, journal, contacts) au format CSV.
        </p>
        <button onClick={exportData} disabled={exporting} className="btn-neural w-full">
          <Download size={14} />
          {exporting ? "Export en cours..." : "Exporter mes données (CSV)"}
        </button>
      </motion.div>
    </div>
  );
}
