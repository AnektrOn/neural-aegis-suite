import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { User, Save, Download, FileText, Smartphone, Camera, Loader2, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { AppendixModal } from "@/features/appendix/AppendixModal";
import AegisHealthSection from "@/components/AegisHealthSection";
import { ProfileEvolutionSection } from "@/features/archetype-assessment/components/ProfileEvolutionSection";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("Europe/Paris");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [appendixOpen, setAppendixOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("display_name, country, timezone, avatar_url").eq("id", user!.id).single();
    if (data) {
      setDisplayName(data.display_name || "");
      setCountry(data.country || "");
      setTimezone((data as any).timezone || "Europe/Paris");
      setAvatarUrl((data as any).avatar_url || null);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: t("toast.error"), description: "Image > 5MB", variant: "destructive" });
      return;
    }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) {
      setUploadingAvatar(false);
      toast({ title: t("toast.error"), description: upErr.message, variant: "destructive" });
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${pub.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: url } as any).eq("id", user.id);
    setAvatarUrl(url);
    setUploadingAvatar(false);
    toast({ title: t("profile.profileUpdated"), description: t("profile.profileUpdatedDesc") });
  };

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName, country, timezone } as any).eq("id", user!.id);
    setSaving(false);
    if (error) {
      toast({ title: t("toast.error"), description: t("profile.saveError"), variant: "destructive" });
    } else {
      toast({ title: t("profile.profileUpdated"), description: t("profile.profileUpdatedDesc") });
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
      sections.push(t("profile.csvHeader"));
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
    toast({ title: t("profile.exportDone"), description: t("profile.exportDoneDesc") });
  };

  return (
    <div className="space-y-10 max-w-3xl">
      <div>
        <p className="text-neural-label mb-3">{t("profile.settings")}</p>
        <h1 className="text-neural-title text-3xl text-foreground">{t("profile.myProfile")}</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="ethereal-glass p-8 space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden group hover:border-primary/40 transition-colors disabled:opacity-50"
            aria-label="Changer la photo de profil"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={24} strokeWidth={1.5} className="text-primary" />
            )}
            <span className="absolute inset-0 bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploadingAvatar ? (
                <Loader2 size={16} className="animate-spin text-primary" />
              ) : (
                <Camera size={16} className="text-primary" />
              )}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-neural-label mt-1">{t("profile.memberSince", { date: user?.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : "—" })}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-neural-label block mb-2">{t("profile.displayName")}</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 transition-colors"
              placeholder={t("profile.yourName")}
            />
          </div>
          <div>
            <label className="text-neural-label block mb-2">{t("profile.country")}</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-secondary/20 border border-border/20 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/30 transition-colors"
              placeholder={t("profile.placeholderCountry")}
            />
          </div>
          <div>
            <label className="text-neural-label block mb-2">{t("profile.timezone")}</label>
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
          {saving ? t("profile.savingProfile") : t("profile.saveProfile")}
        </button>
      </motion.div>

      <AegisHealthSection />

      <ProfileEvolutionSection />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="ethereal-glass p-8">
        <div className="flex items-center gap-3 mb-4">
          <FileText size={18} strokeWidth={1.5} className="text-primary" />
          <p className="text-neural-label">{t("profile.dataExport")}</p>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {t("profile.exportDescription")}
        </p>
        <button onClick={exportData} disabled={exporting} className="btn-neural w-full">
          <Download size={14} />
          {exporting ? t("profile.exporting") : t("profile.exportButton")}
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="ethereal-glass p-8">
        <div className="flex items-center gap-3 mb-4">
          <ClipboardList size={18} strokeWidth={1.5} className="text-primary" />
          <p className="text-neural-label">{t("appendix.title")}</p>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {t("appendix.description")}
        </p>
        <button onClick={() => setAppendixOpen(true)} className="btn-neural w-full">
          <ClipboardList size={14} />
          {t("appendix.cta")}
        </button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="ethereal-glass p-8">
        <div className="flex items-center gap-3 mb-4">
          <Smartphone size={18} strokeWidth={1.5} className="text-primary" />
          <p className="text-neural-label">{t("install.title")}</p>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {t("install.onboardingDesc")}
        </p>
        <button onClick={() => navigate("/install")} className="btn-neural w-full">
          <Smartphone size={14} />
          {t("install.title")}
        </button>
      </motion.div>

      <AppendixModal open={appendixOpen} onOpenChange={setAppendixOpen} />
    </div>
  );
}
