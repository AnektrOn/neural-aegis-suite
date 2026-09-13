import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2, Monitor, Sparkles, Smartphone, X } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import type { Locale } from "@/i18n/translations";
import {
  BUILTIN_TOOLBOX_CONTENT_TYPES,
  type ToolboxContentTypeDefinition,
} from "@/lib/toolbox-content-type-definitions";
import {
  QUANTUM_NEBULA_STATE_LABELS,
  type QuantumNebulaState,
} from "@/components/ui/quantum-nebula";
import {
  TOOLBOX_TYPE_META,
} from "@/lib/toolbox-renderer-registry";
import { resolveToolboxWidget } from "@/lib/toolbox-widget-resolver";
import { ToolboxNebulaExerciseView } from "@/features/toolbox/nebula/ToolboxNebulaExerciseView";
import { buildDemoToolboxItem, EXTRA_TOOLBOX_DEMO_TYPES } from "@/features/toolbox/nebula/buildDemoToolboxItem";
import {
  getNebulaGroupForSlug,
  listUngroupedNebulaSlugs,
  TOOLBOX_NEBULA_GROUPS,
} from "@/features/toolbox/nebula/toolboxNebulaGroups";
import { getToolboxNebulaPreset } from "@/features/toolbox/nebula/toolboxNebulaPresets";
import {
  isMatterVisualSlug,
  isParticleVisualSlug,
  scenarioForSlug,
  visualLanguageForSlug,
} from "@/features/toolbox/nebula/toolboxNebulaVisuals";

const MeditationNebula = lazy(() =>
  import("@/features/meditation/components/MeditationNebula").then((mod) => ({
    default: mod.MeditationNebula,
  })),
);

interface DemoEntry {
  slug: string;
  label_fr: string;
  label_en: string;
  category: string;
  description_fr: string;
  def?: ToolboxContentTypeDefinition;
  isExtra?: boolean;
}

const ENTRY_BY_SLUG = new Map<string, DemoEntry>([
  ...BUILTIN_TOOLBOX_CONTENT_TYPES.map((def): [string, DemoEntry] => [
    def.slug,
    {
      slug: def.slug,
      label_fr: def.label_fr,
      label_en: def.label_en,
      category: def.category,
      description_fr: def.description_fr,
      def,
    },
  ]),
  ...EXTRA_TOOLBOX_DEMO_TYPES.map((extra): [string, DemoEntry] => [
    extra.slug,
    {
      slug: extra.slug,
      label_fr: extra.label_fr,
      label_en: extra.label_en,
      category: extra.category,
      description_fr: extra.description_fr,
      isExtra: true,
    },
  ]),
]);

const ALL_DEMO_ENTRIES: DemoEntry[] = Array.from(ENTRY_BY_SLUG.values());

function resolveDemoItem(entry: DemoEntry) {
  if (entry.def) return buildDemoToolboxItem(entry.def);
  const extra = EXTRA_TOOLBOX_DEMO_TYPES.find((e) => e.slug === entry.slug);
  return extra?.item ?? null;
}

const UNGROUPED_SLUGS = listUngroupedNebulaSlugs(ALL_DEMO_ENTRIES.map((e) => e.slug));

const GROUPED_NAV = TOOLBOX_NEBULA_GROUPS.map((group) => ({
  ...group,
  entries: group.slugs
    .map((slug) => ENTRY_BY_SLUG.get(slug))
    .filter((e): e is DemoEntry => Boolean(e)),
})).filter((g) => g.entries.length > 0);

function StateBadge({ state }: { state: QuantumNebulaState }) {
  const label = QUANTUM_NEBULA_STATE_LABELS[state];
  return (
    <Badge variant="secondary" className="font-normal">
      {label.fr}
    </Badge>
  );
}

function StaticPlaceholders({ slug }: { slug: string }) {
  if (slug === "meditation") {
    return (
      <div className="relative min-h-[12rem] overflow-hidden rounded-lg border border-border/50">
        <Suspense
          fallback={
            <div className="flex min-h-[12rem] items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <MeditationNebula className="absolute inset-0" />
        </Suspense>
        <div className="relative z-10 flex min-h-[12rem] flex-col items-center justify-center gap-2 bg-background/65 p-4 text-center backdrop-blur-sm">
          <p className="text-sm font-medium">MeditationNebula (sans audio en démo)</p>
          <p className="text-xs text-muted-foreground">
            En prod : flux audio + réactivité spectrale
          </p>
        </div>
      </div>
    );
  }

  if (slug === "course") {
    return (
      <div className="space-y-3 rounded-lg border border-dashed border-border/70 bg-card/80 p-4">
        <div className="aspect-video rounded-md bg-muted/60 flex items-center justify-center text-sm text-muted-foreground">
          Player vidéo / contenu cours
        </div>
        <p className="text-sm text-muted-foreground">
          Nébule en bandeau bas — ne pas masquer les sous-titres.
        </p>
      </div>
    );
  }

  if (slug === "external_link") {
    return (
      <a
        href="https://example.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary hover:bg-primary/10"
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        Ouvrir la ressource externe
      </a>
    );
  }

  return null;
}

function ToolboxWidgetPreview({
  entry,
  previewMode,
  variant = "panel",
  locale,
}: {
  entry: DemoEntry;
  previewMode: "embedded" | "fullscreen";
  variant?: "modal" | "panel";
  locale: Locale;
}) {
  const item = useMemo(() => resolveDemoItem(entry), [entry]);

  if (!item) return null;

  if (entry.isExtra) {
    return <StaticPlaceholders slug={entry.slug} />;
  }

  return (
    <ToolboxNebulaExerciseView
      item={item}
      locale={locale}
      title={item.title}
      embedded={previewMode === "embedded"}
      variant={variant}
    />
  );
}

export default function ToolboxNebulaDemo() {
  const { locale } = useLanguage();
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [selectedSlug, setSelectedSlug] = useState("breathwork");
  const [previewMode, setPreviewMode] = useState<"embedded" | "fullscreen">("embedded");

  const selectedEntry = ENTRY_BY_SLUG.get(selectedSlug) ?? ALL_DEMO_ENTRIES[0];
  const selectedGroup = selectedEntry ? getNebulaGroupForSlug(selectedEntry.slug) : undefined;
  const selectedScenario = selectedEntry ? scenarioForSlug(selectedEntry.slug) : undefined;

  const visibleGroups = useMemo(
    () =>
      groupFilter === "all"
        ? GROUPED_NAV
        : GROUPED_NAV.filter((g) => g.id === groupFilter),
    [groupFilter],
  );

  const preset = useMemo(() => {
    if (!selectedEntry) {
      return getToolboxNebulaPreset("breathwork", "regulation");
    }
    const resolved = selectedEntry.def
      ? resolveToolboxWidget(selectedEntry.slug, selectedEntry.def.sample_config)
      : null;
    return getToolboxNebulaPreset(
      selectedEntry.slug,
      selectedEntry.category,
      resolved?.kind ?? null,
    );
  }, [selectedEntry]);

  const resolvedKind = useMemo(() => {
    if (!selectedEntry?.def) return selectedEntry?.slug ?? "—";
    return resolveToolboxWidget(selectedEntry.slug, selectedEntry.def.sample_config)?.kind ?? "—";
  }, [selectedEntry]);

  const typeMeta = selectedEntry ? TOOLBOX_TYPE_META[selectedEntry.slug] : undefined;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dev/quantum-nebula">
              <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
              Quantum Nebula
            </Link>
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <h1 className="truncate text-sm font-semibold sm:text-base">
              Toolbox × Particules — pilotes dev
            </h1>
            <Badge variant="outline" className="hidden sm:inline-flex">
              {ALL_DEMO_ENTRIES.length} types · {TOOLBOX_NEBULA_GROUPS.length} familles
            </Badge>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              DEV ONLY
            </Badge>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[minmax(0,300px)_1fr] lg:gap-6">
        <aside className="space-y-3 lg:sticky lg:top-[4.25rem] lg:self-start">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setGroupFilter("all")}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs transition-colors",
                groupFilter === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              Toutes
            </button>
            {GROUPED_NAV.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setGroupFilter(group.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs transition-colors",
                  groupFilter === group.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {group.label_fr}
              </button>
            ))}
          </div>

          {UNGROUPED_SLUGS.length > 0 ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-2.5 py-1.5 text-[11px] text-destructive">
              Slugs hors famille : {UNGROUPED_SLUGS.join(", ")}
            </p>
          ) : null}

          <nav
            className="max-h-[50vh] overflow-y-auto rounded-xl border border-border/60 bg-card/50 lg:max-h-[calc(100vh-8rem)]"
            aria-label="Familles toolbox"
          >
            {visibleGroups.map((group) => (
              <div key={group.id} className="border-b border-border/40 last:border-b-0">
                <div className="sticky top-0 z-[1] border-b border-border/30 bg-card/95 px-3 py-2 backdrop-blur-sm">
                  <p className="text-xs font-semibold tracking-wide text-foreground">
                    {group.label_fr}
                    <span className="ml-1.5 font-normal text-muted-foreground">
                      ({group.entries.length})
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    {group.rationale_fr}
                  </p>
                  {group.merge_candidates && group.merge_candidates.length > 0 ? (
                    <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
                      À fusionner :{" "}
                      {group.merge_candidates.map((pair) => pair.join(" ≈ ")).join(" · ")}
                    </p>
                  ) : null}
                </div>
                <ul>
                  {group.entries.map((entry) => {
                    const active = entry.slug === selectedSlug;
                    const isPrimary = group.primary === entry.slug;
                    return (
                      <li key={entry.slug}>
                        <button
                          type="button"
                          onClick={() => setSelectedSlug(entry.slug)}
                          className={cn(
                            "flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition-colors",
                            active ? "bg-primary/10 text-foreground" : "hover:bg-muted/50",
                          )}
                        >
                          <span className="flex items-center gap-1.5 font-medium leading-tight">
                            {entry.label_fr}
                            {isPrimary ? (
                              <span className="rounded bg-primary/15 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-primary">
                                primary
                              </span>
                            ) : null}
                            {isParticleVisualSlug(entry.slug) ? (
                              <span className="rounded bg-violet-500/15 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-300">
                                particules
                              </span>
                            ) : null}
                            {isMatterVisualSlug(entry.slug) ? (
                              <span className="rounded bg-sky-500/15 px-1 py-px text-[9px] font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-300">
                                matière
                              </span>
                            ) : null}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{entry.slug}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 space-y-4">
          {selectedEntry ? (
            <>
              <section className="rounded-xl border border-border/60 bg-card/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedEntry.label_fr}</h2>
                    <p className="text-sm text-muted-foreground">{selectedEntry.description_fr}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded bg-muted px-2 py-0.5">{selectedEntry.slug}</span>
                      {selectedGroup ? (
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-primary">
                          famille: {selectedGroup.label_fr}
                        </span>
                      ) : null}
                      <span className="rounded bg-muted px-2 py-0.5 capitalize">
                        legacy: {selectedEntry.category}
                      </span>
                      <span className="rounded bg-muted px-2 py-0.5">widget: {resolvedKind}</span>
                      {isParticleVisualSlug(selectedEntry.slug) ? (
                        <Badge className="bg-violet-600/90 text-[10px] uppercase">Nuage de points</Badge>
                      ) : null}
                      {isMatterVisualSlug(selectedEntry.slug) ? (
                        <Badge className="bg-sky-600/90 text-[10px] uppercase">Matière anomale</Badge>
                      ) : null}
                      <span className="rounded bg-muted px-2 py-0.5">
                        visuel: {visualLanguageForSlug(selectedEntry.slug)}
                      </span>
                      {selectedScenario ? (
                        <span className="rounded bg-muted px-2 py-0.5">
                          engine: {selectedScenario.engine}
                        </span>
                      ) : null}
                      {typeMeta ? (
                        <span className="rounded bg-muted px-2 py-0.5">
                          meta: {typeMeta.labelKey}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StateBadge state={preset.state} />
                    {preset.figure ? (
                      <Badge variant="outline">{preset.figure}</Badge>
                    ) : null}
                  </div>
                </div>
                {selectedGroup ? (
                  <p className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-sm leading-relaxed">
                    <span className="font-medium text-foreground">Famille : </span>
                    {selectedGroup.rationale_fr}
                  </p>
                ) : null}
                {selectedScenario ? (
                  <div className="mt-3 space-y-2 rounded-lg border border-border/50 bg-muted/25 px-3 py-2 text-sm leading-relaxed">
                    <p>
                      <span className="font-medium text-foreground">Geste : </span>
                      {selectedScenario.gesture}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Séquence : </span>
                      {selectedScenario.sequence}
                    </p>
                  </div>
                ) : null}
                <p className="mt-2 rounded-lg bg-muted/30 px-3 py-2 text-sm leading-relaxed">
                  <span className="font-medium text-foreground">Implémentation proposée : </span>
                  {preset.implementationNote.fr}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={previewMode === "fullscreen" ? "default" : "outline"}
                    onClick={() => setPreviewMode("fullscreen")}
                  >
                    <Monitor className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Plein écran (modal)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={previewMode === "embedded" ? "default" : "outline"}
                    onClick={() => setPreviewMode("embedded")}
                  >
                    <Smartphone className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Intégré (panneau)
                  </Button>
                </div>
                <p className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
                  Aperçu <span className="font-medium text-foreground">Nebula + overlay</span> — même rendu que la toolbox
                  prod (canvas particules/matière + contrôles flottants bas).
                </p>
              </section>

              {previewMode === "fullscreen" ? (
                <Dialog open onOpenChange={(open) => !open && setPreviewMode("embedded")}>
                  <DialogContent
                    showCloseButton={false}
                    className="fixed inset-0 left-0 top-0 z-50 h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-none border-0 bg-black p-0"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewMode("embedded")}
                      className="absolute right-3 top-3 z-30 flex min-h-[40px] min-w-[40px] items-center justify-center rounded-full border border-border/40 bg-background/70 text-muted-foreground backdrop-blur-md"
                      aria-label="Fermer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <ToolboxWidgetPreview
                      entry={selectedEntry}
                      previewMode={previewMode}
                      variant="modal"
                      locale={locale as Locale}
                    />
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border/30 bg-background/30 backdrop-blur-xl">
                  <ToolboxWidgetPreview
                    entry={selectedEntry}
                    previewMode={previewMode}
                    variant="panel"
                    locale={locale as Locale}
                  />
                </div>
              )}

              <p className="text-center text-xs text-muted-foreground">
                Plein écran = modal immersif prod. Panneau = aperçu compact dans la page dev.
              </p>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
