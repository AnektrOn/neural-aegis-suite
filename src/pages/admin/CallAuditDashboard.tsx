import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, Search, Plus, X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  display_name: string | null;
}

interface AuditCall {
  id: string;
  user_id: string;
  call_date: string;
  leadership_score: number | null;
  emotional_baseline: number | null;
  decision_style: string | null;
  key_challenges: string | null;
  goals: string | null;
  notes: string | null;
}

export default function CallAuditDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [audits, setAudits] = useState<AuditCall[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [form, setForm] = useState({
    leadership_score: 5,
    emotional_baseline: 5,
    decision_style: "",
    key_challenges: "",
    goals: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [profilesRes, auditsRes] = await Promise.all([
      supabase.from("profiles").select("id, display_name"),
      supabase.from("audit_calls" as any).select("*").order("call_date", { ascending: false }),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data);
    if (auditsRes.data) setAudits(auditsRes.data as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !user) return;

    const { error } = await supabase.from("audit_calls" as any).insert({
      user_id: selectedUserId,
      conducted_by: user.id,
      leadership_score: form.leadership_score,
      emotional_baseline: form.emotional_baseline,
      decision_style: form.decision_style || null,
      key_challenges: form.key_challenges || null,
      goals: form.goals || null,
      notes: form.notes || null,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Audit Recorded", description: "First audit call has been logged." });
      setShowForm(false);
      setForm({ leadership_score: 5, emotional_baseline: 5, decision_style: "", key_challenges: "", goals: "", notes: "" });
      loadData();
    }
  };

  const getProfileName = (id: string) => profiles.find((p) => p.id === id)?.display_name || "Unknown";

  const filteredAudits = audits.filter((a) =>
    getProfileName(a.user_id).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-neural-label mb-3 text-neural-accent/60">Administration</p>
          <h1 className="text-neural-title text-2xl sm:text-3xl text-foreground">Call Audit Dashboard</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-neural shrink-0">
          {showForm ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Audit</>}
        </button>
      </div>

      {/* New Audit Form */}
      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="ethereal-glass p-8 space-y-6"
          style={{ borderColor: "hsla(270, 50%, 55%, 0.15)" }}
        >
          <p className="text-neural-label text-neural-accent/60">Record First Audit Call</p>

          {/* User selection */}
          <div>
            <label className="text-neural-label block mb-2">Select Leader</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              required
              className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-neural-accent/40 transition-colors"
            >
              <option value="">Choose a user...</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.display_name || p.id}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Leadership Score */}
            <div>
              <label className="text-neural-label block mb-2">Leadership Score ({form.leadership_score}/10)</label>
              <input
                type="range" min={1} max={10}
                value={form.leadership_score}
                onChange={(e) => setForm({ ...form, leadership_score: parseInt(e.target.value) })}
                className="w-full accent-neural-accent"
              />
            </div>

            {/* Emotional Baseline */}
            <div>
              <label className="text-neural-label block mb-2">Emotional Baseline ({form.emotional_baseline}/10)</label>
              <input
                type="range" min={1} max={10}
                value={form.emotional_baseline}
                onChange={(e) => setForm({ ...form, emotional_baseline: parseInt(e.target.value) })}
                className="w-full accent-neural-accent"
              />
            </div>
          </div>

          {/* Text fields */}
          {[
            { key: "decision_style", label: "Decision Style" },
            { key: "key_challenges", label: "Key Challenges" },
            { key: "goals", label: "Goals" },
            { key: "notes", label: "Notes" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="text-neural-label block mb-2">{label}</label>
              <textarea
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                rows={2}
                className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/40 transition-colors resize-none"
              />
            </div>
          ))}

          <button type="submit" className="btn-neural">
            <Save size={14} /> Save Audit
          </button>
        </motion.form>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by leader name..."
          className="w-full bg-secondary/20 border border-border/20 rounded-xl pl-12 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neural-accent/30 transition-colors"
        />
      </div>

      {/* Audit List */}
      <div className="space-y-3">
        {filteredAudits.length === 0 && (
          <div className="ethereal-glass p-12 text-center">
            <Phone size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No audit calls recorded yet.</p>
          </div>
        )}
        {filteredAudits.map((audit, i) => (
          <motion.div
            key={audit.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="ethereal-glass p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-foreground">{getProfileName(audit.user_id)}</p>
                <p className="text-neural-label mt-1">{new Date(audit.call_date).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-lg font-cinzel text-neural-accent">{audit.leadership_score}</p>
                  <p className="text-neural-label">Leadership</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-cinzel text-primary">{audit.emotional_baseline}</p>
                  <p className="text-neural-label">Emotion</p>
                </div>
              </div>
            </div>
            {audit.goals && (
              <p className="text-xs text-muted-foreground"><span className="text-neural-label">Goals:</span> {audit.goals}</p>
            )}
            {audit.key_challenges && (
              <p className="text-xs text-muted-foreground mt-1"><span className="text-neural-label">Challenges:</span> {audit.key_challenges}</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
