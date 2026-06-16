import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { SampleProfile } from "@/features/archetype-deepdive-v2/domain/sampleProfile";
import type { TaoPersonaSummary } from "@/features/tao-portrait/lib/buildTaoPersonaSummary";
import { spotlightPoleLabel, taoDeepDiveHref } from "@/features/tao-portrait/lib/buildTaoPersonaSummary";
import { WU_XING_META, type WuXingPole } from "@/features/tao-portrait/domain/types";
import { defaultPortraitLensId } from "../lib/buildPortraitLenses";
import type { PortraitLensCard, PortraitLensStatus } from "../lib/portraitLensTypes";
import { PersonaTriadStrip } from "./personaParts";

interface PersonaPortraitLibraryProps {
  lenses: PortraitLensCard[];
  loading?: boolean;
  profile: SampleProfile;
  taoSummary: TaoPersonaSummary | null;
  shadowTheme: string;
  headingId: string;
}

function statusLabel(status: PortraitLensStatus, locale: "fr" | "en"): string {
  if (locale === "fr") {
    switch (status) {
      case "ready":
        return "Publié";
      case "partial":
        return "En cours";
      case "empty":
        return "À venir";
      default:
        return "…";
    }
  }
  switch (status) {
    case "ready":
      return "Published";
    case "partial":
      return "In progress";
    case "empty":
      return "Upcoming";
    default:
      return "…";
  }
}

function LensProgressBar({
  filled,
  total,
  accentColor,
}: {
  filled: number;
  total: number;
  accentColor: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 0;
  return (
    <div className="space-y-1.5">
      <div
        className="h-1 w-full overflow-hidden rounded-full bg-border/40"
        role="progressbar"
        aria-valuenow={filled}
        aria-valuemin={0}
        aria-valuemax={total}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${accentColor}, color-mix(in srgb, ${accentColor} 65%, white))`,
          }}
        />
      </div>
    </div>
  );
}

function TaoPoleMiniGrid({
  taoSummary,
  locale,
}: {
  taoSummary: TaoPersonaSummary;
  locale: "fr" | "en";
}) {
  return (
    <div className="grid grid-cols-5 gap-1.5" role="list" aria-label={locale === "fr" ? "Pôles Wu Xing" : "Wu Xing poles"}>
      {taoSummary.poleProgress.map(({ pole, filled, total }) => {
        const meta = WU_XING_META[pole as Exclude<WuXingPole, "transversal">];
        const active = filled > 0;
        return (
          <Link
            key={pole}
            to={taoDeepDiveHref({ pole })}
            role="listitem"
            className={cn(
              "rounded-lg border px-1 py-2 text-center transition-colors min-h-[44px]",
              "hover:border-primary/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              active ? "border-border/45 bg-background/50" : "border-border/20 opacity-50",
            )}
            style={
              active
                ? { borderColor: `color-mix(in srgb, ${meta.color} 32%, transparent)` }
                : undefined
            }
          >
            <span
              className="mx-auto block h-2 w-2 rounded-full"
              style={{ background: active ? meta.color : "hsl(var(--border))" }}
              aria-hidden
            />
            <p className="mt-1 text-[8px] sm:text-[9px] font-display uppercase tracking-wider text-muted-foreground truncate">
              {locale === "fr" ? meta.label_fr : meta.label_en}
            </p>
            <span className="sr-only">
              {spotlightPoleLabel(pole, locale)}, {filled}/{total}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export function PersonaPortraitLibrary({
  lenses,
  loading,
  profile,
  taoSummary,
  shadowTheme,
  headingId,
}: PersonaPortraitLibraryProps) {
  const { locale, t } = useLanguage();
  const isFR = locale === "fr";
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState(() => defaultPortraitLensId(lenses));

  const activeLens = useMemo(
    () => lenses.find((l) => l.id === activeId) ?? lenses[0],
    [lenses, activeId],
  );

  useEffect(() => {
    if (!lenses.some((l) => l.id === activeId)) {
      setActiveId(defaultPortraitLensId(lenses));
    }
  }, [lenses, activeId]);

  const publishedCount = lenses.filter((l) => l.status === "ready" || l.status === "partial").length;

  return (
    <section
      className="persona-portrait-library rounded-2xl border border-border/35 bg-card/35 overflow-hidden"
      aria-labelledby={headingId}
    >
      <div className="border-b border-border/30 px-4 sm:px-5 py-4 sm:py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id={headingId}
              className="font-display text-[10px] uppercase tracking-[0.24em] text-muted-foreground"
            >
              {t("persona.portraits.title")}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground font-body leading-relaxed max-w-xl">
              {t("persona.portraits.subtitle")}
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-border/40 bg-background/50 px-2.5 py-1 text-[10px] font-display uppercase tracking-wider text-muted-foreground tabular-nums">
            {publishedCount}/{lenses.length}
          </span>
        </div>

        <div
          ref={scrollRef}
          className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin"
          role="tablist"
          aria-label={t("persona.portraits.selectorLabel")}
        >
          {lenses.map((lens) => {
            const Icon = lens.icon;
            const selected = lens.id === activeId;
            const progressPct =
              lens.progressTotal && lens.progressFilled != null
                ? Math.round((lens.progressFilled / lens.progressTotal) * 100)
                : lens.status === "ready"
                  ? 100
                  : 0;

            return (
              <button
                key={lens.id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`persona-lens-panel-${lens.id}`}
                id={`persona-lens-tab-${lens.id}`}
                onClick={() => setActiveId(lens.id)}
                className={cn(
                  "snap-start shrink-0 w-[min(100%,9.5rem)] sm:w-40 rounded-xl border p-3 text-left transition-all duration-200 min-h-[88px]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  selected
                    ? "border-[var(--lens-accent)] bg-background/70 shadow-sm"
                    : "border-border/35 bg-background/30 hover:border-border/55 hover:bg-background/45",
                )}
                style={
                  {
                    "--lens-accent": `color-mix(in srgb, ${lens.accentColor} 45%, transparent)`,
                  } as React.CSSProperties
                }
              >
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                    style={{
                      borderColor: `color-mix(in srgb, ${lens.accentColor} 30%, transparent)`,
                      background: `color-mix(in srgb, ${lens.accentColor} 10%, transparent)`,
                      color: lens.accentColor,
                    }}
                  >
                    <Icon size={15} strokeWidth={1.5} aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-display uppercase tracking-wider text-muted-foreground truncate">
                      {t(lens.frameworkKey)}
                    </p>
                    <p className="text-[10px] font-medium text-foreground truncate leading-tight">
                      {t(lens.systemKey)}
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-[9px] font-display uppercase tracking-wider",
                      lens.status === "ready" && "text-primary",
                      lens.status === "partial" && "text-amber-600/90 dark:text-amber-400/90",
                      lens.status === "empty" && "text-muted-foreground",
                    )}
                  >
                    {loading && lens.status === "empty" ? "…" : statusLabel(lens.status, locale)}
                  </span>
                  {lens.progressTotal ? (
                    <span className="text-[9px] tabular-nums text-muted-foreground">
                      {progressPct}%
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {activeLens ? (
        <div
          id={`persona-lens-panel-${activeLens.id}`}
          role="tabpanel"
          aria-labelledby={`persona-lens-tab-${activeLens.id}`}
          className="px-4 sm:px-5 py-5 sm:py-6"
          style={{
            borderTop: `3px solid color-mix(in srgb, ${activeLens.accentColor} 55%, transparent)`,
            background: `linear-gradient(180deg, color-mix(in srgb, ${activeLens.accentColor} 5%, transparent) 0%, transparent 28%)`,
          }}
        >
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 size={16} className="animate-spin" aria-hidden />
              {isFR ? "Chargement des portraits…" : "Loading portraits…"}
            </div>
          ) : activeLens.status === "empty" ? (
            <p className="text-sm text-muted-foreground leading-relaxed font-body py-2">
              {activeLens.id === "tao"
                ? t("persona.glimpse.taoEmpty")
                : t("persona.portraits.lensEmpty")}
            </p>
          ) : (
            <div className="space-y-5">
              <div className="flex gap-4">
                {activeLens.mark ? (
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border bg-background/60 text-xl font-display"
                    style={{
                      color: activeLens.accentColor,
                      borderColor: `color-mix(in srgb, ${activeLens.accentColor} 35%, transparent)`,
                    }}
                    aria-hidden
                  >
                    {activeLens.mark}
                  </div>
                ) : null}
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {t(activeLens.frameworkKey)} · {t(activeLens.systemKey)}
                  </p>
                  {activeLens.eyebrow ? (
                    <p className="text-[10px] font-display uppercase tracking-[0.16em] text-muted-foreground/90">
                      {activeLens.eyebrow}
                    </p>
                  ) : null}
                  {activeLens.title ? (
                    <h3 className="font-cormorant-display text-xl sm:text-2xl text-foreground leading-tight line-clamp-2">
                      {activeLens.title}
                    </h3>
                  ) : null}
                </div>
              </div>

              {activeLens.excerpt ? (
                <p className="text-sm text-muted-foreground leading-relaxed font-body line-clamp-5 sm:line-clamp-6">
                  {activeLens.excerpt}
                </p>
              ) : null}

              {activeLens.progressTotal != null && activeLens.progressFilled != null ? (
                <div className="space-y-2">
                  <LensProgressBar
                    filled={activeLens.progressFilled}
                    total={activeLens.progressTotal}
                    accentColor={activeLens.accentColor}
                  />
                  <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
                    {t("persona.glimpse.taoProgress", {
                      filled: String(activeLens.progressFilled),
                      total: String(activeLens.progressTotal),
                    })}
                  </p>
                </div>
              ) : null}

              {activeLens.detailKind === "myss" ? (
                <div className="space-y-3 rounded-xl border border-border/30 bg-background/25 p-3 sm:p-4">
                  <PersonaTriadStrip profile={profile} headingId={`${headingId}-triad`} embedded />
                  <p className="text-xs text-muted-foreground px-1">
                    {t("persona.glimpse.shadowHint", { theme: shadowTheme })}
                  </p>
                </div>
              ) : null}

              {activeLens.detailKind === "tao" && taoSummary?.hasContent ? (
                <TaoPoleMiniGrid taoSummary={taoSummary} locale={locale} />
              ) : null}

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                {activeLens.actions.map((action) => (
                  <Button
                    key={action.href + action.labelKey}
                    asChild
                    variant={action.variant === "outline" ? "outline" : "default"}
                    className="min-h-[44px] flex-1 font-display text-xs tracking-wider gap-2"
                  >
                    <Link to={action.href}>
                      {t(action.labelKey)}
                      <ArrowUpRight size={14} aria-hidden />
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
