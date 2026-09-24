import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Scan, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Locale } from "@/i18n/translations";
import { pickWidgetCatalogCopy } from "@/lib/toolbox-widget-i18n";
import { resolveSequenceFromElapsed } from "@/lib/exercise-sequence-position";
import { ToolboxWidgetTimerControls } from "@/features/toolbox/ui";
import { BodyScanSkinnedFigure } from "./BodyScanSkinnedFigure";
import { BODY_SCAN_PREVIEW_ZONES, elapsedAtZoneStart } from "./bodyScanBones";

type BodyScanZone = (typeof BODY_SCAN_PREVIEW_ZONES)[number];

function zoneLabel(zone: BodyScanZone, t: (key: string) => string, locale: Locale): string {
  const k = `toolbox.bodyScan.zone.${zone.id}.label`;
  const v = t(k);
  if (v !== k) return v;
  return pickWidgetCatalogCopy(locale, (zone as { label_i18n?: unknown }).label_i18n, zone.label);
}

function zoneInstruction(zone: BodyScanZone, t: (key: string) => string, locale: Locale): string {
  const k = `toolbox.bodyScan.zone.${zone.id}.instruction`;
  const v = t(k);
  if (v !== k) return v;
  return pickWidgetCatalogCopy(
    locale,
    (zone as { instruction_i18n?: unknown }).instruction_i18n,
    zone.instruction,
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function BodyScanPreview() {
  const { t, locale } = useLanguage();
  const zones = BODY_SCAN_PREVIEW_ZONES;
  const totalSec = zones.reduce((sum, zone) => sum + zone.duration_sec, 0);
  const segments = useMemo(
    () => zones.map((zone) => ({ id: zone.id, durationSec: zone.duration_sec })),
    [zones],
  );

  const [elapsedSec, setElapsedSec] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setElapsedSec((prev) => {
        const next = prev + dt;
        if (next >= totalSec) {
          setRunning(false);
          return totalSec;
        }
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, totalSec]);

  const timed = useMemo(
    () => resolveSequenceFromElapsed(elapsedSec, segments),
    [elapsedSec, segments],
  );
  const zoneIndex = timed.index;
  const currentZone = zones[zoneIndex] ?? zones[0];
  const completed = timed.completed;
  const sessionRemaining = Math.max(0, totalSec - elapsedSec);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,hsl(var(--primary)/0.14),transparent_55%),radial-gradient(ellipse_at_80%_90%,hsl(var(--aegis-warm)/0.08),transparent_45%)]"
      />

      <header className="relative z-30 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 lg:px-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
              Retour
            </Link>
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Scan className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <p className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Dev · toolbox body scan
              </p>
              <h1 className="truncate font-cormorant text-xl font-light tracking-tight sm:text-2xl">
                Matière
              </h1>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              DEV ONLY
            </Badge>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="relative z-10 mx-auto grid max-w-[1600px] lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="relative min-h-[52vh] lg:min-h-[calc(100vh-3.75rem)]">
          <div className="absolute inset-0 bg-black">
            <BodyScanSkinnedFigure
              zoneId={completed ? null : currentZone.id}
              zoneProgress={timed.phaseProgress}
              completedZoneIds={[...timed.completedIds]}
              isRunning={running && !completed}
              elapsedSec={elapsedSec}
            />
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4">
            <p className="rounded-full border border-white/10 bg-black/45 px-3 py-1 font-display text-[10px] uppercase tracking-[0.18em] text-white/55 backdrop-blur-md">
              Idle · wireframe · couleur
            </p>
            <span className="rounded-full border border-white/10 bg-black/45 px-3 py-1 font-mono text-[10px] text-white/50 backdrop-blur-md">
              {formatTime(sessionRemaining)} / {formatTime(totalSec)}
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pt-12">
            <p className="font-cormorant text-2xl font-light text-white">
              {completed ? t("toolbox.bodyScanDone") : zoneLabel(currentZone, t, locale as Locale)}
            </p>
            <p className="mt-1 max-w-lg text-sm leading-relaxed text-white/65">
              {completed
                ? t("toolbox.bodyScanAttend")
                : zoneInstruction(currentZone, t, locale as Locale)}
            </p>
            <div
              className="mt-3 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-white/15"
              aria-hidden
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-150"
                style={{ width: `${Math.min(100, timed.phaseProgress * 100)}%` }}
              />
            </div>
          </div>
        </section>

        <aside className="flex flex-col gap-6 border-t border-border/40 bg-card/50 p-5 backdrop-blur-md sm:p-6 lg:sticky lg:top-[3.75rem] lg:max-h-[calc(100vh-3.75rem)] lg:overflow-y-auto lg:border-l lg:border-t-0">
          <div>
            <h2 className="mb-3 flex items-center font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="mr-2 h-3.5 w-3.5" aria-hidden />
              Scan
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {zones.map((zone, index) => {
                const active = !completed && index === zoneIndex;
                const done = timed.completedIds.has(zone.id);
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => {
                      const next = zones[index];
                      setElapsedSec(
                        elapsedAtZoneStart(zones, index) + next.duration_sec * 0.45,
                      );
                      setRunning(false);
                    }}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                      active
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : done
                          ? "border-border/50 bg-muted/40 text-muted-foreground"
                          : "border-border/40 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                    )}
                  >
                    {zoneLabel(zone, t, locale as Locale)}
                  </button>
                );
              })}
            </div>
            <div className="mt-4">
              <ToolboxWidgetTimerControls
                isRunning={running}
                onToggle={() => {
                  if (completed) {
                    setElapsedSec(0);
                    setRunning(true);
                    return;
                  }
                  setRunning((v) => !v);
                }}
                onReset={() => {
                  setElapsedSec(0);
                  setRunning(false);
                }}
                playLabel={t("toolbox.launch")}
                pauseLabel={t("toolbox.pause")}
                resetLabel={t("toolbox.restart")}
              />
              <p className="mt-2 text-center text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {t("toolbox.bodyScanZoneProgress", {
                  current: Math.min(zoneIndex + 1, zones.length),
                  total: zones.length,
                })}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
