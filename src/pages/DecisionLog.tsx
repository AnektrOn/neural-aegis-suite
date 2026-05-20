import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Clock, ArrowUpRight, Plus, X, Save, AlertTriangle, CheckCircle2, CalendarClock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import RadialSlider from "@/components/RadialSlider";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  DecisionCard,
  DecisionEmptyState,
  DecisionMetaBadge,
  DecisionPageStat,
  DecisionSection,
  decisionFieldClass,
  decisionLabelClass,
} from "@/components/decisions/DecisionLogUi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

const priorityTone = (p: number) => {
  if (p >= 5) return "text-primary border-primary/30 bg-primary/5";
  if (p >= 3) return "text-neural-warm border-neural-warm/30 bg-neural-warm/5";
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

function statusButtonClass(status: string, active: boolean) {
  if (!active) {
    return "border-transparent bg-transparent text-muted-foreground/50 hover:border-border/40 hover:text-muted-foreground";
  }
  if (status === "decided") return "border-primary/30 bg-primary/10 text-primary";
  if (status === "pending") return "border-amber-400/30 bg-amber-400/10 text-amber-400";
  return "border-border bg-muted/30 text-muted-foreground";
}

export default function DecisionLog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";

  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", priority: 3.0, responsibility: 5.0 });

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    decisionId: string | null;
    decisionName: string;
    targetStatus: string;
    deferredUntil: string;
    createdAt: string;
  }>({
    open: false,
    decisionId: null,
    decisionName: "",
    targetStatus: "",
    deferredUntil: "",
    createdAt: "",
  });

  useEffect(() => {
    if (user) loadDecisions();
  }, [user]);

  const loadDecisions = async () => {
    const { data } = await supabase
      .from("decisions")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setDecisions(data as Decision[]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("decisions").insert({
      user_id: user.id,
      name: form.name,
      priority: Math.round(form.priority),
      responsibility: Math.round(form.responsibility),
    } as any);
    if (error) {
      toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("decisions.decisionRecorded") });
      setShowForm(false);
      setForm({ name: "", priority: 3.0, responsibility: 5.0 });
      loadDecisions();
    }
  };

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

  const confirmStatusChange = async () => {
    if (!confirmModal.decisionId) return;
    const updates: Record<string, string> = { status: confirmModal.targetStatus };

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
      const statusKey = {
        pending: "decisions.statusPending",
        decided: "decisions.statusDecided",
        deferred: "decisions.statusDeferred",
      } as const;
      toast({
        title: `${t("decisions.statusUpdated")}: ${t(statusKey[confirmModal.targetStatus as keyof typeof statusKey])}`,
      });
    }
    setConfirmModal({
      open: false,
      decisionId: null,
      decisionName: "",
      targetStatus: "",
      deferredUntil: "",
      createdAt: "",
    });
    loadDecisions();
  };

  const openCount = decisions.filter((d) => d.status === "pending").length;
  const decidedThisWeek = decisions.filter((d) => {
    if (d.status !== "decided") return false;
    const week = new Date();
    week.setDate(week.getDate() - 7);
    return new Date(d.created_at) > week;
  }).length;

  const statusLabels: Record<string, string> = {
    pending: t("decisions.statusPending"),
    decided: t("decisions.statusDecided"),
    deferred: t("decisions.statusDeferred"),
  };

  const formatShortDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-16 md:space-y-10">
      <header className="space-y-4 border-b border-border/40 pb-6 md:pb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {t("decisions.cognitiveArchitecture")}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {t("decisions.journalTitle")}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {t("decisions.pageSubtitle")}
            </p>
          </div>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="size-11 shrink-0 rounded-xl md:hidden"
            onClick={() => setShowForm(!showForm)}
            aria-label={showForm ? t("general.cancel") : t("decisions.newDecision")}
          >
            {showForm ? <X className="size-5" aria-hidden /> : <Plus className="size-5" aria-hidden />}
          </Button>
        </div>
        <Button
          type="button"
          className="hidden w-full sm:w-auto md:inline-flex"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? (
            <>
              <X className="size-4" aria-hidden /> {t("general.cancel")}
            </>
          ) : (
            <>
              <Plus className="size-4" aria-hidden /> {t("decisions.newDecision")}
            </>
          )}
        </Button>
      </header>

      <AnimatePresence mode="wait">
        {showForm && (
          <motion.form
            key="decision-form"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onSubmit={handleCreate}
            className="ethereal-glass space-y-6 p-5 md:p-8"
          >
            <h2 className="text-base font-semibold text-foreground">{t("decisions.newFormSection")}</h2>
            <div className="space-y-2">
              <label htmlFor="decision-name" className={decisionLabelClass}>
                {t("decisions.decisionName")}
              </label>
              <input
                id="decision-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder={t("decisions.placeholder")}
                className={decisionFieldClass}
              />
            </div>
            <div className="flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-12">
              <RadialSlider
                value={form.priority}
                onChange={(v) => setForm({ ...form, priority: v })}
                min={0}
                max={5}
                step={0.1}
                size={120}
                label={t("decisions.priority")}
                color="hsl(var(--neural-warm))"
              />
              <RadialSlider
                value={form.responsibility}
                onChange={(v) => setForm({ ...form, responsibility: v })}
                min={0}
                max={10}
                step={0.1}
                size={120}
                label={t("decisions.weight")}
                color="hsl(var(--primary))"
              />
            </div>
            <Button type="submit" className="mx-auto w-full sm:w-auto">
              <Save className="size-4" aria-hidden />
              {t("general.save")}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4" aria-label={t("decisions.cognitiveArchitecture")}>
        <DecisionPageStat label={t("decisions.totalDecisions")} value={decisions.length} icon={Target} />
        <DecisionPageStat label={t("decisions.openDecisions")} value={openCount} icon={Clock} />
        <DecisionPageStat label={t("decisions.decidedThisWeek")} value={decidedThisWeek} icon={ArrowUpRight} />
      </section>

      <DecisionSection title={t("decisions.listSection")}>
        {decisions.length === 0 ? (
          <DecisionEmptyState icon={Target} title={t("decisions.noDecisions")} />
        ) : (
          <ul className="grid gap-4 md:gap-5">
            {decisions.map((d, i) => (
              <motion.li
                key={d.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
              >
                <DecisionCard
                  footer={
                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {t("decisions.statusActions")}
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {(["pending", "decided", "deferred"] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => requestStatusChange(d, s)}
                            aria-label={`${t("decisions.statusActions")}: ${statusLabels[s]}`}
                            aria-pressed={d.status === s}
                            className={cn(
                              "min-h-11 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              statusButtonClass(s, d.status === s),
                            )}
                          >
                            {statusLabels[s]}
                          </button>
                        ))}
                      </div>
                    </div>
                  }
                >
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <h3
                          className={cn(
                            "text-base font-semibold leading-snug md:text-lg",
                            d.status === "decided"
                              ? "text-muted-foreground/50 line-through"
                              : "text-foreground",
                          )}
                        >
                          {d.name}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <DecisionMetaBadge>{formatShortDate(d.created_at)}</DecisionMetaBadge>
                          <DecisionMetaBadge className={priorityTone(d.priority)}>
                            {t("decisions.priority")} {d.priority}
                          </DecisionMetaBadge>
                          <DecisionMetaBadge variant="secondary">
                            {t("decisions.weight")} {d.responsibility}/10
                          </DecisionMetaBadge>
                          {d.status === "decided" && d.time_to_decide ? (
                            <DecisionMetaBadge className="border-primary/30 bg-primary/5 text-primary">
                              <CheckCircle2 className="mr-1 inline size-3" aria-hidden />
                              {d.time_to_decide}
                            </DecisionMetaBadge>
                          ) : null}
                          {d.status === "deferred" && d.deferred_until ? (
                            <DecisionMetaBadge className="border-neural-warm/30 bg-neural-warm/5 text-neural-warm">
                              <CalendarClock className="mr-1 inline size-3" aria-hidden />
                              {formatShortDate(d.deferred_until)}
                            </DecisionMetaBadge>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-6 sm:gap-8">
                        <div className="text-center">
                          <p className="text-lg font-semibold tabular-nums text-foreground">
                            {d.time_to_decide || "—"}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{t("decisions.speed")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </DecisionCard>
              </motion.li>
            ))}
          </ul>
        )}
      </DecisionSection>

      <Dialog
        open={confirmModal.open}
        onOpenChange={(open) => {
          if (!open) setConfirmModal((m) => ({ ...m, open: false }));
        }}
      >
        <DialogContent className="ethereal-glass border-border/30 sm:max-w-md">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="flex items-center gap-2 text-lg text-foreground">
              {confirmModal.targetStatus === "decided" ? (
                <>
                  <CheckCircle2 className="size-5 text-primary" aria-hidden />
                  {t("decisions.confirmDecision")}
                </>
              ) : confirmModal.targetStatus === "deferred" ? (
                <>
                  <CalendarClock className="size-5 text-neural-warm" aria-hidden />
                  {t("decisions.deferDecision")}
                </>
              ) : (
                <>
                  <AlertTriangle className="size-5 text-neural-warm" aria-hidden />
                  {t("decisions.putBackPending")}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">{confirmModal.decisionName}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {confirmModal.targetStatus === "decided" && (
              <div className="ethereal-glass space-y-1 p-5 text-center">
                <p className="text-sm text-muted-foreground">{t("decisions.reflectionTime")}</p>
                <p className="text-2xl font-semibold text-primary">
                  {formatDuration(confirmModal.createdAt, new Date().toISOString())}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("decisions.sinceDate", {
                    date: new Date(confirmModal.createdAt).toLocaleDateString(dateLocale, {
                      day: "numeric",
                      month: "short",
                    }),
                  })}
                </p>
              </div>
            )}

            {confirmModal.targetStatus === "deferred" && (
              <div className="space-y-2">
                <label htmlFor="defer-date" className={decisionLabelClass}>
                  {t("decisions.deferDateOptional")}
                </label>
                <input
                  id="defer-date"
                  type="date"
                  value={confirmModal.deferredUntil}
                  onChange={(e) => setConfirmModal((m) => ({ ...m, deferredUntil: e.target.value }))}
                  min={new Date().toISOString().split("T")[0]}
                  className={decisionFieldClass}
                />
                <p className="text-xs leading-relaxed text-muted-foreground">{t("decisions.deferHint")}</p>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmModal((m) => ({ ...m, open: false }))}
              >
                {t("general.cancel")}
              </Button>
              <Button type="button" onClick={confirmStatusChange}>
                {confirmModal.targetStatus === "decided"
                  ? t("general.confirm")
                  : confirmModal.targetStatus === "deferred"
                    ? t("decisions.defer")
                    : t("general.confirm")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
