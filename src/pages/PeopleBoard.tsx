import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Network, LayoutGrid, Plus, X, Save, Trash2, TrendingUp, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import NeuralMap from "@/components/NeuralMap";

interface Person {
  id: string;
  name: string;
  role: string | null;
  quality: number;
  insight: string | null;
}

interface QualityHistory {
  id: string;
  contact_id: string;
  quality: number;
  recorded_at: string;
}

const qualityColor = (q: number) => {
  if (q >= 8) return "hsl(176 70% 48%)";
  if (q >= 6) return "hsl(35 80% 55%)";
  return "hsl(0 70% 50%)";
};

type Period = "1d" | "7d" | "30d" | "90d" | "quarter" | "semester" | "year";

const periodDays: Record<Period, number> = {
  "1d": 1, "7d": 7, "30d": 30, "90d": 90, quarter: 90, semester: 180, year: 365,
};

const periodLabels: Record<Period, string> = {
  "1d": "Jour", "7d": "7 jours", "30d": "30 jours", "90d": "90 jours",
  quarter: "Trimestre", semester: "Semestre", year: "Année",
};

export default function PeopleBoard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<"neural" | "card">("card");
  const [people, setPeople] = useState<Person[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", quality: 7, insight: "" });
  const [loading, setLoading] = useState(true);
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; person: Person | null }>({ open: false, person: null });
  const [history, setHistory] = useState<QualityHistory[]>([]);
  const [period, setPeriod] = useState<Period>("30d");

  const [localQualities, setLocalQualities] = useState<Record<string, number>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => { if (user) loadPeople(); }, [user]);

  const loadPeople = async () => {
    setLoading(true);
    const { data } = await supabase.from("people_contacts").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    if (data) {
      setPeople(data as any);
      const quals: Record<string, number> = {};
      (data as any[]).forEach((p: Person) => { quals[p.id] = p.quality; });
      setLocalQualities(quals);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("people_contacts").insert({ user_id: user.id, name: form.name, role: form.role || null, quality: form.quality, insight: form.insight || null } as any);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Contact ajouté" }); setShowForm(false); setForm({ name: "", role: "", quality: 7, insight: "" }); loadPeople(); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("people_contacts").delete().eq("id", id);
    loadPeople();
  };

  const handleLocalQualityChange = (id: string, quality: number) => {
    setLocalQualities(prev => ({ ...prev, [id]: quality }));
    setHasUnsavedChanges(true);
  };

  const saveAllChanges = async () => {
    if (!user) return;
    const updates: Promise<any>[] = [];
    for (const person of people) {
      const newQ = localQualities[person.id];
      if (newQ !== undefined && newQ !== person.quality) {
        updates.push((async () => {
          await supabase.from("people_contacts").update({ quality: newQ } as any).eq("id", person.id);
          await supabase.from("relation_quality_history").insert({ contact_id: person.id, user_id: user.id, quality: newQ } as any);
        })());
      }
    }
    if (updates.length === 0) { toast({ title: "Aucun changement à enregistrer" }); return; }
    await Promise.all(updates);
    toast({ title: `${updates.length} relation(s) mise(s) à jour` });
    setHasUnsavedChanges(false);
    loadPeople();
  };

  const openHistory = async (person: Person) => {
    setHistoryDialog({ open: true, person });
    loadHistory(person.id);
  };

  const loadHistory = async (contactId: string) => {
    const since = new Date();
    since.setDate(since.getDate() - periodDays[period]);
    const { data } = await supabase.from("relation_quality_history").select("*").eq("contact_id", contactId).gte("recorded_at", since.toISOString()).order("recorded_at", { ascending: true });
    if (data) setHistory(data as any);
  };

  useEffect(() => { if (historyDialog.person) loadHistory(historyDialog.person.id); }, [period]);

  const chartData = history.map(h => ({
    date: new Date(h.recorded_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
    quality: h.quality,
  }));

  const avgQuality = people.length > 0 ? (people.reduce((s, p) => s + p.quality, 0) / people.length).toFixed(1) : "—";
  const highCount = people.filter(p => p.quality >= 8).length;
  const lowCount = people.filter(p => p.quality < 5).length;

  return (
    <div className="space-y-10 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-neural-label mb-3">Intelligence Relationnelle</p>
          <h1 className="text-neural-title text-2xl sm:text-3xl text-foreground">Tableau des Relations</h1>
        </div>
        <div className="flex gap-2 items-center">
          {hasUnsavedChanges && (
            <button onClick={saveAllChanges} className="btn-neural shrink-0 animate-pulse">
              <Send size={14} /> Envoyer
            </button>
          )}
          <button onClick={() => setShowForm(!showForm)} className="btn-neural shrink-0">
            {showForm ? <><X size={14} /> Annuler</> : <><Plus size={14} /> Ajouter</>}
          </button>
          <button onClick={() => setView("neural")} className={`p-2.5 rounded-xl border transition-all ${view === "neural" ? "border-primary/30 bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}>
            <Network size={16} strokeWidth={1.5} />
          </button>
          <button onClick={() => setView("card")} className={`p-2.5 rounded-xl border transition-all ${view === "card" ? "border-primary/30 bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}>
            <LayoutGrid size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {people.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="ethereal-glass p-4 text-center">
            <p className="text-xl font-cinzel text-foreground">{avgQuality}</p>
            <p className="text-neural-label mt-0.5">Moyenne</p>
          </div>
          <div className="ethereal-glass p-4 text-center">
            <p className="text-xl font-cinzel text-primary">{highCount}</p>
            <p className="text-neural-label mt-0.5">Excellentes (≥8)</p>
          </div>
          <div className="ethereal-glass p-4 text-center">
            <p className="text-xl font-cinzel text-destructive">{lowCount}</p>
            <p className="text-neural-label mt-0.5">À surveiller (&lt;5)</p>
          </div>
        </div>
      )}

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleCreate} className="ethereal-glass p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-neural-label block mb-2">Nom</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Sarah Chen"
                className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors" />
            </div>
            <div>
              <label className="text-neural-label block mb-2">Poste</label>
              <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Directeur des opérations"
                className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-neural-label block mb-2">Qualité de la relation ({form.quality}/10)</label>
            <input type="range" min={1} max={10} value={form.quality} onChange={(e) => setForm({ ...form, quality: parseInt(e.target.value) })} className="w-full" />
          </div>
          <div>
            <label className="text-neural-label block mb-2">Observation</label>
            <input type="text" value={form.insight} onChange={(e) => setForm({ ...form, insight: e.target.value })} placeholder="Observations clés sur la relation..."
              className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors" />
          </div>
          <button type="submit" className="btn-neural"><Save size={14} /> Ajouter le contact</button>
        </motion.form>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : people.length === 0 ? (
        <div className="ethereal-glass p-12 text-center">
          <Users size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">Aucun contact. Ajoutez les personnes clés de votre réseau.</p>
        </div>
      ) : view === "neural" ? (
        <NeuralMap people={people} onPersonClick={openHistory} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((person, i) => {
            const localQ = localQualities[person.id] ?? person.quality;
            const changed = localQ !== person.quality;
            return (
              <motion.div key={person.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className={`ethereal-glass p-6 ${changed ? "ring-1 ring-primary/30" : ""}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-cinzel"
                      style={{ backgroundColor: `${qualityColor(localQ)}15`, border: `1px solid ${qualityColor(localQ)}30`, color: qualityColor(localQ) }}>
                      {person.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{person.name}</p>
                      <p className="text-neural-label">{person.role || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openHistory(person)} className="text-muted-foreground/40 hover:text-primary transition-colors p-1" title="Historique">
                      <TrendingUp size={14} />
                    </button>
                    <button onClick={() => handleDelete(person.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-neural-label">Relation</span>
                    <span className="text-xs font-cinzel" style={{ color: qualityColor(localQ) }}>{localQ}/10</span>
                  </div>
                  <input type="range" min={1} max={10} value={localQ}
                    onChange={(e) => handleLocalQualityChange(person.id, parseInt(e.target.value))}
                    className="w-full h-1 appearance-none rounded-full cursor-pointer" />
                </div>
                {person.insight && <p className="text-xs text-muted-foreground leading-relaxed">{person.insight}</p>}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* History Dialog */}
      <Dialog open={historyDialog.open} onOpenChange={(open) => { if (!open) setHistoryDialog({ open: false, person: null }); }}>
        <DialogContent className="ethereal-glass border-border/30 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Évolution — {historyDialog.person?.name}
            </DialogTitle>
            <DialogDescription>Qualité de la relation au fil du temps</DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 flex-wrap">
            {(Object.keys(periodLabels) as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border transition-all ${
                  period === p ? "border-primary/40 bg-primary/5 text-primary" : "border-border/30 text-muted-foreground hover:border-primary/30"
                }`}>
                {periodLabels[p]}
              </button>
            ))}
          </div>

          <div className="h-48 mt-2">
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 20%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(220 10% 45%)" }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "hsl(220 10% 45%)" }} />
                  <Tooltip contentStyle={{ background: "hsl(220 20% 12%)", border: "1px solid hsl(220 10% 20%)", borderRadius: "12px", fontSize: "12px" }} labelStyle={{ color: "hsl(220 10% 60%)" }} />
                  <Line type="monotone" dataKey="quality" stroke="hsl(176 70% 48%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(176 70% 48%)" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm text-center">
                  {chartData.length === 1 ? "Un seul point de donnée." : "Aucune donnée sur cette période."}
                </p>
              </div>
            )}
          </div>

          {historyDialog.person && (
            <div className="flex items-center justify-between pt-2 border-t border-border/20">
              <span className="text-neural-label">Qualité actuelle</span>
              <span className="text-lg font-cinzel" style={{ color: qualityColor(historyDialog.person.quality) }}>{historyDialog.person.quality}/10</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
