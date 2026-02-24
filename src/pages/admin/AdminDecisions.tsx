import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Clock, ArrowUpRight, Search, Filter, User, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminDecision {
  id: string;
  name: string;
  priority: number;
  responsibility: number;
  status: string;
  created_at: string;
  decided_at: string | null;
  time_to_decide: string | null;
  user_id: string;
  user_name?: string;
}

const statusLabels: Record<string, string> = { pending: "En attente", decided: "Décidée", deferred: "Reportée" };
const statusColors: Record<string, string> = {
  pending: "text-neural-warm border-neural-warm/20 bg-neural-warm/5",
  decided: "text-primary border-primary/20 bg-primary/5",
  deferred: "text-muted-foreground border-border bg-muted/20",
};

export default function AdminDecisions() {
  const { toast } = useToast();
  const [decisions, setDecisions] = useState<AdminDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => { loadDecisions(); }, []);

  const loadDecisions = async () => {
    setLoading(true);
    const { data: decs } = await supabase.from("decisions").select("*").order("created_at", { ascending: false });
    if (!decs) { setLoading(false); return; }

    // Get user names
    const userIds = [...new Set((decs as any[]).map(d => d.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
    const nameMap: Record<string, string> = {};
    (profiles || []).forEach((p: any) => { nameMap[p.id] = p.display_name || "Utilisateur"; });

    setDecisions((decs as any[]).map(d => ({ ...d, user_name: nameMap[d.user_id] || "Utilisateur" })));
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "decided") updates.decided_at = new Date().toISOString();
    const { error } = await supabase.from("decisions").update(updates).eq("id", id);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Statut mis à jour: ${statusLabels[status]}` });
    loadDecisions();
  };

  const filtered = decisions.filter(d => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.user_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: decisions.length,
    pending: decisions.filter(d => d.status === "pending").length,
    decided: decisions.filter(d => d.status === "decided").length,
    deferred: decisions.filter(d => d.status === "deferred").length,
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-neural-label mb-3">Supervision</p>
          <h1 className="text-neural-title text-2xl sm:text-3xl text-foreground">Décisions Utilisateurs</h1>
        </div>
        <button onClick={loadDecisions} className="btn-neural shrink-0"><RefreshCw size={14} /> Actualiser</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, icon: Target, color: "text-muted-foreground" },
          { label: "En attente", value: stats.pending, icon: Clock, color: "text-neural-warm" },
          { label: "Décidées", value: stats.decided, icon: ArrowUpRight, color: "text-primary" },
          { label: "Reportées", value: stats.deferred, icon: Filter, color: "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="ethereal-glass p-4 text-center">
            <s.icon size={16} strokeWidth={1.5} className={`${s.color} mx-auto mb-2`} />
            <p className="text-xl font-cinzel text-foreground">{s.value}</p>
            <p className="text-neural-label mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher décision ou utilisateur..."
            className="w-full pl-9 pr-4 py-2.5 bg-secondary/30 border border-border/30 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40" />
        </div>
        <div className="flex gap-2">
          {["all", "pending", "decided", "deferred"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-[9px] uppercase tracking-[0.2em] px-3 py-2 rounded-full border transition-all ${
                statusFilter === s ? "text-primary border-primary/30 bg-primary/5" : "text-muted-foreground border-border hover:border-muted-foreground/30"
              }`}>
              {s === "all" ? "Tout" : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Decisions list */}
      {loading ? (
        <div className="flex items-center justify-center h-32"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="ethereal-glass p-12 text-center">
          <Target size={32} strokeWidth={1} className="mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">Aucune décision trouvée.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className="ethereal-glass p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User size={12} className="text-muted-foreground shrink-0" />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{d.user_name}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                  <p className="text-neural-label mt-1">{new Date(d.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <div className="flex gap-4 items-center shrink-0">
                  <div className="text-center hidden sm:block">
                    <p className="text-sm font-cinzel text-foreground">P{d.priority}</p>
                    <p className="text-neural-label">Priorité</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className="text-sm font-cinzel text-foreground">{d.responsibility}/10</p>
                    <p className="text-neural-label">Poids</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {(["pending", "decided", "deferred"] as const).map(s => (
                  <button key={s} onClick={() => updateStatus(d.id, s)}
                    className={`text-[8px] uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border transition-all ${
                      d.status === s ? statusColors[s] : "text-muted-foreground/40 border-transparent hover:border-border/30"
                    }`}>
                    {statusLabels[s]}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
