import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Network, LayoutGrid, Plus, X, Save, Trash2, TrendingUp, Send, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import NeuralMap from "@/components/NeuralMap";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  CONTACT_PROXIMITY_LABELS,
  CONTACT_PROXIMITY_VALUES,
  DEFAULT_CONTACT_PROXIMITY,
  type ContactProximity,
  normalizeContactProximity,
} from "@/lib/contactProximity";

type MapPeriod = "1d" | "3d" | "7d" | "14d" | "1m" | "3m" | "6m" | "1y" | "all";

const MAP_PERIOD_LABELS: Record<MapPeriod, string> = {
  "1d": "1J",
  "3d": "3J",
  "7d": "1 Sem",
  "14d": "2 Sem",
  "1m": "1 Mois",
  "3m": "Trim.",
  "6m": "Sem.",
  "1y": "Année",
  all: "Lifetime",
};

interface Person {
  id: string;
  name: string;
  role: string | null;
  quality: number;
  insight: string | null;
  proximity?: string | null;
}

interface QualityHistory {
  id: string;
  contact_id: string;
  quality: number;
  recorded_at: string;
  note: string | null;
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

export default function PeopleBoard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const periodLabels: Record<Period, string> = {
    "1d": t("people.periodDay"), "7d": t("people.period7d"), "30d": t("people.period30d"), "90d": t("people.period90d"),
    quarter: t("people.periodQuarter"), semester: t("people.periodSemester"), year: t("people.periodYear"),
  };
  const [view, setView] = useState<"neural" | "card">("card");
  const [people, setPeople] = useState<Person[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "",
    quality: 7,
    insight: "",
    proximity: DEFAULT_CONTACT_PROXIMITY as ContactProximity,
  });
  const [loading, setLoading] = useState(true);
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; person: Person | null }>({ open: false, person: null });
  const [history, setHistory] = useState<QualityHistory[]>([]);
  const [period, setPeriod] = useState<Period>("30d");

  // Local edits — quality + note per person
  const [localQualities, setLocalQualities] = useState<Record<string, number>>({});
  const [localProximities, setLocalProximities] = useState<Record<string, ContactProximity>>({});
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [mapPeriod, setMapPeriod] = useState<MapPeriod>("all");

  useEffect(() => { if (user) loadPeople(); }, [user]);

  const loadPeople = async () => {
    setLoading(true);
    const { data } = await supabase.from("people_contacts").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    if (data) {
      setPeople(data as any);
      const quals: Record<string, number> = {};
      const prox: Record<string, ContactProximity> = {};
      (data as any[]).forEach((p: Person) => {
        quals[p.id] = p.quality;
        prox[p.id] = normalizeContactProximity(p.proximity);
      });
      setLocalQualities(quals);
      setLocalProximities(prox);
      setLocalNotes({});
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("people_contacts").insert({
      user_id: user.id,
      name: form.name,
      role: form.role || null,
      quality: form.quality,
      insight: form.insight || null,
      proximity: form.proximity,
    } as any);
    if (error) { toast({ title: t("toast.error"), description: error.message, variant: "destructive" }); }
    else {
      toast({ title: t("people.contactAdded") });
      setShowForm(false);
      setForm({ name: "", role: "", quality: 7, insight: "", proximity: DEFAULT_CONTACT_PROXIMITY });
      loadPeople();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("people_contacts").delete().eq("id", id);
    loadPeople();
  };

  const handleLocalQualityChange = (id: string, quality: number) => {
    setLocalQualities(prev => ({ ...prev, [id]: quality }));
    setHasUnsavedChanges(true);
  };

  const handleLocalNoteChange = (id: string, note: string) => {
    setLocalNotes(prev => ({ ...prev, [id]: note }));
    setHasUnsavedChanges(true);
  };

  const handleLocalProximityChange = (id: string, proximity: ContactProximity) => {
    setLocalProximities(prev => ({ ...prev, [id]: proximity }));
    setHasUnsavedChanges(true);
  };

  const saveAllChanges = async () => {
    if (!user) return;
    const updates: Promise<any>[] = [];
    for (const person of people) {
      const newQ = localQualities[person.id] ?? person.quality;
      const newPx = localProximities[person.id] ?? normalizeContactProximity(person.proximity);
      const note = localNotes[person.id];
      const qualityChanged = newQ !== person.quality;
      const proximityChanged = newPx !== normalizeContactProximity(person.proximity);
      const hasNote = note && note.trim().length > 0;

      if (qualityChanged || proximityChanged) {
        updates.push((async () => {
          const patch: { quality?: number; proximity?: string } = {};
          if (qualityChanged) patch.quality = newQ;
          if (proximityChanged) patch.proximity = newPx;
          await supabase.from("people_contacts").update(patch as any).eq("id", person.id);
        })());
      }

      if (qualityChanged || hasNote) {
        updates.push((async () => {
          await supabase.from("relation_quality_history").insert({
            contact_id: person.id,
            user_id: user.id,
            quality: qualityChanged ? newQ : person.quality,
            note: hasNote ? note!.trim() : null,
          } as any);
        })());
      }
    }
    if (updates.length === 0) { toast({ title: t("common.noChangesToSave") }); return; }
    await Promise.all(updates);
    toast({ title: t("people.relationsUpdated", { count: updates.length }) });
    setHasUnsavedChanges(false);
    setLocalNotes({});
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
    note: h.note,
  }));

  const avgQuality = people.length > 0 ? (people.reduce((s, p) => s + p.quality, 0) / people.length).toFixed(1) : "—";
  const highCount = people.filter(p => p.quality >= 8).length;
  const lowCount = people.filter(p => p.quality < 5).length;

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg max-w-[200px]">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-cinzel" style={{ color: qualityColor(data.quality) }}>{data.quality}/10</p>
        {data.note && <p className="text-xs text-foreground mt-1 italic">"{data.note}"</p>}
      </div>
    );
  };

  return (
    <div className="space-y-10 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-neural-label mb-3">{t("people.relationalIntelligence")}</p>
          <h1 className="text-neural-title text-2xl sm:text-3xl text-foreground">{t("people.boardTitle")}</h1>
        </div>
        <div className="flex gap-2 items-center">
          {hasUnsavedChanges && (
            <button onClick={saveAllChanges} className="btn-neural shrink-0 animate-pulse">
              <Send size={14} /> {t("people.send")}
            </button>
          )}
          <button onClick={() => setShowForm(!showForm)} className="btn-neural shrink-0">
            {showForm ? <><X size={14} /> {t("general.cancel")}</> : <><Plus size={14} /> {t("common.add")}</>}
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
        <div className="flex flex-wrap items-center gap-5 py-1">
          <span className="text-[10px] uppercase tracking-[0.14em] text-white/20">
            Moy.{" "}
            <span className="ml-1 font-['Cormorant_Garamond'] text-[15px] text-white/50">{avgQuality}</span>
          </span>
          <span className="text-white/[0.08]">·</span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-white/20">
            Excellents{" "}
            <span className="ml-1 font-['Cormorant_Garamond'] text-[15px] text-white/50">{highCount}</span>
          </span>
          <span className="text-white/[0.08]">·</span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-white/20">
            À relancer{" "}
            <span className="ml-1 font-['Cormorant_Garamond'] text-[15px] text-white/50">{lowCount}</span>
          </span>
        </div>
      )}

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleCreate} className="ethereal-glass p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-neural-label block mb-2">{t("people.name")}</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Sarah Chen"
                className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors" />
            </div>
            <div>
              <label className="text-neural-label block mb-2">{t("people.role")}</label>
              <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Directeur des opérations"
                className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors" />
            </div>
          </div>
          <div>
            <label className="text-neural-label block mb-2">Niveau de proximité</label>
            <select
              value={form.proximity}
              onChange={(e) => setForm({ ...form, proximity: e.target.value as ContactProximity })}
              className="w-full rounded-xl border border-border/30 bg-secondary/30 px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/40"
            >
              {CONTACT_PROXIMITY_VALUES.map((v) => (
                <option key={v} value={v}>
                  {CONTACT_PROXIMITY_LABELS[v]}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[10px] text-muted-foreground/70">Détermine la distance au centre sur la carte relationnelle.</p>
          </div>
          <div>
            <label className="text-neural-label block mb-2">{t("people.qualityLabel", { value: form.quality })}</label>
            <input type="range" min={1} max={10} value={form.quality} onChange={(e) => setForm({ ...form, quality: parseInt(e.target.value) })} className="w-full" />
          </div>
          <div>
            <label className="text-neural-label block mb-2">{t("people.observation")}</label>
            <input type="text" value={form.insight} onChange={(e) => setForm({ ...form, insight: e.target.value })} placeholder="Observations clés sur la relation..."
              className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors" />
          </div>
          <button type="submit" className="btn-neural"><Save size={14} /> {t("common.addContact")}</button>
        </motion.form>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : people.length === 0 ? (
        <div className="ethereal-glass p-12 text-center">
          <Users size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">{t("common.noContactsHint")}</p>
        </div>
      ) : view === "neural" ? (
        <div>
          <div
            className="mb-0 flex overflow-x-auto border-b border-white/[0.06]"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {(Object.entries(MAP_PERIOD_LABELS) as [MapPeriod, string][]).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setMapPeriod(id)}
                className={[
                  "flex-shrink-0 whitespace-nowrap border-r border-white/[0.05] bg-transparent px-3 py-2 font-sans text-[9px] uppercase tracking-[0.14em] transition-colors",
                  mapPeriod === id
                    ? "border-b border-white/60 bg-white/[0.03] text-white/90"
                    : "text-white/20 hover:text-white/45",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
          <NeuralMap
            people={people}
            proximityById={localProximities}
            qualityById={localQualities}
            onPersonClick={openHistory}
            showFilters={false}
            period={mapPeriod}
            onPeriodChange={setMapPeriod}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((person, i) => {
            const localQ = localQualities[person.id] ?? person.quality;
            const localPx = localProximities[person.id] ?? normalizeContactProximity(person.proximity);
            const changed = localQ !== person.quality;
            const proxChanged = localPx !== normalizeContactProximity(person.proximity);
            const localNote = localNotes[person.id] ?? "";
            const hasChanges = changed || proxChanged || localNote.trim().length > 0;
            return (
              <motion.div key={person.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className={`ethereal-glass p-6 ${hasChanges ? "ring-1 ring-primary/30" : ""}`}>
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
                  <label className="text-neural-label mb-1 block">Proximité</label>
                  <select
                    value={localPx}
                    onChange={(e) => handleLocalProximityChange(person.id, e.target.value as ContactProximity)}
                    className="mb-3 w-full rounded-lg border border-border/25 bg-secondary/20 px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary/30"
                  >
                    {CONTACT_PROXIMITY_VALUES.map((v) => (
                      <option key={v} value={v}>
                        {CONTACT_PROXIMITY_LABELS[v]}
                      </option>
                    ))}
                  </select>
                  <div className="flex justify-between mb-1">
                    <span className="text-neural-label">Note de relation</span>
                    <span className="text-xs font-cinzel" style={{ color: qualityColor(localQ) }}>{localQ}/10</span>
                  </div>
                  <input type="range" min={1} max={10} value={localQ}
                    onChange={(e) => handleLocalQualityChange(person.id, parseInt(e.target.value))}
                    className="w-full h-1 appearance-none rounded-full cursor-pointer" />
                </div>
                {/* Note input */}
                <div className="mt-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <MessageSquare size={10} className="text-muted-foreground" />
                    <span className="text-neural-label">Note</span>
                  </div>
                  <textarea
                    value={localNote}
                    onChange={(e) => handleLocalNoteChange(person.id, e.target.value)}
                    placeholder="Ex: Bon moment partagé autour d'un café..."
                    rows={2}
                    className="w-full bg-secondary/20 border border-border/20 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/30 transition-colors resize-none"
                  />
                </div>
                {person.insight && <p className="text-xs text-muted-foreground leading-relaxed mt-2">{person.insight}</p>}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* History Dialog */}
      <Dialog open={historyDialog.open} onOpenChange={(open) => { if (!open) setHistoryDialog({ open: false, person: null }); }}>
        <DialogContent className="ethereal-glass border-border/30 sm:max-w-lg max-h-[85vh] overflow-y-auto">
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
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="quality" stroke="hsl(176 70% 48%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(176 70% 48%)" }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm text-center">
                  {chartData.length === 1 ? t("common.singleDataPoint") : t("common.noDataForPeriod")}
                </p>
              </div>
            )}
          </div>

          {/* History entries with notes */}
          {history.length > 0 && (
            <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
              <p className="text-neural-label mb-1">Journal des changements</p>
              {[...history].reverse().map((h) => (
                <div key={h.id} className="flex items-start gap-3 py-2 border-b border-border/10 last:border-0">
                  <div className="shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: qualityColor(h.quality) }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-cinzel" style={{ color: qualityColor(h.quality) }}>{h.quality}/10</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(h.recorded_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {h.note && <p className="text-xs text-foreground/80 mt-0.5 italic">"{h.note}"</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

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
