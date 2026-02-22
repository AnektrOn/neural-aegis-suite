import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, Search, Tag, Trash2, Edit3, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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
const SUGGESTED_TAGS = ["réflexion", "gratitude", "défi", "victoire", "apprentissage", "idée", "stress", "énergie"];

export default function Journal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", tags: [] as string[], mood_score: null as number | null });

  useEffect(() => {
    if (user) loadEntries();
  }, [user]);

  const loadEntries = async () => {
    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setEntries((data as any[] || []) as JournalEntry[]);
  };

  const saveEntry = async () => {
    if (!form.content.trim()) return;
    if (editing) {
      await supabase.from("journal_entries").update({
        title: form.title || null,
        content: form.content,
        tags: form.tags,
        mood_score: form.mood_score,
      } as any).eq("id", editing);
      toast({ title: "Entrée modifiée" });
    } else {
      await supabase.from("journal_entries").insert({
        user_id: user!.id,
        title: form.title || null,
        content: form.content,
        tags: form.tags,
        mood_score: form.mood_score,
      } as any);
      toast({ title: "Entrée ajoutée" });
    }
    resetForm();
    loadEntries();
  };

  const deleteEntry = async (id: string) => {
    await supabase.from("journal_entries").delete().eq("id", id);
    toast({ title: "Entrée supprimée" });
    loadEntries();
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
          <p className="text-neural-label mb-1">Introspection</p>
          <h1 className="text-neural-title text-2xl sm:text-3xl text-foreground">Journal</h1>
        </div>
        <button onClick={() => { resetForm(); setShowNew(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm shrink-0 self-start sm:self-auto">
          <Plus size={16} /> Nouvelle entrée
        </button>
      </div>

      {/* Search & filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {allTags.map(tag => (
            <button key={tag} onClick={() => setFilterTag(filterTag === tag ? null : tag)} className={`px-2 py-1 rounded-lg text-xs transition-colors ${filterTag === tag ? "bg-primary/20 text-primary" : "bg-secondary/30 text-muted-foreground hover:text-foreground"}`}>
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
              <h3 className="text-sm font-medium text-foreground">{editing ? "Modifier l'entrée" : "Nouvelle entrée"}</h3>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Titre (optionnel)" className="w-full px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30" />
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Écrivez vos pensées..." rows={5} className="w-full px-3 py-2 rounded-lg bg-secondary/30 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none" />
            <div>
              <p className="text-xs text-muted-foreground mb-2">Humeur associée</p>
              <div className="flex gap-2">
                {MOOD_EMOJIS.map((emoji, i) => (
                  <button key={i} onClick={() => setForm(f => ({ ...f, mood_score: f.mood_score === i + 1 ? null : i + 1 }))} className={`text-xl p-1 rounded-lg transition-all ${form.mood_score === i + 1 ? "bg-primary/20 scale-110" : "opacity-50 hover:opacity-100"}`}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Tags</p>
              <div className="flex gap-1 flex-wrap">
                {SUGGESTED_TAGS.map(tag => (
                  <button key={tag} onClick={() => toggleTag(tag)} className={`px-2 py-1 rounded-lg text-xs transition-colors ${form.tags.includes(tag) ? "bg-primary/20 text-primary" : "bg-secondary/30 text-muted-foreground hover:text-foreground"}`}>
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={saveEntry} disabled={!form.content.trim()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm disabled:opacity-50">
              <Save size={14} /> Enregistrer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries list */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune entrée trouvée</p>
          </div>
        )}
        {filtered.map((entry, i) => (
          <motion.div key={entry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="ethereal-glass p-5 group">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                {entry.mood_score && <span className="text-lg">{MOOD_EMOJIS[entry.mood_score - 1]}</span>}
                <h3 className="text-sm font-medium text-foreground">{entry.title || "Sans titre"}</h3>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(entry)} className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground"><Edit3 size={13} /></button>
                <button onClick={() => deleteEntry(entry.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive/60"><Trash2 size={13} /></button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{entry.content}</p>
            <div className="flex items-center justify-between mt-3">
              <div className="flex gap-1">
                {(entry.tags || []).map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px]">#{tag}</span>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">{new Date(entry.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
