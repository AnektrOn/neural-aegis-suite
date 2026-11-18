import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  coverFlowCardStyle,
  useCoverFlowDragSwipe,
} from "@/components/ui/cover-flow/coverFlowShelf";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { SampleProfile } from "@/features/archetype-deepdive-v2/domain/sampleProfile";
import { DeepDiveUserCards } from "@/features/archetype-deepdive-v2/components/DeepDiveUserCards";
import type { V4PoleAnalysis } from "@/features/archetype-assessment/domain/types";
import type { TaoPersonaSummary } from "@/features/tao-portrait/lib/buildTaoPersonaSummary";
import { TaoPortraitPanel } from "@/features/tao-portrait/components/TaoPortraitPanel";
import type { TaoPortraitPartRow } from "@/features/tao-portrait/domain/types";
import { UserReportModal } from "@/features/user-reports/UserReportModal";
import { markUserReportRead } from "@/features/user-reports/service";
import type { UserReport } from "@/features/user-reports/types";
import { defaultPortraitLensId } from "../lib/buildPortraitLenses";
import { findClinicalReportForLens } from "../lib/portraitLensClinical";
import type { PortraitLensAction, PortraitLensCard, PortraitLensStatus } from "../lib/portraitLensTypes";

interface PersonaPortraitLibraryProps {
  lenses: PortraitLensCard[];
  loading?: boolean;
  profile: SampleProfile;
  taoSummary: TaoPersonaSummary | null;
  taoParts?: TaoPortraitPartRow[];
  v4Analysis?: V4PoleAnalysis | null;
  clinicalReports?: UserReport[];
  displayName?: string | null;
  shadowTheme: string;
  headingId: string;
  initialLensId?: string;
  /** Dedicated /persona/portraits route — grid selector + expanded detail. */
  fullPage?: boolean;
  /** Hide in-card title when the page supplies MemberPageHeader. */
  hideIntro?: boolean;
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

function lensStatusBadge(
  lens: PortraitLensCard,
  loading: boolean | undefined,
  locale: "fr" | "en",
): string {
  if (loading && lens.status === "empty") return "…";
  if (lens.comingSoon) return locale === "fr" ? "Bientôt" : "Soon";
  if (lens.locked) return locale === "fr" ? "À débloquer" : "Locked";
  return statusLabel(lens.status, locale);
}

function PortraitLensActionButtons({
  lens,
  clinicalReports,
  onOpenClinical,
}: {
  lens: PortraitLensCard;
  clinicalReports: UserReport[];
  onOpenClinical: (report: UserReport) => void;
}) {
  const { t, locale } = useLanguage();
  const isFR = locale === "fr";
  const clinicalReport = findClinicalReportForLens(clinicalReports, lens.id);

  return (
    <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
      {lens.locked && !lens.comingSoon ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground py-2 rounded-xl border border-border/25">
          <Lock size={14} aria-hidden />
          <span className="font-cinzel text-[10px] uppercase tracking-wider">
            {isFR ? "À débloquer" : "Locked"}
          </span>
        </div>
      ) : null}
      {lens.actions.map((action: PortraitLensAction) => {
        if (action.intent === "clinical") {
          return (
            <Button
              key={action.labelKey}
              type="button"
              disabled={!clinicalReport}
              onClick={() => clinicalReport && onOpenClinical(clinicalReport)}
              variant={action.variant === "outline" ? "outline" : "default"}
              className="min-h-[44px] flex-1 font-display text-xs tracking-wider gap-2"
            >
              {t(action.labelKey)}
              <ArrowUpRight size={14} aria-hidden />
            </Button>
          );
        }
        if (!action.href) return null;
        return (
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
        );
      })}
      {lens.actions.some((a) => a.intent === "clinical") && !clinicalReport ? (
        <p className="w-full text-center text-xs text-muted-foreground font-body sm:text-left">
          {t("persona.lens.ctaClinicalMissing")}
        </p>
      ) : null}
    </div>
  );
}

function PortraitLensActivePanel({
  lens,
  loading,
  profile,
  taoSummary,
  taoParts,
  v4Analysis,
  clinicalReports,
  displayName,
  headingId,
  onOpenClinical,
}: {
  lens: PortraitLensCard;
  loading?: boolean;
  profile: SampleProfile;
  taoSummary: TaoPersonaSummary | null;
  taoParts?: TaoPortraitPartRow[];
  v4Analysis?: V4PoleAnalysis | null;
  clinicalReports: UserReport[];
  displayName?: string | null;
  headingId: string;
  onOpenClinical: (report: UserReport) => void;
}) {
  const { locale, t } = useLanguage();
  const isFR = locale === "fr";
  const showMyssShelf = lens.detailKind === "myss" && lens.status !== "empty";
  const showTaoShelf =
    lens.detailKind === "tao" && (lens.status === "ready" || lens.status === "partial");

  return (
    <div
      id={`persona-lens-panel-${lens.id}`}
      role="tabpanel"
      aria-labelledby={`persona-lens-cover-${lens.id}`}
      className="w-full max-w-none rounded-2xl border border-border/30 bg-card/35 px-4 sm:px-5 py-5"
      style={{
        borderTop: `3px solid color-mix(in srgb, ${lens.accentColor} 55%, transparent)`,
        background: `linear-gradient(180deg, color-mix(in srgb, ${lens.accentColor} 6%, transparent) 0%, transparent 32%)`,
      }}
    >
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 size={16} className="animate-spin" aria-hidden />
          {isFR ? "Chargement des portraits…" : "Loading portraits…"}
        </div>
      ) : lens.status === "empty" ? (
        <div className="space-y-3 text-center sm:text-left">
          <p className="text-sm text-muted-foreground leading-relaxed font-body max-w-lg mx-auto sm:mx-0">
            {lens.comingSoon
              ? t("persona.lens.comingSoon")
              : t(lens.emptyDetailKey ?? "persona.portraits.lensEmpty")}
          </p>
          {lens.actions.length > 0 ? (
            <PortraitLensActionButtons
              lens={lens}
              clinicalReports={clinicalReports}
              onOpenClinical={onOpenClinical}
            />
          ) : null}
        </div>
      ) : (
        <div className="space-y-5">
          {lens.title ? (
            <h3 className="font-cormorant-display text-xl sm:text-2xl text-foreground leading-tight line-clamp-2">
              {lens.title}
            </h3>
          ) : null}
          {lens.excerpt ? (
            <p className="text-sm text-muted-foreground leading-relaxed font-body line-clamp-5">{lens.excerpt}</p>
          ) : null}
          {lens.progressTotal != null && lens.progressFilled != null ? (
            <div className="space-y-2">
              <LensProgressBar
                filled={lens.progressFilled}
                total={lens.progressTotal}
                accentColor={lens.accentColor}
              />
            </div>
          ) : null}

          {showMyssShelf ? (
            <div className="rounded-2xl border border-border/30 bg-background/20 p-3 sm:p-4 overflow-hidden">
              <DeepDiveUserCards
                profile={profile}
                v4Analysis={v4Analysis ?? null}
                layout="stack"
              />
            </div>
          ) : null}

          {showTaoShelf ? (
            <div className="rounded-2xl border border-border/30 bg-background/20 p-2 sm:p-3 overflow-hidden">
              <TaoPortraitPanel
                parts={taoParts ?? []}
                loading={loading}
                variant="embedded"
                displayName={displayName ?? null}
              />
            </div>
          ) : null}

          {lens.actions.length > 0 ? (
            <PortraitLensActionButtons
              lens={lens}
              clinicalReports={clinicalReports}
              onOpenClinical={onOpenClinical}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

/** Full-page 3D cover-flow shelf — centre card forward, peers rotated in perspective. */
function PersonaPortraitLibraryCarousel({
  lenses,
  loading,
  profile,
  taoSummary,
  taoParts,
  v4Analysis,
  clinicalReports = [],
  displayName,
  shadowTheme,
  headingId,
  initialLensId,
}: Omit<PersonaPortraitLibraryProps, "fullPage" | "hideIntro">) {
  const { locale, t } = useLanguage();
  const isFR = locale === "fr";
  const [clinicalModal, setClinicalModal] = useState<UserReport | null>(null);
  const [activeIndex, setActiveIndex] = useState(() => {
    if (initialLensId) {
      const idx = lenses.findIndex((l) => l.id === initialLensId);
      if (idx >= 0) return idx;
    }
    return 0;
  });
  const swipeSurfaceRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const activeLens = lenses[activeIndex] ?? lenses[0];

  useEffect(() => {
    if (activeIndex >= lenses.length) setActiveIndex(Math.max(0, lenses.length - 1));
  }, [lenses.length, activeIndex]);

  useEffect(() => {
    if (!initialLensId) return;
    const idx = lenses.findIndex((l) => l.id === initialLensId);
    if (idx >= 0) setActiveIndex(idx);
  }, [initialLensId, lenses]);

  const goTo = (index: number) => {
    const n = lenses.length;
    if (n === 0) return;
    setActiveIndex(((index % n) + n) % n);
  };

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, lenses.length]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, lenses.length]);

  useCoverFlowDragSwipe(swipeSurfaceRef, goPrev, goNext);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    }
  };

  return (
    <section className="persona-portrait-library-coverflow w-full" aria-labelledby={headingId}>
      <p id={headingId} className="sr-only">
        {t("persona.portraits.title")}
      </p>

      <div
        ref={swipeSurfaceRef}
        className="touch-pan-y cursor-grab select-none [&.persona-cover-flow--dragging]:cursor-grabbing"
        style={{ touchAction: "pan-y pinch-zoom" }}
      >
      <div
        className="persona-cover-flow-stage relative mx-auto flex w-full max-w-5xl items-center justify-center overflow-x-clip overflow-y-visible py-3 sm:py-6"
        style={{ perspective: "1200px", perspectiveOrigin: "50% 40%" }}
        role="tablist"
        aria-label={t("persona.portraits.selectorLabel")}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <div
          className="relative flex h-[min(88vw,32rem)] w-full items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          {lenses.map((lens, index) => {
            const offset = index - activeIndex;
            const Icon = lens.icon;
            const badge = lensStatusBadge(lens, loading, locale);
            const flow = coverFlowCardStyle(offset, reduceMotion);
            const isCenter = offset === 0;
            const hasCoverArt = Boolean(lens.coverArtUrl);
            const veilAuthor = Boolean(lens.locked || lens.comingSoon);
            const showCoverPortrait = hasCoverArt && !veilAuthor;

            return (
              <button
                key={lens.id}
                type="button"
                role="tab"
                id={`persona-lens-cover-${lens.id}`}
                aria-selected={isCenter}
                aria-controls={isCenter ? `persona-lens-panel-${lens.id}` : undefined}
                onClick={() => {
                  if (!isCenter) goTo(index);
                }}
                className={cn(
                  "persona-cover-flow-card absolute left-1/2 top-1/2 flex w-[min(78vw,20.5rem)] sm:w-[min(64vw,22rem)] flex-col rounded-[1.75rem] border text-left overflow-hidden",
                  "bg-gradient-to-b from-background/95 via-card/80 to-card/60 shadow-[0_16px_48px_rgba(0,0,0,0.45)]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
                  "aspect-[3/4] min-h-0",
                  hasCoverArt ? "p-0" : "p-5 sm:p-6",
                  isCenter ? "cursor-default" : "cursor-pointer",
                  lens.locked && !hasCoverArt && "opacity-90",
                )}
                style={{
                  ...flow,
                  borderColor: `color-mix(in srgb, ${lens.accentColor} ${isCenter ? 48 : 28}%, hsl(var(--border)))`,
                  boxShadow: isCenter
                    ? `0 20px 50px color-mix(in srgb, ${lens.accentColor} 22%, transparent)`
                    : undefined,
                }}
              >
                {showCoverPortrait ? (
                  <>
                    <img
                      src={lens.coverArtUrl}
                      alt=""
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/88 via-black/35 to-black/10"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${lens.accentColor} 35%, transparent)`,
                      }}
                      aria-hidden
                    />
                    <span
                      className={cn(
                        "absolute right-3 top-3 z-[1] rounded-full border border-white/20 bg-black/45 px-2.5 py-0.5 text-[8px] font-display uppercase tracking-wider text-white/95 backdrop-blur-sm",
                      )}
                    >
                      {badge}
                    </span>
                    <div className="relative z-[1] mt-auto flex flex-col p-5 pt-16">
                      <p className="font-cormorant text-[2rem] leading-[1.05] text-white sm:text-[2.35rem] drop-shadow-md">
                        {t(lens.frameworkKey)}
                      </p>
                      <p className="mt-2 font-display text-[10px] uppercase tracking-[0.2em] text-white/75 line-clamp-2">
                        {t(lens.systemKey)}
                      </p>
                    </div>
                  </>
                ) : hasCoverArt && veilAuthor ? (
                  <>
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: `radial-gradient(120% 90% at 50% 100%, color-mix(in srgb, ${lens.accentColor} 28%, hsl(var(--background))), hsl(var(--card)))`,
                      }}
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute inset-0 opacity-40"
                      style={{
                        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${lens.accentColor} 35%, transparent)`,
                      }}
                      aria-hidden
                    />
                    <span className="absolute right-3 top-3 z-[1] rounded-full border border-border/40 bg-background/80 px-2.5 py-0.5 text-[8px] font-display uppercase tracking-wider text-muted-foreground backdrop-blur-sm">
                      {badge}
                    </span>
                    <div className="relative z-[1] flex flex-1 flex-col items-center justify-center gap-3 px-5 py-8 text-center">
                      <Lock size={20} className="text-muted-foreground" aria-hidden />
                      <p className="font-cormorant text-[2rem] leading-[1.05] text-foreground sm:text-[2.35rem]">
                        {t(lens.systemKey)}
                      </p>
                      <p className="sr-only">{t(lens.frameworkKey)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    {lens.mark ? (
                      <span
                        className="pointer-events-none absolute inset-x-0 top-6 text-center font-display text-4xl opacity-[0.12]"
                        style={{ color: lens.accentColor }}
                        aria-hidden
                      >
                        {lens.mark}
                      </span>
                    ) : null}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-3xl opacity-40"
                      style={{
                        background: `radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, ${lens.accentColor} 28%, transparent), transparent 70%)`,
                      }}
                      aria-hidden
                    />
                    <div className="relative flex items-start justify-between gap-2">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border"
                        style={{
                          borderColor: `color-mix(in srgb, ${lens.accentColor} 35%, transparent)`,
                          background: `color-mix(in srgb, ${lens.accentColor} 14%, transparent)`,
                          color: lens.accentColor,
                        }}
                      >
                        <Icon size={22} strokeWidth={1.5} aria-hidden />
                      </div>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[8px] font-display uppercase tracking-wider",
                          lens.status === "ready" && "border-primary/40 text-primary",
                          lens.status === "partial" && "border-amber-400/40 text-amber-500",
                          lens.status === "empty" && "text-muted-foreground border-border/40",
                        )}
                      >
                        {badge}
                      </span>
                    </div>
                    <div className="relative mt-auto pt-8">
                      <p className="font-cormorant text-[2.15rem] leading-[1.05] text-foreground sm:text-[2.65rem]">
                        {t(lens.frameworkKey)}
                      </p>
                      <p className="mt-2.5 font-display text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-muted-foreground line-clamp-2">
                        {t(lens.systemKey)}
                      </p>
                    </div>
                    {lens.locked || lens.comingSoon ? (
                      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-background/20 backdrop-blur-[1px]" aria-hidden />
                    ) : null}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-center gap-3 px-4">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full border-border/50 bg-background/60"
          onClick={goPrev}
          aria-label={isFR ? "Prisme précédent" : "Previous lens"}
        >
          <ChevronLeft size={18} aria-hidden />
        </Button>
        <div
          className="flex max-w-[min(100%,14rem)] flex-1 flex-wrap items-center justify-center gap-1.5"
          role="presentation"
        >
          {lenses.map((lens, i) => (
            <button
              key={lens.id}
              type="button"
              aria-label={t(lens.frameworkKey)}
              aria-current={i === activeIndex ? "true" : undefined}
              onClick={() => goTo(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === activeIndex ? "w-5 bg-foreground/90" : "w-2 bg-muted-foreground/35 hover:bg-muted-foreground/55",
              )}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full border-border/50 bg-background/60"
          onClick={goNext}
          aria-label={isFR ? "Prisme suivant" : "Next lens"}
        >
          <ChevronRight size={18} aria-hidden />
        </Button>
      </div>

      </div>

      {activeLens ? (
        <div className="mt-5 w-full box-border pl-3 pr-3 sm:pl-5 sm:pr-5 max-lg:pr-[var(--member-top-dock-clearance)] lg:px-8">
          <PortraitLensActivePanel
            lens={activeLens}
            loading={loading}
            profile={profile}
            taoSummary={taoSummary}
            taoParts={taoParts}
            v4Analysis={v4Analysis}
            clinicalReports={clinicalReports}
            displayName={displayName}
            headingId={headingId}
            onOpenClinical={(report) => {
              setClinicalModal(report);
              void markUserReportRead(report.id);
            }}
          />
        </div>
      ) : null}

      <UserReportModal
        report={clinicalModal}
        open={!!clinicalModal}
        onOpenChange={(open) => !open && setClinicalModal(null)}
      />
    </section>
  );
}

export function PersonaPortraitLibrary({
  lenses,
  loading,
  profile,
  taoSummary,
  taoParts,
  v4Analysis,
  clinicalReports = [],
  displayName,
  shadowTheme,
  headingId,
  initialLensId,
  fullPage = false,
  hideIntro = false,
}: PersonaPortraitLibraryProps) {
  if (fullPage) {
    return (
      <PersonaPortraitLibraryCarousel
        lenses={lenses}
        loading={loading}
        profile={profile}
        taoSummary={taoSummary}
        taoParts={taoParts}
        v4Analysis={v4Analysis}
        clinicalReports={clinicalReports}
        displayName={displayName}
        shadowTheme={shadowTheme}
        headingId={headingId}
        initialLensId={initialLensId}
      />
    );
  }

  const { locale, t } = useLanguage();
  const isFR = locale === "fr";
  const scrollRef = useRef<HTMLDivElement>(null);
  const [clinicalModal, setClinicalModal] = useState<UserReport | null>(null);
  const [activeId, setActiveId] = useState(() => initialLensId ?? defaultPortraitLensId(lenses));

  const activeLens = useMemo(
    () => lenses.find((l) => l.id === activeId) ?? lenses[0],
    [lenses, activeId],
  );

  useEffect(() => {
    if (!lenses.some((l) => l.id === activeId)) {
      setActiveId(defaultPortraitLensId(lenses));
    }
  }, [lenses, activeId]);

  useEffect(() => {
    if (!initialLensId) return;
    if (lenses.some((l) => l.id === initialLensId)) {
      setActiveId(initialLensId);
    }
  }, [initialLensId, lenses]);

  const publishedCount = lenses.filter((l) => l.status === "ready" || l.status === "partial").length;

  return (
    <section
      className={cn(
        "persona-portrait-library overflow-hidden",
        fullPage
          ? "flex flex-col gap-0 rounded-2xl border border-border/35 bg-card/40 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
          : "rounded-2xl border border-border/35 bg-card/35",
      )}
      aria-labelledby={headingId}
    >
      <div
        className={cn(
          "border-b border-border/30 px-4 sm:px-6 py-4 sm:py-5",
          fullPage && "sm:py-6",
        )}
      >
        {!hideIntro ? (
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
        ) : (
          <div className="flex items-center justify-between gap-3">
            <h2 id={headingId} className="sr-only">
              {t("persona.portraits.title")}
            </h2>
            <span className="rounded-full border border-border/40 bg-background/50 px-2.5 py-1 text-[10px] font-display uppercase tracking-wider text-muted-foreground tabular-nums">
              {publishedCount}/{lenses.length} {t("persona.portraits.countLabel")}
            </span>
          </div>
        )}

        <div
          ref={scrollRef}
          className={cn(
            fullPage
              ? "mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5"
              : "mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin",
            !hideIntro && !fullPage && "mt-4",
            hideIntro && "mt-2",
          )}
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
            const veilAuthor = Boolean(lens.locked || lens.comingSoon);

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
                  "rounded-xl border p-3 text-left transition-all duration-200 min-h-[96px] relative",
                  fullPage ? "w-full min-h-[100px] sm:min-h-[108px]" : "snap-start shrink-0 w-[min(100%,9.5rem)] sm:w-44",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  selected
                    ? "border-[var(--lens-accent)] bg-background/70 shadow-sm"
                    : "border-border/35 bg-background/30 hover:border-border/55 hover:bg-background/45",
                  lens.locked && !selected && "opacity-75",
                )}
                style={
                  {
                    "--lens-accent": `color-mix(in srgb, ${lens.accentColor} 45%, transparent)`,
                  } as React.CSSProperties
                }
              >
                <div className="flex flex-col gap-1.5">
                  {!veilAuthor ? (
                    <p className="font-cormorant text-lg leading-none text-foreground line-clamp-2">
                      {t(lens.frameworkKey)}
                    </p>
                  ) : null}
                  <div className={cn("flex items-center gap-2", veilAuthor && "justify-center py-1")}>
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                      style={{
                        borderColor: `color-mix(in srgb, ${lens.accentColor} 30%, transparent)`,
                        background: `color-mix(in srgb, ${lens.accentColor} 10%, transparent)`,
                        color: lens.accentColor,
                      }}
                    >
                      <Icon size={13} strokeWidth={1.5} aria-hidden />
                    </div>
                    <p
                      className={cn(
                        "font-display uppercase tracking-wider text-muted-foreground truncate",
                        veilAuthor ? "text-[10px] text-foreground/90" : "text-[9px]",
                      )}
                    >
                      {t(lens.systemKey)}
                    </p>
                  </div>
                  {veilAuthor ? <p className="sr-only">{t(lens.frameworkKey)}</p> : null}
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
                    {loading && lens.status === "empty"
                      ? "…"
                      : lens.comingSoon
                        ? isFR
                          ? "Bientôt"
                          : "Soon"
                        : lens.locked
                          ? isFR
                            ? "À débloquer"
                            : "Locked"
                          : statusLabel(lens.status, locale)}
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
        <PortraitLensActivePanel
          lens={activeLens}
          loading={loading}
          profile={profile}
          taoSummary={taoSummary}
          taoParts={taoParts}
          v4Analysis={v4Analysis}
          clinicalReports={clinicalReports}
          displayName={displayName}
          headingId={headingId}
          onOpenClinical={(report) => {
            setClinicalModal(report);
            void markUserReportRead(report.id);
          }}
        />
      ) : null}

      <UserReportModal
        report={clinicalModal}
        open={!!clinicalModal}
        onOpenChange={(open) => !open && setClinicalModal(null)}
      />
    </section>
  );
}
