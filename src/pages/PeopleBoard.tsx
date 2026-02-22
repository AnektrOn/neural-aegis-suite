import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Network, LayoutGrid, Plus, X, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Person {
  id: string;
  name: string;
  role: string | null;
  quality: number;
  insight: string | null;
}

const qualityColor = (q: number) => {
  if (q >= 8) return "hsl(180 70% 50%)";
  if (q >= 6) return "hsl(35 80% 55%)";
  return "hsl(0 70% 50%)";
};

export default function PeopleBoard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [view, setView] = useState<"neural" | "card">("card");
  const [people, setPeople] = useState<Person[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", quality: 7, insight: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadPeople();
  }, [user]);

  const loadPeople = async () => {
    setLoading(true);
    const { data } = await supabase.from("people_contacts" as any).select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    if (data) setPeople(data as any);
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("people_contacts" as any).insert({ user_id: user.id, name: form.name, role: form.role || null, quality: form.quality, insight: form.insight || null } as any);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Contact ajouté" }); setShowForm(false); setForm({ name: "", role: "", quality: 7, insight: "" }); loadPeople(); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("people_contacts" as any).delete().eq("id", id);
    loadPeople();
  };

  const updateQuality = async (id: string, quality: number) => {
    await supabase.from("people_contacts" as any).update({ quality } as any).eq("id", id);
    setPeople((prev) => prev.map((p) => (p.id === id ? { ...p, quality } : p)));
  };

  return (
    <div className="space-y-10 max-w-6xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-neural-label mb-3">Intelligence Relationnelle</p>
          <h1 className="text-neural-title text-3xl text-foreground">Tableau des Relations</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(!showForm)} className="btn-neural">
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="ethereal-glass p-8">
          <svg viewBox="0 0 600 400" className="w-full h-auto max-h-[500px]">
            <circle cx="300" cy="200" r="18" fill="hsl(180 70% 50% / 0.15)" stroke="hsl(180 70% 50% / 0.4)" strokeWidth="1">
              <animate attributeName="r" values="16;20;16" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="300" cy="200" r="6" fill="hsl(180 70% 50%)" />
            <text x="300" y="235" textAnchor="middle" fill="hsl(220 10% 45%)" fontSize="9" fontFamily="Cinzel" letterSpacing="0.3em">VOUS</text>
            {people.map((person, idx) => {
              const angle = (idx / people.length) * Math.PI * 2 - Math.PI / 2;
              const radius = 140;
              const cx = 300 + Math.cos(angle) * radius;
              const cy = 200 + Math.sin(angle) * radius;
              const color = qualityColor(person.quality);
              return (
                <g key={person.id}>
                  <line x1="300" y1="200" x2={cx} y2={cy} stroke={color} strokeWidth="0.8" opacity="0.3" />
                  <circle cx={cx} cy={cy} r="10" fill={`${color}20`} stroke={`${color}50`} strokeWidth="0.8">
                    <animate attributeName="opacity" values="0.6;1;0.6" dur={`${3 + idx * 0.5}s`} repeatCount="indefinite" />
                  </circle>
                  <circle cx={cx} cy={cy} r="3" fill={color} />
                  <text x={cx} y={cy + 22} textAnchor="middle" fill="hsl(210 20% 88%)" fontSize="8" fontFamily="Space Grotesk" fontWeight="500">{person.name.split(" ")[0]}</text>
                  <text x={cx} y={cy + 33} textAnchor="middle" fill="hsl(220 10% 45%)" fontSize="7" fontFamily="Space Grotesk">{person.quality}/10</text>
                </g>
              );
            })}
          </svg>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((person, i) => (
            <motion.div key={person.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="ethereal-glass p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-cinzel"
                    style={{ backgroundColor: `${qualityColor(person.quality)}15`, border: `1px solid ${qualityColor(person.quality)}30`, color: qualityColor(person.quality) }}>
                    {person.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{person.name}</p>
                    <p className="text-neural-label">{person.role || "—"}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(person.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="mb-3">
                <div className="flex justify-between mb-1">
                  <span className="text-neural-label">Relation</span>
                  <span className="text-xs font-cinzel" style={{ color: qualityColor(person.quality) }}>{person.quality}/10</span>
                </div>
                <input type="range" min={1} max={10} value={person.quality} onChange={(e) => updateQuality(person.id, parseInt(e.target.value))} className="w-full h-1 appearance-none rounded-full cursor-pointer" />
              </div>
              {person.insight && <p className="text-xs text-muted-foreground leading-relaxed">{person.insight}</p>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
