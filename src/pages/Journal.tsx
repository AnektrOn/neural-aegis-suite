import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAegisMotion } from "@/hooks/useAegisMotion";
import { BookOpen, Plus, Search, Tag, Trash2, Edit3, Save, X, Loader2, Sparkles, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { notifyAdminOnJournalEntry } from "@/services/adminNotifications";
import { MemberPageHeader } from "@/components/ui/MemberPageHeader";
import { MemberPageScaffold } from "@/layouts/MemberPageScaffold";
import { MemberSplitLayout } from "@/layouts/MemberSplitLayout";
import { cn } from "@/lib/utils";

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
const MOOD_LABEL_KEYS = [
  "journal.mood.1",
  "journal.mood.2",
  "journal.mood.3",
  "journal.mood.4",
  "journal.mood.5",
] as const;

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
  const [form, setForm] = useState({ title: "", content: "", tags: [] as string[], mood_score: null as number | null });
  const [saving, setSaving] = useState(false);
  const [mobileTab, setMobileTab] = useState<"write" | "memory">("write");

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
    if (!form.content.trim() || !user || saving) return;
    setSaving(true);
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
    } finally {
      setSaving(false);
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
  };

  const resetForm = () => {
    setEditing(null);
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

  const leftPane = (
    <div className="flex flex-col gap-5 h-full justify-between">
      <div>
        <p className="font-cinzel text-[10.5px] font-semibold tracking-[0.26em] uppercase text-[#9e7828] dark:text-[#c9a24b] mb-1.5">
          {t("journal.introspection")} · EXOCORTEX
        </p>
        <h1 className="font-cormorant text-3xl sm:text-4xl lg:text-5xl font-light text-foreground tracking-tight">
          {t("journal.title")}
        </h1>
        <p className="font-sans text-sm text-muted-foreground mt-2 leading-relaxed">
          Consignez vos prises de conscience, leçons d'arbitrage et réflexions profondes.
        </p>
      </div>

      {/* Mobile Segmented Switcher (<lg) */}
      <div className="flex lg:hidden items-center p-1 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md shadow-sm">
        <button
          type="button"
          onClick={() => setMobileTab("write")}
          className={cn(
            "flex-1 py-2 px-2 rounded-lg text-xs font-cinzel uppercase tracking-[0.14em] font-medium transition-all text-center",
            mobileTab === "write"
              ? "bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40 shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          ✍️ Rédiger
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("memory")}
          className={cn(
            "flex-1 py-2 px-2 rounded-lg text-xs font-cinzel uppercase tracking-[0.14em] font-medium transition-all text-center",
            mobileTab === "memory"
              ? "bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40 shadow-sm font-semibold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          📜 Mémoire ({entries.length})
        </button>
      </div>

      {/* Editor Box & Telemetry */}
      <div className={cn("space-y-4 flex-1 flex flex-col justify-between", mobileTab !== "write" && "hidden lg:flex", "pb-6 lg:pb-0")}>
        <div className="aegis-dock-tile rounded-2xl p-5 space-y-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="flex justify-between items-center">
            <span className="font-cinzel text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c9a24b]">
              {editing ? t("journal.editEntry") : t("journal.newEntryTitle")}
            </span>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X size={13} /> Annuler
              </button>
            )}
          </div>

          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder={t("journal.titleOptional")}
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/25 dark:bg-black/35 border border-white/10 text-sm focus:outline-none focus:border-[#c9a24b]/50 placeholder:text-muted-foreground/50 transition-colors"
          />

          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder={t("journal.writeThoughts")}
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-xl bg-black/25 dark:bg-black/35 border border-white/10 text-sm focus:outline-none focus:border-[#c9a24b]/50 placeholder:text-muted-foreground/50 resize-none transition-colors"
          />

          <div>
            <p className="font-cinzel text-[9.5px] uppercase tracking-wider text-muted-foreground mb-1.5">
              {t("journal.associatedMood")}
            </p>
            <div className="flex gap-2" role="group" aria-label={t("journal.associatedMood")}>
              {MOOD_EMOJIS.map((emoji, i) => {
                const score = i + 1;
                const selected = form.mood_score === score;
                const label = t(MOOD_LABEL_KEYS[i]);
                return (
                  <button
                    key={score}
                    type="button"
                    aria-label={label}
                    aria-pressed={selected}
                    onClick={() => setForm((f) => ({ ...f, mood_score: selected ? null : score }))}
                    className={cn(
                      "h-10 w-10 text-lg rounded-xl transition-all cursor-pointer flex items-center justify-center border",
                      selected
                        ? "border-[#c9a24b]/60 bg-[#c9a24b]/20 shadow-[0_0_12px_rgba(201,162,75,0.2)]"
                        : "border-white/5 bg-black/20 opacity-60 hover:opacity-100",
                    )}
                  >
                    <span aria-hidden>{emoji}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="font-cinzel text-[9.5px] uppercase tracking-wider text-muted-foreground mb-1.5">
              {t("journal.tags")}
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-mono transition-colors border",
                    form.tags.includes(tag)
                      ? "border-[#c9a24b]/40 bg-[#c9a24b]/15 text-[#c9a24b]"
                      : "border-white/5 bg-black/20 text-muted-foreground hover:text-foreground",
                  )}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void saveEntry()}
            disabled={!form.content.trim() || saving}
            className="btn-solaire w-full flex min-h-[44px] items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-cinzel text-xs uppercase tracking-[0.16em] disabled:opacity-50 cursor-pointer shadow-md"
          >
            {saving ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Save size={14} aria-hidden />}
            <span>{editing ? "Mettre à jour" : "Sceller dans l'Exocortex"}</span>
          </button>
        </div>

        {/* Telemetry Pod */}
        <div className="aegis-dock-tile rounded-2xl p-4 flex items-center justify-between text-center">
          <div>
            <p className="font-mono text-xl font-semibold text-foreground">{entries.length}</p>
            <p className="font-cinzel text-[8.5px] uppercase tracking-wider text-muted-foreground">Réflexions</p>
          </div>
          <div>
            <p className="font-mono text-xl font-semibold text-[#c9a24b]">{allTags.length}</p>
            <p className="font-cinzel text-[8.5px] uppercase tracking-wider text-muted-foreground">Concepts</p>
          </div>
          <div>
            <p className="font-mono text-xs font-semibold text-muted-foreground">
              {entries[0] ? new Date(entries[0].created_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "short" }) : "—"}
            </p>
            <p className="font-cinzel text-[8.5px] uppercase tracking-wider text-muted-foreground">Dernière entrée</p>
          </div>
        </div>
      </div>
    </div>
  );

  const rightPane = (
    <div className={cn("space-y-4", mobileTab !== "memory" && "hidden lg:block")}>
      {/* Search & filter */}
      <div className="flex flex-wrap gap-2.5 items-center justify-between border-b border-border/25 pb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("journal.search")}
            aria-label={t("journal.search")}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/25 dark:bg-black/35 border border-white/10 text-sm focus:outline-none focus:border-[#c9a24b]/40 placeholder:text-muted-foreground/40 font-sans"
          />
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {filtered.length} {filtered.length > 1 ? "entrées" : "entrée"}
        </span>
      </div>

      {allTags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={cn(
                "px-2.5 py-1 rounded-full font-mono text-[10px] tracking-wider uppercase transition-all duration-200 border",
                filterTag === tag
                  ? "bg-[#c9a24b]/20 text-[#c9a24b] border-[#c9a24b]/40"
                  : "bg-black/20 border-white/5 text-muted-foreground hover:text-foreground",
              )}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Entries feed */}
      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label={t("journal.loading")}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aegis-dock-tile h-28 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="aegis-dock-tile rounded-2xl text-center py-14 px-8 space-y-2">
          <BookOpen size={36} strokeWidth={1} className="mx-auto mb-3 text-primary/30" />
          <p className="font-cormorant text-xl font-light italic text-muted-foreground">
            Chaque pensée mérite d'être consignée
          </p>
          <p className="font-cinzel text-[10px] font-semibold tracking-[0.2em] uppercase text-muted-foreground/60">
            {t("journal.noEntries")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry, i) => (
            <motion.div
              key={entry.id}
              {...fadeUp(i * 0.03)}
              className="aegis-dock-tile rounded-2xl p-5 group hover:border-[#c9a24b]/40 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {entry.mood_score && <span className="text-base">{MOOD_EMOJIS[entry.mood_score - 1]}</span>}
                  <h3 className="font-cinzel text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
                    {entry.title || t("journal.noTitle")}
                  </h3>
                </div>
                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => startEdit(entry)}
                    aria-label={t("journal.editEntry")}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteEntry(entry.id)}
                    aria-label={t("journal.deleteEntry")}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-destructive/60 hover:text-destructive transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground/90 whitespace-pre-wrap leading-relaxed font-sans">
                {entry.content}
              </p>
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5">
                <div className="flex gap-1 flex-wrap">
                  {(entry.tags || []).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded-md bg-[#c9a24b]/10 text-[#c9a24b] font-mono text-[9px]">
                      #{tag}
                    </span>
                  ))}
                </div>
                <span className="font-mono text-[9px] text-muted-foreground flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(entry.created_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <MemberPageScaffold width="wide" viewport>
      <MemberSplitLayout
        left={leftPane}
        right={rightPane}
        leftCols="lg:col-span-5"
        rightCols="lg:col-span-7"
        scrollRight={true}
        scrollLeft={true}
      />
    </MemberPageScaffold>
  );
}
