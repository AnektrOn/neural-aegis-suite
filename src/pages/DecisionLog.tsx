import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Clock, ArrowUpRight, Plus, X, Save, AlertTriangle, CheckCircle2, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import RadialSlider from "@/components/RadialSlider";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

interface Decision {
  id: string;
  name: string;
  priority: number;
  time_to_decide: string | null;
  responsibility: number;
  status: string;
  created_at: string;
  decided_at: string | null;
  deferred_until: string | null;
}

const priorityColor = (p: number) => {
  if (p >= 5) return "text-primary";
  if (p >= 3) return "text-neural-warm";
  return "text-muted-foreground";
};

const formatDuration = (createdAt: string, decidedAt: string) => {
  const diff = new Date(decidedAt).getTime() - new Date(createdAt).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}j ${hours % 24}h`;
  if (hours > 0) return `${hours}h`;
  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes}min`;
};

export default function DecisionLog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", priority: 3.0, responsibility: 5.0 });

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    decisionId: string | null;
    decisionName: string;
    targetStatus: string;
    deferredUntil: string;
    createdAt: string;
  }>({ open: false, decisionId: null, decisionName: "", targetStatus: "", deferredUntil: "", createdAt: "" });

  useEffect(() => {
    if (user) loadDecisions();
  }, [user]);

  const loadDecisions = async () => {
    const { data } = await supabase.from("decisions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    if (data) setDecisions(data as any);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("decisions").insert({ user_id: user.id, name: form.name, priority: Math.round(form.priority), responsibility: Math.round(form.responsibility) } as any);
    if (error) { toast({ title: t("toast.error"), description: error.message, variant: "destructive" }); }
    else { toast({ title: t("decisions.decisionRecorded") }); setShowForm(false); setForm({ name: "", priority: 3.0, responsibility: 5.0 }); loadDecisions(); }
  };

  // Step 1: open confirmation modal
  const requestStatusChange = (d: Decision, status: string) => {
    if (d.status === status) return;
    setConfirmModal({
      open: true,
      decisionId: d.id,
      decisionName: d.name,
      targetStatus: status,
      deferredUntil: "",
      createdAt: d.created_at,
    });
  };

  // Step 2: confirm and execute
  const confirmStatusChange = async () => {
    if (!confirmModal.decisionId) return;
    const updates: any = { status: confirmModal.targetStatus };

    if (confirmModal.targetStatus === "decided") {
      const now = new Date().toISOString();
      updates.decided_at = now;
      updates.time_to_decide = formatDuration(confirmModal.createdAt, now);
    }

    if (confirmModal.targetStatus === "deferred" && confirmModal.deferredUntil) {
      updates.deferred_until = new Date(confirmModal.deferredUntil).toISOString();
    }

    const { error } = await supabase.from("decisions").update(updates).eq("id", confirmModal.decisionId);
    if (error) {
      toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
    } else {
      const statusKey = { pending: "decisions.statusPending", decided: "decisions.statusDecided", deferred: "decisions.statusDeferred" } as const;
      toast({ title: `${t("decisions.statusUpdated")}: ${t(statusKey[confirmModal.targetStatus as keyof typeof statusKey])}` });
    }
    setConfirmModal({ open: false, decisionId: null, decisionName: "", targetStatus: "", deferredUntil: "", createdAt: "" });
    loadDecisions();
  };

  const openCount = decisions.filter((d) => d.status === "pending").length;
  const decidedThisWeek = decisions.filter((d) => {
    if (d.status !== "decided") return false;
    const week = new Date(); week.setDate(week.getDate() - 7);
    return new Date(d.created_at) > week;
  }).length;

  const statusLabels: Record<string, string> = {
    pending: t("decisions.statusPending"),
    decided: t("decisions.statusDecided"),
    deferred: t("decisions.statusDeferred"),
  };

  // Mobile: compact status pill labels
  const mobileStatusLabels: Record<string, string> = {
    pending: t("decisions.pillPending"),
    decided: t("decisions.pillDecided"),
    deferred: t("decisions.pillDeferred"),
  };

  const mobileStatusStyle = (s: string, isActive: boolean) => {
    if (!isActive) return "text-muted-foreground/30 border-transparent hover:border-border/20";
    if (s === "decided") return "text-primary border-primary/20 bg-primary/5";
    if (s === "pending") return "text-amber-400 border-amber-400/20 bg-amber-400/5";
    return "text-muted-foreground border-border bg-muted/20";
  };

  return (
    <div className={isMobile ? "space-y-3 max-w-full pb-6 pt-2" : "space-y-10 max-w-5xl"}>
      {/* Header */}
      <div className={`flex ${isMobile ? "items-start" : "flex-col sm:flex-row sm:items-start"} justify-between gap-3`}>
        {!isMobile && (
          <div>
            <p className="text-neural-label mb-3">{t("decisions.cognitiveArchitecture")}</p>
            <h1 className="text-neural-title text-2xl sm:text-3xl text-foreground">{t("decisions.journalTitle")}</h1>
          </div>
        )}
        {isMobile && (
          <div className="flex items-start justify-between gap-3 w-full">
            <div className="min-w-0 flex-1">
              <p className="text-[8px] text-muted-foreground/40 tracking-[0.2em] uppercase mb-0.5">{t("decisions.cognitiveArchitecture")}</p>
              <h1 className="text-neural-title text-xl text-foreground">{t("decisions.journalTitle")}</h1>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="shrink-0 w-11 h-11 rounded-2xl border border-accent/30 flex items-center justify-center text-accent/70 hover:bg-accent/5 transition-colors"
              aria-label={showForm ? t("general.cancel") : t("decisions.newDecision")}
              style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
            >
              {showForm ? <X size={18} strokeWidth={1.5} /> : <Plus size={18} strokeWidth={1.5} />}
            </button>
          </div>
        )}
        {!isMobile && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="btn-neural shrink-0"
          >
            {showForm ? <><X size={14} /> {t("general.cancel")}</> : <><Plus size={14} /> {t("decisions.newDecision")}</>}
          </button>
        )}
      </div>

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleCreate} className="ethereal-glass p-5 sm:p-8 space-y-5">
          <div>
            <label className="text-neural-label block mb-2">{t("decisions.decisionName")}</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder={t("decisions.placeholder")}
              className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors" />
          </div>
          <div className="flex justify-center gap-6 sm:gap-12">
            <RadialSlider value={form.priority} onChange={(v) => setForm({ ...form, priority: v })} min={0} max={5} step={0.1} size={isMobile ? 100 : 120} label={t("decisions.priority")} color="hsl(var(--neural-warm))" />
            <RadialSlider value={form.responsibility} onChange={(v) => setForm({ ...form, responsibility: v })} min={0} max={10} step={0.1} size={isMobile ? 100 : 120} label={t("decisions.weight")} color="hsl(var(--primary))" />
          </div>
          <button type="submit" className="btn-neural mx-auto"><Save size={14} /> {t("general.save")}</button>
        </motion.form>
      )}

      {/* Stats row — hidden on mobile to save space */}
      {!isMobile && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t("decisions.totalDecisions"), value: decisions.length, icon: Target },
            { label: t("decisions.openDecisions"), value: openCount, icon: Clock },
            { label: t("decisions.decidedThisWeek"), value: decidedThisWeek, icon: ArrowUpRight },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="ethereal-glass p-6">
              <stat.icon size={16} strokeWidth={1.5} className="text-primary mb-3" />
              <p className="text-2xl font-cinzel font-light text-foreground">{stat.value}</p>
              <p className="text-neural-label mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Mobile mini stats */}
      {isMobile && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t("decisions.mobileStatTotal"), value: decisions.length },
            { label: t("decisions.mobileStatOpen"), value: openCount },
            { label: t("decisions.mobileStatWeek"), value: decidedThisWeek },
          ].map((s) => (
            <div key={s.label} className="ethereal-glass p-2.5 text-center">
              <p className="text-base font-cinzel text-foreground">{s.value}</p>
              <p className="text-[8px] text-muted-foreground/50 uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Decision list */}
      <div className="space-y-2">
        {decisions.length === 0 && (
          <div className={`ethereal-glass ${isMobile ? "p-8" : "p-12"} text-center`}>
            <Target size={isMobile ? 24 : 32} strokeWidth={1} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">{t("decisions.noDecisions")}</p>
          </div>
        )}
        {decisions.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="ethereal-glass p-3 sm:p-6"
          >
            {/* Name row */}
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${d.status === "decided" ? "line-through text-muted-foreground/40" : "text-foreground"}`}>
                  {d.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <p className="text-[9px] text-muted-foreground/40">{new Date(d.created_at).toLocaleDateString("fr-FR")}</p>
                  <span className={`text-[9px] font-medium ${priorityColor(d.priority)}`}>P{d.priority}</span>
                  {d.status === "decided" && d.time_to_decide && (
                    <p className="text-[9px] text-primary flex items-center gap-1">
                      <CheckCircle2 size={9} /> {d.time_to_decide}
                    </p>
                  )}
                  {d.status === "deferred" && (d as any).deferred_until && (
                    <p className="text-[9px] text-neural-warm flex items-center gap-1">
                      <CalendarClock size={9} /> {new Date((d as any).deferred_until).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </p>
                  )}
                </div>
              </div>
              {/* Desktop meta */}
              {!isMobile && (
                <div className="hidden sm:flex gap-6">
                  <div className="text-center">
                    <p className="text-sm font-cinzel text-foreground">{d.time_to_decide || "—"}</p>
                    <p className="text-neural-label">{t("decisions.speed")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-cinzel text-foreground">{d.responsibility}/10</p>
                    <p className="text-neural-label">{t("decisions.weight")}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Status pills */}
            <div className="flex gap-1 mt-2.5 flex-wrap">
              {(["pending", "decided", "deferred"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => requestStatusChange(d, s)}
                  aria-label={`Marquer comme ${statusLabels[s]}`}
                  className={`text-[8px] uppercase tracking-[0.18em] px-2 py-1 rounded-full border transition-all ${
                    isMobile
                      ? mobileStatusStyle(s, d.status === s)
                      : d.status === s
                        ? s === "decided" ? "text-primary border-primary/20 bg-primary/5"
                          : s === "pending" ? "text-neural-warm border-neural-warm/20 bg-neural-warm/5"
                          : "text-muted-foreground border-border bg-muted/20"
                        : "text-muted-foreground/40 border-transparent hover:border-border/30"
                  }`}
                >
                  {isMobile ? mobileStatusLabels[s] : statusLabels[s]}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Confirmation Modal */}
      <Dialog open={confirmModal.open} onOpenChange={(open) => { if (!open) setConfirmModal(m => ({ ...m, open: false })); }}>
        <DialogContent className="ethereal-glass border-border/30 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              {confirmModal.targetStatus === "decided" ? (
                <><CheckCircle2 size={18} className="text-primary" /> {t("decisions.confirmDecision")}</>
              ) : confirmModal.targetStatus === "deferred" ? (
                <><CalendarClock size={18} className="text-neural-warm" /> {t("decisions.deferDecision")}</>
              ) : (
                <><AlertTriangle size={18} className="text-neural-warm" /> {t("decisions.putBackPending")}</>
              )}
            </DialogTitle>
            <DialogDescription>
              {confirmModal.decisionName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {confirmModal.targetStatus === "decided" && (
              <div className="ethereal-glass p-4 text-center">
                <p className="text-neural-label mb-1">{t("decisions.reflectionTime")}</p>
                <p className="text-xl font-cinzel text-primary">
                  {formatDuration(confirmModal.createdAt, new Date().toISOString())}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {t("decisions.sinceDate", { date: new Date(confirmModal.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) })}
                </p>
              </div>
            )}

            {confirmModal.targetStatus === "deferred" && (
              <div>
                <label className="text-neural-label block mb-2">{t("decisions.deferDateOptional")}</label>
                <input
                  type="date"
                  value={confirmModal.deferredUntil}
                  onChange={(e) => setConfirmModal(m => ({ ...m, deferredUntil: e.target.value }))}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full bg-secondary/30 border border-border/30 rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary/40 transition-colors"
                />
                <p className="text-[10px] text-muted-foreground mt-1">{t("decisions.deferHint")}</p>
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmModal(m => ({ ...m, open: false }))}
                className="text-[9px] uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-border text-muted-foreground hover:text-foreground transition-all"
              >
                {t("general.cancel")}
              </button>
              <button
                onClick={confirmStatusChange}
                className="btn-neural"
              >
                {confirmModal.targetStatus === "decided" ? t("general.confirm") : confirmModal.targetStatus === "deferred" ? t("decisions.defer") : t("general.confirm")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
