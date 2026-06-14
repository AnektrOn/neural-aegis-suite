import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAegisMotion } from "@/hooks/useAegisMotion";
import { BookOpen, Plus, Search, Tag, Trash2, Edit3, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { notifyAdminOnJournalEntry } from "@/services/adminNotifications";

interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  tags: string[];
  mood_score: number | null;
  created_at: string;
  updated_at: string;
}

const MOOD_EMOJIS = ["😔", "😕", "😐", "🙂", "😊"];

export default function Journal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const { fadeUp } = useAegisMotion();
  const suggestedTags = t("journal.suggestedTags").split(",").map((s) => s.trim());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", tags: [] as string[], mood_score: null as number | null });

  useEffect(() => {
    if (user) loadEntries();
  }, [user]);

  const loadEntries = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setEntries((data as JournalEntry[] | null) ?? []);
    } catch (err) {
      console.error("[Journal] load failed", err);
      toast({
        title: t("journal.loadError"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveEntry = async () => {
    if (!form.content.trim() || !user) return;
    try {
      if (editing) {
        const { error } = await supabase.from("journal_entries").update({
          title: form.title || null,
          content: form.content,
          tags: form.tags,
          mood_score: form.mood_score,
        } as any).eq("id", editing);
        if (error) throw error;
        toast({ title: t("journal.entryModified") });
      } else {
        const { error } = await supabase.from("journal_entries").insert({
          user_id: user.id,
          title: form.title || null,
          content: form.content,
          tags: form.tags,
          mood_score: form.mood_score,
        } as any);
        if (error) throw error;
        void notifyAdminOnJournalEntry({
          user,
          title: form.title || null,
          content: form.content,
        });
        toast({ title: t("journal.entryAdded") });
      }
      resetForm();
      void loadEntries();
    } catch (err) {
      toast({
        title: t("journal.saveError"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase.from("journal_entries").delete().eq("id", id);
      if (error) throw error;
      toast({ title: t("journal.entryDeleted") });
      void loadEntries();
    } catch (err) {
      toast({
        title: t("journal.deleteError"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  const startEdit = (entry: JournalEntry) => {
    setEditing(entry.id);
    setForm({ title: entry.title || "", content: entry.content, tags: entry.tags || [], mood_score: entry.mood_score });
    setShowNew(true);
  };

  const resetForm = () => {
    setEditing(null);
    setShowNew(false);
    setForm({ title: "", content: "", tags: [], mood_score: null });
  };

  const toggleTag = (tag: string) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  };

  const allTags = [...new Set(entries.flatMap(e => e.tags || []))];
  const filtered = entries.filter(e => {
    const matchSearch = !search || e.content.toLowerCase().includes(search.toLowerCase()) || (e.title || "").toLowerCase().includes(search.toLowerCase());
    const matchTag = !filterTag || (e.tags || []).includes(filterTag);
    return matchSearch && matchTag;
  });

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="font-display text-[10px] tracking-[0.22em] uppercase text-text-tertiary/70 mb-2">{t("journal.introspection")}</p>
          <h1 className="font-cormorant text-3xl sm:text-4xl font-light text-text-primary tracking-tight">{t("journal.title")}</h1>
        </div>
        <button onClick={() => { resetForm(); setShowNew(true); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] transition-all duration-200 shadow-[0_0_16px_hsl(var(--primary)/0.25)] text-sm font-medium shrink-0 self-start sm:self-auto">
          <Plus size={16} /> {t("journal.newEntry")}
        </button>
      </div>

      {/* Search & filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("journal.search")} aria-label={t("journal.search")} className="w-full pl-9 pr-3 py-2.5 rounded-full bg-card/60 border border-border/40 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/40" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {allTags.map(tag => (
            <button key={tag} onClick={() => setFilterTag(filterTag === tag ? null : tag)} className={`px-3 py-1 rounded-full font-display text-[10px] tracking-widest uppercase transition-all duration-200 ${filterTag === tag ? "bg-primary/20 text-primary border border-primary/30" : "bg-card/40 border border-border/30 text-muted-foreground hover:text-foreground hover:border-primary/20"}`}>
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* New/Edit form */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="ethereal-glass p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-foreground">{editing ? t("journal.editEntry") : t("journal.newEntryTitle")}</h3>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={t("journal.titleOptional")} className="w-full px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder={t("journal.writeThoughts")} rows={5} className="w-full px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none" />
            <div>
              <p className="text-xs text-muted-foreground mb-2">{t("journal.associatedMood")}</p>
              <div className="flex gap-2">
                {MOOD_EMOJIS.map((emoji, i) => (
                  <button key={i} onClick={() => setForm(f => ({ ...f, mood_score: f.mood_score === i + 1 ? null : i + 1 }))} className={`text-xl p-1 rounded-lg transition-all ${form.mood_score === i + 1 ? "bg-primary/20 scale-110" : "opacity-50 hover:opacity-100"}`}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">{t("journal.tags")}</p>
              <div className="flex gap-1 flex-wrap">
                {suggestedTags.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)} className={`px-2 py-1 rounded-lg text-xs transition-colors ${form.tags.includes(tag) ? "bg-primary/20 text-primary" : "bg-secondary/30 text-muted-foreground hover:text-foreground"}`}>
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={saveEntry} disabled={!form.content.trim()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm disabled:opacity-50">
              <Save size={14} /> {t("general.save")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries list */}
      <div className="space-y-3">
        {loading && (
          <div className="space-y-3" aria-busy="true" aria-label={t("journal.loading")}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card h-28 animate-pulse rounded-2xl" />
            ))}
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="glass-card text-center py-14 px-8">
            <BookOpen size={36} strokeWidth={1} className="mx-auto mb-4 text-primary/20" />
            <p className="font-cormorant text-xl font-light italic text-text-tertiary/70 mb-2">Chaque pensée mérite d'être consignée</p>
            <p className="font-display text-[10px] tracking-[0.18em] uppercase text-text-tertiary/40">{t("journal.noEntries")}</p>
          </div>
        )}
        {!loading && filtered.map((entry, i) => (
          <motion.div key={entry.id} {...fadeUp(i * 0.04)} className="dashboard-panel p-5 group hover:border-primary/20 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {entry.mood_score && <span className="text-lg">{MOOD_EMOJIS[entry.mood_score - 1]}</span>}
                <h3 className="text-sm font-medium text-foreground">{entry.title || t("journal.noTitle")}</h3>
              </div>
              <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => startEdit(entry)} aria-label={t("journal.editEntry")} className="min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-secondary/50 text-muted-foreground"><Edit3 size={13} /></button>
                <button type="button" onClick={() => deleteEntry(entry.id)} aria-label={t("journal.deleteEntry")} className="min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-destructive/60"><Trash2 size={13} /></button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{entry.content}</p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-1">
                {(entry.tags || []).map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px]">#{tag}</span>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">{new Date(entry.created_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
