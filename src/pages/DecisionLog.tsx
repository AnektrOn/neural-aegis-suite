import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, CheckCircle2, CalendarClock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDecisionJournal } from "@/hooks/useDecisionJournal";
import { formatDecisionDuration, type DecisionRecord } from "@/lib/decisionAnalytics";
import { DecisionDashboard } from "@/components/decisions/DecisionDashboard";
import { DecisionQuickForm, DecisionQuickAddFab } from "@/components/decisions/DecisionQuickForm";
import {
  DecisionCard,
  DecisionEmptyState,
  DecisionMetaBadge,
  DecisionSection,
  decisionFieldClass,
  decisionLabelClass,
} from "@/components/decisions/DecisionLogUi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MemberPageHeader } from "@/components/ui/MemberPageHeader";
import { MemberPageScaffold } from "@/layouts/MemberPageScaffold";
import { MemberSplitLayout } from "@/layouts/MemberSplitLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type TabId = "dashboard" | "journal";
type FilterId = "all" | "pending" | "decided" | "deferred";

const priorityTone = (p: number) => {
  if (p >= 5) return "text-[#c9a24b] border-[#c9a24b]/40 bg-[#c9a24b]/10 font-mono";
  if (p >= 3) return "text-amber-300 border-amber-400/30 bg-amber-400/10 font-mono";
  return "text-muted-foreground border-white/5 bg-white/5 font-mono";
};

function statusButtonClass(status: string, active: boolean) {
  if (!active) {
    return "border-transparent bg-transparent text-muted-foreground/50 hover:border-white/10 hover:text-muted-foreground";
  }
  if (status === "decided") return "border-[#c9a24b]/50 bg-[#c9a24b]/20 text-[#c9a24b] font-semibold shadow-sm";
  if (status === "pending") return "border-amber-400/40 bg-amber-400/15 text-amber-300 font-semibold";
  return "border-white/20 bg-white/10 text-foreground font-semibold";
}

export default function DecisionLog() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useLanguage();
  const isMobile = useIsMobile();
  const dateLocale = locale === "fr" ? "fr-FR" : "en-US";

  const statusLabels = useMemo(
    () => ({
      pending: t("decisions.statusPending"),
      decided: t("decisions.statusDecided"),
      deferred: t("decisions.statusDeferred"),
    }),
    [t],
  );

  const {
    decisions,
    analytics,
    isLoading,
    createMutation,
    updateStatusMutation,
  } = useDecisionJournal(user?.id, statusLabels, dateLocale);

  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [filter, setFilter] = useState<FilterId>("pending");
  const [showQuickForm, setShowQuickForm] = useState(!isMobile);

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    decision: DecisionRecord | null;
    targetStatus: string;
    deferredUntil: string;
  }>({ open: false, decision: null, targetStatus: "", deferredUntil: "" });

  const filtered = useMemo(() => {
    if (filter === "all") return decisions;
    return decisions.filter((d) => d.status === filter);
  }, [decisions, filter]);

  const formatShortDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" });

  const handleQuickCreate = async (data: { name: string; priority: number; responsibility: number }) => {
    try {
      await createMutation.mutateAsync(data);
      toast({ title: t("decisions.decisionRecorded") });
      setShowQuickForm(false);
      setActiveTab("journal");
      setFilter("pending");
    } catch (e) {
      toast({
        title: t("toast.error"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  const requestStatusChange = (d: DecisionRecord, status: string) => {
    if (d.status === status) return;
    if (status === "decided" || status === "deferred") {
      setConfirmModal({ open: true, decision: d, targetStatus: status, deferredUntil: "" });
      return;
    }
    void applyStatusChange(d, status);
  };

  const applyStatusChange = async (
    d: DecisionRecord,
    status: string,
    deferredUntil?: string,
  ) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: d.id,
        status,
        createdAt: d.created_at,
        deferredUntil,
      });
      const statusKey = {
        pending: "decisions.statusPending",
        decided: "decisions.statusDecided",
        deferred: "decisions.statusDeferred",
      } as const;
      toast({
        title: `${t("decisions.statusUpdated")}: ${t(statusKey[status as keyof typeof statusKey])}`,
      });
    } catch (e) {
      toast({
        title: t("toast.error"),
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    }
  };

  const confirmStatusChange = async () => {
    if (!confirmModal.decision) return;
    await applyStatusChange(
      confirmModal.decision,
      confirmModal.targetStatus,
      confirmModal.deferredUntil || undefined,
    );
    setConfirmModal({ open: false, decision: null, targetStatus: "", deferredUntil: "" });
  };

  const filterPills: { id: FilterId; label: string }[] = [
    { id: "all", label: t("decisions.filterAll") },
    { id: "pending", label: t("decisions.filterPending") },
    { id: "decided", label: t("decisions.filterDecided") },
    { id: "deferred", label: t("decisions.filterDeferred") },
  ];

  const tabClass = (id: TabId) =>
    cn(
      "min-h-11 flex-1 rounded-xl border px-3 py-2.5 font-cinzel text-xs font-semibold uppercase tracking-[0.12em] transition-all duration-200",
      activeTab === id
        ? "border-[#9e7828]/40 bg-[#9e7828]/10 text-[#9e7828] dark:border-[#c9a24b]/40 dark:bg-[#c9a24b]/15 dark:text-[#c9a24b]"
        : "border-black/8 dark:border-white/8 bg-black/[0.02] dark:bg-white/[0.02] text-muted-foreground hover:border-[#c9a24b]/25",
    );

  if (isLoading && decisions.length === 0) {
    return (
      <MemberPageScaffold>
        <div className="flex h-64 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
      </MemberPageScaffold>
    );
  }

  const desktopLeftPane = (
    <div className="space-y-5">
      <MemberPageHeader
        kicker="ARCHITECTURE COGNITIVE · DÉCISIONNEL"
        title={t("decisions.journalTitle")}
        subtitle={t("decisions.pageSubtitle")}
      />

      {/* Decision Telemetry Strip */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="aegis-dock-tile rounded-2xl p-3.5 text-center shadow-md">
          <p className="font-cormorant text-2xl font-light text-amber-400 tabular-nums">
            {analytics.pendingCount}
          </p>
          <p className="font-cinzel text-[8.5px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
            {t("decisions.openDecisions")}
          </p>
        </div>
        <div className="aegis-dock-tile rounded-2xl p-3.5 text-center shadow-md">
          <p className="font-cormorant text-2xl font-light text-[#c9a24b] tabular-nums">
            {analytics.decidedThisWeek}
          </p>
          <p className="font-cinzel text-[8.5px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
            {t("decisions.decidedThisWeek")}
          </p>
        </div>
        <div className="aegis-dock-tile rounded-2xl p-3.5 text-center shadow-md">
          <p className="font-cormorant text-2xl font-light text-foreground truncate">
            {analytics.avgResolutionHours > 0
              ? analytics.avgResolutionHours >= 48
                ? `${Math.round(analytics.avgResolutionHours / 24)}j`
                : `${Math.round(analytics.avgResolutionHours)}h`
              : "—"}
          </p>
          <p className="font-cinzel text-[8.5px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
            {t("decisions.avgResolution")}
          </p>
        </div>
      </div>

      {/* Quick Add Form */}
      <div>
        <DecisionQuickForm
          onSubmit={handleQuickCreate}
          isPending={createMutation.isPending}
          labels={{
            title: t("decisions.quickAdd"),
            name: t("decisions.decisionName"),
            placeholder: t("decisions.placeholder"),
            priority: t("decisions.priority"),
            save: t("general.save"),
          }}
        />
      </div>
    </div>
  );

  const desktopRightPane = (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
        <div className="flex flex-wrap gap-2">
          {filterPills.map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setFilter(pill.id)}
              aria-pressed={filter === pill.id}
              className={cn(
                "min-h-9 rounded-xl border px-3.5 py-1.5 font-cinzel text-[10px] font-semibold tracking-[0.14em] uppercase transition-all cursor-pointer",
                filter === pill.id
                  ? "border-[#c9a24b]/50 bg-[#c9a24b]/20 text-[#c9a24b] shadow-sm"
                  : "border-white/5 bg-black/25 text-muted-foreground hover:border-white/15 hover:text-foreground",
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>
        <span className="font-mono text-xs text-muted-foreground">
          {filtered.length} {filtered.length > 1 ? "décisions" : "décision"}
        </span>
      </div>

      {/* Decisions List */}
      <DecisionSection title={t("decisions.listSection")}>
        {filtered.length === 0 ? (
          <DecisionEmptyState icon={Target} title={t("decisions.noDecisions")} />
        ) : (
          <ul className="grid gap-3">
            {filtered.map((d, i) => (
              <motion.li
                key={d.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.25) }}
              >
                <DecisionCard
                  footer={
                    <div className="grid grid-cols-3 gap-2">
                      {(["pending", "decided", "deferred"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          disabled={updateStatusMutation.isPending}
                          onClick={() => requestStatusChange(d, s)}
                          aria-pressed={d.status === s}
                          className={cn(
                            "min-h-10 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                            statusButtonClass(s, d.status === s),
                          )}
                        >
                          {statusLabels[s]}
                        </button>
                      ))}
                    </div>
                  }
                >
                  <div className="space-y-2">
                    <h3
                      className={cn(
                        "text-sm font-semibold leading-snug",
                        d.status === "decided"
                          ? "text-muted-foreground/50 line-through"
                          : "text-foreground",
                      )}
                    >
                      {d.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      <DecisionMetaBadge>{formatShortDate(d.created_at)}</DecisionMetaBadge>
                      <DecisionMetaBadge className={priorityTone(d.priority)}>
                        {t("decisions.priority")} {d.priority}
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
                </DecisionCard>
              </motion.li>
            ))}
          </ul>
        )}
      </DecisionSection>
    </div>
  );

  return (
    <MemberPageScaffold
      width={isMobile ? "default" : "wide"}
      viewport={!isMobile}
      className={cn("space-y-6 md:space-y-8", !isMobile && "min-w-0 overflow-x-hidden")}
    >
      {isMobile ? (
        <>
          <header className="space-y-4 border-b border-border/30 pb-6">
            <MemberPageHeader
              kicker={t("decisions.cognitiveArchitecture")}
              title={t("decisions.journalTitle")}
              subtitle={t("decisions.pageSubtitle")}
            />

            <div className="flex gap-2" role="tablist" aria-label={t("decisions.journalTitle")}>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "dashboard"}
                className={tabClass("dashboard")}
                onClick={() => setActiveTab("dashboard")}
              >
                {t("decisions.tabDashboard")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "journal"}
                className={tabClass("journal")}
                onClick={() => setActiveTab("journal")}
              >
                {t("decisions.tabJournal")}
                {analytics.pendingCount > 0 && (
                  <span className="ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full bg-warning/20 px-1.5 text-[10px] font-semibold text-warning">
                    {analytics.pendingCount}
                  </span>
                )}
              </button>
            </div>
          </header>

          {activeTab === "dashboard" && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <DecisionDashboard
                analytics={analytics}
                locale={locale}
                labels={{
                  total: t("decisions.totalDecisions"),
                  open: t("decisions.openDecisions"),
                  week: t("decisions.decidedThisWeek"),
                  deferred: t("decisions.deferredCount"),
                  chartStatus: t("decisions.chartStatus"),
                  chartWeekly: t("decisions.chartWeekly"),
                  chartPriority: t("decisions.chartPriority"),
                  avgResolution: t("decisions.avgResolution"),
                  oldestPending: t("decisions.oldestPending"),
                  emptyCharts: t("decisions.emptyCharts"),
                }}
              />
            </motion.div>
          )}

          {activeTab === "journal" && (
            <motion.div
              className="space-y-5"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AnimatePresence>
                {showQuickForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <DecisionQuickForm
                      onSubmit={handleQuickCreate}
                      isPending={createMutation.isPending}
                      labels={{
                        title: t("decisions.quickAdd"),
                        name: t("decisions.decisionName"),
                        placeholder: t("decisions.placeholder"),
                        priority: t("decisions.priority"),
                        save: t("general.save"),
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-nowrap overflow-x-auto no-scrollbar gap-2 pb-1">
                {filterPills.map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setFilter(pill.id)}
                    aria-pressed={filter === pill.id}
                    className={cn(
                      "shrink-0 min-h-10 rounded-full border px-3.5 py-2 font-display text-[10px] tracking-[0.14em] uppercase transition-colors whitespace-nowrap",
                      filter === pill.id
                        ? "border-primary/35 bg-primary/10 text-primary"
                        : "border-border/40 text-muted-foreground hover:border-primary/20",
                    )}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <DecisionSection title={t("decisions.listSection")}>
                {filtered.length === 0 ? (
                  <DecisionEmptyState icon={Target} title={t("decisions.noDecisions")} />
                ) : (
                  <ul className="grid gap-3 md:gap-4">
                    {filtered.map((d, i) => (
                      <motion.li
                        key={d.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.03, 0.25) }}
                      >
                        <DecisionCard
                          footer={
                            <div className="grid grid-cols-3 gap-2">
                              {(["pending", "decided", "deferred"] as const).map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  disabled={updateStatusMutation.isPending}
                                  onClick={() => requestStatusChange(d, s)}
                                  aria-pressed={d.status === s}
                                  className={cn(
                                    "min-h-11 rounded-lg border px-2 py-2 text-xs font-medium transition-colors sm:text-sm",
                                    statusButtonClass(s, d.status === s),
                                  )}
                                >
                                  {statusLabels[s]}
                                </button>
                              ))}
                            </div>
                          }
                        >
                          <div className="space-y-3">
                            <h3
                              className={cn(
                                "text-base font-semibold leading-snug",
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
                        </DecisionCard>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </DecisionSection>

              {!showQuickForm && (
                <DecisionQuickAddFab onClick={() => setShowQuickForm(true)} label={t("decisions.newDecision")} />
              )}
            </motion.div>
          )}
        </>
      ) : (
        <MemberSplitLayout
          left={desktopLeftPane}
          right={desktopRightPane}
          leftColSpan={5}
          rightColSpan={7}
          scrollRight={true}
          scrollLeft={true}
        />
      )}

      <Dialog
        open={confirmModal.open}
        onOpenChange={(open) => {
          if (!open) setConfirmModal((m) => ({ ...m, open: false }));
        }}
      >
        <DialogContent className="glass-card border-border/30 sm:max-w-md">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="flex items-center gap-2 text-lg text-foreground">
              {confirmModal.targetStatus === "decided" ? (
                <>
                  <CheckCircle2 className="size-5 text-primary" aria-hidden />
                  {t("decisions.confirmDecision")}
                </>
              ) : (
                <>
                  <CalendarClock className="size-5 text-neural-warm" aria-hidden />
                  {t("decisions.deferDecision")}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {confirmModal.decision?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {confirmModal.targetStatus === "decided" && confirmModal.decision && (
              <div className="glass-card space-y-1 border-0 p-5 text-center">
                <p className="text-sm text-muted-foreground">{t("decisions.reflectionTime")}</p>
                <p className="font-cormorant text-3xl font-light text-primary">
                  {formatDecisionDuration(confirmModal.decision.created_at, new Date().toISOString())}
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
                <p className="text-xs text-muted-foreground">{t("decisions.deferHint")}</p>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setConfirmModal((m) => ({ ...m, open: false }))}>
                {t("general.cancel")}
              </Button>
              <Button type="button" onClick={confirmStatusChange} disabled={updateStatusMutation.isPending}>
                {t("general.confirm")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MemberPageScaffold>
  );
}
