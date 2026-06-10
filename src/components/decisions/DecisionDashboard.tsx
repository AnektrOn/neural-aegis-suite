import { Target, Clock, CheckCircle2, CalendarClock, Timer, AlertCircle } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { DecisionAnalytics } from "@/lib/decisionAnalytics";
import { formatAvgHours } from "@/lib/decisionAnalytics";
import { DecisionPageStat } from "@/components/decisions/DecisionLogUi";

interface Props {
  analytics: DecisionAnalytics;
  locale: string;
  labels: {
    total: string;
    open: string;
    week: string;
    deferred: string;
    chartStatus: string;
    chartWeekly: string;
    chartPriority: string;
    avgResolution: string;
    oldestPending: string;
    emptyCharts: string;
  };
}

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  color: "hsl(var(--foreground))",
  fontSize: 12,
};

export function DecisionDashboard({ analytics, locale, labels }: Props) {
  const hasData = analytics.total > 0;
  const avgLabel = formatAvgHours(analytics.avgResolutionHours, locale);

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <DecisionPageStat label={labels.total} value={analytics.total} icon={Target} />
        <DecisionPageStat label={labels.open} value={analytics.pendingCount} icon={Clock} />
        <DecisionPageStat label={labels.week} value={analytics.decidedThisWeek} icon={CheckCircle2} />
        <DecisionPageStat label={labels.deferred} value={analytics.deferredCount} icon={CalendarClock} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <div className="glass-card p-4 sm:p-5 border-0">
          <p className="font-display text-[10px] tracking-[0.18em] uppercase text-text-tertiary/70 mb-4">
            {labels.chartStatus}
          </p>
          {!hasData || analytics.statusPie.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground/60">{labels.emptyCharts}</p>
          ) : (
            <div className="h-44 sm:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.statusPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="52%"
                    outerRadius="78%"
                    paddingAngle={3}
                  >
                    {analytics.statusPie.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                {analytics.statusPie.map((s) => (
                  <span key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-2 rounded-full" style={{ background: s.fill }} />
                    {s.name} ({s.value})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="glass-card p-4 sm:p-5 border-0">
          <p className="font-display text-[10px] tracking-[0.18em] uppercase text-text-tertiary/70 mb-4">
            {labels.chartWeekly}
          </p>
          <div className="h-44 sm:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.weeklyResolved} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="hsl(var(--border)/0.35)" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        <div className="glass-card flex items-center gap-4 p-4 sm:p-5 border-0">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Timer className="size-5" strokeWidth={1.75} aria-hidden />
          </div>
          <div>
            <p className="font-display text-[10px] tracking-[0.14em] uppercase text-text-tertiary/70">
              {labels.avgResolution}
            </p>
            <p className="font-cormorant text-2xl font-light tabular-nums text-foreground">{avgLabel}</p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-4 p-4 sm:p-5 border-0">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-warning/10 text-warning">
            <AlertCircle className="size-5" strokeWidth={1.75} aria-hidden />
          </div>
          <div>
            <p className="font-display text-[10px] tracking-[0.14em] uppercase text-text-tertiary/70">
              {labels.oldestPending}
            </p>
            <p className="font-cormorant text-2xl font-light tabular-nums text-foreground">
              {analytics.pendingCount > 0
                ? locale === "fr"
                  ? `${analytics.oldestPendingDays} j`
                  : `${analytics.oldestPendingDays}d`
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {hasData && analytics.priorityBars.some((b) => b.count > 0) && (
        <div className="glass-card p-4 sm:p-5 border-0">
          <p className="font-display text-[10px] tracking-[0.18em] uppercase text-text-tertiary/70 mb-4">
            {labels.chartPriority}
          </p>
          <div className="h-36 sm:h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.priorityBars} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} stroke="hsl(var(--border)/0.35)" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis
                  type="category"
                  dataKey="priority"
                  width={32}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
