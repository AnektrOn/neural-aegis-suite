import DashboardHero from "@/components/DashboardHero";
import { DashboardMobileBento } from "@/pages/dashboard/DashboardMobileBento";
import { useLanguage } from "@/i18n/LanguageContext";
import { ArrowUpRight, Sparkles, Target } from "lucide-react";
import { NavLink } from "react-router-dom";
import { priorityBadge } from "@/pages/dashboard/dashboard-shared";
import {
  PROMOTE_DECISIONS,
  PROMOTE_DIGEST,
  PROMOTE_HABITS,
  PROMOTE_JOURNAL,
  PROMOTE_STATS,
  PROMOTE_USER,
  copy,
} from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";

function timeAgo(isFR: boolean, iso: string) {
  const h = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 3600_000));
  return isFR ? `il y a ${h} h` : `${h}h ago`;
}

export function DashboardScene() {
  const { t } = useLanguage();
  const { isFR } = usePromotePlayer();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? t("dashboard.greetingMorning") : hour < 18 ? t("dashboard.greetingAfternoon") : t("dashboard.greetingEvening");
  const sessionLabel =
    hour < 12 ? t("dashboard.sessionMorning") : hour < 18 ? t("dashboard.sessionAfternoon") : t("dashboard.sessionEvening");
  const pending = PROMOTE_HABITS.filter((h) => !h.completed);
  const done = PROMOTE_HABITS.filter((h) => h.completed).length;
  const journal = copy(isFR, PROMOTE_JOURNAL.contentFr, PROMOTE_JOURNAL.contentEn);

  return (
    <div className="mobile-section-gap max-w-full pt-1 pb-4">
      <div className="flex min-h-[24px] items-center justify-end gap-1.5">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
        <span className="font-barlow text-[11px] font-medium text-primary">
        {t("dashboard.streakLine", { n: String(PROMOTE_DIGEST.streakDays) })}
        </span>
      </div>
      <DashboardHero
        greeting={`${greeting} ${PROMOTE_USER.firstName}`}
        sessionLabel={sessionLabel}
        progress={PROMOTE_DIGEST.habitRate}
        progressAriaLabel={t("dashboard.heroProgressAria", { n: String(PROMOTE_DIGEST.habitRate) })}
      />
      <button type="button" className="dashboard-cta w-full select-none">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsla(var(--aegis-warm)/0.14)]">
            <span className="h-2 w-2 rounded-full bg-[hsl(var(--aegis-warm))]" />
          </div>
          <div className="min-w-0 text-left">
            <p className="font-barlow text-[14px] font-medium text-text-primary">{t("dashboard.mobileLogNow")}</p>
            <p className="mt-1 font-barlow text-[10px] font-medium uppercase tracking-[0.18em] text-text-tertiary/80">
              {t("dashboard.mobileLogSubtitle")}
            </p>
          </div>
        </div>
        <span className="shrink-0 pl-2 text-2xl font-light text-primary/45">›</span>
      </button>
      <DashboardMobileBento
        digest={PROMOTE_DIGEST}
        moodAvg={PROMOTE_STATS.moodAvg}
        habitsLabel={`${done}/${PROMOTE_HABITS.length}`}
        openDecisions={PROMOTE_STATS.openDecisions}
        streakDays={PROMOTE_DIGEST.streakDays}
      />
      <div className="dashboard-panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="dashboard-section-label">{t("dashboard.mobileDecisionsOpen")}</p>
          <NavLink to="/decisions" className="font-barlow text-[11px] tracking-wide text-primary/55">
            {t("dashboard.mobileSeeAll")}
            <ArrowUpRight size={12} className="ml-1 inline" />
          </NavLink>
        </div>
        <div className="divide-y divide-border/40">
          {PROMOTE_DECISIONS.slice(0, 2).map((d) => {
            const badge = priorityBadge(d.priority);
            return (
              <div key={d.id} className="flex min-h-[44px] items-center justify-between gap-2 py-2 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Target size={12} className="shrink-0 text-primary/70" />
                  <span className="truncate font-barlow text-[15px] text-foreground/90">{copy(isFR, d.nameFr, d.nameEn)}</span>
                </div>
                <span className={`rounded-md px-2 py-0.5 font-barlow text-[10px] ${badge.cls}`}>{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="dashboard-panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="dashboard-section-label">{t("dashboard.mobileHabitsToday")}</p>
          <span className="rounded-lg bg-primary/10 px-2.5 py-1 font-barlow text-[11px] tabular-nums text-primary">
            {done}/{PROMOTE_HABITS.length}
          </span>
        </div>
        <div className="space-y-1">
          {pending.map((habit) => (
            <div key={habit.id} className="flex min-h-[44px] items-center gap-3">
              <div className="h-6 w-6 rounded-lg border border-[hsl(var(--aegis-border))]" />
              <span className="font-barlow text-[15px]">{habit.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="dashboard-panel p-4">
        <p className="dashboard-section-label mb-2">{t("dashboard.mobileLastEntry")}</p>
        <p className="line-clamp-3 font-cormorant text-[15px] font-light italic text-muted-foreground">
          “{journal}”
        </p>
        <p className="mt-2 font-barlow text-[10px] text-muted-foreground/50">{timeAgo(isFR, PROMOTE_JOURNAL.created_at)}</p>
      </div>
      <NavLink
        to="/pulse"
        className="flex items-center gap-3 rounded-2xl border border-accent-primary/25 bg-accent-primary/[0.07] px-4 py-3.5 no-underline"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-accent-primary/30 bg-accent-primary/10">
          <Sparkles size={16} className="text-accent-primary" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[11px] uppercase tracking-[0.15em] text-accent-primary">Pulse</span>
          <span className="mt-0.5 block truncate text-sm text-text-tertiary">
            {copy(isFR, "Le point immobile — 4 min", "The still point — 4 min")}
          </span>
        </span>
      </NavLink>
    </div>
  );
}
